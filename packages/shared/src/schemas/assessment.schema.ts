import { z } from 'zod';

export const createAssessmentSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  conductedByTrainerId: z.string().optional(),
  date: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
  weightKg: z.number().min(20).max(300),
  heightCm: z.number().min(80).max(250),
  bodyFatPercent: z.number().min(1).max(60).optional(),
  muscleMassKg: z.number().min(10).max(150).optional(),
  chestCm: z.number().min(20).max(200).optional(),
  waistCm: z.number().min(20).max(200).optional(),
  hipsCm: z.number().min(20).max(200).optional(),
  armsCm: z.number().min(10).max(100).optional(),
  thighsCm: z.number().min(10).max(120).optional(),
  notes: z.string().optional(),
  photos: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(['FRONT', 'SIDE', 'BACK']),
      }),
    )
    .default([]),
  goals: z
    .array(
      z.object({
        goalType: z.string(),
        targetValue: z.number(),
        achieved: z.boolean().default(false),
        milestoneBadge: z.string().optional(),
      }),
    )
    .default([]),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const updateGoalSchema = z.object({
  achieved: z.boolean(),
  milestoneBadge: z.string().optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
