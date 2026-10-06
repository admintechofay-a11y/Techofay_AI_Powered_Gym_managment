import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SUBSCRIPTION_TIER, type SubscriptionTier } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ISubscription extends Document {
  tenantId: Types.ObjectId;
  planTier: SubscriptionTier;
  billingCycle: 'MONTHLY' | 'YEARLY';
  amountInPaise: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
  maxBranches: number;
  maxMembers: number;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    planTier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.STARTER,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    amountInPaise: { type: Number, required: true, min: 0 },
    currentPeriodStart: { type: Date, default: Date.now, required: true },
    currentPeriodEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    maxBranches: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 500 },
    features: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

SubscriptionSchema.index({ tenantId: 1, status: 1 });

SubscriptionSchema.plugin(tenantIsolationPlugin);

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
