import { Types } from 'mongoose';
import { Inventory, type IInventory } from '../models/Inventory.js';
import { Supplier, type ISupplier } from '../models/Supplier.js';
import { AuditLogService } from './auditLogService.js';
import type { StockAdjustmentInput, CreateInventoryItemInput } from '@gymos/shared';

export class InventoryService {
  /**
   * Create new inventory item
   */
  public static async createItem(
    tenantId: string,
    input: CreateInventoryItemInput,
    actorId?: string,
  ) {
    const existing = await Inventory.findOne({
      tenantId: new Types.ObjectId(tenantId),
      sku: input.sku.toUpperCase(),
    });

    if (existing) {
      const err: any = new Error(`Inventory item with SKU "${input.sku}" already exists`);
      err.statusCode = 409;
      throw err;
    }

    const item = await Inventory.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: new Types.ObjectId(input.branchId),
      name: input.name,
      sku: input.sku.toUpperCase(),
      category: input.category,
      supplierId: input.supplierId ? new Types.ObjectId(input.supplierId) : undefined,
      costPriceInPaise: input.costPriceInPaise,
      sellingPriceInPaise: input.sellingPriceInPaise,
      quantityInStock: input.initialStock || 0,
      minThresholdAlert: input.minThresholdAlert ?? 5,
      isLowStock: (input.initialStock || 0) <= (input.minThresholdAlert ?? 5),
      unit: input.unit || 'pcs',
    });

    if (actorId) {
      await AuditLogService.record({
        tenantId,
        branchId: input.branchId,
        userId: actorId,
        userRole: 'STAFF',
        action: 'CREATE_INVENTORY_ITEM',
        entity: 'Inventory',
        entityId: item._id.toString(),
        afterSnapshot: { sku: item.sku, name: item.name, quantity: item.quantityInStock },
      });
    }

    return item;
  }

  /**
   * List inventory items with category & low stock filters
   */
  public static async listItems(params: {
    tenantId: string;
    branchId?: string;
    category?: string;
    isLowStock?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit || 20)));

    const filter: Record<string, any> = { tenantId: new Types.ObjectId(params.tenantId) };
    if (params.branchId) filter.branchId = new Types.ObjectId(params.branchId);
    if (params.category) filter.category = params.category;
    if (params.isLowStock !== undefined) filter.isLowStock = params.isLowStock;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { sku: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort({ isLowStock: -1, quantityInStock: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('supplierId', 'name contactPerson phone')
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ATOMIC Stock Adjustment (Stock In / Stock Out)
   * Guaranteed race-safe against negative stock via conditional $gte update.
   */
  public static async adjustStock(
    tenantId: string,
    input: StockAdjustmentInput,
    actorId?: string,
  ) {
    const tenantObjectId = new Types.ObjectId(tenantId);
    const itemObjectId = new Types.ObjectId(input.inventoryId);

    let updatedItem: IInventory | null = null;

    if (input.type === 'STOCK_IN') {
      // Atomic increment
      updatedItem = await Inventory.findOneAndUpdate(
        {
          _id: itemObjectId,
          tenantId: tenantObjectId,
        },
        {
          $inc: { quantityInStock: input.quantity },
        },
        { new: true },
      );

      if (!updatedItem) {
        const err: any = new Error('Inventory item not found');
        err.statusCode = 404;
        throw err;
      }
    } else {
      // STOCK_OUT: Atomic conditional update verifying quantityInStock >= requested quantity
      updatedItem = await Inventory.findOneAndUpdate(
        {
          _id: itemObjectId,
          tenantId: tenantObjectId,
          quantityInStock: { $gte: input.quantity },
        },
        {
          $inc: { quantityInStock: -input.quantity },
        },
        { new: true },
      );

      if (!updatedItem) {
        // Find existing to verify if it exists but is out of stock
        const currentItem = await Inventory.findOne({ _id: itemObjectId, tenantId: tenantObjectId });
        if (!currentItem) {
          const err: any = new Error('Inventory item not found');
          err.statusCode = 404;
          throw err;
        }

        const err: any = new Error(
          `Insufficient stock: requested stock-out of ${input.quantity} exceeds current available stock (${currentItem.quantityInStock} ${currentItem.unit}).`,
        );
        err.statusCode = 400;
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
    }

    // Refresh low stock flag
    const isLowStock = updatedItem.quantityInStock <= updatedItem.minThresholdAlert;
    if (updatedItem.isLowStock !== isLowStock) {
      updatedItem.isLowStock = isLowStock;
      await updatedItem.save();
    }

    if (actorId) {
      await AuditLogService.record({
        tenantId,
        branchId: updatedItem.branchId.toString(),
        userId: actorId,
        userRole: 'STAFF',
        action: `INVENTORY_${input.type}`,
        entity: 'Inventory',
        entityId: updatedItem._id.toString(),
        afterSnapshot: {
          type: input.type,
          quantity: input.quantity,
          reason: input.reason,
          newQuantityInStock: updatedItem.quantityInStock,
          isLowStock: updatedItem.isLowStock,
        },
      });
    }

    return {
      success: true,
      item: updatedItem,
      adjustment: {
        type: input.type,
        quantity: input.quantity,
        newStock: updatedItem.quantityInStock,
        isLowStock: updatedItem.isLowStock,
      },
    };
  }

  /**
   * Low Stock Alerts
   */
  public static async getLowStockAlerts(tenantId: string, branchId?: string) {
    const filter: Record<string, any> = {
      tenantId: new Types.ObjectId(tenantId),
      isLowStock: true,
    };
    if (branchId) filter.branchId = new Types.ObjectId(branchId);

    const items = await Inventory.find(filter)
      .populate('supplierId', 'name contactPerson phone email')
      .sort({ quantityInStock: 1 })
      .lean();

    return {
      count: items.length,
      items,
    };
  }

  // --- Suppliers Management ---

  public static async createSupplier(
    tenantId: string,
    data: {
      name: string;
      contactPerson: string;
      email: string;
      phone: string;
      address?: string;
      taxNumber?: string;
      paymentTerms?: string;
    },
  ) {
    const supplier = await Supplier.create({
      tenantId: new Types.ObjectId(tenantId),
      ...data,
      status: 'ACTIVE',
    });
    return supplier;
  }

  public static async listSuppliers(tenantId: string) {
    return Supplier.find({
      tenantId: new Types.ObjectId(tenantId),
      status: 'ACTIVE',
    }).sort({ name: 1 }).lean();
  }
}
