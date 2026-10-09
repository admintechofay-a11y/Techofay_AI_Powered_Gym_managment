import { z } from 'zod';

export const createClassSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  name: z.string().min(2, 'Class name is required'),
  description: z.string().optional(),
  trainerId: z.string().optional(),
  scheduleDays: z.array(z.string()).min(1, 'At least one day is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Valid HH:MM start time required'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Valid HH:MM end time required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  waitlistCapacity: z.number().int().min(0).default(5),
  color: z.string().optional().default('#6366f1'),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export const createBookingSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  memberId: z.string().min(1, 'Member ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  slotTime: z.string().datetime().or(z.date()),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createTrialSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  leadId: z.string().optional(),
  memberId: z.string().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  classId: z.string().optional(),
  trainerId: z.string().optional(),
  slotTime: z.string().datetime().or(z.date()),
  notes: z.string().optional(),
});

export type CreateTrialInput = z.infer<typeof createTrialSchema>;

export const updateTrialStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'ATTENDED', 'NO_SHOW', 'CONVERTED', 'CANCELLED']),
  notes: z.string().optional(),
});

export type UpdateTrialStatusInput = z.infer<typeof updateTrialStatusSchema>;
