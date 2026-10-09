import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IClassSlot extends Document {
  tenantId: Types.ObjectId;
  classId: Types.ObjectId;
  slotTime: Date;
  capacity: number;
  waitlistCapacity: number;
  bookedCount: number;
  waitlistCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSlotSchema = new Schema<IClassSlot>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    slotTime: { type: Date, required: true, index: true },
    capacity: { type: Number, required: true },
    waitlistCapacity: { type: Number, required: true, default: 5 },
    bookedCount: { type: Number, required: true, default: 0 },
    waitlistCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

ClassSlotSchema.index({ tenantId: 1, classId: 1, slotTime: 1 }, { unique: true });
ClassSlotSchema.plugin(tenantIsolationPlugin);

export const ClassSlot: Model<IClassSlot> =
  mongoose.models.ClassSlot || mongoose.model<IClassSlot>('ClassSlot', ClassSlotSchema);
