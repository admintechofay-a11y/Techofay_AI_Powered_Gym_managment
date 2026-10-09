import { z } from 'zod';

export const createExerciseSchema = z.object({
  name: z.string().min(2, 'Exercise name is required'),
  category: z.string().min(2, 'Category is required'),
  targetMuscleGroup: z.string().min(2, 'Target muscle group is required'),
  secondaryMuscles: z.array(z.string()).default([]),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  instructions: z.string().min(5, 'Instructions are required'),
  equipmentRequired: z.string().optional(),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export const workoutExerciseItemSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  weightInKg: z.number().min(0).optional(),
  restSeconds: z.number().int().min(0).default(60),
  notes: z.string().optional(),
});

export const workoutDaySchema = z.object({
  dayOfWeek: z.string(),
  focus: z.string(),
  exercises: z.array(workoutExerciseItemSchema),
});

export const createWorkoutPlanSchema = z.object({
  memberId: z.string().optional(), // optional if template
  createdByTrainerId: z.string().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  daysPerWeek: z.number().int().min(1).max(7).default(3),
  schedule: z.array(workoutDaySchema),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  isTemplate: z.boolean().default(false),
});

export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;

export const assignWorkoutPlanSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  planId: z.string().min(1, 'Plan/Template ID is required'),
  startDate: z.string().datetime().or(z.date()).optional(),
});

export type AssignWorkoutPlanInput = z.infer<typeof assignWorkoutPlanSchema>;

export const logWorkoutSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  workoutPlanId: z.string().optional(),
  title: z.string().min(1, 'Workout title is required'),
  date: z.string().datetime().or(z.date()).default(() => new Date().toISOString()),
  durationMinutes: z.number().int().min(1).default(45),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1),
      exerciseName: z.string(),
      setsCompleted: z.number().int().min(1),
      repsCompleted: z.number().int().min(1),
      weightKg: z.number().min(0).default(0),
    }),
  ),
  notes: z.string().optional(),
});

export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;
