import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IIdempotencyKey extends Document {
  tenantId: Types.ObjectId;
  key: string;
  method: string;
  path: string;
  requestHash: string;
  responseStatus?: number;
  responseBody?: any;
  expiresAt: Date;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    key: { type: String, required: true, trim: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    requestHash: { type: String, required: true },
    responseStatus: { type: Number },
    responseBody: { type: Schema.Types.Mixed },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

IdempotencyKeySchema.index({ tenantId: 1, key: 1 }, { unique: true });

IdempotencyKeySchema.plugin(tenantIsolationPlugin);

export const IdempotencyKey: Model<IIdempotencyKey> =
  mongoose.models.IdempotencyKey ||
  mongoose.model<IIdempotencyKey>('IdempotencyKey', IdempotencyKeySchema);
