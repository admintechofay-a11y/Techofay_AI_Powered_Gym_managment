import { Types } from 'mongoose';
import { Staff } from '../models/Staff.js';
import { Commission } from '../models/Commission.js';
import { Locker } from '../models/Locker.js';
import { Member } from '../models/Member.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Attendance } from '../models/Attendance.js';
import { Membership } from '../models/Membership.js';

export class OperationsService {
  /**
   * Assign a locker to an active member.
   */
  static async assignLocker(
    tenantId: string,
    branchId: string,
    lockerNumber: string,
    memberId: string,
    rentPerMonthInPaise: number = 50000, // ₹500/mo
  ) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const branchObjectId = new Types.ObjectId(branchId);
    const memberObjectId = new Types.ObjectId(memberId);

    // Find or create locker
    let locker = await Locker.findOne({
      tenantId: tenantObjectId,
      branchId: branchObjectId,
      lockerNumber,
    });

    if (!locker) {
      locker = new Locker({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        lockerNumber,
        status: 'AVAILABLE',
      });
    }

    if (locker.status === 'OCCUPIED') {
      throw new Error(`Locker ${lockerNumber} is already occupied`);
    }

    locker.status = 'OCCUPIED';
    locker.assignedMemberId = memberObjectId;
    locker.assignedFrom = new Date();
    locker.assignedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    locker.feeInPaise = rentPerMonthInPaise;
    await locker.save();

    return locker;
  }

  /**
   * Release an occupied locker.
   */
  static async releaseLocker(tenantId: string, lockerId: string) {
    const locker = await Locker.findById(lockerId);
    if (!locker) throw new Error('Locker not found');

    locker.status = 'AVAILABLE';
    locker.assignedMemberId = undefined;
    locker.assignedFrom = undefined;
    locker.assignedUntil = undefined;
    await locker.save();

    return locker;
  }

  /**
   * Record trainer commission for a PT session or package sale.
   */
  static async recordTrainerCommission(
    tenantId: string,
    trainerId: string,
    memberId: string,
    amountInPaise: number,
    commissionType: 'PT_SESSION' | 'PLAN_SALE',
    notes?: string,
  ) {
    const commission = await Commission.create({
      tenantId: new Types.ObjectId(tenantId),
      trainerId: new Types.ObjectId(trainerId),
      memberId: new Types.ObjectId(memberId),
      amountInPaise,
      commissionType,
      status: 'PENDING',
      notes,
      earnedDate: new Date(),
    });

    return commission;
  }

  /**
   * Owner Executive Dashboard Aggregations (SOW Sec 4)
   * High performance indexed aggregations with branch and date filters.
   */
  static async getOwnerDashboardKpis(
    tenantId: string,
    branchId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const branchObjectId = branchId ? new Types.ObjectId(branchId) : undefined;

    const baseFilter: Record<string, any> = { tenantId: tenantObjectId };
    if (branchObjectId) baseFilter.branchId = branchObjectId;

    // 1. Total & Active Members
    const totalMembersCount = await Member.countDocuments(baseFilter);
    const activeMembersCount = await Member.countDocuments({ ...baseFilter, status: 'ACTIVE' });

    // 2. Today's check-ins
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCheckinsCount = await Attendance.countDocuments({
      ...baseFilter,
      checkInTime: { $gte: startOfToday },
    });

    // 3. Live floor occupancy
    const liveOccupancyCount = await Attendance.countDocuments({
      ...baseFilter,
      checkOutTime: { $exists: false },
      checkInTime: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
    });

    // 4. Monthly Revenue & Pending Dues
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const revenueAgg = await Payment.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          ...(branchObjectId ? { branchId: branchObjectId } : {}),
          transactionDate: { $gte: startOfMonth },
          status: 'SUCCESSFUL',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenueInPaise: { $sum: '$amountInPaise' },
        },
      },
    ]);
    const monthlyRevenueInPaise = revenueAgg[0]?.totalRevenueInPaise || 0;

    const duesAgg = await Invoice.aggregate([
      {
        $match: {
          tenantId: tenantObjectId,
          ...(branchObjectId ? { branchId: branchObjectId } : {}),
          status: { $in: ['UNPAID', 'PARTIALLY_PAID'] },
        },
      },
      {
        $group: {
          _id: null,
          totalPendingDuesInPaise: { $sum: '$dueAmountInPaise' },
        },
      },
    ]);
    const pendingDuesInPaise = duesAgg[0]?.totalPendingDuesInPaise || 0;

    // 5. Renewals Due in next 7 days
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingRenewals = await Membership.find({
      tenantId: tenantObjectId,
      status: 'ACTIVE',
      endDate: { $gte: new Date(), $lte: in7Days },
    })
      .populate('memberId', 'firstName lastName phone email memberCode')
      .limit(10);

    return {
      kpis: {
        totalMembers: totalMembersCount,
        activeMembers: activeMembersCount,
        todayCheckins: todayCheckinsCount,
        liveOccupancy: liveOccupancyCount,
        monthlyRevenueInPaise,
        monthlyRevenueInRupees: monthlyRevenueInPaise / 100,
        pendingDuesInPaise,
        pendingDuesInRupees: pendingDuesInPaise / 100,
      },
      upcomingRenewals,
    };
  }
}
