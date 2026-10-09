import mongoose, { Types } from 'mongoose';
import {
  LEAD_PIPELINE_STATUS,
  LEAD_SCORE,
  LEAD_SOURCE,
  MEMBER_STATUS,
  MEMBERSHIP_STATUS,
  USER_ROLES,
  type LeadPipelineStatus,
} from '@gymos/shared';
import {
  Lead,
  type ILead,
  LeadActivity,
  Member,
  User,
  Branch,
  Tenant,
  Counter,
  Plan,
  Membership,
  Invoice,
  Payment,
  Wallet,
} from '../models/index.js';

export class CrmService {
  /**
   * Public lead capture API endpoint for landing page and embedded widgets
   */
  static async capturePublicLead(data: {
    tenantId?: string;
    subdomain?: string;
    branchId: string;
    name: string;
    phone: string;
    email?: string;
    source?: any;
    fitnessGoal?: string;
    notes?: string;
  }) {
    let resolvedTenantId: Types.ObjectId | null = null;

    if (data.tenantId) {
      resolvedTenantId = new Types.ObjectId(data.tenantId);
    } else if (data.subdomain) {
      const tenant = await Tenant.findOne({ subdomain: data.subdomain.toLowerCase() });
      if (tenant) resolvedTenantId = tenant._id;
    }

    if (!resolvedTenantId) {
      // Fallback to tenant of the branch
      const branch = await Branch.findById(data.branchId);
      if (!branch) {
        throw new Error('Invalid branch or tenant specified');
      }
      resolvedTenantId = branch.tenantId;
    }

    const branchObjId = new Types.ObjectId(data.branchId);

    // Duplicate check by phone for the tenant
    let lead = await Lead.findOne({
      tenantId: resolvedTenantId,
      phone: data.phone,
      isDeleted: false,
    });

    if (lead) {
      // Lead already exists: record duplicate inquiry activity and elevate score to HOT
      lead.leadScore = LEAD_SCORE.HOT;
      if (data.notes) {
        lead.notes = `${lead.notes || ''}\n[Repeat Inquiry] ${data.notes}`.trim();
      }
      if (data.fitnessGoal && !lead.tags.includes(data.fitnessGoal)) {
        lead.tags.push(data.fitnessGoal);
      }
      lead.lastContactedAt = new Date();
      await lead.save();

      await LeadActivity.create({
        tenantId: resolvedTenantId,
        leadId: lead._id,
        type: 'NOTE',
        content: `Repeat online inquiry received via ${data.source || 'WEBSITE'}. Goal: ${data.fitnessGoal || 'Not specified'}.`,
      });

      return { lead, isDuplicate: true };
    }

    // Auto-assign: pick a sales rep round-robin
    const salesReps = await User.find({
      tenantId: resolvedTenantId,
      branchIds: branchObjId,
      role: { $in: [USER_ROLES.SALES_EXEC, USER_ROLES.BRANCH_MANAGER] },
      isActive: true,
    });

    let assignedStaffId: Types.ObjectId | undefined;
    if (salesReps.length > 0) {
      // Pick rep with fewest active leads
      const repCounts = await Promise.all(
        salesReps.map(async (rep) => ({
          rep,
          count: await Lead.countDocuments({
            tenantId: resolvedTenantId,
            assignedToStaffId: rep._id,
            pipelineStatus: { $nin: [LEAD_PIPELINE_STATUS.CONVERTED, LEAD_PIPELINE_STATUS.LOST] },
          }),
        })),
      );
      repCounts.sort((a, b) => a.count - b.count);
      assignedStaffId = repCounts[0].rep._id;
    }

    lead = await Lead.create({
      tenantId: resolvedTenantId,
      branchId: branchObjId,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      source: data.source || LEAD_SOURCE.WEBSITE,
      pipelineStatus: LEAD_PIPELINE_STATUS.NEW,
      leadScore: LEAD_SCORE.WARM,
      assignedToStaffId: assignedStaffId,
      tags: data.fitnessGoal ? [data.fitnessGoal] : [],
      notes: data.notes || undefined,
    });

    await LeadActivity.create({
      tenantId: resolvedTenantId,
      leadId: lead._id,
      type: 'NOTE',
      content: `Lead captured via online form (${data.source || 'WEBSITE'}).${assignedStaffId ? ' Auto-assigned to staff.' : ''}`,
    });

    return { lead, isDuplicate: false };
  }

  /**
   * Create lead manually in staff console
   */
  static async createLead(tenantId: string, data: any, staffId?: string) {
    const lead = await Lead.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: new Types.ObjectId(data.branchId),
      name: data.name,
      email: data.email || undefined,
      phone: data.phone,
      source: data.source || LEAD_SOURCE.WALK_IN,
      pipelineStatus: data.pipelineStatus || LEAD_PIPELINE_STATUS.NEW,
      assignedToStaffId: data.assignedToStaffId ? new Types.ObjectId(data.assignedToStaffId) : undefined,
      tags: data.tags || [],
      notes: data.notes || undefined,
      leadScore: data.leadScore || LEAD_SCORE.WARM,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
    });

    await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: lead._id,
      staffId: staffId ? new Types.ObjectId(staffId) : undefined,
      type: 'NOTE',
      content: `Lead created manually: ${lead.name} (${lead.source}).`,
    });

    return lead;
  }

  /**
   * List leads with filters, search, and pagination
   */
  static async getLeads(
    tenantId: string,
    filters: {
      branchId?: string;
      status?: string;
      score?: string;
      source?: string;
      assignedStaffId?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    };

    if (filters.branchId) query.branchId = new Types.ObjectId(filters.branchId);
    if (filters.status) query.pipelineStatus = filters.status;
    if (filters.score) query.leadScore = filters.score;
    if (filters.source) query.source = filters.source;
    if (filters.assignedStaffId) query.assignedToStaffId = new Types.ObjectId(filters.assignedStaffId);
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ name: searchRegex }, { phone: searchRegex }, { email: searchRegex }];
    }

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedToStaffId', 'name email role')
        .populate('branchId', 'name code')
        .populate('convertedMemberId', 'memberCode firstName lastName')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
    ]);

    // Pipeline stage counts for Kanban header metrics
    const stageCountsAgg = await Lead.aggregate([
      { $match: { tenantId: new Types.ObjectId(tenantId), isDeleted: false } },
      { $group: { _id: '$pipelineStatus', count: { $sum: 1 } } },
    ]);
    const stageCounts: Record<string, number> = {};
    Object.values(LEAD_PIPELINE_STATUS).forEach((st) => {
      stageCounts[st] = 0;
    });
    stageCountsAgg.forEach((s) => {
      if (s._id) stageCounts[s._id] = s.count;
    });

    return {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stageCounts,
    };
  }

  /**
   * Get single lead by ID
   */
  static async getLeadById(tenantId: string, leadId: string) {
    const lead = await Lead.findOne({
      _id: new Types.ObjectId(leadId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    })
      .populate('assignedToStaffId', 'name email role')
      .populate('branchId', 'name code')
      .populate('convertedMemberId', 'memberCode firstName lastName');

    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  /**
   * Update lead fields
   */
  static async updateLead(tenantId: string, leadId: string, data: any) {
    const lead = await Lead.findOneAndUpdate(
      { _id: new Types.ObjectId(leadId), tenantId: new Types.ObjectId(tenantId), isDeleted: false },
      { $set: data },
      { new: true },
    );
    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  /**
   * Transition pipeline status (Kanban drag-and-drop)
   */
  static async updateLeadStatus(
    tenantId: string,
    leadId: string,
    status: LeadPipelineStatus,
    lostReason?: string,
    notes?: string,
    staffId?: string,
  ) {
    const lead = await Lead.findOne({
      _id: new Types.ObjectId(leadId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    });
    if (!lead) throw new Error('Lead not found');

    const previousStatus = lead.pipelineStatus;
    lead.pipelineStatus = status;
    if (status === LEAD_PIPELINE_STATUS.LOST) {
      lead.lostReason = lostReason || 'Not interested';
    }
    lead.lastContactedAt = new Date();
    await lead.save();

    await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: lead._id,
      staffId: staffId ? new Types.ObjectId(staffId) : undefined,
      type: 'STATUS_CHANGE',
      content: `Pipeline status moved from ${previousStatus} to ${status}.${lostReason ? ` Reason: ${lostReason}.` : ''}${notes ? ` Notes: ${notes}` : ''}`,
    });

    return lead;
  }

  /**
   * Assign lead to specific staff member
   */
  static async assignLead(tenantId: string, leadId: string, staffId: string, assignedByStaffId?: string) {
    const staff = await User.findOne({ _id: new Types.ObjectId(staffId), tenantId: new Types.ObjectId(tenantId) });
    if (!staff) throw new Error('Staff member not found');

    const lead = await Lead.findOneAndUpdate(
      { _id: new Types.ObjectId(leadId), tenantId: new Types.ObjectId(tenantId), isDeleted: false },
      { $set: { assignedToStaffId: staff._id } },
      { new: true },
    );
    if (!lead) throw new Error('Lead not found');

    await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: lead._id,
      staffId: assignedByStaffId ? new Types.ObjectId(assignedByStaffId) : undefined,
      type: 'NOTE',
      content: `Lead assigned to ${staff.name} (${staff.role}).`,
    });

    return lead;
  }

  /**
   * Auto-assign all unassigned leads across sales team
   */
  static async autoAssignLeads(tenantId: string, branchId?: string) {
    const branchQuery = branchId ? { branchIds: new Types.ObjectId(branchId) } : {};
    const salesReps = await User.find({
      tenantId: new Types.ObjectId(tenantId),
      ...branchQuery,
      role: { $in: [USER_ROLES.SALES_EXEC, USER_ROLES.BRANCH_MANAGER] },
      isActive: true,
    });

    if (salesReps.length === 0) {
      throw new Error('No active sales executives or managers found for auto-assignment');
    }

    const unassignedLeads = await Lead.find({
      tenantId: new Types.ObjectId(tenantId),
      ...(branchId ? { branchId: new Types.ObjectId(branchId) } : {}),
      assignedToStaffId: { $exists: false },
      isDeleted: false,
      pipelineStatus: { $nin: [LEAD_PIPELINE_STATUS.CONVERTED, LEAD_PIPELINE_STATUS.LOST] },
    });

    let assignedCount = 0;
    for (let i = 0; i < unassignedLeads.length; i++) {
      const rep = salesReps[i % salesReps.length];
      unassignedLeads[i].assignedToStaffId = rep._id;
      await unassignedLeads[i].save();

      await LeadActivity.create({
        tenantId: new Types.ObjectId(tenantId),
        leadId: unassignedLeads[i]._id,
        type: 'NOTE',
        content: `Lead auto-assigned to ${rep.name}.`,
      });
      assignedCount++;
    }

    return { assignedCount, totalUnassigned: unassignedLeads.length };
  }

  /**
   * Add activity (Call, WhatsApp, Email, Note, Follow-up Task)
   */
  static async addActivity(
    tenantId: string,
    leadId: string,
    activity: {
      type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE';
      content: string;
      scheduledAt?: string | Date;
      completedAt?: string | Date;
      result?: string;
    },
    staffId?: string,
  ) {
    const lead = await Lead.findOne({
      _id: new Types.ObjectId(leadId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    });
    if (!lead) throw new Error('Lead not found');

    const leadActivity = await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: lead._id,
      staffId: staffId ? new Types.ObjectId(staffId) : undefined,
      type: activity.type,
      content: activity.content,
      scheduledAt: activity.scheduledAt ? new Date(activity.scheduledAt) : undefined,
      completedAt: activity.completedAt ? new Date(activity.completedAt) : undefined,
      result: activity.result,
    });

    lead.lastContactedAt = new Date();
    if (activity.scheduledAt) {
      lead.followUpDate = new Date(activity.scheduledAt);
    }
    await lead.save();

    return leadActivity;
  }

  /**
   * Get activities list for a lead
   */
  static async getActivities(tenantId: string, leadId: string) {
    return LeadActivity.find({
      tenantId: new Types.ObjectId(tenantId),
      leadId: new Types.ObjectId(leadId),
    })
      .populate('staffId', 'name role')
      .sort({ createdAt: -1 });
  }

  /**
   * Get follow-up tasks and reminders
   */
  static async getFollowUpTasks(tenantId: string, staffId?: string, branchId?: string) {
    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
      followUpDate: { $exists: true, $ne: null },
      pipelineStatus: { $nin: [LEAD_PIPELINE_STATUS.CONVERTED, LEAD_PIPELINE_STATUS.LOST] },
    };
    if (staffId) query.assignedToStaffId = new Types.ObjectId(staffId);
    if (branchId) query.branchId = new Types.ObjectId(branchId);

    const leads = await Lead.find(query)
      .populate('assignedToStaffId', 'name email')
      .populate('branchId', 'name code')
      .sort({ followUpDate: 1 })
      .limit(50);

    const scheduledActivities = await LeadActivity.find({
      tenantId: new Types.ObjectId(tenantId),
      scheduledAt: { $exists: true, $ne: null },
      completedAt: { $exists: false },
    })
      .populate('leadId', 'name phone pipelineStatus')
      .populate('staffId', 'name email')
      .sort({ scheduledAt: 1 })
      .limit(50);

    return { leads, scheduledActivities };
  }

  /**
   * Merge duplicate lead into primary lead
   */
  static async mergeLeads(tenantId: string, primaryLeadId: string, duplicateLeadId: string, staffId?: string) {
    if (primaryLeadId === duplicateLeadId) {
      throw new Error('Cannot merge lead into itself');
    }

    const [primary, duplicate] = await Promise.all([
      Lead.findOne({ _id: new Types.ObjectId(primaryLeadId), tenantId: new Types.ObjectId(tenantId), isDeleted: false }),
      Lead.findOne({ _id: new Types.ObjectId(duplicateLeadId), tenantId: new Types.ObjectId(tenantId), isDeleted: false }),
    ]);

    if (!primary || !duplicate) {
      throw new Error('One or both leads not found');
    }

    // Merge notes, tags, email
    if (duplicate.email && !primary.email) primary.email = duplicate.email;
    if (duplicate.notes) {
      primary.notes = `${primary.notes || ''}\n[Merged Notes from ${duplicate.name}]: ${duplicate.notes}`.trim();
    }
    const combinedTags = Array.from(new Set([...primary.tags, ...duplicate.tags]));
    primary.tags = combinedTags;
    await primary.save();

    // Reassign activities from duplicate to primary
    await LeadActivity.updateMany(
      { tenantId: new Types.ObjectId(tenantId), leadId: duplicate._id },
      { $set: { leadId: primary._id } },
    );

    // Soft delete duplicate lead and mark reference
    duplicate.isDeleted = true;
    duplicate.deletedAt = new Date();
    duplicate.mergedIntoLeadId = primary._id;
    await duplicate.save();

    await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: primary._id,
      staffId: staffId ? new Types.ObjectId(staffId) : undefined,
      type: 'NOTE',
      content: `Duplicate lead ${duplicate.name} (${duplicate.phone}) successfully merged into this lead.`,
    });

    return primary;
  }

  /**
   * One-Click Convert Lead to Member
   */
  static async convertLeadToMember(
    tenantId: string,
    leadId: string,
    data: {
      planId?: string;
      startDate?: string | Date;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      emergencyContact?: { name: string; phone: string; relation: string };
      notes?: string;
    },
    staffId?: string,
  ) {
    const lead = await Lead.findOne({
      _id: new Types.ObjectId(leadId),
      tenantId: new Types.ObjectId(tenantId),
      isDeleted: false,
    });
    if (!lead) throw new Error('Lead not found');

    if (lead.pipelineStatus === LEAD_PIPELINE_STATUS.CONVERTED && lead.convertedMemberId) {
      const existingMember = await Member.findById(lead.convertedMemberId);
      return { member: existingMember, lead, alreadyConverted: true };
    }

    // Generate atomic sequence member code
    const memberCode = await Counter.getNextSequence(new Types.ObjectId(tenantId), 'MEMBER', 'MEM');

    // Split name
    const nameParts = lead.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Member';

    // Unique referral code for the new member
    const referralCode = `REF-${memberCode.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Create member
    const member = await Member.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: lead.branchId,
      memberCode,
      firstName,
      lastName,
      email: lead.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@fitnessclub.test`,
      phone: lead.phone,
      gender: data.gender || 'MALE',
      emergencyContact: data.emergencyContact,
      medicalNotes: data.notes || lead.notes,
      fitnessGoals: lead.tags.length > 0 ? lead.tags : ['General Fitness'],
      status: MEMBER_STATUS.ACTIVE,
      joinDate: data.startDate ? new Date(data.startDate) : new Date(),
      referralCode,
      leaderboardOptIn: true,
    });

    // Initialize transactional wallet
    await Wallet.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: member._id,
      balanceInPaise: 0,
      transactions: [],
    });

    // Optional plan assignment with invoice & payment
    if (data.planId) {
      const plan = await Plan.findOne({ _id: new Types.ObjectId(data.planId), tenantId: new Types.ObjectId(tenantId) });
      if (plan) {
        const itemAmount = plan.priceInPaise;
        const taxRate = plan.taxRatePercent || 18;
        const taxAmount = Math.round((itemAmount * taxRate) / 100);
        const grandTotal = itemAmount + taxAmount;
        const invoiceNumber = await Counter.getNextSequence(new Types.ObjectId(tenantId), 'INVOICE', 'INV', '2026-27');
        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const invoice = await Invoice.create({
          tenantId: new Types.ObjectId(tenantId),
          branchId: lead.branchId,
          invoiceNumber,
          financialYear: '2026-27',
          memberId: member._id,
          memberSnapshot: {
            memberId: member._id.toString(),
            memberCode: member.memberCode,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            phone: member.phone,
          },
          items: [
            {
              description: `${plan.name} Membership`,
              quantity: 1,
              unitPriceInPaise: itemAmount,
              amountInPaise: itemAmount,
              taxRatePercent: taxRate,
              taxAmountInPaise: taxAmount,
              planSnapshot: {
                planId: plan._id.toString(),
                planName: plan.name,
                durationDays: plan.durationDays,
              },
            },
          ],
          subtotalInPaise: itemAmount,
          taxTotalInPaise: taxAmount,
          discountInPaise: 0,
          grandTotalInPaise: grandTotal,
          paidAmountInPaise: grandTotal,
          dueAmountInPaise: 0,
          status: 'PAID',
          issueDate: startDate,
          dueDate: startDate,
        });

        const paymentNumber = await Counter.getNextSequence(new Types.ObjectId(tenantId), 'PAYMENT', 'RCPT');
        await Payment.create({
          tenantId: new Types.ObjectId(tenantId),
          branchId: lead.branchId,
          paymentNumber,
          invoiceId: invoice._id,
          memberId: member._id,
          amountInPaise: grandTotal,
          method: 'UPI',
          status: 'SUCCESSFUL',
          transactionRef: `CONV-TXN-${Date.now()}`,
          idempotencyKey: `idemp-conv-${member.memberCode}`,
        });

        await Membership.create({
          tenantId: new Types.ObjectId(tenantId),
          branchId: lead.branchId,
          memberId: member._id,
          planId: plan._id,
          invoiceId: invoice._id,
          startDate,
          endDate,
          status: MEMBERSHIP_STATUS.ACTIVE,
          totalAmountInPaise: grandTotal,
          balanceInPaise: 0,
        });
      }
    }

    // Update lead status
    lead.pipelineStatus = LEAD_PIPELINE_STATUS.CONVERTED;
    lead.convertedMemberId = member._id;
    await lead.save();

    await LeadActivity.create({
      tenantId: new Types.ObjectId(tenantId),
      leadId: lead._id,
      staffId: staffId ? new Types.ObjectId(staffId) : undefined,
      type: 'STATUS_CHANGE',
      content: `Converted to active gym member: ${member.firstName} ${member.lastName} (${member.memberCode}).`,
    });

    return { member, lead, alreadyConverted: false };
  }

  /**
   * Sales representative performance and conversion reports
   */
  static async getSalesReport(tenantId: string, branchId?: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const branchFilter = branchId ? { branchId: new Types.ObjectId(branchId) } : {};

    const reps = await User.find({
      tenantId: tenantObjId,
      ...(branchId ? { branchIds: new Types.ObjectId(branchId) } : {}),
      role: { $in: [USER_ROLES.SALES_EXEC, USER_ROLES.BRANCH_MANAGER] },
    }).lean();

    const stats = await Promise.all(
      reps.map(async (rep) => {
        const [totalAssigned, converted, lost, contacted] = await Promise.all([
          Lead.countDocuments({ tenantId: tenantObjId, ...branchFilter, assignedToStaffId: rep._id, isDeleted: false }),
          Lead.countDocuments({
            tenantId: tenantObjId,
            ...branchFilter,
            assignedToStaffId: rep._id,
            pipelineStatus: LEAD_PIPELINE_STATUS.CONVERTED,
            isDeleted: false,
          }),
          Lead.countDocuments({
            tenantId: tenantObjId,
            ...branchFilter,
            assignedToStaffId: rep._id,
            pipelineStatus: LEAD_PIPELINE_STATUS.LOST,
            isDeleted: false,
          }),
          Lead.countDocuments({
            tenantId: tenantObjId,
            ...branchFilter,
            assignedToStaffId: rep._id,
            pipelineStatus: { $in: [LEAD_PIPELINE_STATUS.CONTACTED, LEAD_PIPELINE_STATUS.INTERESTED, LEAD_PIPELINE_STATUS.TRIAL_BOOKED, LEAD_PIPELINE_STATUS.TRIAL_COMPLETED] },
            isDeleted: false,
          }),
        ]);

        const conversionRate = totalAssigned > 0 ? Math.round((converted / totalAssigned) * 100) : 0;

        return {
          staffId: rep._id,
          name: rep.name,
          email: rep.email,
          role: rep.role,
          totalAssigned,
          contacted,
          converted,
          lost,
          activePipeline: totalAssigned - converted - lost,
          conversionRatePercent: conversionRate,
        };
      }),
    );

    // Source conversion breakdown
    const sourceStats = await Lead.aggregate([
      { $match: { tenantId: tenantObjId, ...branchFilter, isDeleted: false } },
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$pipelineStatus', LEAD_PIPELINE_STATUS.CONVERTED] }, 1, 0] },
          },
        },
      },
    ]);

    const totalLeads = sourceStats.reduce((acc, s) => acc + s.total, 0);
    const convertedLeads = sourceStats.reduce((acc, s) => acc + s.converted, 0);

    return {
      totalLeads,
      convertedLeads,
      repPerformance: stats,
      sourceBreakdown: sourceStats.map((s) => ({
        source: s._id,
        totalLeads: s.total,
        converted: s.converted,
        conversionRatePercent: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
      })),
    };
  }
}
