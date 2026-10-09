import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { CrmService } from '../services/crmService.js';
import {
  createLeadSchema,
  publicLeadCaptureSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  leadActivitySchema,
  mergeLeadsSchema,
  convertLeadToMemberSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

// ============================================================================
// 1. PUBLIC LEAD CAPTURE (No Auth required for public forms/landing pages)
// ============================================================================
router.post(
  '/leads/public',
  validateBody(publicLeadCaptureSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CrmService.capturePublicLead(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: result.isDuplicate
          ? 'Thank you! We received your inquiry and our team will get back to you shortly.'
          : 'Thank you for your interest! A fitness counselor will contact you soon.',
      });
    } catch (error) {
      next(error);
    }
  },
);

// All subsequent routes require authentication
router.use(authMiddleware);

// ============================================================================
// 2. LEAD MANAGEMENT
// ============================================================================
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CrmService.getLeads(getTenantId(req), {
      branchId: req.query.branchId as string | undefined,
      status: req.query.status as string | undefined,
      score: req.query.score as string | undefined,
      source: req.query.source as string | undefined,
      assignedStaffId: req.query.assignedStaffId as string | undefined,
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
  '/leads',
  validateBody(createLeadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await CrmService.createLead(getTenantId(req), req.body, req.user?.userId);
      res.status(201).json({ success: true, data: lead, message: 'Lead created successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/leads/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lead = await CrmService.getLeadById(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/leads/:id',
  validateBody(updateLeadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await CrmService.updateLead(getTenantId(req), req.params.id as string, req.body);
      res.json({ success: true, data: lead, message: 'Lead updated successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/leads/:id/status',
  validateBody(updateLeadStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await CrmService.updateLeadStatus(
        getTenantId(req),
        req.params.id as string,
        req.body.pipelineStatus,
        req.body.lostReason,
        req.body.notes,
        req.user?.userId,
      );
      res.json({ success: true, data: lead, message: 'Pipeline status updated' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/leads/:id/assign',
  validateBody(assignLeadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lead = await CrmService.assignLead(
        getTenantId(req),
        req.params.id as string,
        req.body.assignedToStaffId,
        req.user?.userId,
      );
      res.json({ success: true, data: lead, message: 'Lead assigned successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.post('/leads/auto-assign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CrmService.autoAssignLeads(getTenantId(req), req.body.branchId);
    res.json({ success: true, data: result, message: `Auto-assigned ${result.assignedCount} leads` });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 3. ACTIVITIES, CALLS & NOTES
// ============================================================================
router.get('/leads/:id/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activities = await CrmService.getActivities(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/leads/:id/activities',
  validateBody(leadActivitySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activity = await CrmService.addActivity(
        getTenantId(req),
        req.params.id as string,
        req.body,
        req.user?.userId,
      );
      res.status(201).json({ success: true, data: activity, message: 'Activity logged successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/follow-ups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await CrmService.getFollowUpTasks(
      getTenantId(req),
      req.query.staffId as string | undefined,
      req.query.branchId as string | undefined,
    );
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 4. DUPLICATE MERGE & 1-CLICK CONVERSION
// ============================================================================
router.post(
  '/leads/:id/merge',
  validateBody(mergeLeadsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const primaryLead = await CrmService.mergeLeads(
        getTenantId(req),
        req.params.id as string,
        req.body.duplicateLeadId,
        req.user?.userId,
      );
      res.json({ success: true, data: primaryLead, message: 'Duplicate lead merged successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/leads/:id/convert',
  validateBody(convertLeadToMemberSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await CrmService.convertLeadToMember(
        getTenantId(req),
        req.params.id as string,
        req.body,
        req.user?.userId,
      );
      res.status(201).json({
        success: true,
        data: result,
        message: result.alreadyConverted
          ? 'Lead was already converted to this member.'
          : 'Lead successfully converted to member with generated credentials and code.',
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================================
// 5. SALES PERFORMANCE REPORTS
// ============================================================================
router.get('/reports/sales-performance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await CrmService.getSalesReport(getTenantId(req), req.query.branchId as string | undefined);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

export default router;
