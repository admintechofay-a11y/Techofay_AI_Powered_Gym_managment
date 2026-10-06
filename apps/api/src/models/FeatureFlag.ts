import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SUBSCRIPTION_TIER, type SubscriptionTier } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IFeatureFlag extends Document {
  tenantId: Types.ObjectId;
  key: string;
  description: string;
  isEnabled: boolean;
  rolloutPercentage: number;
  minTier: SubscriptionTier;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    key: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    isEnabled: { type: Boolean, default: false },
    rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },
    minTier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.STARTER,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

FeatureFlagSchema.index({ tenantId: 1, key: 1 }, { unique: true });

FeatureFlagSchema.plugin(tenantIsolationPlugin);

export const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);
