import { z } from 'zod';
import { SUBSCRIPTION_TIER, TENANT_STATUS } from '../constants/enums.js';

export const updateTenantSettingsSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url().optional(),
  currency: z.string().length(3).default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  phone: z.string().min(8),
  email: z.string().email(),
  operatingHours: z.object({
    openingTime: z.string().default('06:00'),
    closingTime: z.string().default('22:00'),
  }).optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
