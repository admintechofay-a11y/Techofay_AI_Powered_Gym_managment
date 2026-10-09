import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { BookingService } from '../services/bookingService.js';
import {
  createClassSchema,
  createBookingSchema,
  createTrialSchema,
  updateTrialStatusSchema,
} from '@gymos/shared';

const router = Router();

function getTenantId(req: Request): string {
  const tid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || req.context?.tenantId;
  if (!tid) throw new Error('Tenant context required');
  return tid;
}

router.use(authMiddleware);

// ============================================================================
// 1. CLASSES
// ============================================================================
router.get('/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classes = await BookingService.getClasses(getTenantId(req), req.query.branchId as string | undefined);
    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/classes',
  validateBody(createClassSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cls = await BookingService.createClass(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: cls, message: 'Class created successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/classes/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cls = await BookingService.getClassById(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: cls });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 2. BOOKINGS (RACE-SAFE ATOMIC CAPACITY & WAITLIST)
// ============================================================================
router.post(
  '/bookings',
  validateBody(createBookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await BookingService.bookClassSlot(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: result, message: result.message });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await BookingService.getBookings(getTenantId(req), {
      branchId: req.query.branchId as string | undefined,
      classId: req.query.classId as string | undefined,
      memberId: req.query.memberId as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

router.post('/bookings/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BookingService.cancelBooking(getTenantId(req), req.params.id as string);
    res.json({ success: true, data: result, message: result.message });
  } catch (error) {
    next(error);
  }
});

router.get('/bookings/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const calendar = await BookingService.getCalendarView(
      getTenantId(req),
      req.query.branchId as string | undefined,
      req.query.date as string | undefined,
    );
    res.json({ success: true, data: calendar });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// 3. TRIALS & TRIAL-TO-MEMBER CONVERSION
// ============================================================================
router.post(
  '/trials',
  validateBody(createTrialSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trial = await BookingService.registerTrial(getTenantId(req), req.body);
      res.status(201).json({ success: true, data: trial, message: 'Trial booked successfully' });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/trials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trials = await BookingService.getTrials(getTenantId(req), {
      branchId: req.query.branchId as string | undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    res.json({ success: true, data: trials });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/trials/:id/status',
  validateBody(updateTrialStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trial = await BookingService.updateTrialStatus(
        getTenantId(req),
        req.params.id as string,
        req.body.status,
        req.body.notes,
      );
      res.json({ success: true, data: trial, message: 'Trial status updated' });
    } catch (error) {
      next(error);
    }
  },
);

router.post('/trials/:id/convert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BookingService.convertTrialToMember(
      getTenantId(req),
      req.params.id as string,
      req.body.planId,
      req.user?.userId,
    );
    res.json({ success: true, data: result, message: 'Trial converted to active member successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
