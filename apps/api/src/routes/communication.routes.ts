import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { communicationService } from '../services/communicationService.js';
import { schedulerService } from '../services/schedulerService.js';
import { sendNotificationSchema, createTemplateSchema, quietHoursSchema } from '@gymos/shared';

const router = Router();

// ================= PUBLIC / 1-CLICK UNSUBSCRIBE =================
router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, memberId, channel } = req.body;
    if (!tenantId || !memberId || !channel) {
      res.status(400).json({ success: false, message: 'tenantId, memberId, and channel are required' });
      return;
    }
    const result = await communicationService.handleUnsubscribe(tenantId, memberId, channel);
    res.json({ success: true, message: `Successfully unsubscribed from ${channel}`, member: result });
  } catch (err) {
    next(err);
  }
});

// Protect all following endpoints with authentication
router.use(requireAuth);

// ================= NOTIFICATION DISPATCH =================
router.post('/send', requirePermission('notifications', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = sendNotificationSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const result = await communicationService.sendNotification({
      tenantId,
      ...validated,
    });

    res.json({ success: result.success, data: result });
  } catch (err) {
    next(err);
  }
});

// ================= COMMUNICATION HISTORY & LOGS =================
router.get('/history', requirePermission('notifications', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { memberId, leadId, channel, status, page, limit } = req.query;

    const history = await communicationService.getHistory({
      tenantId,
      memberId: memberId as string,
      leadId: leadId as string,
      channel: channel as any,
      status: status as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// ================= TEMPLATE MANAGER =================
router.get('/templates', requirePermission('notifications', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const { channel } = req.query;
    const templates = await communicationService.getTemplates(tenantId, channel as any);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

router.post('/templates', requirePermission('notifications', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createTemplateSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const template = await communicationService.createTemplate(tenantId, validated);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.get('/templates/:id', requirePermission('notifications', 'view'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const template = await communicationService.getTemplateById(tenantId, req.params.id as string);
    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.put('/templates/:id', requirePermission('notifications', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const template = await communicationService.updateTemplate(tenantId, req.params.id as string, req.body);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.delete('/templates/:id', requirePermission('notifications', 'delete'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    await communicationService.deleteTemplate(tenantId, req.params.id as string);
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/templates/:id/preview', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const template = await communicationService.getTemplateById(tenantId, req.params.id as string);
    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }

    const variables = req.body.variables || {
      memberName: 'Rahul Sharma',
      gymName: 'IronPulse Fitness Club',
      expiryDate: '15/10/2026',
      amount: '₹14,999',
      couponCode: 'BDAY-RS-2026',
    };
    const lang = req.body.lang || 'en';

    const rendered = communicationService.renderTemplate(template as any, variables, lang);
    res.json({ success: true, data: rendered });
  } catch (err) {
    next(err);
  }
});

// ================= BULLMQ JOBS & QUEUE DASHBOARD =================
router.get('/jobs', requirePermission('notifications', 'view'), async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = schedulerService.getDashboardStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

router.post('/jobs/:jobName/trigger', requirePermission('notifications', 'create'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId;
    const result = await schedulerService.triggerJob(req.params.jobName as string, tenantId.toString());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ================= QUIET HOURS & PREFERENCES =================
router.get('/quiet-hours', async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user!.tenantId.toString();
  const settings = communicationService.getQuietHours(tenantId);
  res.json({ success: true, data: settings });
});

router.put('/quiet-hours', requirePermission('notifications', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = quietHoursSchema.parse(req.body);
    const tenantId = req.user!.tenantId.toString();
    const updated = communicationService.setQuietHours(tenantId, validated);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences/:memberId', requirePermission('members', 'edit'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.user!.tenantId.toString();
    const updated = await communicationService.updateMemberPreferences(tenantId, req.params.memberId as string, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export const communicationRoutes = router;
