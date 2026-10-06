import mongoose, { Schema, Document, Model } from 'mongoose';
import { SUBSCRIPTION_TIER, TENANT_STATUS, type SubscriptionTier, type TenantStatus } from '@gymos/shared';

export interface ITenant extends Document {
  name: string;
  subdomain: string;
  customDomain?: string;
  tier: SubscriptionTier;
  status: TenantStatus;
  settings: {
    currency: string;
    timezone: string;
    gstin?: string;
    brandColor?: string;
    logoUrl?: string;
  };
  contactEmail: string;
  contactPhone: string;
  trialEndsAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    tier: {
      type: String,
      enum: Object.values(SUBSCRIPTION_TIER),
      default: SUBSCRIPTION_TIER.STARTER,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TENANT_STATUS),
      default: TENANT_STATUS.TRIAL,
      required: true,
      index: true,
    },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      gstin: { type: String, trim: true },
      brandColor: { type: String, default: '#10b981' },
      logoUrl: { type: String },
    },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    trialEndsAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  },
);

TenantSchema.index({ status: 1, createdAt: -1 });

export const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
