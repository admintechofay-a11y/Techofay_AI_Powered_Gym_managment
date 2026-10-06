import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IBooking extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  memberId: Types.ObjectId;
  classId: Types.ObjectId;
  slotTime: Date;
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'ATTENDED';
  waitlistPosition?: number;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    slotTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'WAITLIST', 'CANCELLED', 'ATTENDED'],
      default: 'CONFIRMED',
      index: true,
    },
    waitlistPosition: { type: Number },
    cancelledAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

BookingSchema.index({ tenantId: 1, classId: 1, slotTime: 1, memberId: 1 });
BookingSchema.index({ tenantId: 1, memberId: 1, status: 1 });

BookingSchema.plugin(tenantIsolationPlugin);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
