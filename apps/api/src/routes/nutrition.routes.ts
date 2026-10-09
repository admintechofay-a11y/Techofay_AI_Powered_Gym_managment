import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { NutritionService } from '../services/nutritionService.js';
import {
  calculateTargetsSchema,
  createFoodSchema,
  createNutritionPlanSchema,
  reviewNutritionPlanSchema,
  logWaterSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

// ============================================================================
// 1. MACRO & CALORIE CALCULATOR
// ============================================================================
router.post(
  '/calculate-targets',
  validateBody(calculateTargetsSchema),
  (req: Request, res: Response) => {
    const targets = NutritionService.calculateTargets(req.body);
    res.json({ success: true, data: targets });
  },
);

// ============================================================================
// 2. FOOD DATABASE
// ============================================================================
router.get('/foods', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await NutritionService.getFoods(getTenantId(req), {
      category: req.query.category as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/foods',
  validateBody(createFoodSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const food = await NutritionService.createFood(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: food, message: 'Food item saved successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 3. MEAL SCHEDULES & NUTRITIONIST REVIEW FLOW
// ============================================================================
router.get('/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await NutritionService.getPlans(getTenantId(req), req.query.memberId as string | undefined);
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/plans',
  validateBody(createNutritionPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isNutritionist = req.user?.role === 'NUTRITIONIST' || req.user?.role === 'GYM_OWNER';
      const plan = await NutritionService.createPlan(
        getTenantId(req),
        req.body,
        req.user?.userId,
        isNutritionist,
      );
      res.status(201).json({
        success: true,
        data: plan,
        message: isNutritionist
          ? 'Nutrition plan created and approved'
          : 'Nutrition plan created and submitted for professional nutritionist review',
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await NutritionService.getPlanById(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/plans/:id/review',
  validateBody(reviewNutritionPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await NutritionService.reviewPlan(
        getTenantId(req),
        req.params.id as string,
        req.body.status,
        req.body.reviewNotes,
        req.user?.userId,
      );
      res.json({
        success: true,
        data: plan,
        message: `Plan has been ${plan.status.toLowerCase()} by nutritionist`,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 4. WATER TRACKING
// ============================================================================
router.post(
  '/water',
  validateBody(logWaterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await NutritionService.logWater(
        getTenantId(req),
        req.body.memberId,
        req.body.amountLiters,
        req.body.date,
      );
      res.status(201).json({ success: true, data: log, message: 'Water intake logged' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/members/:memberId/water', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tracking = await NutritionService.getWaterLogs(
      getTenantId(req),
      req.params.memberId as string,
      req.query.date as string | undefined,
    );
    res.json({ success: true, data: tracking });
  } catch (error) {
    next(error);
  }
});

export default router;
