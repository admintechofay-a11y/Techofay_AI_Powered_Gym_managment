import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  COMMUNICATION_CHANNEL,
  type CommunicationChannel,
  CAMPAIGN_TYPE,
  type CampaignType,
  CAMPAIGN_STATUS,
  type CampaignStatus,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ICampaignVariant {
  variantId: 'A' | 'B';
  subject?: string;
  body: string;
  percentage: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
}

export interface ICampaign extends Document {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  type: CampaignType;
  channel: CommunicationChannel;
  segmentId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  scheduledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  revenueGeneratedInPaise: number;
  status: CampaignStatus;
  abTestingEnabled: boolean;
  variants: ICampaignVariant[];
  couponId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignVariantSchema = new Schema<ICampaignVariant>(
  {
    variantId: { type: String, enum: ['A', 'B'], required: true },
    subject: { type: String },
    body: { type: String, required: true },
    percentage: { type: Number, default: 50 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    convertedCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const CampaignSchema = new Schema<ICampaign>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(CAMPAIGN_TYPE),
      default: CAMPAIGN_TYPE.FESTIVAL,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNEL),
      required: true,
    },
    segmentId: { type: Schema.Types.ObjectId, ref: 'Segment' },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    scheduledAt: { type: Date },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    convertedCount: { type: Number, default: 0 },
    revenueGeneratedInPaise: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
      index: true,
    },
    abTestingEnabled: { type: Boolean, default: false },
    variants: [CampaignVariantSchema],
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  },
  {
    timestamps: true,
  },
);

CampaignSchema.index({ tenantId: 1, status: 1 });
CampaignSchema.index({ tenantId: 1, type: 1 });

CampaignSchema.plugin(tenantIsolationPlugin);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
