import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IExpense extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  category:
    | 'SALARY'
    | 'UTILITIES'
    | 'RENT'
    | 'EQUIPMENT'
    | 'MARKETING'
    | 'SUPPLIES'
    | 'MAINTENANCE'
    | 'OTHER';
  amountInPaise: number;
  paymentMethod: string;
  vendorName: string;
  invoiceNumber?: string;
  date: Date;
  recurringInterval: 'NONE' | 'MONTHLY' | 'YEARLY';
  recordedByUserId?: Types.ObjectId;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    category: {
      type: String,
      enum: [
        'SALARY',
        'UTILITIES',
        'RENT',
        'EQUIPMENT',
        'MARKETING',
        'SUPPLIES',
        'MAINTENANCE',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    amountInPaise: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true, default: 'BANK_TRANSFER' },
    vendorName: { type: String, required: true, trim: true },
    invoiceNumber: { type: String },
    date: { type: Date, default: Date.now, required: true },
    recurringInterval: {
      type: String,
      enum: ['NONE', 'MONTHLY', 'YEARLY'],
      default: 'NONE',
    },
    recordedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    receiptUrl: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

ExpenseSchema.index({ tenantId: 1, branchId: 1, date: -1 });

ExpenseSchema.plugin(tenantIsolationPlugin);

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
