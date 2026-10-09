import { Router, Request, Response, NextFunction } from 'express';
import { Ticket } from '../models/Ticket.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createTicketSchema, replyTicketSchema } from '@gymos/shared';
import { Types } from 'mongoose';

const router = Router();
router.use(authMiddleware);

// POST /api/tickets - Create ticket
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createTicketSchema.parse(req.body);
    const ticket = await Ticket.create({
      tenantId: new Types.ObjectId(req.user!.tenantId),
      branchId: input.branchId ? new Types.ObjectId(input.branchId) : (req.user?.branchId ? new Types.ObjectId(req.user.branchId) : undefined),
      userId: new Types.ObjectId(req.user!.userId),
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      category: input.category,
      status: 'OPEN',
      messages: [
        {
          senderId: new Types.ObjectId(req.user!.userId),
          senderType: 'USER',
          message: input.description,
          createdAt: new Date(),
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      data: ticket,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets - List tickets for tenant
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    const filter: Record<string, any> = { tenantId: new Types.ObjectId(req.user!.tenantId) };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tickets,
      meta: {
        requestId: req.correlationId,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets/:id/reply - Add reply message to ticket
router.post('/:id/reply', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = replyTicketSchema.parse(req.body);
    const ticket = await Ticket.findOne({
      _id: new Types.ObjectId(req.params.id as string),
      tenantId: new Types.ObjectId(req.user!.tenantId),
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Ticket not found' },
      });
      return;
    }

    ticket.messages.push({
      senderId: new Types.ObjectId(req.user!.userId),
      senderType: 'USER',
      message: input.message,
      createdAt: new Date(),
    });

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: ticket,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tickets/:id/status - Update ticket status
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findOneAndUpdate(
      {
        _id: new Types.ObjectId(req.params.id as string),
        tenantId: new Types.ObjectId(req.user!.tenantId),
      },
      { status },
      { new: true },
    );

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Ticket not found' },
      });
      return;
    }

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
