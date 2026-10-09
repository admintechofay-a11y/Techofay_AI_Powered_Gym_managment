import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ITrainer extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  branchIds: Types.ObjectId[];
  specializations: string[];
  qualifications: string[];
  certifications: string[];
  bio?: string;
  rating: number;
  availabilitySchedule: {
    dayOfWeek: string;
    slots: { startTime: string; endTime: string }[];
  }[];
  name?: string;
  email?: string;
  commissionRatePercent?: number;
  defaultCommissionRatePercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrainerSchema = new Schema<ITrainer>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchIds: [{ type: Schema.Types.ObjectId, ref: 'Branch' }],
    name: { type: String },
    email: { type: String },
    specializations: [{ type: String }],
    qualifications: [{ type: String }],
    certifications: [{ type: String }],
    bio: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    availabilitySchedule: [
      {
        dayOfWeek: { type: String, required: true },
        slots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
    ],
    commissionRatePercent: { type: Number, min: 0, max: 100 },
    defaultCommissionRatePercent: { type: Number, default: 15, min: 0, max: 100 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

TrainerSchema.pre('save', function (next) {
  if (this.commissionRatePercent !== undefined && this.defaultCommissionRatePercent === 15) {
    this.defaultCommissionRatePercent = this.commissionRatePercent;
  }
  if (this.defaultCommissionRatePercent !== undefined && this.commissionRatePercent === undefined) {
    this.commissionRatePercent = this.defaultCommissionRatePercent;
  }
  next();
});

TrainerSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

TrainerSchema.plugin(tenantIsolationPlugin);

export const Trainer: Model<ITrainer> =
  mongoose.models.Trainer || mongoose.model<ITrainer>('Trainer', TrainerSchema);
