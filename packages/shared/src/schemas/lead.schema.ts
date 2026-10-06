import { z } from 'zod';
import { LEAD_PIPELINE_STATUS, LEAD_SCORE, LEAD_SOURCE } from '../constants/enums.js';

export const createLeadSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Valid phone number is required'),
  source: z.nativeEnum(LEAD_SOURCE).default(LEAD_SOURCE.WEBSITE),
  pipelineStatus: z.nativeEnum(LEAD_PIPELINE_STATUS).default(LEAD_PIPELINE_STATUS.NEW),
  assignedToStaffId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  leadScore: z.nativeEnum(LEAD_SCORE).default(LEAD_SCORE.WARM),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
