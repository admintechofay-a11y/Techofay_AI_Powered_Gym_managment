import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IReferral extends Document {
  tenantId: Types.ObjectId;
  referrerMemberId: Types.ObjectId;
  referredLeadId?: Types.ObjectId;
  referredMemberId?: Types.ObjectId;
  rewardType: 'WALLET_CREDIT' | 'FREE_DAYS' | 'CASH' | 'GIFT';
  rewardValue: number;
  status: 'PENDING' | 'REWARDED' | 'EXPIRED';
  rewardedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    referrerMemberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    referredLeadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    referredMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    rewardType: {
      type: String,
      enum: ['WALLET_CREDIT', 'FREE_DAYS', 'CASH', 'GIFT'],
      default: 'WALLET_CREDIT',
    },
    rewardValue: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'REWARDED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    rewardedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

ReferralSchema.index({ tenantId: 1, referrerMemberId: 1 });

ReferralSchema.plugin(tenantIsolationPlugin);

export const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
