import { Router, Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billingService.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Tenant } from '../models/Tenant.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { APP_MODULES, PERMISSION_ACTIONS } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// POST /api/billing/invoices - Create tax invoice with GST in ACID transaction
router.post(
  '/invoices',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const invoice = await BillingService.createInvoice({
        tenantId: req.user!.tenantId,
        branchId: req.body.branchId || req.user!.branchId,
        memberId: req.body.memberId,
        membershipId: req.body.membershipId,
        items: req.body.items,
        discountInPaise: req.body.discountInPaise,
        isInterState: req.body.isInterState,
        notes: req.body.notes,
        idempotencyKey: idempotencyKey || req.body.idempotencyKey,
        createdById: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: 'Tax invoice generated with gapless sequence number',
        data: invoice,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/billing/invoices - List invoices with status & branch filter
router.get(
  '/invoices',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, memberId } = req.query;
      const filter: Record<string, any> = { tenantId: req.user!.tenantId };
      if (status) filter.status = status;
      if (memberId) filter.memberId = memberId;

      const invoices = await Invoice.find(filter)
        .populate('memberId', 'firstName lastName memberCode phone email')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: invoices,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/billing/invoices/:id/print - Generate printable HTML tax invoice
router.get(
  '/invoices/:id/print',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoice = await Invoice.findById(req.params.id as string);
      if (!invoice) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Invoice not found' },
        });
        return;
      }

      const tenant = await Tenant.findById(invoice.tenantId);
      const gymDetails = {
        name: tenant?.name || 'Techofay Gym Fitness',
        gstin: tenant?.settings?.gstin,
        address: 'Bandra Kurla Complex, Mumbai 400051',
      };

      const html = BillingService.generateInvoiceHtml(invoice, gymDetails);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// POST /api/billing/payments - Record payment (full or partial) with ACID transaction
router.post(
  '/payments',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const result = await BillingService.recordPayment({
        tenantId: req.user!.tenantId,
        branchId: req.body.branchId || req.user!.branchId,
        invoiceId: req.body.invoiceId,
        memberId: req.body.memberId,
        amountInPaise: req.body.amountInPaise,
        paymentMethod: req.body.paymentMethod,
        referenceNumber: req.body.referenceNumber,
        idempotencyKey: idempotencyKey || req.body.idempotencyKey,
        recordedByUserId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        message: result.isFullyPaid ? 'Invoice fully settled' : 'Partial payment recorded',
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

// POST /api/billing/refunds - Process refund
router.post(
  '/refunds',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.DELETE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refund = await BillingService.processRefund(
        req.user!.tenantId,
        req.body.paymentId,
        req.body.amountInPaise,
        req.body.reason || 'Member cancellation / refund request',
        req.user!.userId,
      );

      res.json({
        success: true,
        message: 'Refund processed and ledger updated',
        data: refund,
        meta: { requestId: req.correlationId },
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
);

// GET /api/billing/payments - List payment records
router.get(
  '/payments',
  requirePermission(APP_MODULES.BILLING, PERMISSION_ACTIONS.VIEW),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await Payment.find({ tenantId: req.user!.tenantId })
        .populate('memberId', 'firstName lastName memberCode phone')
        .sort({ transactionDate: -1 })
        .limit(100);

      res.json({
        success: true,
        data: payments,
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
