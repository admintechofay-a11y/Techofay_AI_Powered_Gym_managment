import { Types } from 'mongoose';
import { Branch } from '../models/Branch.js';
import { Member } from '../models/Member.js';
import { Membership } from '../models/Membership.js';
import { Invoice } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';
import { Attendance } from '../models/Attendance.js';
import { User } from '../models/User.js';
import { AuditLogService } from './auditLogService.js';

export class BranchService {
  /**
   * Performance metrics for a single branch
   */
  public static async getBranchPerformance(tenantId: string, branchId: string) {
    const branchObjectId = new Types.ObjectId(branchId);
    const tenantObjectId = new Types.ObjectId(tenantId);

    const branch = await Branch.findOne({ _id: branchObjectId, tenantId }).lean();
    if (!branch) {
      const err: any = new Error('Branch not found');
      err.statusCode = 404;
      throw err;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMembers,
      staffCount,
      monthlyInvoices,
      monthlyExpenses,
      attendanceCount,
    ] = await Promise.all([
      Member.countDocuments({ tenantId: tenantObjectId, branchId: branchObjectId, isDeleted: false }),
      Member.countDocuments({ tenantId: tenantObjectId, branchId: branchObjectId, status: 'ACTIVE', isDeleted: false }),
      User.countDocuments({ tenantId: tenantObjectId, branchIds: branchObjectId, status: 'ACTIVE' }),
      Invoice.find({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        status: 'PAID',
        createdAt: { $gte: startOfMonth },
      }).select('paidAmountInPaise grandTotalInPaise').lean(),
      Expense.find({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        date: { $gte: startOfMonth },
      }).select('amountInPaise').lean(),
      Attendance.countDocuments({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        checkInTime: { $gte: startOfMonth },
      }),
    ]);

    const revenueInPaise = monthlyInvoices.reduce((sum, inv) => sum + (inv.paidAmountInPaise || inv.grandTotalInPaise || 0), 0);
    const expensesInPaise = monthlyExpenses.reduce((sum, exp) => sum + (exp.amountInPaise || 0), 0);
    const netProfitInPaise = revenueInPaise - expensesInPaise;

    return {
      branch: {
        id: branch._id,
        name: branch.name,
        code: branch.code,
        city: branch.city,
      },
      metrics: {
        totalMembers,
        activeMembers,
        staffCount,
        attendanceCountThisMonth: attendanceCount,
        revenueInPaise,
        revenueFormatted: `₹${(revenueInPaise / 100).toLocaleString('en-IN')}`,
        expensesInPaise,
        expensesFormatted: `₹${(expensesInPaise / 100).toLocaleString('en-IN')}`,
        netProfitInPaise,
        netProfitFormatted: `₹${(netProfitInPaise / 100).toLocaleString('en-IN')}`,
        profitMargin: revenueInPaise > 0 ? Math.round((netProfitInPaise / revenueInPaise) * 100) : 0,
      },
    };
  }

  /**
   * Cross-branch comparison matrix
   */
  public static async getCrossBranchComparison(tenantId: string) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const branches = await Branch.find({ tenantId: tenantObjectId, isActive: true }).lean();

    const comparison = await Promise.all(
      branches.map(async (b) => {
        const perf = await this.getBranchPerformance(tenantId, b._id.toString());
        return {
          branchId: b._id,
          branchName: b.name,
          branchCode: b.code,
          city: b.city,
          totalMembers: perf.metrics.totalMembers,
          activeMembers: perf.metrics.activeMembers,
          staffCount: perf.metrics.staffCount,
          attendanceThisMonth: perf.metrics.attendanceCountThisMonth,
          revenueInPaise: perf.metrics.revenueInPaise,
          expensesInPaise: perf.metrics.expensesInPaise,
          netProfitInPaise: perf.metrics.netProfitInPaise,
          profitMargin: perf.metrics.profitMargin,
        };
      }),
    );

    // Sort by revenue desc
    comparison.sort((a, b) => b.revenueInPaise - a.revenueInPaise);

    return {
      branches: comparison,
      topPerformer: comparison[0] || null,
      totalBranches: branches.length,
    };
  }

  /**
   * Consolidated Multi-Branch Financial & Operational Report
   */
  public static async getConsolidatedReports(tenantId: string) {
    const comparison = await this.getCrossBranchComparison(tenantId);

    const totals = comparison.branches.reduce(
      (acc, item) => {
        acc.totalMembers += item.totalMembers;
        acc.totalActiveMembers += item.activeMembers;
        acc.totalStaff += item.staffCount;
        acc.totalAttendance += item.attendanceThisMonth;
        acc.totalRevenueInPaise += item.revenueInPaise;
        acc.totalExpensesInPaise += item.expensesInPaise;
        acc.totalNetProfitInPaise += item.netProfitInPaise;
        return acc;
      },
      {
        totalMembers: 0,
        totalActiveMembers: 0,
        totalStaff: 0,
        totalAttendance: 0,
        totalRevenueInPaise: 0,
        totalExpensesInPaise: 0,
        totalNetProfitInPaise: 0,
      },
    );

    const overallMargin =
      totals.totalRevenueInPaise > 0
        ? Math.round((totals.totalNetProfitInPaise / totals.totalRevenueInPaise) * 100)
        : 0;

    return {
      totals: {
        ...totals,
        revenueFormatted: `₹${(totals.totalRevenueInPaise / 100).toLocaleString('en-IN')}`,
        expensesFormatted: `₹${(totals.totalExpensesInPaise / 100).toLocaleString('en-IN')}`,
        netProfitFormatted: `₹${(totals.totalNetProfitInPaise / 100).toLocaleString('en-IN')}`,
        overallProfitMargin: overallMargin,
      },
      branchBreakdown: comparison.branches,
    };
  }

  /**
   * Member Transfer between Branches with Complete Audit Log
   */
  public static async transferMember(params: {
    tenantId: string;
    memberId: string;
    destinationBranchId: string;
    reason: string;
    transferActiveMemberships?: boolean;
    actorId?: string;
  }) {
    const { tenantId, memberId, destinationBranchId, reason, transferActiveMemberships = true, actorId } = params;

    const tenantObjectId = new Types.ObjectId(tenantId);
    const memberObjectId = new Types.ObjectId(memberId);
    const destinationBranchObjectId = new Types.ObjectId(destinationBranchId);

    // 1. Verify destination branch exists and belongs to tenant
    const destBranch = await Branch.findOne({ _id: destinationBranchObjectId, tenantId: tenantObjectId });
    if (!destBranch) {
      const err: any = new Error('Destination branch not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify Member
    const member = await Member.findOne({ _id: memberObjectId, tenantId: tenantObjectId });
    if (!member) {
      const err: any = new Error('Member not found');
      err.statusCode = 404;
      throw err;
    }

    const sourceBranchId = member.branchId;
    if (sourceBranchId.toString() === destinationBranchId) {
      const err: any = new Error('Member is already assigned to this branch');
      err.statusCode = 400;
      throw err;
    }

    // 3. Update Member's Branch
    member.branchId = destinationBranchObjectId;
    await member.save();

    // 4. Optionally update active memberships to new branch
    let membershipsUpdated = 0;
    if (transferActiveMemberships) {
      const updateResult = await Membership.updateMany(
        {
          tenantId: tenantObjectId,
          memberId: memberObjectId,
          status: 'ACTIVE',
        },
        {
          branchId: destinationBranchObjectId,
        },
      );
      membershipsUpdated = updateResult.modifiedCount;
    }

    // 5. Audit Log
    await AuditLogService.record({
      tenantId,
      branchId: destinationBranchId,
      userId: actorId,
      userRole: 'GYM_OWNER',
      action: 'TRANSFER_MEMBER_BRANCH',
      entity: 'Member',
      entityId: memberId,
      beforeSnapshot: { branchId: sourceBranchId.toString() },
      afterSnapshot: {
        destinationBranchId,
        destinationBranchName: destBranch.name,
        reason,
        membershipsTransferred: membershipsUpdated,
      },
    });

    return {
      success: true,
      member: {
        id: member._id,
        memberCode: member.memberCode,
        fullName: `${member.firstName} ${member.lastName}`,
        previousBranchId: sourceBranchId,
        newBranchId: destinationBranchObjectId,
        newBranchName: destBranch.name,
      },
      membershipsTransferred: membershipsUpdated,
    };
  }
}
