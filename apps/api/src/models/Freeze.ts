import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IFreeze extends Document {
  tenantId: Types.ObjectId;
  membershipId: Types.ObjectId;
  memberId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason: string;
  approvedBy?: Types.ObjectId;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  resumeDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FreezeSchema = new Schema<IFreeze>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    membershipId: { type: Schema.Types.ObjectId, ref: 'Membership', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    resumeDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

FreezeSchema.index({ tenantId: 1, membershipId: 1, status: 1 });

FreezeSchema.plugin(tenantIsolationPlugin);

export const Freeze: Model<IFreeze> =
  mongoose.models.Freeze || mongoose.model<IFreeze>('Freeze', FreezeSchema);
