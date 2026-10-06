import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IStaff extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  branchIds: Types.ObjectId[];
  designation: string;
  department: string;
  joinDate: Date;
  baseSalaryInPaise: number;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  status: 'ACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    designation: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    joinDate: { type: Date, default: Date.now },
    baseSalaryInPaise: { type: Number, required: true, min: 0 },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'],
      default: 'FULL_TIME',
    },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TERMINATED', 'ON_LEAVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

StaffSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

StaffSchema.plugin(tenantIsolationPlugin);

export const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);
