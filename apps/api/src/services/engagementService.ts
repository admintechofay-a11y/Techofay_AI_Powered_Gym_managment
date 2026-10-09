import mongoose, { Types } from 'mongoose';
import {
  Attendance,
  Member,
  Wallet,
  type IWallet,
  Referral,
  type IReferral,
  Lead,
} from '../models/index.js';
import { LEAD_SOURCE, LEAD_PIPELINE_STATUS } from '@gymos/shared';

export class EngagementService {
  /**
   * Calculate real-time attendance streak for member
   */
  static async getAttendanceStreak(tenantId: string, memberId: string) {
    const memberObjId = new Types.ObjectId(memberId);
    const tenantObjId = new Types.ObjectId(tenantId);

    const attendances = await Attendance.find({
      tenantId: tenantObjId,
      memberId: memberObjId,
    }).sort({ checkInTime: -1 });

    if (attendances.length === 0) {
      return { currentStreakDays: 0, longestStreakDays: 0, totalWorkouts: 0 };
    }

    // Extract unique calendar dates in YYYY-MM-DD
    const uniqueDates = Array.from(
      new Set(
        attendances.map((a) => a.checkInTime.toISOString().split('T')[0]),
      ),
    ).sort().reverse(); // descending

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = 0;
    let expectedDate = new Date();

    // If member attended today or yesterday, streak is currently active
    const firstAttended = uniqueDates[0];
    if (firstAttended === todayStr || firstAttended === yesterdayStr) {
      expectedDate = new Date(firstAttended);
      for (const d of uniqueDates) {
        const dStr = expectedDate.toISOString().split('T')[0];
        if (d === dStr) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Compute longest streak in history
    let longestStreak = currentStreak;
    let tempStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const curr = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i + 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 1;
      }
    }

    return {
      currentStreakDays: currentStreak,
      longestStreakDays: longestStreak,
      totalWorkouts: attendances.length,
      recentDates: uniqueDates.slice(0, 14),
    };
  }

  /**
   * Community Leaderboard (strictly Opt-In only)
   */
  static async getLeaderboard(tenantId: string, branchId?: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const query: any = {
      tenantId: tenantObjId,
      leaderboardOptIn: true,
      status: 'ACTIVE',
    };
    if (branchId) query.branchId = new Types.ObjectId(branchId);

    const members = await Member.find(query).select('memberCode firstName lastName profilePhotoUrl');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const leaderboardItems = await Promise.all(
      members.map(async (m) => {
        const attendanceCount = await Attendance.countDocuments({
          tenantId: tenantObjId,
          memberId: m._id,
          checkInTime: { $gte: thirtyDaysAgo },
        });

        const streak = await this.getAttendanceStreak(tenantId, m._id.toString());

        return {
          memberId: m._id,
          memberCode: m.memberCode,
          name: `${m.firstName} ${m.lastName.charAt(0)}.`,
          profilePhotoUrl: m.profilePhotoUrl,
          monthlyCheckIns: attendanceCount,
          currentStreakDays: streak.currentStreakDays,
          score: attendanceCount * 10 + streak.currentStreakDays * 5,
        };
      }),
    );

    leaderboardItems.sort((a, b) => b.score - a.score);

    return leaderboardItems.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  }

  static async updateLeaderboardOptIn(tenantId: string, memberId: string, optIn: boolean) {
    const member = await Member.findOneAndUpdate(
      { _id: new Types.ObjectId(memberId), tenantId: new Types.ObjectId(tenantId) },
      { $set: { leaderboardOptIn: optIn } },
      { new: true },
    );
    if (!member) throw new Error('Member not found');
    return member;
  }

  // ==========================================================================
  // REFERRALS & TRANSACTIONAL WALLET LEDGER
  // ==========================================================================
  static async createReferral(tenantId: string, data: {
    referrerMemberId: string;
    referredName: string;
    referredPhone: string;
    referredEmail?: string;
    notes?: string;
  }) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const referrerObjId = new Types.ObjectId(data.referrerMemberId);

    const referrer = await Member.findOne({ _id: referrerObjId, tenantId: tenantObjId });
    if (!referrer) throw new Error('Referrer member not found');

    // Automatically create a CRM Lead attributed to referral
    let lead = await Lead.findOne({ tenantId: tenantObjId, phone: data.referredPhone, isDeleted: false });
    if (!lead) {
      lead = await Lead.create({
        tenantId: tenantObjId,
        branchId: referrer.branchId,
        name: data.referredName,
        phone: data.referredPhone,
        email: data.referredEmail || undefined,
        source: LEAD_SOURCE.REFERRAL,
        pipelineStatus: LEAD_PIPELINE_STATUS.NEW,
        leadScore: 'HOT',
        tags: [`Referred by ${referrer.memberCode}`],
        notes: `Referral from member ${referrer.firstName} ${referrer.lastName} (${referrer.memberCode}). ${data.notes || ''}`.trim(),
      });
    }

    const referral = await Referral.create({
      tenantId: tenantObjId,
      referrerMemberId: referrerObjId,
      referredLeadId: lead._id,
      rewardType: 'WALLET_CREDIT',
      rewardValue: 50000, // ₹500 standard reward
      status: 'PENDING',
    });

    return { referral, lead };
  }

  /**
   * Reward referral with atomic wallet credit transaction ledger
   */
  static async rewardReferral(tenantId: string, referralId: string, rewardAmountInPaise: number, reason: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const referral = await Referral.findOne({ _id: new Types.ObjectId(referralId), tenantId: tenantObjId });
    if (!referral) throw new Error('Referral record not found');
    if (referral.status === 'REWARDED') {
      throw new Error('This referral has already been rewarded');
    }

    let wallet = await Wallet.findOne({
      tenantId: tenantObjId,
      memberId: referral.referrerMemberId,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        tenantId: tenantObjId,
        memberId: referral.referrerMemberId,
        balanceInPaise: 0,
        transactions: [],
      });
    }

    const newBalanceInPaise = wallet.balanceInPaise + rewardAmountInPaise;

    // Transactional ledger entry
    wallet.transactions.push({
      type: 'CREDIT',
      amountInPaise: rewardAmountInPaise,
      balanceAfterInPaise: newBalanceInPaise,
      reason: reason || 'Referral reward credit for inviting a new member',
      referenceId: referral._id,
      timestamp: new Date(),
    });

    wallet.balanceInPaise = newBalanceInPaise;
    await wallet.save();

    referral.status = 'REWARDED';
    referral.rewardedAt = new Date();
    referral.rewardValue = rewardAmountInPaise;
    await referral.save();

    return {
      referral,
      wallet,
      creditedAmountInPaise: rewardAmountInPaise,
      newBalanceInPaise,
      message: `Successfully credited ₹${(rewardAmountInPaise / 100).toFixed(2)} to member wallet.`,
    };
  }

  static async getWallet(tenantId: string, memberId: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const memberObjId = new Types.ObjectId(memberId);

    let wallet = await Wallet.findOne({
      tenantId: tenantObjId,
      memberId: memberObjId,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        tenantId: tenantObjId,
        memberId: memberObjId,
        balanceInPaise: 0,
        transactions: [],
      });
    }

    const referrals = await Referral.find({
      tenantId: tenantObjId,
      referrerMemberId: memberObjId,
    }).populate('referredLeadId', 'name phone pipelineStatus');

    return {
      wallet,
      referrals,
    };
  }
}
