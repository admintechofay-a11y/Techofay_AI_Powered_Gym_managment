import { Router, Request, Response, NextFunction } from 'express';
import { MemberPwaService } from '../services/memberPwaService.js';
import { Member } from '../models/Member.js';
import { dpdpAccountDeleteSchema } from '@gymos/shared';
import { runInContext } from '../context/requestContext.js';

const router = Router();

// Member Context Resolution Middleware
// Accepts JWT auth OR X-Member-Id + X-Tenant-Id headers for PWA client requests
router.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let tenantId = req.headers['x-tenant-id'] as string;
    let memberId = req.headers['x-member-id'] as string;

    // If query parameters provided (for DPDP export download links)
    if (!memberId && req.query.memberId) memberId = req.query.memberId as string;
    if (!tenantId && req.query.tenantId) tenantId = req.query.tenantId as string;

    // If already in req.user from JWT
    if (!tenantId && req.user?.tenantId) {
      tenantId = req.user.tenantId;
    }

    if (!memberId && req.user?.userId) {
      // Look up member by registeredByUserId or find first member in tenant
      const member = await Member.findOne({ tenantId, isDeleted: false });
      if (member) memberId = member._id.toString();
    }

    // Fallback: If no memberId yet, find first active member of tenant
    if (!memberId && tenantId) {
      const member = await Member.findOne({ tenantId, isDeleted: false });
      if (member) memberId = member._id.toString();
    }

    if (!tenantId || !memberId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MEMBER_AUTH_REQUIRED',
          message: 'Member authentication required. Provide X-Tenant-Id and X-Member-Id headers or login.',
          requestId: req.correlationId,
        },
      });
      return;
    }

    (req as any).pwaContext = { tenantId, memberId };
    const updatedStore = {
      ...(req.context || {}),
      tenantId,
    };
    req.context = updatedStore;

    runInContext(updatedStore, () => {
      next();
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getProfile(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/membership
router.get('/membership', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getMembership(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/qr - Dynamic Check-in QR Payload
router.get('/qr', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getDynamicQrCode(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/attendance - History & Streaks
router.get('/attendance', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getAttendanceHistory(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/workouts - Assigned Workout Plans
router.get('/workouts', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getWorkouts(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/diet - Assigned Nutrition Plan
router.get('/diet', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getDiet(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/trainer - Assigned Personal Trainer
router.get('/trainer', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getTrainer(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/wallet - Referral Wallet & Rewards
router.get('/wallet', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getWallet(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/invoices - Invoices and Payment History
router.get('/invoices', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const result = await MemberPwaService.getInvoices(tenantId, memberId);
    res.json({ success: true, data: result, meta: { requestId: req.correlationId } });
  } catch (error) {
    next(error);
  }
});

// POST /api/member-pwa/reviews - Submit Review & Rating
router.post('/reviews', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const { rating, reviewText, trainerId } = req.body;
    const result = await MemberPwaService.submitReview(tenantId, memberId, {
      rating: Number(rating),
      reviewText,
      trainerId,
    });
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/member-pwa/dpdp/export - DPDP Act Personal Data Export (JSON Download)
router.get('/dpdp/export', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const data = await MemberPwaService.exportPersonalData(tenantId, memberId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="member_personal_data_export_${memberId}.json"`,
    );
    res.json({
      success: true,
      data,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/member-pwa/dpdp/delete-request - DPDP Act Account Erasure Request
router.post('/dpdp/delete-request', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId } = (req as any).pwaContext;
    const input = dpdpAccountDeleteSchema.parse(req.body);
    const result = await MemberPwaService.requestAccountDeletion(
      tenantId,
      memberId,
      input.reason,
      input.confirmPhone,
    );

    res.json({
      success: true,
      message: result.message,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
