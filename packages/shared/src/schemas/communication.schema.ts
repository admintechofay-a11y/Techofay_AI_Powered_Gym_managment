import { z } from 'zod';
import { COMMUNICATION_CHANNEL, NOTIFICATION_TYPE, WHATSAPP_TEMPLATE_STATUS } from '../constants/enums.js';

export const sendNotificationSchema = z.object({
  channel: z.enum([
    COMMUNICATION_CHANNEL.IN_APP,
    COMMUNICATION_CHANNEL.WHATSAPP,
    COMMUNICATION_CHANNEL.SMS,
    COMMUNICATION_CHANNEL.EMAIL,
    COMMUNICATION_CHANNEL.PUSH,
  ]),
  type: z.enum([
    NOTIFICATION_TYPE.INFO,
    NOTIFICATION_TYPE.WARNING,
    NOTIFICATION_TYPE.SUCCESS,
    NOTIFICATION_TYPE.REMINDER,
    NOTIFICATION_TYPE.PROMOTIONAL,
    NOTIFICATION_TYPE.EXPIRY,
    NOTIFICATION_TYPE.PAYMENT,
    NOTIFICATION_TYPE.BIRTHDAY,
    NOTIFICATION_TYPE.ANNIVERSARY,
  ]).default(NOTIFICATION_TYPE.INFO),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  memberId: z.string().optional(),
  leadId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
  dedupeKey: z.string().optional(),
  isUrgent: z.boolean().default(false),
});

export const templateLanguageSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  channel: z.enum([
    COMMUNICATION_CHANNEL.IN_APP,
    COMMUNICATION_CHANNEL.WHATSAPP,
    COMMUNICATION_CHANNEL.SMS,
    COMMUNICATION_CHANNEL.EMAIL,
    COMMUNICATION_CHANNEL.PUSH,
  ]),
  triggerEvent: z.string().optional(),
  category: z.enum(['TRANSACTIONAL', 'MARKETING', 'OTP']).default('TRANSACTIONAL'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
  variables: z.array(z.string()).default([]),
  languages: z.object({
    en: templateLanguageSchema,
    hi: templateLanguageSchema.optional(),
    gu: templateLanguageSchema.optional(),
  }).optional(),
  whatsAppApprovalStatus: z.enum([
    WHATSAPP_TEMPLATE_STATUS.DRAFT,
    WHATSAPP_TEMPLATE_STATUS.PENDING_APPROVAL,
    WHATSAPP_TEMPLATE_STATUS.APPROVED,
    WHATSAPP_TEMPLATE_STATUS.REJECTED,
  ]).default(WHATSAPP_TEMPLATE_STATUS.DRAFT),
  whatsAppTemplateName: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const notificationPreferencesSchema = z.object({
  whatsapp: z.boolean().default(true),
  sms: z.boolean().default(true),
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
});

export const quietHoursSchema = z.object({
  enabled: z.boolean().default(true),
  startHour: z.number().min(0).max(23).default(21), // 9 PM
  endHour: z.number().min(0).max(23).default(8),   // 8 AM
  timezone: z.string().default('Asia/Kolkata'),
});

export type SendNotificationDTO = z.infer<typeof sendNotificationSchema>;
export type CreateTemplateDTO = z.infer<typeof createTemplateSchema>;
export type NotificationPreferencesDTO = z.infer<typeof notificationPreferencesSchema>;
export type QuietHoursDTO = z.infer<typeof quietHoursSchema>;
