import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MEMBER_STATUS, type MemberStatus } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IMember extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  memberCode: string;
  userId?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: Date;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  profilePhotoUrl?: string;
  medicalNotes?: string;
  fitnessGoals: string[];
  status: MemberStatus;
  joinDate: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    memberCode: { type: String, required: true, uppercase: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    dob: { type: Date },
    bloodGroup: { type: String },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    profilePhotoUrl: { type: String },
    medicalNotes: { type: String },
    fitnessGoals: [{ type: String }],
    status: {
      type: String,
      enum: Object.values(MEMBER_STATUS),
      default: MEMBER_STATUS.ACTIVE,
      required: true,
      index: true,
    },
    joinDate: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

MemberSchema.index({ tenantId: 1, memberCode: 1 }, { unique: true });
MemberSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
MemberSchema.index({ tenantId: 1, email: 1 });
MemberSchema.index({ tenantId: 1, branchId: 1, status: 1 });

MemberSchema.plugin(tenantIsolationPlugin);

export const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
