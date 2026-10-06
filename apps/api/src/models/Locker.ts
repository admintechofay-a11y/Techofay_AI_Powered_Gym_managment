import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ILocker extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  lockerNumber: string;
  size: 'SMALL' | 'MEDIUM' | 'LARGE';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  assignedMemberId?: Types.ObjectId;
  assignedFrom?: Date;
  assignedUntil?: Date;
  feeInPaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const LockerSchema = new Schema<ILocker>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    lockerNumber: { type: String, required: true, trim: true },
    size: { type: String, enum: ['SMALL', 'MEDIUM', 'LARGE'], default: 'MEDIUM' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
    assignedMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    assignedFrom: { type: Date },
    assignedUntil: { type: Date },
    feeInPaise: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

LockerSchema.index({ tenantId: 1, branchId: 1, lockerNumber: 1 }, { unique: true });

LockerSchema.plugin(tenantIsolationPlugin);

export const Locker: Model<ILocker> =
  mongoose.models.Locker || mongoose.model<ILocker>('Locker', LockerSchema);
