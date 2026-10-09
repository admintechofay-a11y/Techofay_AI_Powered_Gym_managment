import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createInventoryItemSchema, stockAdjustmentSchema } from '@gymos/shared';

const router = Router();
router.use(authMiddleware);

// POST /api/inventory - Create item
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createInventoryItemSchema.parse(req.body);
    const item = await InventoryService.createItem(req.user!.tenantId, input, req.user!.userId);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: item,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory - List items
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId, category, isLowStock, search, page, limit } = req.query;
    const result = await InventoryService.listItems({
      tenantId: req.user!.tenantId,
      branchId: (branchId as string) || req.user?.branchId,
      category: category as string,
      isLowStock: isLowStock !== undefined ? isLowStock === 'true' : undefined,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        requestId: req.correlationId,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/adjust - ATOMIC Stock Adjustment
router.post('/adjust', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = stockAdjustmentSchema.parse(req.body);
    const result = await InventoryService.adjustStock(req.user!.tenantId, input, req.user!.userId);

    res.json({
      success: true,
      message: `Stock successfully updated (${input.type}: ${input.quantity})`,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/low-stock - Low Stock Alerts
router.get('/low-stock', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { branchId } = req.query;
    const result = await InventoryService.getLowStockAlerts(
      req.user!.tenantId,
      (branchId as string) || req.user?.branchId,
    );

    res.json({
      success: true,
      data: result,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/suppliers - List Suppliers
router.get('/suppliers', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await InventoryService.listSuppliers(req.user!.tenantId);
    res.json({
      success: true,
      data: suppliers,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory/suppliers - Create Supplier
router.post('/suppliers', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await InventoryService.createSupplier(req.user!.tenantId, req.body);
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
      meta: { requestId: req.correlationId },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
