import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IWaterLog extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  amountLiters: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    amountLiters: { type: Number, required: true, min: 0.1 },
    date: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
  },
);

WaterLogSchema.index({ tenantId: 1, memberId: 1, date: -1 });

WaterLogSchema.plugin(tenantIsolationPlugin);

export const WaterLog: Model<IWaterLog> =
  mongoose.models.WaterLog || mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
