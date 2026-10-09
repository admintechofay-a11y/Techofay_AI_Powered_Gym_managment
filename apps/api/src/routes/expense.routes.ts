import { Router, Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expenseService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createExpenseItemSchema } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// POST /api/expenses - Record expense
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createExpenseItemSchema.parse(req.body);
    const expense = await ExpenseService.createExpense(req.user!.tenantId, input, req.user!.userId);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses - List expenses
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, category, startDate, endDate, page, limit } = req.query;
    const result = await ExpenseService.listExpenses({
      tenantId: req.user!.tenantId,
      branchId: (branchId as string) || req.user?.branchId,
      category: category as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result.expenses,
      meta: {
        requestId: req.correlationId,
        totalAmountInPaise: result.totalAmountInPaise,
        totalAmountFormatted: result.totalAmountFormatted,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/profit-and-loss - Profit & Loss Statement (P&L)
router.get('/profit-and-loss', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const pnl = await ExpenseService.getProfitAndLoss({
      tenantId: req.user!.tenantId,
      branchId: (branchId as string) || req.user?.branchId,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({
      success: true,
      data: pnl,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
