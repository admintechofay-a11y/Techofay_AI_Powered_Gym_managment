import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ICommission extends Document {
  tenantId: Types.ObjectId;
  staffId: Types.ObjectId;
  type: 'PT' | 'MEMBERSHIP_SALE' | 'PRODUCT_SALE';
  referenceId: Types.ObjectId;
  amountInPaise: number;
  ratePercent: number;
  status: 'PENDING' | 'APPROVED' | 'PAID';
  periodMonthYear: string; // e.g. "2026-10"
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    type: {
      type: String,
      enum: ['PT', 'MEMBERSHIP_SALE', 'PRODUCT_SALE'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    amountInPaise: { type: Number, required: true, min: 0 },
    ratePercent: { type: Number, required: true, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PAID'],
      default: 'PENDING',
      index: true,
    },
    periodMonthYear: { type: String, required: true },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

CommissionSchema.index({ tenantId: 1, staffId: 1, periodMonthYear: 1 });

CommissionSchema.plugin(tenantIsolationPlugin);

export const Commission: Model<ICommission> =
  mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);
