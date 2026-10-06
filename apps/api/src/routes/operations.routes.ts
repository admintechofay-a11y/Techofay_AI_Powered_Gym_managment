import { Router, Request, Response, NextFunction } from 'express';
import { OperationsService } from '../services/operationsService.js';
import { Locker } from '../models/Locker.js';
import { Commission } from '../models/Commission.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// GET /api/operations/dashboard-kpis - Owner Executive Dashboard
router.get(
  '/dashboard-kpis',
  requirePermission(APP_MODULES.REPORTS, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await OperationsService.getOwnerDashboardKpis(
        req.user!.tenantId,
        req.query.branchId as string,
      );

      res.json({
        success: true,
        data,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/operations/lockers - List all lockers
router.get(
  '/lockers',
  requirePermission(APP_MODULES.STAFF, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lockers = await Locker.find()
        .populate('memberId', 'firstName lastName memberId phone')
        .sort({ lockerNumber: 1 });

      res.json({
        success: true,
        data: lockers,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/operations/lockers/assign - Assign locker to member
router.post(
  '/lockers/assign',
  requirePermission(APP_MODULES.STAFF, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { lockerNumber, memberId, branchId, rentPerMonthInPaise } = req.body;
      const locker = await OperationsService.assignLocker(
        req.user!.tenantId,
        branchId || req.user!.branchId,
        lockerNumber,
        memberId,
        rentPerMonthInPaise,
      );

      res.json({
        success: true,
        message: `Locker ${lockerNumber} assigned successfully`,
        data: locker,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/operations/lockers/:id/release - Release locker
router.post(
  '/lockers/:id/release',
  requirePermission(APP_MODULES.STAFF, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const locker = await OperationsService.releaseLocker(req.user!.tenantId, req.params.id as string);

      res.json({
        success: true,
        message: 'Locker released to available pool',
        data: locker,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/operations/commissions - Record trainer commission
router.post(
  '/commissions',
  requirePermission(APP_MODULES.STAFF, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const commission = await OperationsService.recordTrainerCommission(
        req.user!.tenantId,
        req.body.trainerId,
        req.body.memberId,
        req.body.amountInPaise,
        req.body.commissionType || 'PT_SESSION',
        req.body.notes,
      );

      res.status(201).json({
        success: true,
        message: 'Trainer commission recorded',
        data: commission,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/operations/commissions - List trainer commissions
router.get(
  '/commissions',
  requirePermission(APP_MODULES.STAFF, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const commissions = await Commission.find()
        .populate('trainerId', 'firstName lastName staffId phone')
        .populate('memberId', 'firstName lastName memberId phone')
        .sort({ earnedDate: -1 });

      res.json({
        success: true,
        data: commissions,
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
