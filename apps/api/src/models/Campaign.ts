import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { COMMUNICATION_CHANNEL, type CommunicationChannel } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ICampaign extends Document {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  channel: CommunicationChannel;
  segmentId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  scheduledAt?: Date;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  convertedCount: number;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    name: { type: String, required: true, trim: true },
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
    convertedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED'],
      default: 'DRAFT',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

CampaignSchema.index({ tenantId: 1, status: 1 });

CampaignSchema.plugin(tenantIsolationPlugin);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
