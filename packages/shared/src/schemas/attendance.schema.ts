import { z } from 'zod';
import { ATTENDANCE_METHOD } from '../constants/enums.js';

export const checkInSchema = z.object({
  identifier: z.string().min(1, 'Member code, phone or ID is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  method: z.nativeEnum(ATTENDANCE_METHOD).default(ATTENDANCE_METHOD.QR),
  deviceId: z.string().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
