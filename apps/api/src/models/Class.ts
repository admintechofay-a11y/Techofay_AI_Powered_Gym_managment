import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IClass extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  name: string;
  description?: string;
  trainerId?: Types.ObjectId;
  scheduleDays: string[]; // e.g. ["MON", "WED", "FRI"]
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "08:00"
  capacity: number;
  waitlistCapacity: number;
  isActive: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    scheduleDays: [{ type: String }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    capacity: { type: Number, required: true, min: 1 },
    waitlistCapacity: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    color: { type: String, default: '#6366f1' },
  },
  {
    timestamps: true,
  },
);

ClassSchema.index({ tenantId: 1, branchId: 1, isActive: 1 });

ClassSchema.plugin(tenantIsolationPlugin);

export const Class: Model<IClass> =
  mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
