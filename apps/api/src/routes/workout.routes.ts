import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { WorkoutService } from '../services/workoutService.js';
import {
  createExerciseSchema,
  createWorkoutPlanSchema,
  assignWorkoutPlanSchema,
  logWorkoutSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

// ============================================================================
// 1. EXERCISE LIBRARY
// ============================================================================
router.get('/exercises', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await WorkoutService.getExercises(getTenantId(req), {
      targetMuscleGroup: req.query.targetMuscleGroup as string | undefined,
      difficulty: req.query.difficulty as string | undefined,
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
  '/exercises',
  validateBody(createExerciseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exercise = await WorkoutService.createExercise(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: exercise, message: 'Exercise created successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 2. WORKOUT PLANS & TEMPLATES
// ============================================================================
router.get('/plans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plans = await WorkoutService.getPlans(getTenantId(req), {
      memberId: req.query.memberId as string | undefined,
      isTemplate: req.query.isTemplate ? req.query.isTemplate === 'true' : undefined,
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/plans',
  validateBody(createWorkoutPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await WorkoutService.createPlan(getTenantId(req), req.body, req.user?.userId);
      res.status(201).json({ success: true, data: plan, message: 'Workout plan saved successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plan = await WorkoutService.getPlanById(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/plans/:id/assign',
  validateBody(assignWorkoutPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await WorkoutService.assignPlanToMember(
        getTenantId(req),
        req.params.id as string,
        req.body.memberId,
        req.body.startDate,
        req.user?.userId,
      );
      res.status(201).json({ success: true, data: plan, message: 'Workout plan assigned to member successfully' });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 3. WORKOUT LOGS & MEMBER PROGRESS
// ============================================================================
router.post(
  '/logs',
  validateBody(logWorkoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await WorkoutService.logWorkout(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: log, message: 'Workout logged successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/members/:memberId/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await WorkoutService.getMemberWorkoutLogs(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

router.get('/members/:memberId/progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await WorkoutService.getMemberProgressTracking(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
});

export default router;
