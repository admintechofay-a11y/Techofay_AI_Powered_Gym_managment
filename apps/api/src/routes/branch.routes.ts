import { Router, Request, Response, NextFunction } from 'express';
import { Branch } from '../models/Branch.js';
import { BranchService } from '../services/branchService.js';
import { createBranchSchema, transferMemberBranchSchema, APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { checkTenantLimit } from '../middleware/tenantLimitsMiddleware.js';

const router = Router();

router.use(authMiddleware);

// GET /api/branches - List branches for the current tenant
router.get(
  '/',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
      res.json({
        success: true,
        data: branches,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/branches/comparison - Cross-branch performance comparison matrix
router.get(
  '/comparison',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await BranchService.getCrossBranchComparison(req.user!.tenantId);
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/branches/consolidated - Consolidated Multi-Branch Financial & Member Report
router.get(
  '/consolidated',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await BranchService.getConsolidatedReports(req.user!.tenantId);
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/branches/:id/performance - Single branch financial & operational performance
router.get(
  '/:id/performance',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await BranchService.getBranchPerformance(
        req.user!.tenantId,
        req.params.id as string,
      );
      res.json({
        success: true,
        data: result,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/branches/transfer-member - Member transfer between branches with audit trail
router.post(
  '/transfer-member',
  requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = transferMemberBranchSchema.parse(req.body);
      const result = await BranchService.transferMember({
        tenantId: req.user!.tenantId,
        memberId: input.memberId,
        destinationBranchId: input.destinationBranchId,
        reason: input.reason,
        transferActiveMemberships: input.transferActiveMemberships,
        actorId: req.user!.userId,
      });

      res.json({
        success: true,
        message: 'Member successfully transferred to new branch',
        data: result,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/branches - Create branch (enforcing subscription tier quota limits)
router.post(
  '/',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.CREATE),
  checkTenantLimit('branches'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = createBranchSchema.parse(req.body);
      const branch = await Branch.create({
        ...input,
        tenantId: req.user!.tenantId,
      });

      res.status(201).json({
        success: true,
        message: 'Branch created successfully',
        data: branch,
        meta: { requestId: req.correlationId },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
