import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ICounter extends Document {
  tenantId: Types.ObjectId;
  key: string;
  prefix: string;
  financialYear?: string;
  seq: number;
  updatedAt: Date;
}

export interface ICounterModel extends Model<ICounter> {
  getNextSequence(
    tenantId: Types.ObjectId | string,
    key: string,
    prefix: string,
    financialYear?: string,
  ): Promise<string>;
}

const CounterSchema = new Schema<ICounter, ICounterModel>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    prefix: { type: String, required: true, uppercase: true, trim: true },
    financialYear: { type: String, trim: true },
    seq: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  },
);

CounterSchema.index({ tenantId: 1, key: 1, financialYear: 1 }, { unique: true });

CounterSchema.plugin(tenantIsolationPlugin);

CounterSchema.statics.getNextSequence = async function (
  tenantId: Types.ObjectId | string,
  key: string,
  prefix: string,
  financialYear?: string,
): Promise<string> {
  const query: any = {
    tenantId: typeof tenantId === 'string' ? new Types.ObjectId(tenantId) : tenantId,
    key: key.toUpperCase(),
    financialYear: financialYear || '',
  };

  const counter = await this.findOneAndUpdate(
    query,
    {
      $inc: { seq: 1 },
      $setOnInsert: { prefix: prefix.toUpperCase() },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  if (financialYear) {
    return `${prefix}-${financialYear}-${paddedSeq}`;
  }
  return `${prefix}-${paddedSeq}`;
};

export const Counter: ICounterModel =
  (mongoose.models.Counter as ICounterModel) ||
  mongoose.model<ICounter, ICounterModel>('Counter', CounterSchema);
