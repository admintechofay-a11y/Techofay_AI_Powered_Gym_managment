import { Router, Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/Tenant.js';
import { updateTenantSettingsSchema, APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authMiddleware);

// GET /api/tenants/current - Get tenant settings
router.get('/current', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await Tenant.findById(req.user!.tenantId);
    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tenant not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: tenant,
      meta: { requestId: req.correlationId },
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// PUT /api/tenants/current - Update tenant settings
router.put(
  '/current',
  requirePermission(APP_MODULES.SETTINGS, PERMISSION_ACTIONS.EDIT),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = updateTenantSettingsSchema.parse(req.body);
      const tenant = await Tenant.findById(req.user!.tenantId);
      if (!tenant) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Tenant not found' },
        });
        return;
      }

      if (input.name) tenant.name = input.name;
      if (input.brandColor) tenant.settings.brandColor = input.brandColor;
      if (input.logoUrl) tenant.settings.logoUrl = input.logoUrl;
      if (input.gstin) tenant.settings.gstin = input.gstin;

      await tenant.save();

      res.json({
        success: true,
        message: 'Tenant settings updated',
        data: tenant,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

export default router;
