import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IWorkoutLogExercise {
  exerciseId: Types.ObjectId;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: number;
  weightKg: number;
}

export interface IWorkoutLog extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  workoutPlanId?: Types.ObjectId;
  title: string;
  date: Date;
  durationMinutes: number;
  exercises: IWorkoutLogExercise[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutLogExerciseSchema = new Schema<IWorkoutLogExercise>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    exerciseName: { type: String, required: true },
    setsCompleted: { type: Number, required: true, min: 1 },
    repsCompleted: { type: Number, required: true, min: 1 },
    weightKg: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const WorkoutLogSchema = new Schema<IWorkoutLog>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    workoutPlanId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    title: { type: String, required: true },
    date: { type: Date, default: Date.now, required: true },
    durationMinutes: { type: Number, default: 45, min: 1 },
    exercises: [WorkoutLogExerciseSchema],
    notes: { type: String },
  },
  {
    timestamps: true,
  },
);

WorkoutLogSchema.index({ tenantId: 1, memberId: 1, date: -1 });

WorkoutLogSchema.plugin(tenantIsolationPlugin);

export const WorkoutLog: Model<IWorkoutLog> =
  mongoose.models.WorkoutLog || mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema);
