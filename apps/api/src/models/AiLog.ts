import mongoose, { Schema, Document, Types } from 'mongoose';
import { AI_FEATURE, type AiFeature } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IAiLog extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  feature: AiFeature;
  provider: 'CLAUDE' | 'RULE_BASED';
  promptSummary?: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  status: 'SUCCESS' | 'FALLBACK' | 'ERROR';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AiLogSchema = new Schema<IAiLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    feature: {
      type: String,
      enum: Object.values(AI_FEATURE),
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['CLAUDE', 'RULE_BASED'],
      required: true,
    },
    promptSummary: { type: String },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['SUCCESS', 'FALLBACK', 'ERROR'],
      required: true,
      index: true,
    },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

AiLogSchema.plugin(tenantIsolationPlugin);
AiLogSchema.index({ tenantId: 1, feature: 1, createdAt: -1 });

export const AiLog = mongoose.model<IAiLog>('AiLog', AiLogSchema);
