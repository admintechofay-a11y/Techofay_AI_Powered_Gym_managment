import { Router, Request, Response, NextFunction } from 'express';
import { SuperAdminService } from '../services/superAdminService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { onboardTenantSchema, tenantStatusUpdateSchema } from '@gymos/shared';

const router = Router();

// Middleware: Require Super Admin role
router.use(authMiddleware);
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Super Admin access required to access platform administration console',
        requestId: req.correlationId,
      },
    });
    return;
  }
  next();
});

// POST /api/super-admin/onboard - Tenant Onboarding Wizard
router.post('/onboard', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = onboardTenantSchema.parse(req.body);
    const result = await SuperAdminService.onboardTenant(input, req.user!.userId);

    res.status(201).json({
      success: true,
      message: `Tenant "${result.tenant.name}" onboarded successfully`,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/tenants - List all tenants with metrics
router.get('/tenants', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, tier, page, limit } = req.query;
    const result = await SuperAdminService.listTenants({
      search: search as string,
      status: status as string,
      tier: tier as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result.tenants,
      meta: {
        requestId: req.correlationId,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/tenants/:id - Tenant detail with usage metering
router.get('/tenants/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await SuperAdminService.getTenantDetails(req.params.id as string);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/super-admin/tenants/:id/status - Activate / Suspend / Cancel tenant
router.patch('/tenants/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, reason } = tenantStatusUpdateSchema.parse(req.body);
    const tenant = await SuperAdminService.updateTenantStatus(
      req.params.id as string,
      status,
      reason,
      req.user!.userId,
    );

    res.json({
      success: true,
      message: `Tenant status updated to ${status}`,
      data: tenant,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/super-admin/tenants/:id - Soft-delete tenant
router.delete('/tenants/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await SuperAdminService.deleteTenant(req.params.id as string, req.user!.userId);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/super-admin/tenants/:id/impersonate - Impersonate tenant admin with audit log
router.post('/tenants/:id/impersonate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await SuperAdminService.impersonateTenant(req.params.id as string, req.user);
    res.json({
      success: true,
      message: `Impersonation session initialized for tenant "${result.tenant.name}"`,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/super-admin/tenants/:id/subscription - Change subscription tier & quotas
router.patch('/tenants/:id/subscription', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planTier, billingCycle, maxBranches, maxMembers } = req.body;
    const result = await SuperAdminService.updateSubscription(
      req.params.id as string,
      { planTier, billingCycle, maxBranches, maxMembers },
      req.user!.userId,
    );

    res.json({
      success: true,
      message: 'Tenant subscription updated successfully',
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/tenants/:id/usage - Usage metering vs tier quotas
router.get('/tenants/:id/usage', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usage = await SuperAdminService.getUsageMetering(req.params.id as string);
    res.json({
      success: true,
      data: usage,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/metrics - Platform Revenue Dashboard & Global Aggregates
router.get('/metrics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await SuperAdminService.getPlatformMetrics();
    res.json({
      success: true,
      data: metrics,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/feature-flags/:tenantId - Tenant feature flags
router.get('/feature-flags/:tenantId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const flags = await SuperAdminService.getFeatureFlags(req.params.tenantId as string);
    res.json({
      success: true,
      data: flags,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/super-admin/feature-flags/:tenantId - Update or toggle feature flag
router.post('/feature-flags/:tenantId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key, isEnabled, description, minTier } = req.body;
    const flag = await SuperAdminService.updateFeatureFlag(
      req.params.tenantId as string,
      key,
      isEnabled,
      description,
      minTier,
    );
    res.json({
      success: true,
      data: flag,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/audit-logs - Global platform audit logs
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, action, page, limit } = req.query;
    const result = await SuperAdminService.getGlobalAuditLogs({
      tenantId: tenantId as string,
      action: action as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      success: true,
      data: result.logs,
      meta: {
        requestId: req.correlationId,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/super-admin/tickets - Platform Support Tickets
router.get('/tickets', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId, status, priority, page, limit } = req.query;
    const result = await SuperAdminService.getPlatformTickets({
      tenantId: tenantId as string,
      status: status as string,
      priority: priority as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json({
      success: true,
      data: result.tickets,
      meta: {
        requestId: req.correlationId,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/super-admin/tickets/:id/reply - Reply to support ticket
router.post('/tickets/:id/reply', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, status } = req.body;
    const ticket = await SuperAdminService.replyToTicket(
      req.params.id as string,
      req.user!.userId,
      'USER',
      message,
      status,
    );
    res.json({
      success: true,
      message: 'Support reply added',
      data: ticket,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
