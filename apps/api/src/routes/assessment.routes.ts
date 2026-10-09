import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { AssessmentService } from '../services/assessmentService.js';
import { createAssessmentSchema } from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

router.post(
  '/',
  validateBody(createAssessmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assessment = await AssessmentService.createAssessment(
        getTenantId(req),
        req.body,
        req.user?.userId,
      );
      res.status(201).json({ success: true, data: assessment, message: 'Fitness assessment recorded' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await AssessmentService.getMemberAssessments(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

router.get('/members/:memberId/photos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const photos = await AssessmentService.getMemberPhotos(getTenantId(req), req.params.memberId as string);
    res.json({ success: true, data: photos });
  } catch (error) {
    next(error);
  }
});

export default router;
