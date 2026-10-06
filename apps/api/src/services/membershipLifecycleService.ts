import { Types } from 'mongoose';
import { Membership, IMembership } from '../models/Membership.js';
import { Freeze } from '../models/Freeze.js';
import { Plan } from '../models/Plan.js';
import { Member } from '../models/Member.js';
import { MembershipDateService } from './membershipDateService.js';
import { MEMBERSHIP_STATUS, MEMBER_STATUS } from '@gymos/shared';
import { AuditLogService } from './auditLogService.js';

export interface BuyPlanInput {
  tenantId: string;
  memberId: string;
  planId: string;
  startDate?: Date;
  trainerId?: string;
  discountInPaise?: number;
  notes?: string;
  performedByUserId?: string;
}

export class MembershipLifecycleService {
  /**
   * Enroll a member into a new membership plan.
   */
  static async buyPlan(input: BuyPlanInput): Promise<IMembership> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const memberObjectId = new Types.ObjectId(input.memberId);
    const planObjectId = new Types.ObjectId(input.planId);

    const plan = await Plan.findById(planObjectId);
    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive plan selected');
    }

    const member = await Member.findById(memberObjectId);
    if (!member) {
      throw new Error('Member not found');
    }

    const start = input.startDate ? new Date(input.startDate) : new Date();
    const end = MembershipDateService.calculateEndDate(start, plan.type, plan.durationDays);

    const totalAmount = Math.max(0, plan.priceInPaise - (input.discountInPaise || 0));

    const membership = await Membership.create({
      tenantId: tenantObjectId,
      branchId: member.branchId,
      memberId: memberObjectId,
      planId: planObjectId,
      startDate: start,
      endDate: end,
      status: MEMBERSHIP_STATUS.ACTIVE,
      totalAmountInPaise: totalAmount,
      balanceInPaise: 0,
      notes: input.notes,
    });

    // Update member's status to ACTIVE
    member.status = MEMBER_STATUS.ACTIVE;
    await member.save();

    if (input.performedByUserId) {
      await AuditLogService.record({
        tenantId: input.tenantId,
        userId: input.performedByUserId,
        action: 'MEMBERSHIP_PURCHASE',
        entity: 'Membership',
        entityId: membership._id.toString(),
        afterSnapshot: membership.toObject(),
      });
    }

    return membership;
  }

  /**
   * Freeze an active membership.
   */
  static async freezeMembership(
    tenantId: string,
    membershipId: string,
    reason: string,
    freezeStartDate: Date = new Date(),
    expectedResumeDate?: Date,
    performedByUserId?: string,
  ) {
    const membership = await Membership.findById(membershipId);
    if (!membership) throw new Error('Membership not found');
    if (membership.status !== MEMBERSHIP_STATUS.ACTIVE) {
      throw new Error(`Cannot freeze membership with status ${membership.status}`);
    }

    membership.status = MEMBERSHIP_STATUS.FROZEN;
    membership.notes = reason;
    await membership.save();

    const freezeDoc = await Freeze.create({
      tenantId: new Types.ObjectId(tenantId),
      membershipId: membership._id,
      memberId: membership.memberId,
      startDate: freezeStartDate,
      endDate: expectedResumeDate || new Date(freezeStartDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      reason,
      status: 'ACTIVE',
    });

    if (performedByUserId) {
      await AuditLogService.record({
        tenantId,
        userId: performedByUserId,
        action: 'MEMBERSHIP_FREEZE',
        entity: 'Membership',
        entityId: membershipId,
        afterSnapshot: { freezeId: freezeDoc._id, reason },
      });
    }

    return { membership, freeze: freezeDoc };
  }

  /**
   * Unfreeze / resume a frozen membership and extend end date by the exact frozen days.
   */
  static async unfreezeMembership(
    tenantId: string,
    membershipId: string,
    unfreezeDate: Date = new Date(),
    performedByUserId?: string,
  ) {
    const membership = await Membership.findById(membershipId);
    if (!membership) throw new Error('Membership not found');
    if (membership.status !== MEMBERSHIP_STATUS.FROZEN) {
      throw new Error(`Membership is not currently frozen (status: ${membership.status})`);
    }

    const activeFreeze = await Freeze.findOne({
      membershipId: membership._id,
      status: 'ACTIVE',
    }).sort({ createdAt: -1 });

    if (!activeFreeze) {
      throw new Error('Active freeze record not found');
    }

    // Calculate days frozen and extend end date
    const { extendedEndDate, frozenDays } = MembershipDateService.calculateFrozenExtension(
      membership.endDate,
      activeFreeze.startDate,
      unfreezeDate,
    );

    activeFreeze.endDate = unfreezeDate;
    activeFreeze.status = 'COMPLETED';
    await activeFreeze.save();

    membership.endDate = extendedEndDate;
    membership.status = MEMBERSHIP_STATUS.ACTIVE;
    membership.freezeDaysUsed = (membership.freezeDaysUsed || 0) + frozenDays;
    await membership.save();

    if (performedByUserId) {
      await AuditLogService.record({
        tenantId,
        userId: performedByUserId,
        action: 'MEMBERSHIP_UNFREEZE',
        entity: 'Membership',
        entityId: membershipId,
        afterSnapshot: { extendedEndDate, frozenDays },
      });
    }

    return { membership, frozenDays, extendedEndDate, newEndDate: extendedEndDate };
  }

  /**
   * Upgrade or downgrade an existing membership with prorated credit calculation.
   */
  static async changePlanWithProration(
    tenantId: string,
    currentMembershipId: string,
    newPlanId: string,
    effectiveDate: Date = new Date(),
    performedByUserId?: string,
  ) {
    const currentMembership = await Membership.findById(currentMembershipId);
    if (!currentMembership) throw new Error('Current membership not found');

    const newPlan = await Plan.findById(newPlanId);
    if (!newPlan) throw new Error('New plan not found');

    // Compute unconsumed credit in integer paise
    const { unconsumedCreditInPaise, remainingDays } = MembershipDateService.calculateProratedAdjustment(
      currentMembership.startDate,
      currentMembership.endDate,
      currentMembership.totalAmountInPaise,
      effectiveDate,
    );

    // Archive old membership
    currentMembership.status = MEMBERSHIP_STATUS.CANCELLED;
    currentMembership.notes = `Upgraded/changed to ${newPlan.name} on ${effectiveDate.toISOString().split('T')[0]}. Credit: ₹${(unconsumedCreditInPaise / 100).toFixed(2)}`;
    await currentMembership.save();

    // Create new membership starting from effective date
    const newEnd = MembershipDateService.calculateEndDate(effectiveDate, newPlan.type, newPlan.durationDays);
    const payableAmount = Math.max(0, newPlan.priceInPaise - unconsumedCreditInPaise);

    const newMembership = await Membership.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: currentMembership.branchId,
      memberId: currentMembership.memberId,
      planId: newPlan._id,
      startDate: effectiveDate,
      endDate: newEnd,
      status: MEMBERSHIP_STATUS.ACTIVE,
      totalAmountInPaise: payableAmount,
      balanceInPaise: 0,
    });

    if (performedByUserId) {
      await AuditLogService.record({
        tenantId,
        userId: performedByUserId,
        action: 'MEMBERSHIP_UPGRADE_PRORATED',
        entity: 'Membership',
        entityId: newMembership._id.toString(),
        afterSnapshot: {
          previousMembershipId: currentMembershipId,
          unconsumedCreditInPaise,
          remainingDays,
        },
      });
    }

    return {
      previousMembership: currentMembership,
      oldMembership: currentMembership,
      newMembership,
      unconsumedCreditInPaise,
      remainingDays,
      payableDifferenceInPaise: payableAmount,
      proration: { creditInPaise: unconsumedCreditInPaise },
    };
  }

  /**
   * Automated midnight expiry evaluation job.
   */
  static async runAutomatedExpiryJob(tenantId?: string): Promise<{ expiredCount: number }> {
    const now = new Date();
    const filter: Record<string, any> = {
      status: MEMBERSHIP_STATUS.ACTIVE,
      endDate: { $lt: now },
    };
    if (tenantId) filter.tenantId = new Types.ObjectId(tenantId);

    const expiredMemberships = await Membership.find(filter);
    let count = 0;

    for (const m of expiredMemberships) {
      m.status = MEMBERSHIP_STATUS.EXPIRED;
      await m.save();
      count++;

      // Check if member has any other active membership
      const hasOtherActive = await Membership.exists({
        memberId: m.memberId,
        status: MEMBERSHIP_STATUS.ACTIVE,
        endDate: { $gte: now },
      });

      if (!hasOtherActive) {
        await Member.findByIdAndUpdate(m.memberId, { status: MEMBER_STATUS.EXPIRED });
      }
    }

    return { expiredCount: count };
  }
}
