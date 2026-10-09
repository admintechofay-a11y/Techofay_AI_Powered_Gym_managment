import { Types } from 'mongoose';
import {
  SUBSCRIPTION_TIER,
  TENANT_STATUS,
  PLAN_TYPE,
  TIER_LIMITS,
  type SubscriptionTier,
  type TenantStatus,
  type OnboardTenantInput,
} from '@gymos/shared';
import { Tenant } from '../models/Tenant.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { Member } from '../models/Member.js';
import { AuditLog } from '../models/AuditLog.js';
import { FeatureFlag } from '../models/FeatureFlag.js';
import { Ticket } from '../models/Ticket.js';
import { AiLog } from '../models/AiLog.js';
import { Notification } from '../models/Notification.js';
import { AuthService } from './authService.js';
import { AuditLogService } from './auditLogService.js';
import crypto from 'node:crypto';

export class SuperAdminService {
  /**
   * Complete Tenant Onboarding Wizard
   */
  public static async onboardTenant(input: OnboardTenantInput, superAdminUserId: string) {
    const existingTenant = await Tenant.findOne({ subdomain: input.subdomain.toLowerCase() });
    if (existingTenant) {
      const err: any = new Error(`Subdomain "${input.subdomain}" is already registered`);
      err.statusCode = 409;
      throw err;
    }

    const trialDays = input.trialDays ?? 14;
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const tierConfig = TIER_LIMITS[input.tier] || TIER_LIMITS.STARTER;

    // 1. Create Tenant
    const tenant = await Tenant.create({
      name: input.name,
      subdomain: input.subdomain.toLowerCase(),
      customDomain: input.customDomain?.toLowerCase(),
      tier: input.tier,
      status: TENANT_STATUS.ACTIVE,
      contactEmail: input.contactEmail.toLowerCase(),
      contactPhone: input.contactPhone,
      trialEndsAt,
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        brandColor: '#10b981',
      },
      aiSettings: {
        enabled: true,
        dailyLimit: tierConfig.maxAiCallsPerDay,
        usageToday: 0,
        lastResetDate: new Date().toISOString().slice(0, 10),
        mode: 'BASIC',
      },
    });

    // 2. Create Initial Branch
    const branch = await Branch.create({
      tenantId: tenant._id,
      name: input.branchName,
      code: input.branchCode.toUpperCase(),
      address: input.branchAddress,
      city: input.branchCity,
      state: input.branchState,
      pincode: input.branchPincode,
      phone: input.branchPhone,
      email: input.contactEmail.toLowerCase(),
      isActive: true,
      operatingHours: {
        openingTime: '06:00',
        closingTime: '22:00',
      },
    });

    // 3. Create Tenant Admin / Owner User
    const passwordHash = await AuthService.hashPassword(input.ownerPassword);
    const ownerUser = await User.create({
      tenantId: tenant._id,
      branchIds: [branch._id],
      name: input.ownerName,
      email: input.ownerEmail.toLowerCase(),
      phone: input.contactPhone,
      passwordHash,
      role: 'GYM_OWNER',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 4. Create Initial Subscription
    const pricePaise =
      input.billingCycle === 'YEARLY'
        ? tierConfig.yearlyPriceInPaise
        : tierConfig.monthlyPriceInPaise;

    const subscription = await Subscription.create({
      tenantId: tenant._id,
      planTier: input.tier,
      billingCycle: input.billingCycle,
      amountInPaise: pricePaise,
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndsAt,
      status: 'ACTIVE',
      maxBranches: tierConfig.maxBranches,
      maxMembers: tierConfig.maxMembers,
      features: tierConfig.features,
    });

    // 5. Create Default Starter Gym Plan
    await Plan.create({
      tenantId: tenant._id,
      branchIds: [branch._id],
      name: 'All-Access Pro Membership',
      code: 'PRO-ANNUAL',
      type: PLAN_TYPE.ANNUAL,
      description: 'Full gym facilities access including fitness floor and group classes',
      durationDays: 365,
      priceInPaise: 1800000, // ₹18,000
      signupFeeInPaise: 0,
      taxRatePercent: 18,
      maxFreezes: 2,
      maxFreezeDays: 30,
      isActive: true,
    });

    // 6. Default Feature Flags for Tenant
    const defaultFlags = [
      { key: 'ai_coach', description: 'AI Workout & Nutrition Assistant', isEnabled: true, minTier: SUBSCRIPTION_TIER.STARTER },
      { key: 'whatsapp_crm', description: 'WhatsApp Automated Notifications', isEnabled: true, minTier: SUBSCRIPTION_TIER.STARTER },
      { key: 'multi_branch', description: 'Multi-Branch Engine & Roaming Members', isEnabled: input.tier !== SUBSCRIPTION_TIER.STARTER, minTier: SUBSCRIPTION_TIER.PROFESSIONAL },
      { key: 'biometric_sync', description: 'Biometric Access Control Integration', isEnabled: input.tier === SUBSCRIPTION_TIER.ENTERPRISE, minTier: SUBSCRIPTION_TIER.ENTERPRISE },
    ];

    for (const flag of defaultFlags) {
      await FeatureFlag.create({
        tenantId: tenant._id,
        ...flag,
      });
    }

    // 7. Audit Log
    await AuditLogService.record({
      tenantId: tenant._id.toString(),
      branchId: branch._id.toString(),
      userId: superAdminUserId,
      userRole: 'SUPER_ADMIN',
      action: 'ONBOARD_TENANT',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      afterSnapshot: {
        subdomain: tenant.subdomain,
        tier: tenant.tier,
        ownerEmail: ownerUser.email,
      },
    });

    return {
      tenant,
      branch,
      ownerUser: {
        id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email,
        role: ownerUser.role,
      },
      subscription,
    };
  }

  /**
   * List Tenants with Pagination, Search & Tier filtering
   */
  public static async listTenants(params: {
    search?: string;
    status?: string;
    tier?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const filter: Record<string, any> = { isDeleted: false };
    if (params.status) filter.status = params.status;
    if (params.tier) filter.tier = params.tier;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { subdomain: { $regex: params.search, $options: 'i' } },
        { contactEmail: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Tenant.countDocuments(filter),
    ]);

    // Attach enriched metrics (memberCount, branchCount)
    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const [memberCount, branchCount, activeSub] = await Promise.all([
          Member.countDocuments({ tenantId: t._id, isDeleted: false }),
          Branch.countDocuments({ tenantId: t._id, isActive: true }),
          Subscription.findOne({ tenantId: t._id, status: 'ACTIVE' }).sort({ createdAt: -1 }).lean(),
        ]);
        return {
          ...t,
          metrics: {
            memberCount,
            branchCount,
            planTier: activeSub?.planTier || t.tier,
            subscriptionStatus: activeSub?.status || 'TRIAL',
            periodEnd: activeSub?.currentPeriodEnd || t.trialEndsAt,
          },
        };
      }),
    );

    return {
      tenants: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Single Tenant Details & Usage
   */
  public static async getTenantDetails(tenantId: string) {
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    const [branches, subscription, featureFlags, usage] = await Promise.all([
      Branch.find({ tenantId: tenant._id, isActive: true }).lean(),
      Subscription.findOne({ tenantId: tenant._id }).sort({ createdAt: -1 }).lean(),
      FeatureFlag.find({ tenantId: tenant._id }).lean(),
      this.getUsageMetering(tenantId),
    ]);

    return {
      tenant,
      branches,
      subscription,
      featureFlags,
      usage,
    };
  }

  /**
   * Update Tenant Status (Activate / Suspend / Cancel)
   */
  public static async updateTenantStatus(
    tenantId: string,
    status: TenantStatus,
    reason?: string,
    actorId?: string,
  ) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    const previousStatus = tenant.status;
    tenant.status = status;
    await tenant.save();

    // If suspended or cancelled, update active subscription accordingly
    if (status === TENANT_STATUS.SUSPENDED || status === TENANT_STATUS.CANCELLED) {
      await Subscription.updateMany(
        { tenantId: tenant._id, status: 'ACTIVE' },
        { status: status === TENANT_STATUS.SUSPENDED ? 'PAST_DUE' : 'CANCELLED' },
      );
    } else if (status === TENANT_STATUS.ACTIVE) {
      await Subscription.updateMany(
        { tenantId: tenant._id, status: { $in: ['PAST_DUE', 'TRIAL'] } },
        { status: 'ACTIVE' },
      );
    }

    if (actorId) {
      await AuditLogService.record({
        tenantId: tenant._id.toString(),
        userId: actorId,
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE_TENANT_STATUS',
        entity: 'Tenant',
        entityId: tenant._id.toString(),
        beforeSnapshot: { status: previousStatus },
        afterSnapshot: { status, reason },
      });
    }

    return tenant;
  }

  /**
   * Soft-delete Tenant
   */
  public static async deleteTenant(tenantId: string, actorId?: string) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    tenant.isDeleted = true;
    tenant.status = TENANT_STATUS.CANCELLED;
    await tenant.save();

    await Subscription.updateMany(
      { tenantId: tenant._id },
      { status: 'CANCELLED' },
    );

    if (actorId) {
      await AuditLogService.record({
        tenantId: tenant._id.toString(),
        userId: actorId,
        userRole: 'SUPER_ADMIN',
        action: 'DELETE_TENANT',
        entity: 'Tenant',
        entityId: tenant._id.toString(),
        afterSnapshot: { isDeleted: true },
      });
    }

    return { success: true, message: 'Tenant successfully deactivated and scheduled for removal' };
  }

  /**
   * Generate Impersonation Access Token with Audit Trail
   */
  public static async impersonateTenant(tenantId: string, superAdminUser: any) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    // Find primary admin user for this tenant
    const targetUser = await User.findOne({
      tenantId: tenant._id,
      role: { $in: ['GYM_OWNER', 'BRANCH_MANAGER'] },
      status: 'ACTIVE',
    });

    if (!targetUser) {
      const err: any = new Error('No active administrator user found for this tenant to impersonate');
      err.statusCode = 404;
      throw err;
    }

    // Generate impersonation token
    const sessionId = crypto.randomUUID();
    const tokenPayload: any = {
      userId: targetUser._id.toString(),
      tenantId: tenant._id.toString(),
      branchId: targetUser.branchIds[0]?.toString() || '',
      role: targetUser.role,
      sessionId,
      isImpersonated: true,
      impersonatedBy: superAdminUser.userId,
    };

    const tokens = AuthService.generateTokens(tokenPayload);

    // Audit log
    await AuditLogService.record({
      tenantId: tenant._id.toString(),
      userId: superAdminUser.userId,
      userRole: 'SUPER_ADMIN',
      action: 'IMPERSONATE_TENANT',
      entity: 'Tenant',
      entityId: tenant._id.toString(),
      afterSnapshot: {
        impersonatedUserId: targetUser._id.toString(),
        impersonatedEmail: targetUser.email,
        superAdminId: superAdminUser.userId,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      isImpersonated: true,
    };
  }

  /**
   * Update Subscription Tier & Quotas
   */
  public static async updateSubscription(
    tenantId: string,
    input: {
      planTier: SubscriptionTier;
      billingCycle: 'MONTHLY' | 'YEARLY';
      maxBranches?: number;
      maxMembers?: number;
    },
    actorId?: string,
  ) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    const tierConfig = TIER_LIMITS[input.planTier] || TIER_LIMITS.STARTER;
    const amountInPaise =
      input.billingCycle === 'YEARLY'
        ? tierConfig.yearlyPriceInPaise
        : tierConfig.monthlyPriceInPaise;

    const periodDays = input.billingCycle === 'YEARLY' ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000);

    tenant.tier = input.planTier;
    if (tenant.aiSettings) {
      tenant.aiSettings.dailyLimit = tierConfig.maxAiCallsPerDay;
    }
    await tenant.save();

    let subscription = await Subscription.findOne({ tenantId: tenant._id }).sort({ createdAt: -1 });

    if (subscription) {
      subscription.planTier = input.planTier;
      subscription.billingCycle = input.billingCycle;
      subscription.amountInPaise = amountInPaise;
      subscription.maxBranches = input.maxBranches ?? tierConfig.maxBranches;
      subscription.maxMembers = input.maxMembers ?? tierConfig.maxMembers;
      subscription.features = tierConfig.features;
      subscription.status = 'ACTIVE';
      subscription.currentPeriodEnd = currentPeriodEnd;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        tenantId: tenant._id,
        planTier: input.planTier,
        billingCycle: input.billingCycle,
        amountInPaise,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        status: 'ACTIVE',
        maxBranches: input.maxBranches ?? tierConfig.maxBranches,
        maxMembers: input.maxMembers ?? tierConfig.maxMembers,
        features: tierConfig.features,
      });
    }

    if (actorId) {
      await AuditLogService.record({
        tenantId: tenant._id.toString(),
        userId: actorId,
        userRole: 'SUPER_ADMIN',
        action: 'UPDATE_SUBSCRIPTION',
        entity: 'Subscription',
        entityId: subscription._id.toString(),
        afterSnapshot: {
          planTier: input.planTier,
          billingCycle: input.billingCycle,
          amountInPaise,
        },
      });
    }

    return { tenant, subscription };
  }

  /**
   * Usage Metering vs Plan Limits
   */
  public static async getUsageMetering(tenantId: string) {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err: any = new Error('Tenant not found');
      err.statusCode = 404;
      throw err;
    }

    const tierConfig = TIER_LIMITS[tenant.tier] || TIER_LIMITS.STARTER;
    const activeSub = await Subscription.findOne({ tenantId: tenant._id, status: 'ACTIVE' }).sort({ createdAt: -1 });

    const maxMembers = activeSub?.maxMembers ?? tierConfig.maxMembers;
    const maxBranches = activeSub?.maxBranches ?? tierConfig.maxBranches;
    const maxStaff = tierConfig.maxStaff;
    const maxAiCalls = tierConfig.maxAiCallsPerDay;
    const maxMessages = tierConfig.maxMessagesPerMonth;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [memberCount, branchCount, staffCount, aiCountToday, messageCountThisMonth] = await Promise.all([
      Member.countDocuments({ tenantId: tenant._id, isDeleted: false }),
      Branch.countDocuments({ tenantId: tenant._id, isActive: true }),
      User.countDocuments({ tenantId: tenant._id, status: 'ACTIVE' }),
      AiLog.countDocuments({ tenantId: tenant._id, createdAt: { $gte: startOfDay } }),
      Notification.countDocuments({ tenantId: tenant._id, createdAt: { $gte: startOfMonth } }),
    ]);

    return {
      tier: tenant.tier,
      limits: {
        members: { used: memberCount, limit: maxMembers, percentage: Math.min(100, Math.round((memberCount / maxMembers) * 100)) },
        branches: { used: branchCount, limit: maxBranches, percentage: Math.min(100, Math.round((branchCount / maxBranches) * 100)) },
        staff: { used: staffCount, limit: maxStaff, percentage: Math.min(100, Math.round((staffCount / maxStaff) * 100)) },
        aiCalls: { used: aiCountToday, limit: maxAiCalls, percentage: Math.min(100, Math.round((aiCountToday / maxAiCalls) * 100)) },
        messaging: { used: messageCountThisMonth, limit: maxMessages, percentage: Math.min(100, Math.round((messageCountThisMonth / maxMessages) * 100)) },
      },
    };
  }

  /**
   * Platform Revenue Dashboard & Global Aggregates
   */
  public static async getPlatformMetrics() {
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      starterCount,
      proCount,
      enterpriseCount,
      totalMembers,
      totalBranches,
      subscriptions,
    ] = await Promise.all([
      Tenant.countDocuments({ isDeleted: false }),
      Tenant.countDocuments({ isDeleted: false, status: TENANT_STATUS.ACTIVE }),
      Tenant.countDocuments({ isDeleted: false, status: TENANT_STATUS.TRIAL }),
      Tenant.countDocuments({ isDeleted: false, status: TENANT_STATUS.SUSPENDED }),
      Tenant.countDocuments({ isDeleted: false, tier: SUBSCRIPTION_TIER.STARTER }),
      Tenant.countDocuments({ isDeleted: false, tier: SUBSCRIPTION_TIER.PROFESSIONAL }),
      Tenant.countDocuments({ isDeleted: false, tier: SUBSCRIPTION_TIER.ENTERPRISE }),
      Member.countDocuments({ isDeleted: false }),
      Branch.countDocuments({ isActive: true }),
      Subscription.find({ status: 'ACTIVE' }).lean(),
    ]);

    let mrrInPaise = 0;
    for (const sub of subscriptions) {
      if (sub.billingCycle === 'YEARLY') {
        mrrInPaise += Math.round(sub.amountInPaise / 12);
      } else {
        mrrInPaise += sub.amountInPaise;
      }
    }

    const arrInPaise = mrrInPaise * 12;

    return {
      overview: {
        totalTenants,
        activeTenants,
        trialTenants,
        suspendedTenants,
        totalMembers,
        totalBranches,
      },
      revenue: {
        mrrInPaise,
        mrrFormatted: `₹${(mrrInPaise / 100).toLocaleString('en-IN')}`,
        arrInPaise,
        arrFormatted: `₹${(arrInPaise / 100).toLocaleString('en-IN')}`,
        activePaidSubscriptions: subscriptions.length,
      },
      tierBreakdown: {
        starter: starterCount,
        professional: proCount,
        enterprise: enterpriseCount,
      },
    };
  }

  /**
   * Feature Flags per Tenant
   */
  public static async getFeatureFlags(tenantId: string) {
    const flags = await FeatureFlag.find({ tenantId }).lean();
    return flags;
  }

  public static async updateFeatureFlag(
    tenantId: string,
    key: string,
    isEnabled: boolean,
    description?: string,
    minTier?: SubscriptionTier,
  ) {
    const flag = await FeatureFlag.findOneAndUpdate(
      { tenantId, key },
      {
        tenantId,
        key,
        isEnabled,
        description: description || `Feature flag ${key}`,
        minTier: minTier || SUBSCRIPTION_TIER.STARTER,
      },
      { upsert: true, new: true },
    );
    return flag;
  }

  /**
   * Global Audit Logs across Platform
   */
  public static async getGlobalAuditLogs(params: {
    tenantId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 25)));

    const filter: Record<string, any> = {};
    if (params.tenantId) filter.tenantId = params.tenantId;
    if (params.action) filter.action = params.action;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Support Tickets Across Platform
   */
  public static async getPlatformTickets(params: {
    tenantId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const filter: Record<string, any> = {};
    if (params.tenantId) filter.tenantId = params.tenantId;
    if (params.status) filter.status = params.status;
    if (params.priority) filter.priority = params.priority;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('tenantId', 'name subdomain')
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Reply to Support Ticket
   */
  public static async replyToTicket(
    ticketId: string,
    senderId: string,
    senderType: 'USER' | 'MEMBER',
    message: string,
    newStatus?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  ) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      const err: any = new Error('Support ticket not found');
      err.statusCode = 404;
      throw err;
    }

    ticket.messages.push({
      senderId: new Types.ObjectId(senderId),
      senderType,
      message,
      createdAt: new Date(),
    });

    if (newStatus) {
      ticket.status = newStatus;
    }

    await ticket.save();
    return ticket;
  }
}
