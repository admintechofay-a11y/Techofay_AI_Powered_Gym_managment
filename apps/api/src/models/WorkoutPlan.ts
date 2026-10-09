import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IWorkoutExercise {
  exerciseId: Types.ObjectId;
  sets: number;
  reps: number;
  weightInKg?: number;
  restSeconds?: number;
  notes?: string;
}

export interface IWorkoutDay {
  dayOfWeek: string;
  focus: string;
  exercises: IWorkoutExercise[];
}

export interface IWorkoutPlan extends Document {
  tenantId: Types.ObjectId;
  memberId?: Types.ObjectId;
  createdByTrainerId?: Types.ObjectId;
  title: string;
  description?: string;
  daysPerWeek: number;
  schedule: IWorkoutDay[];
  startDate: Date;
  endDate?: Date;
  isTemplate: boolean;
  isActive: boolean;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';
  aiGenerated?: boolean;
  approvedByTrainerId?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutExerciseSchema = new Schema<IWorkoutExercise>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: { type: Number, required: true, min: 1 },
    reps: { type: Number, required: true, min: 1 },
    weightInKg: { type: Number },
    restSeconds: { type: Number, default: 60 },
    notes: { type: String },
  },
  { _id: false },
);

const WorkoutDaySchema = new Schema<IWorkoutDay>(
  {
    dayOfWeek: { type: String, required: true },
    focus: { type: String, required: true },
    exercises: [WorkoutExerciseSchema],
  },
  { _id: false },
);

const WorkoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: false, index: true },
    createdByTrainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    daysPerWeek: { type: Number, default: 3, min: 1, max: 7 },
    schedule: [WorkoutDaySchema],
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isTemplate: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    aiGenerated: { type: Boolean, default: false },
    approvedByTrainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

WorkoutPlanSchema.index({ tenantId: 1, memberId: 1, isActive: 1 });
WorkoutPlanSchema.index({ tenantId: 1, isTemplate: 1 });

WorkoutPlanSchema.plugin(tenantIsolationPlugin);

export const WorkoutPlan: Model<IWorkoutPlan> =
  mongoose.models.WorkoutPlan || mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);
