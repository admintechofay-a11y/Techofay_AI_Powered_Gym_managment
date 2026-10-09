import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MEMBERSHIP_STATUS, type MembershipStatus } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IMembership extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  memberId: Types.ObjectId;
  planId: Types.ObjectId;
  invoiceId?: Types.ObjectId;
  assignedTrainerId?: Types.ObjectId;
  sessionsRemaining?: number;
  sessionsUsed?: number;
  startDate: Date;
  endDate: Date;
  status: MembershipStatus;
  totalAmountInPaise: number;
  balanceInPaise: number;
  autoRenew: boolean;
  freezeDaysUsed: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    assignedTrainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    sessionsRemaining: { type: Number, default: 0, min: 0 },
    sessionsUsed: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.ACTIVE,
      required: true,
      index: true,
    },
    totalAmountInPaise: { type: Number, required: true, min: 0 },
    balanceInPaise: { type: Number, default: 0, min: 0 },
    autoRenew: { type: Boolean, default: false },
    freezeDaysUsed: { type: Number, default: 0, min: 0 },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

MembershipSchema.index({ tenantId: 1, memberId: 1, status: 1 });
MembershipSchema.index({ tenantId: 1, endDate: 1 });
MembershipSchema.index({ tenantId: 1, assignedTrainerId: 1, status: 1 });

MembershipSchema.plugin(tenantIsolationPlugin);

export const Membership: Model<IMembership> =
  mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
