import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IPtPackage extends Document {
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  numberOfSessions: number;
  validityDays: number;
  priceInPaise: number;
  trainerCommissionPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PtPackageSchema = new Schema<IPtPackage>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    numberOfSessions: { type: Number, required: true, min: 1 },
    validityDays: { type: Number, required: true, min: 1 },
    priceInPaise: { type: Number, required: true, min: 0 },
    trainerCommissionPercent: { type: Number, default: 20, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

PtPackageSchema.index({ tenantId: 1, name: 1 }, { unique: true });

PtPackageSchema.plugin(tenantIsolationPlugin);

export const PtPackage: Model<IPtPackage> =
  mongoose.models.PtPackage || mongoose.model<IPtPackage>('PtPackage', PtPackageSchema);
