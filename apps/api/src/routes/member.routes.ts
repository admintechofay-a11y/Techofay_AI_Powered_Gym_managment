import { Router, Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/memberService.js';
import { Member } from '../models/Member.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { checkTenantLimit } from '../middleware/tenantLimitsMiddleware.js';
import { APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// POST /api/members - Register member with atomic Member ID and QR
router.post(
  '/',
  requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.CREATE),
  checkTenantLimit('members'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const member = await MemberService.registerMember({
        tenantId: req.user!.tenantId,
        branchId: req.body.branchId || req.user!.branchId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        gender: req.body.gender,
        dateOfBirth: req.body.dateOfBirth,
        address: req.body.address,
        emergencyContact: req.body.emergencyContact,
        fitnessProfile: req.body.fitnessProfile,
        waiverAgreement: req.body.waiverAgreement,
        registeredByUserId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: member,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/members - List members with search and status filters
router.get(
  '/',
  requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.min(100, Math.max(1, Number(limit)));

      const filter: Record<string, any> = {};
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { firstName: { $regex: String(search), $options: 'i' } },
          { lastName: { $regex: String(search), $options: 'i' } },
          { memberCode: { $regex: String(search), $options: 'i' } },
          { phone: { $regex: String(search), $options: 'i' } },
        ];
      }

      const [members, total] = await Promise.all([
        Member.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
        Member.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: members,
        meta: {
          requestId: req.correlationId,
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/members/:id/history - Complete member history tab
router.get(
  '/:id/history',
  requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await MemberService.getMemberHistory(req.user!.tenantId, req.params.id as string);
      res.json({
        success: true,
        data: history,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/members/import-csv - Bulk CSV import with validation report
router.post(
  '/import-csv',
  requirePermission(APP_MODULES.MEMBERS, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { csvContent, branchId } = req.body;
      if (!csvContent) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'csvContent is required in request body' },
        });
        return;
      }

      const report = await MemberService.importMembersFromCsv(
        req.user!.tenantId,
        branchId || req.user!.branchId,
        csvContent,
        req.user!.userId,
      );

      res.json({
        success: true,
        message: `Import processed: ${report.successfulCount} created, ${report.failedCount} skipped`,
        data: report,
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
