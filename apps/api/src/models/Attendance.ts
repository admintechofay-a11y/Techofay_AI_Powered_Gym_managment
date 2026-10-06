import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ATTENDANCE_METHOD, type AttendanceMethod } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IAttendance extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  memberId: Types.ObjectId;
  staffId?: Types.ObjectId;
  checkInTime: Date;
  checkOutTime?: Date;
  method: AttendanceMethod;
  deviceId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User' },
    checkInTime: { type: Date, default: Date.now, required: true, index: true },
    checkOutTime: { type: Date },
    method: {
      type: String,
      enum: Object.values(ATTENDANCE_METHOD),
      default: ATTENDANCE_METHOD.QR,
      required: true,
    },
    deviceId: { type: String },
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

AttendanceSchema.index({ tenantId: 1, branchId: 1, checkInTime: -1 });
AttendanceSchema.index({ tenantId: 1, memberId: 1, checkInTime: -1 });

AttendanceSchema.plugin(tenantIsolationPlugin);

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
