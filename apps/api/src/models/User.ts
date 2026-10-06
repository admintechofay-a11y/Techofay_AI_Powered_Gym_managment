import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { USER_ROLES, type UserRole } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IUserSession {
  sessionId: string;
  refreshTokenHash: string;
  device: string;
  browser: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  tenantId: Types.ObjectId;
  branchIds: Types.ObjectId[];
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  permissionsOverride?: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  totpSecret?: string;
  totpEnabled: boolean;
  totpRecoveryCodes?: string[];
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  lastLoginAt?: Date;
  sessions: IUserSession[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    sessionId: { type: String, required: true },
    refreshTokenHash: { type: String, required: true },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Chrome' },
    ipAddress: { type: String, default: '127.0.0.1' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.MEMBER,
      required: true,
      index: true,
    },
    permissionsOverride: [{ type: String }],
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    totpSecret: { type: String },
    totpEnabled: { type: Boolean, default: false },
    totpRecoveryCodes: [{ type: String }],
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    lastLoginAt: { type: Date },
    sessions: [UserSessionSchema],
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, phone: 1 }, { sparse: true });
UserSchema.index({ tenantId: 1, role: 1 });

UserSchema.plugin(tenantIsolationPlugin);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
