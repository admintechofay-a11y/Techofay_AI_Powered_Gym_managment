import { z } from 'zod';

export const calculateTargetsSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  age: z.number().int().min(12).max(100),
  weightKg: z.number().min(30).max(300),
  heightCm: z.number().min(100).max(250),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE']).default('MODERATE'),
  goal: z.enum(['FAT_LOSS', 'MAINTENANCE', 'MUSCLE_GAIN']).default('MAINTENANCE'),
});

export type CalculateTargetsInput = z.infer<typeof calculateTargetsSchema>;

export const createFoodSchema = z.object({
  name: z.string().min(2, 'Food name is required'),
  servingSize: z.string().min(1, 'Serving size is required'),
  calories: z.number().min(0),
  proteinGrams: z.number().min(0).default(0),
  carbsGrams: z.number().min(0).default(0),
  fatsGrams: z.number().min(0).default(0),
  category: z.string().default('General'),
});

export type CreateFoodInput = z.infer<typeof createFoodSchema>;

export const mealItemSchema = z.object({
  foodId: z.string().optional(),
  foodName: z.string().min(1),
  quantity: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fats: z.number().min(0).default(0),
});

export const mealScheduleSchema = z.object({
  mealName: z.string().min(1),
  time: z.string().min(1),
  foods: z.array(mealItemSchema),
});

export const createNutritionPlanSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  title: z.string().min(2, 'Title is required'),
  dailyCalorieTarget: z.number().min(500),
  proteinGrams: z.number().min(0).default(0),
  carbsGrams: z.number().min(0).default(0),
  fatsGrams: z.number().min(0).default(0),
  waterIntakeLiters: z.number().min(0.5).default(3),
  meals: z.array(mealScheduleSchema).default([]),
  notes: z.string().optional(),
});

export type CreateNutritionPlanInput = z.infer<typeof createNutritionPlanSchema>;

export const reviewNutritionPlanSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export type ReviewNutritionPlanInput = z.infer<typeof reviewNutritionPlanSchema>;

export const logWaterSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  amountLiters: z.number().min(0.1).max(10),
  date: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
});

export type LogWaterInput = z.infer<typeof logWaterSchema>;
