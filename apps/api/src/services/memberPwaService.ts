import { Types } from 'mongoose';
import { Member } from '../models/Member.js';
import { Membership } from '../models/Membership.js';
import { Attendance } from '../models/Attendance.js';
import { WorkoutPlan } from '../models/WorkoutPlan.js';
import { Nutrition } from '../models/Nutrition.js';
import { Wallet } from '../models/Wallet.js';
import { Referral } from '../models/Referral.js';
import { Invoice } from '../models/Invoice.js';
import { Review } from '../models/Review.js';
import { Consent } from '../models/Consent.js';
import { Assessment } from '../models/Assessment.js';
import { Tenant } from '../models/Tenant.js';
import crypto from 'node:crypto';

export class MemberPwaService {
  /**
   * Member Profile Details
   */
  public static async getProfile(tenantId: string, memberId: string) {
    const member = await Member.findOne({
      _id: new Types.ObjectId(memberId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    })
      .populate('branchId', 'name code address phone')
      .lean();

    if (!member) {
      const err: any = new Error('Member profile not found');
      err.statusCode = 404;
      throw err;
    }

    const tenant = await Tenant.findById(tenantId).select('name settings').lean();

    return {
      member,
      branding: {
        gymName: tenant?.name || 'Techofay GymOS',
        brandColor: tenant?.settings?.brandColor || '#10b981',
        logoUrl: tenant?.settings?.logoUrl,
      },
    };
  }

  /**
   * Active Membership Card & Validity
   */
  public static async getMembership(tenantId: string, memberId: string) {
    const membership = await Membership.findOne({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
      status: 'ACTIVE',
    })
      .populate('planId', 'name type code durationDays')
      .populate('assignedTrainerId', 'name phone email')
      .lean();

    if (!membership) {
      return { hasActiveMembership: false, membership: null };
    }

    const now = new Date();
    const endDate = new Date(membership.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      hasActiveMembership: true,
      membership: {
        ...membership,
        daysRemaining,
        isExpiringSoon: daysRemaining <= 7,
      },
    };
  }

  /**
   * Dynamic Secure QR Code Token for Touchless Turnstile Check-in
   */
  public static async getDynamicQrCode(tenantId: string, memberId: string) {
    const member = await Member.findOne({
      _id: new Types.ObjectId(memberId),
      tenantId: new Types.ObjectId(tenantId),
    }).lean();

    if (!member) {
      const err: any = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const timestamp = Date.now();
    const secret = process.env.JWT_ACCESS_SECRET || 'gymos_qr_secret_key';
    const raw = `${tenantId}:${memberId}:${member.memberCode}:${timestamp}`;
    const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex').slice(0, 16);

    const qrPayload = JSON.stringify({
      t: tenantId,
      m: memberId,
      c: member.memberCode,
      ts: timestamp,
      sig: signature,
    });

    return {
      memberCode: member.memberCode,
      qrPayload,
      expiresInSeconds: 300, // Valid for 5 minutes
      timestamp,
    };
  }

  /**
   * Member Attendance History & Consecutive Day Streak
   */
  public static async getAttendanceHistory(tenantId: string, memberId: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const memberObjectId = new Types.ObjectId(memberId);

    const attendances = await Attendance.find({
      tenantId: tenantObjectId,
      memberId: memberObjectId,
    })
      .sort({ checkInTime: -1 })
      .limit(60)
      .lean();

    // Calculate check-in streak
    let streakDays = 0;
    if (attendances.length > 0) {
      const sortedDates = Array.from(
        new Set(
          attendances.map((a) => {
            const d = new Date(a.checkInTime);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }),
        ),
      ).sort().reverse();

      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const currentExpected = sortedDates[0] === todayStr ? todayStr : yesterday;
      if (sortedDates.includes(currentExpected)) {
        streakDays = 1;
        const testDate = new Date(currentExpected);

        for (let i = 1; i < sortedDates.length; i++) {
          testDate.setDate(testDate.getDate() - 1);
          const expectedPrev = testDate.toISOString().slice(0, 10);
          if (sortedDates.includes(expectedPrev)) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalVisits: attendances.length,
      currentStreakDays: streakDays,
      streakBadge: streakDays >= 30 ? 'Titan (30+ Days)' : streakDays >= 7 ? 'Warrior (7+ Days)' : streakDays >= 3 ? 'Committed (3+ Days)' : 'Starter',
      recentAttendances: attendances.slice(0, 15),
    };
  }

  /**
   * Assigned Workout Plans
   */
  public static async getWorkouts(tenantId: string, memberId: string) {
    const workouts = await WorkoutPlan.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return workouts;
  }

  /**
   * Assigned Nutrition & Diet Plans
   */
  public static async getDiet(tenantId: string, memberId: string) {
    const diet = await Nutrition.findOne({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
      status: 'ACTIVE',
    })
      .sort({ createdAt: -1 })
      .lean();

    return diet;
  }

  /**
   * Assigned Trainer Profile & Contact
   */
  public static async getTrainer(tenantId: string, memberId: string) {
    const membership = await Membership.findOne({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
      status: 'ACTIVE',
      assignedTrainerId: { $exists: true },
    })
      .populate('assignedTrainerId', 'name email phone')
      .lean();

    if (!membership?.assignedTrainerId) {
      return { hasAssignedTrainer: false, trainer: null };
    }

    const trainerUser: any = membership.assignedTrainerId;
    return {
      hasAssignedTrainer: true,
      trainer: {
        id: trainerUser._id,
        name: trainerUser.name,
        email: trainerUser.email,
        phone: trainerUser.phone,
        sessionsRemaining: membership.sessionsRemaining || 0,
        sessionsUsed: membership.sessionsUsed || 0,
      },
    };
  }

  /**
   * Referral Wallet & Referral Code
   */
  public static async getWallet(tenantId: string, memberId: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const memberObjectId = new Types.ObjectId(memberId);

    let wallet: any = await Wallet.findOne({ tenantId: tenantObjectId, memberId: memberObjectId }).lean();
    if (!wallet) {
      wallet = await Wallet.create({
        tenantId: tenantObjectId,
        memberId: memberObjectId,
        balanceInPaise: 0,
        transactions: [],
      });
    }

    const member = await Member.findById(memberId).select('memberCode firstName').lean();
    const referralCode = member?.memberCode || `REF-${memberId.slice(-6).toUpperCase()}`;

    const referrals = await Referral.find({
      tenantId: tenantObjectId,
      referrerMemberId: memberObjectId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      balanceInPaise: wallet.balanceInPaise || 0,
      balanceFormatted: `₹${((wallet.balanceInPaise || 0) / 100).toLocaleString('en-IN')}`,
      referralCode,
      referralsCount: referrals.length,
      rewardedCount: referrals.filter((r) => r.status === 'REWARDED').length,
      recentTransactions: wallet.transactions?.slice(-10) || [],
      referrals,
    };
  }

  /**
   * Invoices and Payment History
   */
  public static async getInvoices(tenantId: string, memberId: string) {
    const invoices = await Invoice.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return invoices.map((inv: any) => ({
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      totalAmountInPaise: inv.grandTotalInPaise,
      totalAmountFormatted: `₹${(inv.grandTotalInPaise / 100).toLocaleString('en-IN')}`,
      status: inv.status,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      pdfUrl: `/api/billing/invoices/${inv._id}/pdf`,
    }));
  }

  /**
   * Post Member Review / Testimonial
   */
  public static async submitReview(
    tenantId: string,
    memberId: string,
    data: { rating: number; reviewText: string; trainerId?: string },
  ) {
    const member = await Member.findById(memberId).lean();
    if (!member) {
      const err: any = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const review = await Review.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: member.branchId,
      memberId: member._id,
      rating: Math.min(5, Math.max(1, data.rating)),
      reviewText: data.reviewText.trim(),
      trainerId: data.trainerId ? new Types.ObjectId(data.trainerId) : undefined,
      isPublic: true,
      isApproved: true, // Auto-publish member reviews
      status: 'APPROVED',
    });

    return review;
  }

  /**
   * DPDP Act Compliance: Complete Personal Data Export (JSON Download)
   */
  public static async exportPersonalData(tenantId: string, memberId: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const memberObjectId = new Types.ObjectId(memberId);

    const [
      member,
      memberships,
      attendances,
      invoices,
      workouts,
      nutrition,
      assessments,
      consents,
      wallet,
    ] = await Promise.all([
      Member.findOne({ _id: memberObjectId, tenantId: tenantObjectId }).lean(),
      Membership.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Attendance.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Invoice.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      WorkoutPlan.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Nutrition.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Assessment.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Consent.find({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
      Wallet.findOne({ tenantId: tenantObjectId, memberId: memberObjectId }).lean(),
    ]);

    if (!member) {
      const err: any = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      dpdpCompliance: {
        regulation: 'Digital Personal Data Protection Act, 2023 (DPDPA - India)',
        exportTimestamp: new Date().toISOString(),
        dataPrincipal: {
          fullName: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          email: member.email,
        },
      },
      profile: member,
      memberships,
      attendances,
      invoices,
      workoutPlans: workouts,
      nutritionPlans: nutrition,
      fitnessAssessments: assessments,
      privacyConsents: consents,
      walletTransactions: wallet?.transactions || [],
    };
  }

  /**
   * DPDP Act Compliance: Right to Erasure / Account Deletion Request
   */
  public static async requestAccountDeletion(
    tenantId: string,
    memberId: string,
    reason: string,
    confirmPhone: string,
  ) {
    const member = await Member.findOne({
      _id: new Types.ObjectId(memberId),
      tenantId: new Types.ObjectId(tenantId),
    });

    if (!member) {
      const err: any = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    if (member.phone.replace(/\D/g, '') !== confirmPhone.replace(/\D/g, '')) {
      const err: any = new Error('Phone verification failed: provided phone number does not match account records');
      err.statusCode = 400;
      throw err;
    }

    // Mark member as INACTIVE and set deletion metadata
    member.status = 'INACTIVE';
    member.isDeleted = true;
    member.deletedAt = new Date();
    await member.save();

    // Cancel active memberships
    await Membership.updateMany(
      { tenantId: new Types.ObjectId(tenantId), memberId: member._id, status: 'ACTIVE' },
      { status: 'CANCELLED', notes: `DPDP Account Erasure Requested: ${reason}` },
    );

    return {
      success: true,
      message: 'Account erasure request accepted per DPDP Act guidelines. Your personal records and memberships have been deactivated.',
      scheduledPurgeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
}
