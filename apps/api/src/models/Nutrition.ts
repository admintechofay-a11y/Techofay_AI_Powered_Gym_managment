import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface INutritionMealItem {
  foodId?: Types.ObjectId;
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface INutritionMeal {
  mealName: string;
  time: string;
  foods: INutritionMealItem[];
}

export interface INutrition extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  createdByStaffId?: Types.ObjectId;
  title: string;
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterIntakeLiters: number;
  meals: INutritionMeal[];
  notes?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  approvedByNutritionistId?: Types.ObjectId;
  approvedAt?: Date;
  reviewNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MealItemSchema = new Schema<INutritionMealItem>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food' },
    foodName: { type: String, required: true },
    quantity: { type: String, required: true },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
  },
  { _id: false },
);

const MealSchema = new Schema<INutritionMeal>(
  {
    mealName: { type: String, required: true },
    time: { type: String, required: true },
    foods: [MealItemSchema],
  },
  { _id: false },
);

const NutritionSchema = new Schema<INutrition>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    createdByStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true, trim: true },
    dailyCalorieTarget: { type: Number, required: true, min: 500 },
    proteinGrams: { type: Number, default: 0 },
    carbsGrams: { type: Number, default: 0 },
    fatsGrams: { type: Number, default: 0 },
    waterIntakeLiters: { type: Number, default: 3 },
    meals: [MealSchema],
    notes: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
    approvedByNutritionistId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    reviewNotes: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

NutritionSchema.index({ tenantId: 1, memberId: 1, isActive: 1 });

NutritionSchema.plugin(tenantIsolationPlugin);

export const Nutrition: Model<INutrition> =
  mongoose.models.Nutrition || mongoose.model<INutrition>('Nutrition', NutritionSchema);
