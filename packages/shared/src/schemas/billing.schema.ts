import { z } from 'zod';
import { PAYMENT_METHOD } from '../constants/enums.js';

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amountInPaise: z.number().int().positive('Payment amount must be positive paise'),
  method: z.nativeEnum(PAYMENT_METHOD),
  transactionRef: z.string().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key is required'),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const createRefundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amountInPaise: z.number().int().positive('Refund amount must be positive paise'),
  reason: z.string().min(5, 'Refund reason is required'),
  refundMethod: z.string().default('ORIGINAL_SOURCE'),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
