import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { COMMUNICATION_CHANNEL, type CommunicationChannel } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ITemplate extends Document {
  tenantId: Types.ObjectId;
  name: string;
  channel: CommunicationChannel;
  triggerEvent?: string; // e.g. "EXPIRY", "RENEWAL", "PAYMENT_DUE", "WELCOME"
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNEL),
      required: true,
      index: true,
    },
    triggerEvent: { type: String, index: true },
    subject: { type: String },
    body: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

TemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });

TemplateSchema.plugin(tenantIsolationPlugin);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
