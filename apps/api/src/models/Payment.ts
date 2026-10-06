import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PAYMENT_METHOD, PAYMENT_STATUS, type PaymentMethod, type PaymentStatus } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IPayment extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  paymentNumber: string;
  invoiceId: Types.ObjectId;
  memberId: Types.ObjectId;
  amountInPaise: number;
  method: PaymentMethod;
  transactionRef?: string;
  status: PaymentStatus;
  idempotencyKey: string;
  gatewayResponse?: Record<string, any>;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    paymentNumber: { type: String, required: true, uppercase: true, trim: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    amountInPaise: { type: Number, required: true, min: 1 },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
      index: true,
    },
    transactionRef: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.SUCCESSFUL,
      required: true,
      index: true,
    },
    idempotencyKey: { type: String, required: true, trim: true },
    gatewayResponse: { type: Schema.Types.Mixed },
    receiptUrl: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

PaymentSchema.index({ tenantId: 1, paymentNumber: 1 }, { unique: true });
PaymentSchema.index({ tenantId: 1, idempotencyKey: 1 }, { unique: true });
PaymentSchema.index({ tenantId: 1, invoiceId: 1 });

PaymentSchema.plugin(tenantIsolationPlugin);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
