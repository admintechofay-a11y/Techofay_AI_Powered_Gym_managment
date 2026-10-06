import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IWalletTransaction {
  type: 'CREDIT' | 'DEBIT';
  amountInPaise: number;
  balanceAfterInPaise: number;
  reason: string;
  referenceId?: Types.ObjectId;
  timestamp: Date;
}

export interface IWallet extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  balanceInPaise: number;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    amountInPaise: { type: Number, required: true, min: 1 },
    balanceAfterInPaise: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const WalletSchema = new Schema<IWallet>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    balanceInPaise: { type: Number, default: 0, min: 0 },
    transactions: [WalletTransactionSchema],
  },
  {
    timestamps: true,
  },
);

WalletSchema.index({ tenantId: 1, memberId: 1 }, { unique: true });

WalletSchema.plugin(tenantIsolationPlugin);

export const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
