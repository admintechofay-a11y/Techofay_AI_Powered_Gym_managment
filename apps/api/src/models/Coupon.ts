import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ICoupon extends Document {
  tenantId: Types.ObjectId;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number; // percentage (e.g. 10) or paise (e.g. 50000)
  minOrderValueInPaise: number;
  maxDiscountInPaise?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderValueInPaise: { type: Number, default: 0, min: 0 },
    maxDiscountInPaise: { type: Number, min: 0 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    usageCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

CouponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

CouponSchema.plugin(tenantIsolationPlugin);

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
