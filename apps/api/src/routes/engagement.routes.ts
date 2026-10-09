import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { EngagementService } from '../services/engagementService.js';
import {
  createReferralSchema,
  rewardReferralSchema,
  leaderboardOptInSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

// ============================================================================
// 1. ATTENDANCE STREAKS & LEADERBOARD
// ============================================================================
router.get('/streak/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streak = await EngagementService.getAttendanceStreak(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: streak });
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leaderboard = await EngagementService.getLeaderboard(
      getTenantId(req),
      req.query.branchId as string | undefined,
    );
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/leaderboard-opt-in/:memberId',
  validateBody(leaderboardOptInSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const member = await EngagementService.updateLeaderboardOptIn(
        getTenantId(req),
        req.params.memberId as string,
        req.body.optIn,
      );
      res.json({ success: true, data: member, message: 'Leaderboard preferences updated' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 2. REFERRALS & TRANSACTIONAL WALLET LEDGER
// ============================================================================
router.post(
  '/referrals',
  validateBody(createReferralSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await EngagementService.createReferral(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: result, message: 'Referral recorded and pushed into CRM' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/referrals/:id/reward',
  validateBody(rewardReferralSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await EngagementService.rewardReferral(
        getTenantId(req),
        req.params.id as string,
        req.body.rewardAmountInPaise,
        req.body.reason,
      );
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/wallet/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletData = await EngagementService.getWallet(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: walletData });
  } catch (error) {
    next(error);
  }
});

export default router;
