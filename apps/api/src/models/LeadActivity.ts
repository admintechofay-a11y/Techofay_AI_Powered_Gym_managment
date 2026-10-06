import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ILeadActivity extends Document {
  tenantId: Types.ObjectId;
  leadId: Types.ObjectId;
  staffId?: Types.ObjectId;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE';
  content: string;
  scheduledAt?: Date;
  completedAt?: Date;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadActivitySchema = new Schema<ILeadActivity>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE'],
      required: true,
    },
    content: { type: String, required: true },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    result: { type: String },
  },
  {
    timestamps: true,
  },
);

LeadActivitySchema.index({ tenantId: 1, leadId: 1, createdAt: -1 });

LeadActivitySchema.plugin(tenantIsolationPlugin);

export const LeadActivity: Model<ILeadActivity> =
  mongoose.models.LeadActivity || mongoose.model<ILeadActivity>('LeadActivity', LeadActivitySchema);
