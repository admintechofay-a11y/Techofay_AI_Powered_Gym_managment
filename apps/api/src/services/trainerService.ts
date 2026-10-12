import mongoose, { Types } from 'mongoose';
import {
  Trainer,
  type ITrainer,
  PtPackage,
  type IPtPackage,
  Commission,
  Review,
  Membership,
  Member,
  User,
  Staff,
} from '../models/index.js';

export class TrainerService {
  /**
   * List all trainers for a gym tenant
   */
  static async getTrainers(tenantId: string, branchId?: string) {
    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    };
    if (branchId) query.branchIds = new Types.ObjectId(branchId);

    return Trainer.find(query)
      .populate('userId', 'name email phone profilePhotoUrl')
      .populate('branchIds', 'name code')
      .sort({ rating: -1 });
  }

  static async getTrainerById(tenantId: string, trainerId: string) {
    const trainer = await Trainer.findOne({
      _id: new Types.ObjectId(trainerId),
      tenantId: new Types.ObjectId(tenantId),
    })
      .populate('userId', 'name email phone profilePhotoUrl')
      .populate('branchIds', 'name code');

    if (!trainer) throw new Error('Trainer not found');
    return trainer;
  }

  static async getTrainerProfile(tenantId: string, trainerId: string) {
    const trainer = await this.getTrainerById(tenantId, trainerId);
    const doc = trainer.toObject();
    return {
      ...doc,
      commissionRatePercent: doc.commissionRatePercent ?? doc.defaultCommissionRatePercent,
    };
  }

  static async createOrUpdateTrainer(tenantId: string, data: any) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const userObjId = new Types.ObjectId(data.userId);

    const user = await User.findOne({ _id: userObjId, tenantId: tenantObjId });
    if (!user) throw new Error('User account not found');

    const branchObjIds = (data.branchIds || []).map((id: string) => new Types.ObjectId(id));

    let trainer = await Trainer.findOne({ tenantId: tenantObjId, userId: userObjId });
    if (trainer) {
      trainer.specializations = data.specializations || trainer.specializations;
      trainer.qualifications = data.qualifications || trainer.qualifications;
      trainer.certifications = data.certifications || trainer.certifications;
      trainer.bio = data.bio ?? trainer.bio;
      trainer.defaultCommissionRatePercent = data.defaultCommissionRatePercent ?? trainer.defaultCommissionRatePercent;
      trainer.availabilitySchedule = data.availabilitySchedule || trainer.availabilitySchedule;
      if (branchObjIds.length > 0) trainer.branchIds = branchObjIds;
      await trainer.save();
    } else {
      trainer = await Trainer.create({
        tenantId: tenantObjId,
        userId: userObjId,
        branchIds: branchObjIds.length > 0 ? branchObjIds : user.branchIds,
        specializations: data.specializations || [],
        qualifications: data.qualifications || [],
        certifications: data.certifications || [],
        bio: data.bio,
        defaultCommissionRatePercent: data.defaultCommissionRatePercent ?? 15,
        availabilitySchedule: data.availabilitySchedule || [],
        rating: 5,
      });
    }

    return trainer;
  }

  /**
   * Trainer personal dashboard: assigned members, active PT packages, session tracking
   */
  static async getTrainerDashboard(tenantId: string, trainerId: string) {
    const trainer = await Trainer.findOne({
      _id: new Types.ObjectId(trainerId),
      tenantId: new Types.ObjectId(tenantId),
    }).populate('userId', 'name email');

    if (!trainer) throw new Error('Trainer not found');

    // Find memberships where trainer is assigned
    const ptMemberships = await Membership.find({
      tenantId: new Types.ObjectId(tenantId),
      assignedTrainerId: trainer.userId,
      status: 'ACTIVE',
    })
      .populate('memberId', 'memberCode firstName lastName phone email')
      .populate('planId', 'name type')
      .sort({ createdAt: -1 });

    const totalClients = ptMemberships.length;
    let totalSessionsRemaining = 0;
    let totalSessionsUsed = 0;

    const clients = ptMemberships.map((m: any) => {
      const remaining = m.sessionsRemaining ?? 10;
      const used = m.sessionsUsed ?? 0;
      totalSessionsRemaining += remaining;
      totalSessionsUsed += used;

      return {
        membershipId: m._id,
        member: m.memberId,
        plan: m.planId,
        startDate: m.startDate,
        endDate: m.endDate,
        sessionsRemaining: remaining,
        sessionsUsed: used,
        isExpired: new Date() > new Date(m.endDate) || remaining <= 0,
      };
    });

    // Recent reviews
    const reviews = await Review.find({
      tenantId: new Types.ObjectId(tenantId),
      trainerId: trainer.userId,
      status: 'APPROVED',
    })
      .populate('memberId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      trainer,
      metrics: {
        totalClients,
        totalSessionsUsed,
        totalSessionsRemaining,
        averageRating: trainer.rating,
      },
      clients,
      recentReviews: reviews,
    };
  }

  // ==========================================================================
  // PT PACKAGES & SESSION TRACKING
  // ==========================================================================
  static async createPtPackage(tenantId: string, data: any) {
    return PtPackage.create({
      tenantId: new Types.ObjectId(tenantId),
      name: data.name,
      description: data.description,
      numberOfSessions: data.numberOfSessions,
      validityDays: data.validityDays,
      priceInPaise: data.priceInPaise,
      trainerCommissionPercent: data.trainerCommissionPercent ?? 20,
      isActive: true,
    });
  }

  static async getPtPackages(tenantId: string) {
    return PtPackage.find({
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    }).sort({ priceInPaise: 1 });
  }

  /**
   * Use PT Session: decrements sessionsRemaining, increments sessionsUsed, creates Commission
   */
  static async usePtSession(tenantId: string, data: {
    membershipId: string;
    trainerId: string;
    sessionNotes?: string;
  }) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const membership = await Membership.findOne({
      _id: new Types.ObjectId(data.membershipId),
      tenantId: tenantObjId,
    });

    if (!membership) throw new Error('Membership not found');
    if (membership.status !== 'ACTIVE') {
      throw new Error(`Membership is not active (current status: ${membership.status})`);
    }

    if (new Date() > new Date(membership.endDate)) {
      membership.status = 'EXPIRED';
      await membership.save();
      throw new Error('PT package validity has expired');
    }

    const remaining = membership.sessionsRemaining ?? 10;
    if (remaining <= 0) {
      membership.status = 'EXPIRED';
      await membership.save();
      throw new Error('All personal training sessions in this package have been used');
    }

    membership.sessionsRemaining = remaining - 1;
    membership.sessionsUsed = (membership.sessionsUsed ?? 0) + 1;
    if (membership.sessionsRemaining === 0) {
      membership.status = 'EXPIRED';
    }
    await membership.save();

    // Calculate trainer commission
    const trainerUser = await User.findById(data.trainerId);
    const trainerDoc = await Trainer.findOne({ tenantId: tenantObjId, userId: new Types.ObjectId(data.trainerId) });
    const commissionPercent = trainerDoc?.defaultCommissionRatePercent ?? 20;

    // Commission per session = (totalAmountInPaise / totalSessions) * commissionPercent / 100
    const totalSessions = (membership.sessionsUsed || 0) + (membership.sessionsRemaining || 0);
    const perSessionPrice = totalSessions > 0 ? Math.round(membership.totalAmountInPaise / totalSessions) : 100000;
    const commissionAmountInPaise = Math.round((perSessionPrice * commissionPercent) / 100);

    const periodMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

    // Find staff record for trainer if available
    let staffDoc = await Staff.findOne({ tenantId: tenantObjId, userId: new Types.ObjectId(data.trainerId) });
    if (!staffDoc && trainerUser) {
      staffDoc = await Staff.create({
        tenantId: tenantObjId,
        userId: trainerUser._id,
        branchId: trainerUser.branchIds[0],
        employeeCode: `STF-${trainerUser._id.toString().slice(-4).toUpperCase()}`,
        designation: 'Personal Trainer',
        department: 'Fitness',
        salaryInPaise: 3000000,
        joiningDate: new Date(),
      });
    }

    const commission = await Commission.create({
      tenantId: tenantObjId,
      staffId: staffDoc ? staffDoc._id : new Types.ObjectId(data.trainerId),
      type: 'PT',
      referenceId: membership._id,
      amountInPaise: commissionAmountInPaise,
      ratePercent: commissionPercent,
      status: 'PENDING',
      periodMonthYear,
    });

    return {
      membership,
      sessionsRemaining: membership.sessionsRemaining,
      sessionsUsed: membership.sessionsUsed,
      commissionAmountInPaise,
      commissionId: commission._id,
      message: `PT session logged. ${membership.sessionsRemaining} sessions remaining.`,
    };
  }

  // ==========================================================================
  // COMMISSIONS & PAYOUT REPORTS
  // ==========================================================================
  static async getCommissionReport(tenantId: string, monthYear?: string, staffId?: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const currentPeriod = monthYear || new Date().toISOString().slice(0, 7);

    const query: any = {
      tenantId: tenantObjId,
      periodMonthYear: currentPeriod,
    };
    if (staffId) query.staffId = new Types.ObjectId(staffId);

    const commissions = await Commission.find(query)
      .populate('staffId', 'employeeCode designation')
      .sort({ createdAt: -1 });

    const totalEarnedInPaise = commissions.reduce((sum, c) => sum + c.amountInPaise, 0);
    const totalPaidInPaise = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amountInPaise, 0);
    const totalPendingInPaise = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amountInPaise, 0);

    return {
      period: currentPeriod,
      commissions,
      metrics: {
        totalEarnedInPaise,
        totalPaidInPaise,
        totalPendingInPaise,
        commissionCount: commissions.length,
      },
    };
  }

  static async payoutCommission(tenantId: string, commissionId: string) {
    const commission = await Commission.findOneAndUpdate(
      { _id: new Types.ObjectId(commissionId), tenantId: new Types.ObjectId(tenantId) },
      { $set: { status: 'PAID', paidAt: new Date() } },
      { new: true },
    );
    if (!commission) throw new Error('Commission record not found');
    return commission;
  }

  // ==========================================================================
  // REVIEWS & RATINGS
  // ==========================================================================
  static async getReviews(tenantId: string, trainerId?: string) {
    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isApproved: true,
    };
    if (trainerId) query.trainerId = new Types.ObjectId(trainerId);

    return Review.find(query)
      .populate('memberId', 'firstName lastName memberCode')
      .populate('trainerId', 'name email')
      .sort({ createdAt: -1 });
  }

  static async submitReview(tenantId: string, data: {
    branchId: string;
    memberId: string;
    trainerId: string;
    rating: number;
    reviewText: string;
    isPublic?: boolean;
  }) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const trainerUserObjId = new Types.ObjectId(data.trainerId);

    const review = await Review.create({
      tenantId: tenantObjId,
      branchId: new Types.ObjectId(data.branchId),
      memberId: new Types.ObjectId(data.memberId),
      trainerId: trainerUserObjId,
      rating: data.rating,
      reviewText: data.reviewText,
      isPublic: data.isPublic ?? true,
      isApproved: false,
      status: 'PENDING',
    });

    // Update trainer aggregate rating
    const allReviews = await Review.find({
      tenantId: tenantObjId,
      trainerId: trainerUserObjId,
      status: 'APPROVED',
    });

    if (allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Trainer.findOneAndUpdate(
        { tenantId: tenantObjId, userId: trainerUserObjId },
        { $set: { rating: parseFloat(avg.toFixed(1)) } },
      );
    }

    return review;
  }
}
