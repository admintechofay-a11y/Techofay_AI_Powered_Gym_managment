import { z } from 'zod';

export const createTrainerSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  branchIds: z.array(z.string()).default([]),
  specializations: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  bio: z.string().optional(),
  defaultCommissionRatePercent: z.number().min(0).max(100).default(15),
  availabilitySchedule: z
    .array(
      z.object({
        dayOfWeek: z.string(),
        slots: z.array(
          z.object({
            startTime: z.string(),
            endTime: z.string(),
          }),
        ),
      }),
    )
    .default([]),
});

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;

export const createPtPackageSchema = z.object({
  name: z.string().min(2, 'Package name is required'),
  description: z.string().optional(),
  numberOfSessions: z.number().int().min(1),
  validityDays: z.number().int().min(1),
  priceInPaise: z.number().int().min(0),
  trainerCommissionPercent: z.number().min(0).max(100).default(20),
});

export type CreatePtPackageInput = z.infer<typeof createPtPackageSchema>;

export const usePtSessionSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  trainerId: z.string().min(1, 'Trainer ID is required'),
  sessionNotes: z.string().optional(),
});

export type UsePtSessionInput = z.infer<typeof usePtSessionSchema>;

export const trainerReviewSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  trainerId: z.string().min(1, 'Trainer ID is required'),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(5, 'Review must be at least 5 characters'),
  isPublic: z.boolean().default(true),
});

export type TrainerReviewInput = z.infer<typeof trainerReviewSchema>;
