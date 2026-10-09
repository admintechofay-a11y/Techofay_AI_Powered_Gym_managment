import { Router, Request, Response, NextFunction } from 'express';
import { PublicSiteService } from '../services/publicSiteService.js';
import { publicTrialBookingSchema, publicPlanPurchaseSchema } from '@gymos/shared';

const router = Router();

// GET /api/public/gym/:slug - Public tenant gym website payload with SEO & JSON-LD
router.get('/gym/:slug', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await PublicSiteService.getPublicGymData(req.params.slug as string);
    res.json({
      success: true,
      data,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/public/gym/:slug/trial - Online Trial Booking Form -> Straight into CRM
router.post('/gym/:slug/trial', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = publicTrialBookingSchema.parse({
      ...req.body,
      tenantSlug: req.params.slug,
    });
    const result = await PublicSiteService.bookTrialLead(input);

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/public/gym/:slug/enquiry - Online Membership Enquiry -> Straight into CRM
router.post('/gym/:slug/enquiry', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, message, branchId } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name, email, and phone number are required' },
      });
      return;
    }

    const result = await PublicSiteService.submitEnquiryLead(req.params.slug as string, {
      name,
      email,
      phone,
      message,
      branchId,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/public/gym/:slug/purchase - Online Plan Purchase / Mock Razorpay intent
router.post('/gym/:slug/purchase', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = publicPlanPurchaseSchema.parse({
      ...req.body,
      tenantSlug: req.params.slug,
    });
    const result = await PublicSiteService.initiatePlanPurchase(input);

    res.json({
      success: true,
      message: 'Plan purchase checkout initialized',
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
