import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ISegmentCriteria {
  membershipStatus?: string[];
  minAttendance?: number;
  maxAttendance?: number;
  minAge?: number;
  maxAge?: number;
  branchId?: Types.ObjectId;
  minSpendInPaise?: number;
  maxSpendInPaise?: number;
  inactivityDays?: number;
  fitnessGoals?: string[];
  leadStatus?: string[];
  tags?: string[];
}

export interface ISegment extends Document {
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  criteria: ISegmentCriteria;
  estimatedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    criteria: {
      membershipStatus: [{ type: String }],
      minAttendance: { type: Number },
      maxAttendance: { type: Number },
      minAge: { type: Number },
      maxAge: { type: Number },
      branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
      minSpendInPaise: { type: Number },
      maxSpendInPaise: { type: Number },
      inactivityDays: { type: Number },
      fitnessGoals: [{ type: String }],
      leadStatus: [{ type: String }],
      tags: [{ type: String }],
    },
    estimatedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

SegmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

SegmentSchema.plugin(tenantIsolationPlugin);

export const Segment: Model<ISegment> =
  mongoose.models.Segment || mongoose.model<ISegment>('Segment', SegmentSchema);
