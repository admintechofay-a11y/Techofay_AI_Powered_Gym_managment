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
  followUpDate: z.string().datetime().optional().or(z.date().optional()),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const publicLeadCaptureSchema = z.object({
  tenantId: z.string().optional(),
  subdomain: z.string().optional(),
  branchId: z.string().min(1, 'Branch ID is required'),
  name: z.string().min(2, 'Name is required').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  source: z.nativeEnum(LEAD_SOURCE).default(LEAD_SOURCE.WEBSITE),
  fitnessGoal: z.string().optional(),
  notes: z.string().optional(),
});

export type PublicLeadCaptureInput = z.infer<typeof publicLeadCaptureSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const updateLeadStatusSchema = z.object({
  pipelineStatus: z.nativeEnum(LEAD_PIPELINE_STATUS),
  lostReason: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;

export const assignLeadSchema = z.object({
  assignedToStaffId: z.string().min(1, 'Staff ID is required'),
});

export type AssignLeadInput = z.infer<typeof assignLeadSchema>;

export const leadActivitySchema = z.object({
  type: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'STATUS_CHANGE']),
  content: z.string().min(1, 'Activity content is required'),
  scheduledAt: z.string().datetime().optional().or(z.date().optional()),
  completedAt: z.string().datetime().optional().or(z.date().optional()),
  result: z.string().optional(),
});

export type LeadActivityInput = z.infer<typeof leadActivitySchema>;

export const mergeLeadsSchema = z.object({
  duplicateLeadId: z.string().min(1, 'Duplicate lead ID is required'),
});

export type MergeLeadsInput = z.infer<typeof mergeLeadsSchema>;

export const convertLeadToMemberSchema = z.object({
  planId: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relation: z.string(),
    })
    .optional(),
  notes: z.string().optional(),
});

export type ConvertLeadToMemberInput = z.infer<typeof convertLeadToMemberSchema>;
