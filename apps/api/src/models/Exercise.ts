import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IExercise extends Document {
  tenantId: Types.ObjectId;
  name: string;
  category: string;
  targetMuscleGroup: string;
  secondaryMuscles: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  instructions: string;
  equipmentRequired?: string;
  videoUrl?: string;
  imageUrl?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    targetMuscleGroup: { type: String, required: true, trim: true },
    secondaryMuscles: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    instructions: { type: String, required: true },
    equipmentRequired: { type: String },
    videoUrl: { type: String },
    imageUrl: { type: String },
    isSystem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

ExerciseSchema.index({ tenantId: 1, name: 1 }, { unique: true });
ExerciseSchema.index({ tenantId: 1, targetMuscleGroup: 1 });

ExerciseSchema.plugin(tenantIsolationPlugin);

export const Exercise: Model<IExercise> =
  mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);
