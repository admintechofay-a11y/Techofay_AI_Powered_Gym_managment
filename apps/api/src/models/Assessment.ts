import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IAssessmentPhoto {
  url: string;
  type: 'FRONT' | 'SIDE' | 'BACK';
}

export interface IAssessmentGoal {
  goalType: string;
  targetValue: number;
  achieved: boolean;
  milestoneBadge?: string;
}

export interface IAssessment extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  conductedByTrainerId?: Types.ObjectId;
  date: Date;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
  notes?: string;
  photos: IAssessmentPhoto[];
  goals: IAssessmentGoal[];
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    conductedByTrainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now, required: true },
    weightKg: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    bmi: { type: Number, required: true },
    bodyFatPercent: { type: Number },
    muscleMassKg: { type: Number },
    chestCm: { type: Number },
    waistCm: { type: Number },
    hipsCm: { type: Number },
    armsCm: { type: Number },
    thighsCm: { type: Number },
    notes: { type: String },
    photos: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['FRONT', 'SIDE', 'BACK'], required: true },
      },
    ],
    goals: [
      {
        goalType: { type: String, required: true },
        targetValue: { type: Number, required: true },
        achieved: { type: Boolean, default: false },
        milestoneBadge: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  },
);

AssessmentSchema.index({ tenantId: 1, memberId: 1, date: -1 });

AssessmentSchema.plugin(tenantIsolationPlugin);

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
