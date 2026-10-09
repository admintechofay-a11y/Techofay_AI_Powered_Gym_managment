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
  anniversaryDate?: Date;
  notificationPreferences?: {
    whatsapp?: boolean;
    sms?: boolean;
    email?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  churnRisk?: {
    score: number;
    level: 'HIGH' | 'MEDIUM' | 'LOW';
    reasons: string[];
    suggestedAction: string;
    calculatedAt: Date;
  };
  referralCode?: string;
  referredByMemberId?: Types.ObjectId;
  leaderboardOptIn: boolean;
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
    anniversaryDate: { type: Date },
    notificationPreferences: {
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    churnRisk: {
      score: { type: Number, min: 0, max: 100 },
      level: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
      reasons: [{ type: String }],
      suggestedAction: { type: String },
      calculatedAt: { type: Date },
    },
    referralCode: { type: String, uppercase: true, trim: true },
    referredByMemberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    leaderboardOptIn: { type: Boolean, default: true, index: true },
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
MemberSchema.index({ tenantId: 1, referralCode: 1 }, { sparse: true });

MemberSchema.plugin(tenantIsolationPlugin);

export const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);
