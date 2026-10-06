import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { INVOICE_STATUS, type InvoiceStatus } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPriceInPaise: number;
  amountInPaise: number;
  taxRatePercent: number;
  taxAmountInPaise: number;
  planSnapshot?: {
    planId: string;
    planName: string;
    durationDays: number;
  };
}

export interface IInvoiceMemberSnapshot {
  memberId: string;
  memberCode: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

export interface IInvoice extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  invoiceNumber: string;
  financialYear: string; // e.g. "2026-2027"
  memberId: Types.ObjectId;
  membershipId?: Types.ObjectId;
  memberSnapshot: IInvoiceMemberSnapshot;
  items: IInvoiceItem[];
  subtotalInPaise: number;
  taxTotalInPaise: number;
  discountInPaise: number;
  grandTotalInPaise: number;
  paidAmountInPaise: number;
  dueAmountInPaise: number;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  gstNumber?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPriceInPaise: { type: Number, required: true, min: 0 },
    amountInPaise: { type: Number, required: true, min: 0 },
    taxRatePercent: { type: Number, default: 18, min: 0, max: 100 },
    taxAmountInPaise: { type: Number, default: 0, min: 0 },
    planSnapshot: {
      planId: { type: String },
      planName: { type: String },
      durationDays: { type: Number },
    },
  },
  { _id: false },
);

const InvoiceMemberSnapshotSchema = new Schema<IInvoiceMemberSnapshot>(
  {
    memberId: { type: String, required: true },
    memberCode: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
  },
  { _id: false },
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    invoiceNumber: { type: String, required: true, uppercase: true, trim: true },
    financialYear: { type: String, required: true, trim: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    membershipId: { type: Schema.Types.ObjectId, ref: 'Membership' },
    memberSnapshot: { type: InvoiceMemberSnapshotSchema, required: true },
    items: [InvoiceItemSchema],
    subtotalInPaise: { type: Number, required: true, min: 0 },
    taxTotalInPaise: { type: Number, default: 0, min: 0 },
    discountInPaise: { type: Number, default: 0, min: 0 },
    grandTotalInPaise: { type: Number, required: true, min: 0 },
    paidAmountInPaise: { type: Number, default: 0, min: 0 },
    dueAmountInPaise: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.UNPAID,
      required: true,
      index: true,
    },
    issueDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date, required: true },
    gstNumber: { type: String, trim: true },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, financialYear: 1 });
InvoiceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

InvoiceSchema.plugin(tenantIsolationPlugin);

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
