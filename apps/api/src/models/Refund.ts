import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IRefund extends Document {
  tenantId: Types.ObjectId;
  paymentId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  memberId: Types.ObjectId;
  amountInPaise: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  processedBy?: Types.ObjectId;
  refundMethod: string;
  transactionRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    amountInPaise: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    refundMethod: { type: String, default: 'ORIGINAL_SOURCE' },
    transactionRef: { type: String },
  },
  {
    timestamps: true,
  },
);

RefundSchema.index({ tenantId: 1, paymentId: 1 });
RefundSchema.index({ tenantId: 1, status: 1 });

RefundSchema.plugin(tenantIsolationPlugin);

export const Refund: Model<IRefund> =
  mongoose.models.Refund || mongoose.model<IRefund>('Refund', RefundSchema);
