import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PLAN_TYPE, type PlanType } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IPlan extends Document {
  tenantId: Types.ObjectId;
  branchIds: Types.ObjectId[];
  name: string;
  code: string;
  type: PlanType;
  durationDays: number;
  priceInPaise: number;
  signupFeeInPaise: number;
  taxRatePercent: number;
  description?: string;
  maxFreezes: number;
  maxFreezeDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: {
      type: String,
      enum: Object.values(PLAN_TYPE),
      required: true,
      index: true,
    },
    durationDays: { type: Number, required: true, min: 1 },
    priceInPaise: { type: Number, required: true, min: 0 },
    signupFeeInPaise: { type: Number, default: 0, min: 0 },
    taxRatePercent: { type: Number, default: 18, min: 0, max: 100 },
    description: { type: String },
    maxFreezes: { type: Number, default: 1, min: 0 },
    maxFreezeDays: { type: Number, default: 30, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

PlanSchema.index({ tenantId: 1, code: 1 }, { unique: true });
PlanSchema.index({ tenantId: 1, isActive: 1 });

PlanSchema.plugin(tenantIsolationPlugin);

export const Plan: Model<IPlan> =
  mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);
