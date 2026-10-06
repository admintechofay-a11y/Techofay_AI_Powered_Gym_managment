import { z } from 'zod';
import { MEMBER_STATUS } from '../constants/enums.js';

export const createMemberSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  firstName: z.string().min(2, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Valid phone number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string().min(2),
      phone: z.string().min(8),
      relation: z.string().min(2),
    })
    .optional(),
  medicalNotes: z.string().optional(),
  fitnessGoals: z.array(z.string()).default([]),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
