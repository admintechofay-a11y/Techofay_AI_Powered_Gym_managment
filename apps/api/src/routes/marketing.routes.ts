import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { marketingService } from '../services/marketingService.js';
import { Coupon } from '../models/Coupon.js';
import {
  createCampaignSchema,
  createSegmentSchema,
  segmentCriteriaSchema,
  createAutomationRuleSchema,
} from '@gymos/shared';

const router = Router();

router.use(requireAuth);

// ================= CAMPAIGNS =================
router.get('/campaigns', requirePermission('marketing', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const campaigns = await marketingService.getCampaigns(tenantId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
});

router.post('/campaigns', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createCampaignSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const campaign = await marketingService.createCampaign(tenantId, validated);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

router.get('/campaigns/:id', requirePermission('marketing', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const campaign = await marketingService.getCampaignById(tenantId, req.params.id as string);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

router.put('/campaigns/:id', requirePermission('marketing', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const campaign = await marketingService.updateCampaign(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: campaign });
  } catch (err) {
    next(err);
  }
});

router.post('/campaigns/:id/execute', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const campaign = await marketingService.executeCampaign(tenantId, req.params.id as string);
    res.json({ success: true, message: 'Campaign executed successfully', data: campaign });
  } catch (err) {
    next(err);
  }
});

// ================= AUDIENCE SEGMENTS =================
router.get('/segments', requirePermission('marketing', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const segments = await marketingService.getSegments(tenantId);
    res.json({ success: true, data: segments });
  } catch (err) {
    next(err);
  }
});

router.post('/segments', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createSegmentSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const segment = await marketingService.createSegment(tenantId, validated);
    res.status(201).json({ success: true, data: segment });
  } catch (err) {
    next(err);
  }
});

router.post('/segments/calculate-count', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = segmentCriteriaSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const criteriaPayload: any = {
      ...validated,
      branchId: validated.branchId ? new Types.ObjectId(validated.branchId) : undefined,
    };
    const count = await marketingService.calculateAudienceCount(tenantId, criteriaPayload);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
});

router.put('/segments/:id', requirePermission('marketing', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const segment = await marketingService.updateSegment(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: segment });
  } catch (err) {
    next(err);
  }
});

router.delete('/segments/:id', requirePermission('marketing', 'delete'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    await marketingService.deleteSegment(tenantId, req.params.id as string);
    res.json({ success: true, message: 'Segment deleted' });
  } catch (err) {
    next(err);
  }
});

// ================= AUTOMATION RULES =================
router.get('/rules', requirePermission('marketing', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const rules = await marketingService.getAutomationRules(tenantId);
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

router.post('/rules', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createAutomationRuleSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const rule = await marketingService.createAutomationRule(tenantId, validated);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

router.put('/rules/:id', requirePermission('marketing', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const rule = await marketingService.updateAutomationRule(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
});

router.delete('/rules/:id', requirePermission('marketing', 'delete'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    await marketingService.deleteAutomationRule(tenantId, req.params.id as string);
    res.json({ success: true, message: 'Automation rule deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/rules/:id/run', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const result = await marketingService.runRuleEvaluation(tenantId, req.params.id as string);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ================= COUPONS (BIRTHDAY, ANNIVERSARY, PROMO) =================
router.get('/coupons', requirePermission('marketing', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const coupons = await Coupon.find({ tenantId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
});

router.post('/coupons', requirePermission('marketing', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const coupon = new Coupon({
      tenantId,
      ...req.body,
      validFrom: req.body.validFrom || new Date(),
      validUntil: req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await coupon.save();
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

export const marketingRoutes = router;
