import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { TrainerService } from '../services/trainerService.js';
import {
  createTrainerSchema,
  createPtPackageSchema,
  usePtSessionSchema,
  trainerReviewSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

// ============================================================================
// 1. TRAINER PROFILES
// ============================================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trainers = await TrainerService.getTrainers(getTenantId(req), req.query.branchId as string | undefined);
    res.json({ success: true, data: trainers });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  validateBody(createTrainerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trainer = await TrainerService.createOrUpdateTrainer(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: trainer, message: 'Trainer profile saved successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 2. PT PACKAGES & SESSIONS
// ============================================================================
router.get('/pt-packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const packages = await TrainerService.getPtPackages(getTenantId(req));
    res.json({ success: true, data: packages });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/pt-packages',
  validateBody(createPtPackageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pkg = await TrainerService.createPtPackage(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: pkg, message: 'PT package created successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/pt-sessions/use',
  validateBody(usePtSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TrainerService.usePtSession(getTenantId(req), req.body);
      res.json({ success: true, data: result, message: result.message });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 3. COMMISSIONS & PAYOUT REPORTS
// ============================================================================
router.get('/commissions/report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await TrainerService.getCommissionReport(
      getTenantId(req),
      req.query.monthYear as string | undefined,
      req.query.staffId as string | undefined,
    );
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.post('/commissions/:id/payout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await TrainerService.payoutCommission(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: result, message: 'Commission payout approved and marked as paid' });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 4. REVIEWS & RATINGS
// ============================================================================
router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await TrainerService.getReviews(getTenantId(req), req.query.trainerId as string | undefined);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/reviews',
  validateBody(trainerReviewSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await TrainerService.submitReview(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: review, message: 'Review submitted successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 5. TRAINER DETAILS & ASSIGNED MEMBER DASHBOARD
// ============================================================================
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trainer = await TrainerService.getTrainerById(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: trainer });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboard = await TrainerService.getTrainerDashboard(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

export default router;
