import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IFood extends Document {
  tenantId: Types.ObjectId;
  name: string;
  servingSize: string; // e.g. "100g", "1 cup"
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  category: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    servingSize: { type: String, required: true },
    calories: { type: Number, required: true, min: 0 },
    proteinGrams: { type: Number, default: 0, min: 0 },
    carbsGrams: { type: Number, default: 0, min: 0 },
    fatsGrams: { type: Number, default: 0, min: 0 },
    category: { type: String, default: 'General' },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

FoodSchema.index({ tenantId: 1, name: 1 }, { unique: true });

FoodSchema.plugin(tenantIsolationPlugin);

export const Food: Model<IFood> =
  mongoose.models.Food || mongoose.model<IFood>('Food', FoodSchema);
