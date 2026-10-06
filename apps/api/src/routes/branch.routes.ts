import { Router, Request, Response, NextFunction } from 'express';
import { Branch } from '../models/Branch.js';
import { createBranchSchema, APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

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
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/branches - Create branch
router.post(
  '/',
  requirePermission(APP_MODULES.BRANCHES, PERMISSION_ACTIONS.CREATE),
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
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

export default router;
