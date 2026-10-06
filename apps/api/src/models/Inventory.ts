import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IInventory extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  sku: string;
  category: 'SUPPLEMENTS' | 'MERCHANDISE' | 'APPAREL' | 'EQUIPMENT' | 'ACCESSORIES';
  supplierId?: Types.ObjectId;
  costPriceInPaise: number;
  sellingPriceInPaise: number;
  quantityInStock: number;
  minThresholdAlert: number;
  isLowStock: boolean;
  unit: string; // e.g. "bottle", "pcs", "kg"
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    category: {
      type: String,
      enum: ['SUPPLEMENTS', 'MERCHANDISE', 'APPAREL', 'EQUIPMENT', 'ACCESSORIES'],
      required: true,
      index: true,
    },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    costPriceInPaise: { type: Number, required: true, min: 0 },
    sellingPriceInPaise: { type: Number, required: true, min: 0 },
    quantityInStock: { type: Number, required: true, default: 0 },
    minThresholdAlert: { type: Number, default: 5, min: 0 },
    isLowStock: { type: Boolean, default: false, index: true },
    unit: { type: String, default: 'pcs' },
  },
  {
    timestamps: true,
  },
);

InventorySchema.index({ tenantId: 1, sku: 1 }, { unique: true });

InventorySchema.plugin(tenantIsolationPlugin);

export const Inventory: Model<IInventory> =
  mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
