import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ITrial extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  leadId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  classId?: Types.ObjectId;
  trainerId?: Types.ObjectId;
  slotTime: Date;
  status: 'SCHEDULED' | 'ATTENDED' | 'NO_SHOW' | 'CONVERTED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TrialSchema = new Schema<ITrial>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    slotTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ATTENDED', 'NO_SHOW', 'CONVERTED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

TrialSchema.index({ tenantId: 1, branchId: 1, slotTime: 1 });

TrialSchema.plugin(tenantIsolationPlugin);

export const Trial: Model<ITrial> =
  mongoose.models.Trial || mongoose.model<ITrial>('Trial', TrialSchema);
