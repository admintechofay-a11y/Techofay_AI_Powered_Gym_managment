import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ILoginHistory extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  ipAddress: string;
  userAgent: string;
  status: 'SUCCESS' | 'FAILURE' | 'LOCKED_OUT';
  failureReason?: string;
  timestamp: Date;
  createdAt: Date;
}

const LoginHistorySchema = new Schema<ILoginHistory>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'LOCKED_OUT'],
      required: true,
      index: true,
    },
    failureReason: { type: String },
    timestamp: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

LoginHistorySchema.index({ tenantId: 1, email: 1, timestamp: -1 });

LoginHistorySchema.plugin(tenantIsolationPlugin);

export const LoginHistory: Model<ILoginHistory> =
  mongoose.models.LoginHistory || mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema);
