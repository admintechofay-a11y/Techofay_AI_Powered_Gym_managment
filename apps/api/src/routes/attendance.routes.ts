import { Router, Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendanceService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';

const router = Router();

// POST /api/attendance/check-in - Process QR, Member ID or phone check-in
router.post(
  '/check-in',
  authMiddleware,
  requirePermission(APP_MODULES.ATTENDANCE, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier, method = 'QR_SCAN', branchId } = req.body;
      if (!identifier) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'identifier (QR, Member ID, or Phone) is required' },
        });
        return;
      }

      const result = await AttendanceService.processCheckIn({
        tenantId: req.user!.tenantId,
        branchId: branchId || req.user!.branchId,
        identifier,
        method,
        performedByUserId: req.user!.userId,
      });

      if (!result.allowed) {
        res.status(403).json({
          success: false,
          error: { code: 'ACCESS_DENIED', message: result.reason },
          data: { member: result.member },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Gate Access Granted: Welcome to the gym',
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

// POST /api/attendance/check-out - Process checkout
router.post(
  '/check-out',
  authMiddleware,
  requirePermission(APP_MODULES.ATTENDANCE, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memberId } = req.body;
      const record = await AttendanceService.processCheckOut(req.user!.tenantId, memberId);

      res.json({
        success: true,
        message: 'Checked out successfully',
        data: record,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/attendance/biometric-punch - Biometric / RFID hardware punch endpoint (Device Simulator)
router.post(
  '/biometric-punch',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, branchId, deviceKey, cardOrUserId } = req.body;
      if (!tenantId || !cardOrUserId) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_DEVICE_PAYLOAD', message: 'tenantId and cardOrUserId are required' },
        });
        return;
      }

      const result = await AttendanceService.processCheckIn({
        tenantId,
        branchId: branchId || 'branch-default',
        identifier: cardOrUserId,
        method: 'BIOMETRIC',
        deviceId: deviceKey || 'ZKT_TURNSTILE_01',
      });

      if (!result.allowed) {
        res.status(403).json({
          success: false,
          turnstileAction: 'REJECT',
          reason: result.reason,
        });
        return;
      }

      res.json({
        success: true,
        turnstileAction: 'UNLOCK_GATE',
        member: result.member,
        currentGymOccupancy: result.currentGymOccupancy,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/attendance/live-occupancy - Current gym capacity meter
router.get(
  '/live-occupancy',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await AttendanceService.getCurrentLiveOccupancy(
        req.user!.tenantId,
        req.query.branchId as string,
      );

      res.json({
        success: true,
        data: {
          currentInGym: count,
          maxSafeCapacity: 60,
          occupancyPercentage: Math.round((count / 60) * 100),
          timestamp: new Date().toISOString(),
        },
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/attendance/peak-hours - Peak hour distribution analytics
router.get(
  '/peak-hours',
  authMiddleware,
  requirePermission(APP_MODULES.ATTENDANCE, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AttendanceService.getPeakHourAnalytics(
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

// GET /api/attendance/inactive-members - Members absent > 14 days
router.get(
  '/inactive-members',
  authMiddleware,
  requirePermission(APP_MODULES.ATTENDANCE, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const thresholdDays = Number(req.query.days || 14);
      const list = await AttendanceService.getInactiveMembers(req.user!.tenantId, thresholdDays);

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
