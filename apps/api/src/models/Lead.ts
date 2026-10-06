import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  LEAD_PIPELINE_STATUS,
  LEAD_SCORE,
  LEAD_SOURCE,
  type LeadPipelineStatus,
  type LeadScore,
  type LeadSource,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ILead extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  pipelineStatus: LeadPipelineStatus;
  assignedToStaffId?: Types.ObjectId;
  tags: string[];
  notes?: string;
  leadScore: LeadScore;
  convertedMemberId?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    source: {
      type: String,
      enum: Object.values(LEAD_SOURCE),
      default: LEAD_SOURCE.WEBSITE,
      required: true,
    },
    pipelineStatus: {
      type: String,
      enum: Object.values(LEAD_PIPELINE_STATUS),
      default: LEAD_PIPELINE_STATUS.NEW,
      required: true,
      index: true,
    },
    assignedToStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: [{ type: String }],
    notes: { type: String },
    leadScore: {
      type: String,
      enum: Object.values(LEAD_SCORE),
      default: LEAD_SCORE.WARM,
      required: true,
    },
    convertedMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

LeadSchema.index({ tenantId: 1, phone: 1 });
LeadSchema.index({ tenantId: 1, pipelineStatus: 1 });
LeadSchema.index({ tenantId: 1, branchId: 1, createdAt: -1 });

LeadSchema.plugin(tenantIsolationPlugin);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
