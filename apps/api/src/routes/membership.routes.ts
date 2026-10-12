import { Router, Request, Response, NextFunction } from 'express';
import { MembershipLifecycleService } from '../services/membershipLifecycleService.js';
import { Membership } from '../models/Membership.js';
import { Plan } from '../models/Plan.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { APP_MODULES, PERMISSION_ACTIONS, PLAN_TYPE } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// POST /api/memberships/buy - Enrol in membership plan
router.post(
  '/buy',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const membership = await MembershipLifecycleService.buyPlan({
        tenantId: req.user!.tenantId,
        memberId: req.body.memberId,
        planId: req.body.planId,
        startDate: req.body.startDate,
        trainerId: req.body.trainerId,
        discountInPaise: req.body.discountInPaise,
        notes: req.body.notes,
        performedByUserId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Membership plan activated',
        data: membership,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/memberships/:id/freeze - Freeze active membership
router.post(
  '/:id/freeze',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await MembershipLifecycleService.freezeMembership(
        req.user!.tenantId,
        req.params.id as string,
        req.body.reason || 'Medical / Travel freeze request',
        req.body.startDate ? new Date(req.body.startDate) : new Date(),
        req.body.expectedResumeDate ? new Date(req.body.expectedResumeDate) : undefined,
        req.user!.userId,
      );

      res.json({
        success: true,
        message: 'Membership frozen successfully',
        data: result,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/memberships/:id/unfreeze - Unfreeze & extend membership end date
router.post(
  '/:id/unfreeze',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await MembershipLifecycleService.unfreezeMembership(
        req.user!.tenantId,
        req.params.id as string,
        new Date(),
        req.user!.userId,
      );

      res.json({
        success: true,
        message: `Membership resumed and extended by ${result.frozenDays} days`,
        data: result,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/memberships/:id/upgrade - Prorated upgrade or change plan
router.post(
  '/:id/upgrade',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await MembershipLifecycleService.changePlanWithProration(
        req.user!.tenantId,
        req.params.id as string,
        req.body.newPlanId,
        new Date(),
        req.user!.userId,
      );

      res.json({
        success: true,
        message: 'Plan upgraded with prorated credit applied',
        data: result,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/memberships/run-expiry - Trigger midnight automated expiry worker
router.post(
  '/run-expiry',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await MembershipLifecycleService.runAutomatedExpiryJob(req.user!.tenantId);
      res.json({
        success: true,
        message: `Expiry sweep completed: ${result.expiredCount} memberships transitioned to EXPIRED`,
        data: result,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/memberships/plans - List active membership plans
router.get(
  '/plans',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plans = await Plan.find({ tenantId: req.user!.tenantId, isActive: true }).sort({ priceInPaise: 1 });
      res.json({
        success: true,
        data: plans,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/memberships/plans - Create a new membership plan
router.post(
  '/plans',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, code, type, durationDays, priceInInr, signupFeeInInr, description, maxFreezes, maxFreezeDays } = req.body;
      if (!name || !code || !durationDays || priceInInr === undefined) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'name, code, durationDays, and priceInInr are required' },
        });
        return;
      }

      const resolvedType =
        type && Object.values(PLAN_TYPE).includes(type)
          ? type
          : Number(durationDays) <= 31
          ? PLAN_TYPE.MONTHLY
          : Number(durationDays) <= 93
          ? PLAN_TYPE.QUARTERLY
          : Number(durationDays) <= 186
          ? PLAN_TYPE.HALF_YEARLY
          : Number(durationDays) <= 366
          ? PLAN_TYPE.ANNUAL
          : PLAN_TYPE.CUSTOM;

      const plan = await Plan.create({
        tenantId: req.user!.tenantId,
        branchIds: [req.user!.branchId],
        name,
        code: code.toUpperCase().trim(),
        type: resolvedType,
        durationDays: Number(durationDays),
        priceInPaise: Math.round(Number(priceInInr) * 100),
        signupFeeInPaise: Math.round(Number(signupFeeInInr || 0) * 100),
        taxRatePercent: 18,
        description,
        maxFreezes: Number(maxFreezes || 1),
        maxFreezeDays: Number(maxFreezeDays || 30),
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'Membership plan created successfully',
        data: plan,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/memberships - List memberships
router.get(
  '/',
  requirePermission(APP_MODULES.MEMBERSHIPS, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await Membership.find({ tenantId: req.user!.tenantId })
        .populate('memberId', 'firstName lastName memberCode phone email')
        .populate('planId', 'name code type durationDays priceInPaise')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: list,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

export default router;
