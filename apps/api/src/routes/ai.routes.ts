import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  NaturalLanguageReportQuerySchema,
  ChatbotQuerySchema,
  SuggestWorkoutSchema,
  SuggestDietSchema,
  FollowUpGenSchema,
} from '@gymos/shared';
import { aiService } from '../services/aiService.js';
import { WorkoutPlan, Nutrition, AuditLog } from '../models/index.js';
import { Types } from 'mongoose';

const router = Router();

// 1. AI Status & Config
router.get(
  '/status',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const summary = await aiService.getSummary(tenantId);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 2. Churn Risk Predictions (Batch)
router.get(
  '/churn',
  requireAuth,
  requirePermission('members:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { branchId, riskLevel, limit } = req.query;
      const result = await aiService.batchPredictChurn(tenantId, {
        branchId: branchId as string,
        riskLevel: riskLevel as string,
        limit: limit ? Number(limit) : 50,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 3. Churn Risk Single Member
router.get(
  '/churn/:memberId',
  requireAuth,
  requirePermission('members:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const memberId = String(req.params.memberId);
      const result = await aiService.predictMemberChurn(memberId, tenantId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 4. Lead Scoring
router.post(
  '/leads/:leadId/score',
  requireAuth,
  requirePermission('crm:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const leadId = String(req.params.leadId);
      const result = await aiService.scoreLead(leadId, tenantId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 5. Follow-Up Message Generation
router.post(
  '/follow-up',
  requireAuth,
  validateBody(FollowUpGenSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const result = await aiService.generateFollowUp({
        ...req.body,
        tenantId,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 6. Natural Language Business Reports
router.post(
  '/business-report',
  requireAuth,
  requirePermission('reports:read'),
  validateBody(NaturalLanguageReportQuerySchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { query, question, startDate, endDate, branchId } = req.body;
      const effectiveQuery = query || question;
      const result = await aiService.queryBusinessIntelligence(effectiveQuery, tenantId, {
        startDate,
        endDate,
        branchId,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 7. Workout Suggestions (Created as DRAFT)
router.post(
  '/workout-suggestion',
  requireAuth,
  requirePermission('fitness:edit'),
  validateBody(SuggestWorkoutSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const trainerUserId = (req as any).user.userId;
      const result = await aiService.suggestWorkoutPlan({
        ...req.body,
        tenantId,
        trainerUserId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 8. Approve Workout Suggestion
router.post(
  '/workout-suggestion/:id/approve',
  requireAuth,
  requirePermission('fitness:edit'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const trainerUserId = (req as any).user.userId;
      const plan = await WorkoutPlan.findOne({ _id: req.params.id, tenantId });
      if (!plan) {
        res.status(404).json({ success: false, error: 'Workout plan not found' });
        return;
      }

      plan.status = 'ACTIVE';
      plan.isActive = true;
      plan.approvedByTrainerId = new Types.ObjectId(trainerUserId);
      plan.approvedAt = new Date();
      await plan.save();

      await AuditLog.create({
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(trainerUserId),
        action: 'WORKOUT_SUGGESTION_APPROVED',
        entity: 'WorkoutPlan',
        entityId: plan._id,
        description: `Trainer approved AI workout suggestion ${plan.title}. Plan is now ACTIVE for member.`,
      });

      res.json({
        success: true,
        message: 'Workout routine approved and activated for member.',
        data: plan,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 9. Diet Suggestions (Created as DRAFT)
router.post(
  '/diet-suggestion',
  requireAuth,
  requirePermission('fitness:edit'),
  validateBody(SuggestDietSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const nutritionistUserId = (req as any).user.userId;
      const result = await aiService.suggestDietPlan({
        ...req.body,
        tenantId,
        nutritionistUserId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 10. Approve Diet Suggestion
router.post(
  '/diet-suggestion/:id/approve',
  requireAuth,
  requirePermission('fitness:edit'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const nutritionistUserId = (req as any).user.userId;
      const plan = await Nutrition.findOne({ _id: req.params.id, tenantId });
      if (!plan) {
        res.status(404).json({ success: false, error: 'Diet plan not found' });
        return;
      }

      plan.status = 'APPROVED';
      plan.isActive = true;
      plan.approvedByNutritionistId = new Types.ObjectId(nutritionistUserId);
      plan.approvedAt = new Date();
      await plan.save();

      await AuditLog.create({
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(nutritionistUserId),
        action: 'NUTRITION_SUGGESTION_APPROVED',
        entity: 'Nutrition',
        entityId: plan._id,
        description: `Nutritionist approved AI diet suggestion ${plan.title}. Plan is now APPROVED for member.`,
      });

      res.json({
        success: true,
        message: 'Diet plan approved and activated for member visibility.',
        data: plan,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 11. Chatbot Support Query
router.post(
  '/chatbot',
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Chatbot can be accessed publicly by prospects or authenticated members
      const tenantId = (req as any).user?.tenantId || req.body.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, error: 'tenantId is required for chatbot assistance' });
        return;
      }

      const { query, branchId, memberId } = req.body;
      const result = await aiService.chatSupport({
        query,
        tenantId,
        branchId,
        memberId,
      });
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

export default router;
