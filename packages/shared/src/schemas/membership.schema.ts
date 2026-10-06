import { z } from 'zod';

export const createMembershipSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  branchId: z.string().min(1, 'Branch ID is required'),
  autoRenew: z.boolean().default(false),
  discountInPaise: z.number().int().nonnegative().default(0),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

export const freezeMembershipSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(3, 'Reason must be provided'),
});

export type FreezeMembershipInput = z.infer<typeof freezeMembershipSchema>;
