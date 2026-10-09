import { z } from 'zod';

export const createReferralSchema = z.object({
  referrerMemberId: z.string().min(1, 'Referrer member ID is required'),
  referredName: z.string().min(2, 'Name is required'),
  referredPhone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Valid phone number is required'),
  referredEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type CreateReferralInput = z.infer<typeof createReferralSchema>;

export const rewardReferralSchema = z.object({
  rewardAmountInPaise: z.number().int().min(100), // e.g. min ₹1
  reason: z.string().min(3),
});

export type RewardReferralInput = z.infer<typeof rewardReferralSchema>;

export const leaderboardOptInSchema = z.object({
  optIn: z.boolean(),
});

export type LeaderboardOptInInput = z.infer<typeof leaderboardOptInSchema>;
