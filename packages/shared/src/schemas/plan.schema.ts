import { z } from 'zod';
import { PLAN_TYPE } from '../constants/enums.js';

export const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name is required').max(100),
  code: z.string().min(2).max(20).toUpperCase(),
  type: z.nativeEnum(PLAN_TYPE),
  durationDays: z.number().int().positive('Duration must be positive days'),
  priceInPaise: z.number().int().nonnegative('Price must be in positive paise'),
  signupFeeInPaise: z.number().int().nonnegative().default(0),
  taxRatePercent: z.number().min(0).max(100).default(18),
  branchIds: z.array(z.string()).default([]),
  description: z.string().optional(),
  maxFreezes: z.number().int().nonnegative().default(1),
  maxFreezeDays: z.number().int().nonnegative().default(30),
  isActive: z.boolean().default(true),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
