import { Types } from 'mongoose';
import { Attendance, IAttendance } from '../models/Attendance.js';
import { Member } from '../models/Member.js';
import { Membership } from '../models/Membership.js';
import { ATTENDANCE_METHOD, MEMBER_STATUS, MEMBERSHIP_STATUS } from '@gymos/shared';

export interface CheckInRequest {
  tenantId: string;
  branchId: string;
  identifier: string; // Member ID, phone number, or QR raw payload
  method: keyof typeof ATTENDANCE_METHOD;
  deviceId?: string;
  performedByUserId?: string;
}

export class AttendanceService {
  /**
   * Process a member check-in attempt with verification and gate access rules.
   */
  static async processCheckIn(input: CheckInRequest): Promise<{
    allowed: boolean;
    reason?: string;
    attendance?: IAttendance;
    member?: any;
    currentGymOccupancy?: number;
  }> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const branchObjectId = new Types.ObjectId(input.branchId);

    // 1. Resolve member by Member ID, phone, or raw QR payload
    const searchFilter: Record<string, any> = { tenantId: tenantObjectId };

    if (input.identifier.includes('{')) {
      try {
        const parsed = JSON.parse(input.identifier);
        if (parsed.m) searchFilter.memberCode = parsed.m;
        else if (parsed.p) searchFilter.phone = parsed.p;
      } catch {
        searchFilter.memberCode = input.identifier;
      }
    } else if (input.identifier.startsWith('GYM-') || input.identifier.length <= 15) {
      searchFilter.$or = [{ memberCode: input.identifier }, { phone: input.identifier }];
    } else {
      searchFilter.phone = input.identifier;
    }

    const member = await Member.findOne(searchFilter);
    if (!member) {
      return {
        allowed: false,
        reason: 'Member record not found in system directory.',
      };
    }

    // 2. Verification rules
    if (member.status === MEMBER_STATUS.SUSPENDED) {
      return {
        allowed: false,
        reason: 'Access Denied: Member account is suspended due to payment or administrative hold.',
        member,
      };
    }

    // Verify membership is not frozen
    const frozenMembership = await Membership.findOne({
      tenantId: tenantObjectId,
      memberId: member._id,
      status: MEMBERSHIP_STATUS.FROZEN,
    });
    if (frozenMembership) {
      return {
        allowed: false,
        reason: 'Access Denied: Membership is currently frozen. Please unfreeze at reception to enter.',
        member,
      };
    }

    // Verify active membership tenure
    const now = new Date();
    const activeMembership = await Membership.findOne({
      tenantId: tenantObjectId,
      memberId: member._id,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!activeMembership) {
      // Check if recently expired
      const expiredMembership = await Membership.findOne({
        tenantId: tenantObjectId,
        memberId: member._id,
      }).sort({ endDate: -1 });

      const expiryStr = expiredMembership ? expiredMembership.endDate.toISOString().split('T')[0] : 'None';
      return {
        allowed: false,
        reason: `Access Denied: Membership plan expired on ${expiryStr}. Renewal required to enter gym.`,
        member,
      };
    }

    // 3. Prevent duplicate check-in if already inside (within last 3 hours without checkout)
    const activeSession = await Attendance.findOne({
      tenantId: tenantObjectId,
      memberId: member._id,
      checkOutTime: { $exists: false },
      checkInTime: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    if (activeSession) {
      return {
        allowed: false,
        reason: `Passback Warning: Member is already registered inside gym floor (Checked in at ${activeSession.checkInTime.toLocaleTimeString()}).`,
        member,
      };
    }

    // 4. Create attendance record
    const attendance = await Attendance.create({
      tenantId: tenantObjectId,
      branchId: branchObjectId,
      memberId: member._id,
      checkInTime: now,
      method: (ATTENDANCE_METHOD as any)[input.method] || ATTENDANCE_METHOD.QR,
      deviceId: input.deviceId || 'TURNSTILE_01',
    });

    // 5. Get current live occupancy
    const currentOccupancy = await this.getCurrentLiveOccupancy(input.tenantId, input.branchId);

    return {
      allowed: true,
      attendance,
      member: {
        id: member._id,
        memberId: member.memberCode,
        name: `${member.firstName} ${member.lastName}`,
      },
      currentGymOccupancy: currentOccupancy,
    };
  }

  /**
   * Process a checkout scan or manual exit.
   */
  static async processCheckOut(tenantId: string, memberIdStr: string) {
    const isObjectId = Types.ObjectId.isValid(memberIdStr) && memberIdStr.length === 24;
    const member = await Member.findOne({
      tenantId: new Types.ObjectId(tenantId),
      $or: [
        ...(isObjectId ? [{ _id: new Types.ObjectId(memberIdStr) }] : []),
        { memberCode: memberIdStr },
        { phone: memberIdStr },
      ],
    });

    if (!member) throw new Error('Member not found');

    const activeRecord = await Attendance.findOne({
      memberId: member._id,
      checkOutTime: { $exists: false },
    }).sort({ checkInTime: -1 });

    if (!activeRecord) {
      throw new Error('No active inside-gym session found for member');
    }

    activeRecord.checkOutTime = new Date();
    await activeRecord.save();

    return activeRecord;
  }

  /**
   * Returns current count of members on the gym floor.
   */
  static async getCurrentLiveOccupancy(tenantId: string, branchId?: string): Promise<number> {
    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      checkOutTime: { $exists: false },
      checkInTime: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // within 4 hours
    };
    if (branchId) filter.branchId = new Types.ObjectId(branchId);

    return Attendance.countDocuments(filter);
  }

  /**
   * Auto-checkout cron worker: closes sessions older than maxStayHours.
   */
  static async autoCheckOutStaleSessions(tenantId?: string, maxStayHours: number = 3): Promise<number> {
    const threshold = new Date(Date.now() - maxStayHours * 60 * 60 * 1000);
    const filter: Record<string, any> = {
      checkOutTime: { $exists: false },
      checkInTime: { $lt: threshold },
    };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const staleSessions = await Attendance.find(filter);
    for (const session of staleSessions) {
      session.checkOutTime = new Date(session.checkInTime.getTime() + maxStayHours * 60 * 60 * 1000);
      await session.save();
    }

    return staleSessions.length;
  }

  /**
   * Peak-hour distribution analytics for the last 30 days.
   */
  static async getPeakHourAnalytics(tenantId: string, branchId?: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const matchStage: Record<string, any> = {
      tenantId: tenantObjectId,
      checkInTime: { $gte: thirtyDaysAgo },
    };
    if (branchId) matchStage.branchId = new Types.ObjectId(branchId);

    const result = await Attendance.aggregate([
      { $match: matchStage },
      {
        $project: {
          hour: { $hour: { date: '$checkInTime', timezone: 'Asia/Kolkata' } },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r) => ({
      hour: `${r._id}:00`,
      checkins: r.count,
    }));
  }

  /**
   * Identifies members inactive for more than daysThreshold days.
   */
  static async getInactiveMembers(tenantId: string, daysThreshold: number = 14) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

    const activeMembers = await Member.find({
      tenantId: tenantObjectId,
      status: MEMBER_STATUS.ACTIVE,
    });

    const inactiveList: any[] = [];

    for (const m of activeMembers) {
      const recentAttendance = await Attendance.findOne({
        memberId: m._id,
        checkInTime: { $gte: cutoffDate },
      });

      if (!recentAttendance) {
        const lastPunch = await Attendance.findOne({ memberId: m._id }).sort({ checkInTime: -1 });
        inactiveList.push({
          memberId: m.memberCode,
          name: `${m.firstName} ${m.lastName}`,
          phone: m.phone,
          lastCheckIn: lastPunch ? lastPunch.checkInTime : 'Never',
        });
      }
    }

    return inactiveList;
  }
}
