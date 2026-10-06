import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ISegment extends Document {
  tenantId: Types.ObjectId;
  name: string;
  description?: string;
  criteria: {
    membershipStatus?: string[];
    lastAttendedDaysAgo?: number;
    minSpendInPaise?: number;
    maxSpendInPaise?: number;
    leadStatus?: string[];
    tags?: string[];
  };
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
      lastAttendedDaysAgo: { type: Number },
      minSpendInPaise: { type: Number },
      maxSpendInPaise: { type: Number },
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
