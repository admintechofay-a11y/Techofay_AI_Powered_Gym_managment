import { Request, Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription.js';
import { Member } from '../models/Member.js';
import { Branch } from '../models/Branch.js';
import { User } from '../models/User.js';
import { SUBSCRIPTION_TIER, TIER_LIMITS, type SubscriptionTier } from '@gymos/shared';

export type LimitResource = 'members' | 'branches' | 'staff';

/**
 * Middleware to enforce tenant subscription tier quotas on resource creation.
 */
export function checkTenantLimit(resource: LimitResource) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return next();
      }

      // If Super Admin, bypass limits
      if (req.user?.role === 'SUPER_ADMIN') {
        return next();
      }

      // Fetch active subscription
      const subscription = await Subscription.findOne({
        tenantId,
        status: { $in: ['ACTIVE', 'TRIAL'] },
      }).sort({ createdAt: -1 });

      const planTier: SubscriptionTier = subscription?.planTier || SUBSCRIPTION_TIER.STARTER;
      const limits = TIER_LIMITS[planTier] || TIER_LIMITS.STARTER;

      if (resource === 'members') {
        const maxMembers = subscription?.maxMembers ?? limits.maxMembers;
        const currentCount = await Member.countDocuments({
          tenantId,
          isDeleted: false,
        });

        if (currentCount >= maxMembers) {
          res.status(403).json({
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: `Member limit reached for ${planTier} tier (${currentCount}/${maxMembers}). Please upgrade to a higher subscription plan in Super Admin console.`,
            },
          });
          return;
        }
      } else if (resource === 'branches') {
        const maxBranches = subscription?.maxBranches ?? limits.maxBranches;
        const currentCount = await Branch.countDocuments({
          tenantId,
          isActive: true,
        });

        if (currentCount >= maxBranches) {
          res.status(403).json({
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: `Branch limit reached for ${planTier} tier (${currentCount}/${maxBranches}). Upgrade to Professional or Enterprise for multi-branch expansion.`,
            },
          });
          return;
        }
      } else if (resource === 'staff') {
        const maxStaff = limits.maxStaff;
        const currentCount = await User.countDocuments({
          tenantId,
          status: 'ACTIVE',
        });

        if (currentCount >= maxStaff) {
          res.status(403).json({
            success: false,
            error: {
              code: 'QUOTA_EXCEEDED',
              message: `Staff account limit reached for ${planTier} tier (${currentCount}/${maxStaff}). Upgrade your plan to invite more team members.`,
            },
          });
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
