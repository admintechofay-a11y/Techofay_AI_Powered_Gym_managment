import { Types } from 'mongoose';
import { Expense, type IExpense } from '../models/Expense.js';
import { Invoice } from '../models/Invoice.js';
import { AuditLogService } from './auditLogService.js';
import type { CreateExpenseItemInput } from '@gymos/shared';

export class ExpenseService {
  /**
   * Record a new business expense
   */
  public static async createExpense(
    tenantId: string,
    input: CreateExpenseItemInput,
    actorId?: string,
  ) {
    const expense = await Expense.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: new Types.ObjectId(input.branchId),
      category: input.category,
      amountInPaise: input.amountInPaise,
      paymentMethod: input.paymentMethod || 'BANK_TRANSFER',
      vendorName: input.vendorName,
      invoiceNumber: input.invoiceNumber,
      date: input.date ? new Date(input.date) : new Date(),
      recurringInterval: input.recurringInterval || 'NONE',
      recordedByUserId: actorId ? new Types.ObjectId(actorId) : undefined,
      notes: input.notes,
    });

    if (actorId) {
      await AuditLogService.record({
        tenantId,
        branchId: input.branchId,
        userId: actorId,
        userRole: 'STAFF',
        action: 'CREATE_EXPENSE',
        entity: 'Expense',
        entityId: expense._id.toString(),
        afterSnapshot: {
          category: expense.category,
          amountInPaise: expense.amountInPaise,
          vendorName: expense.vendorName,
        },
      });
    }

    return expense;
  }

  /**
   * List Expenses with filtering & pagination
   */
  public static async listExpenses(params: {
    tenantId: string;
    branchId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const filter: Record<string, any> = { tenantId: new Types.ObjectId(params.tenantId) };
    if (params.branchId) filter.branchId = new Types.ObjectId(params.branchId);
    if (params.category) filter.category = params.category;
    if (params.startDate || params.endDate) {
      filter.date = {};
      if (params.startDate) filter.date.$gte = new Date(params.startDate);
      if (params.endDate) filter.date.$lte = new Date(params.endDate);
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('branchId', 'name code')
        .lean(),
      Expense.countDocuments(filter),
    ]);

    const totalAmountInPaise = expenses.reduce((sum, e) => sum + (e.amountInPaise || 0), 0);

    return {
      expenses,
      totalAmountInPaise,
      totalAmountFormatted: `₹${(totalAmountInPaise / 100).toLocaleString('en-IN')}`,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Comprehensive Profit and Loss (P&L) Statement
   * Breaks down Gross Revenue, Expenses by Category, Net Profit, and EBITDA margin.
   */
  public static async getProfitAndLoss(params: {
    tenantId: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const tenantObjectId = new Types.ObjectId(params.tenantId);

    // Default range: Start of current month to now
    const start = params.startDate ? new Date(params.startDate) : new Date();
    if (!params.startDate) {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    const end = params.endDate ? new Date(params.endDate) : new Date();

    const invoiceFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      status: 'PAID',
      createdAt: { $gte: start, $lte: end },
    };
    const expenseFilter: Record<string, any> = {
      tenantId: tenantObjectId,
      date: { $gte: start, $lte: end },
    };

    if (params.branchId) {
      const branchObjectId = new Types.ObjectId(params.branchId);
      invoiceFilter.branchId = branchObjectId;
      expenseFilter.branchId = branchObjectId;
    }

    const [invoices, expenses] = await Promise.all([
      Invoice.find(invoiceFilter).select('paidAmountInPaise grandTotalInPaise').lean(),
      Expense.find(expenseFilter).select('category amountInPaise').lean(),
    ]);

    // 1. Calculate Gross Revenue
    const grossRevenueInPaise = invoices.reduce(
      (sum, inv) => sum + (inv.paidAmountInPaise || inv.grandTotalInPaise || 0),
      0,
    );

    // 2. Breakdown Operating Expenses by Category
    const categoryTotals: Record<string, number> = {
      SALARY: 0,
      RENT: 0,
      UTILITIES: 0,
      EQUIPMENT: 0,
      MARKETING: 0,
      SUPPLIES: 0,
      MAINTENANCE: 0,
      OTHER: 0,
    };

    let totalExpensesInPaise = 0;
    for (const exp of expenses) {
      const cat = exp.category || 'OTHER';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (exp.amountInPaise || 0);
      totalExpensesInPaise += exp.amountInPaise || 0;
    }

    // 3. Profit & Loss Metrics
    const netProfitInPaise = grossRevenueInPaise - totalExpensesInPaise;
    const profitMargin =
      grossRevenueInPaise > 0
        ? Math.round((netProfitInPaise / grossRevenueInPaise) * 100)
        : 0;

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      revenue: {
        grossRevenueInPaise,
        grossRevenueFormatted: `₹${(grossRevenueInPaise / 100).toLocaleString('en-IN')}`,
        paidInvoicesCount: invoices.length,
      },
      expenses: {
        totalExpensesInPaise,
        totalExpensesFormatted: `₹${(totalExpensesInPaise / 100).toLocaleString('en-IN')}`,
        expenseCount: expenses.length,
        byCategory: Object.entries(categoryTotals).map(([cat, amt]) => ({
          category: cat,
          amountInPaise: amt,
          amountFormatted: `₹${(amt / 100).toLocaleString('en-IN')}`,
          percentageOfExpenses:
            totalExpensesInPaise > 0 ? Math.round((amt / totalExpensesInPaise) * 100) : 0,
        })),
      },
      profitability: {
        netProfitInPaise,
        netProfitFormatted: `₹${(netProfitInPaise / 100).toLocaleString('en-IN')}`,
        profitMargin,
        isProfitable: netProfitInPaise >= 0,
      },
    };
  }
}
