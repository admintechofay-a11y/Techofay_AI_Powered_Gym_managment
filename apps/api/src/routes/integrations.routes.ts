import { Router, Request, Response, NextFunction } from 'express';
import { integrations } from '../integrations/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { USER_ROLES } from '@gymos/shared';

const router = Router();

// GET /api/integrations - List status of all integrations for Settings > Integrations UI
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const list = integrations.getSummaries();
    res.json({
      success: true,
      data: list,
      meta: { requestId: req.correlationId },
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// POST /api/integrations/:id/test - Run diagnostics / test execution on integration
router.post(
  '/:id/test',
  authMiddleware,
  requireRole([USER_ROLES.SUPER_ADMIN, USER_ROLES.GYM_OWNER]),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      let result: any = null;

      switch (id) {
        case 'payments': {
          result = await integrations.payment.createOrder({
            amountInPaise: 10000,
            currency: 'INR',
            receipt: 'test_rcpt_001',
          });
          break;
        }
        case 'whatsapp': {
          result = await integrations.whatsapp.sendTextMessage(
            '+919876543210',
            'Test notification from Techofay GymOS integration framework',
          );
          break;
        }
        case 'sms': {
          result = await integrations.sms.sendSms(
            '+919876543210',
            'Test SMS verification message from Techofay GymOS',
          );
          break;
        }
        case 'email': {
          result = await integrations.email.sendEmail(
            req.user?.email || 'admin@gymos.techofay.com',
            'Techofay GymOS Integration Test',
            '<p>Your email integration is operating as configured.</p>',
          );
          break;
        }
        case 'ai': {
          result = await integrations.ai.scoreLead({
            name: 'Priya Sharma',
            source: 'WALK_IN',
            notes: 'Enquired about annual membership and personal trainer',
            activitiesCount: 2,
          });
          break;
        }
        case 'biometric': {
          result = await integrations.biometric.pingDevice();
          break;
        }
        case 'storage': {
          result = await integrations.storage.uploadFile({
            key: `test/ping_${Date.now()}.txt`,
            buffer: Buffer.from('Ping test content'),
            contentType: 'text/plain',
          });
          break;
        }
        case 'push': {
          result = await integrations.push.sendPush({}, { title: 'Test Alert', body: 'GymOS Push' });
          break;
        }
        default: {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: `Integration ${id} not found` },
          });
          return;
        }
      }

      res.json({
        success: true,
        message: `Successfully tested ${id} integration adapter`,
        data: result,
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
