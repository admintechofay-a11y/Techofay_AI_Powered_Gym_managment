import { z } from 'zod';
import {
  COMMUNICATION_CHANNEL,
  CAMPAIGN_TYPE,
  CAMPAIGN_STATUS,
  AUTOMATION_TRIGGER,
} from '../constants/enums.js';

export const campaignVariantSchema = z.object({
  variantId: z.enum(['A', 'B']),
  subject: z.string().optional(),
  body: z.string().min(1, 'Variant body is required'),
  percentage: z.number().min(1).max(100).default(50),
});

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name is required'),
  type: z.enum([
    CAMPAIGN_TYPE.WELCOME,
    CAMPAIGN_TYPE.RENEWAL,
    CAMPAIGN_TYPE.WIN_BACK,
    CAMPAIGN_TYPE.FESTIVAL,
    CAMPAIGN_TYPE.REFERRAL,
    CAMPAIGN_TYPE.TRIAL,
    CAMPAIGN_TYPE.BIRTHDAY,
  ]),
  channel: z.enum([
    COMMUNICATION_CHANNEL.WHATSAPP,
    COMMUNICATION_CHANNEL.SMS,
    COMMUNICATION_CHANNEL.EMAIL,
    COMMUNICATION_CHANNEL.PUSH,
    COMMUNICATION_CHANNEL.IN_APP,
  ]),
  segmentId: z.string().optional(),
  templateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  abTestingEnabled: z.boolean().default(false),
  variants: z.array(campaignVariantSchema).optional(),
  couponId: z.string().optional(),
});

export const segmentCriteriaSchema = z.object({
  membershipStatus: z.array(z.string()).optional(),
  minAttendance: z.number().min(0).optional(),
  maxAttendance: z.number().min(0).optional(),
  minAge: z.number().min(10).max(100).optional(),
  maxAge: z.number().min(10).max(100).optional(),
  branchId: z.string().optional(),
  minSpendInPaise: z.number().min(0).optional(),
  maxSpendInPaise: z.number().min(0).optional(),
  inactivityDays: z.number().min(0).optional(),
  fitnessGoals: z.array(z.string()).optional(),
  leadStatus: z.array(z.string()).optional(),
});

export const createSegmentSchema = z.object({
  name: z.string().min(2, 'Segment name is required'),
  description: z.string().optional(),
  criteria: segmentCriteriaSchema,
});

export const automationRuleConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN']),
  value: z.any(),
});

export const automationRuleActionSchema = z.object({
  type: z.enum([
    'SEND_NOTIFICATION',
    'SEND_WHATSAPP',
    'SEND_SMS',
    'SEND_EMAIL',
    'CREATE_COUPON',
    'CREATE_STAFF_TASK',
  ]),
  channel: z.enum([
    COMMUNICATION_CHANNEL.WHATSAPP,
    COMMUNICATION_CHANNEL.SMS,
    COMMUNICATION_CHANNEL.EMAIL,
    COMMUNICATION_CHANNEL.PUSH,
    COMMUNICATION_CHANNEL.IN_APP,
  ]).optional(),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
  couponConfig: z.object({
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive(),
    validDays: z.number().min(1).default(14),
  }).optional(),
});

export const createAutomationRuleSchema = z.object({
  name: z.string().min(2, 'Rule name is required'),
  trigger: z.enum([
    AUTOMATION_TRIGGER.MEMBER_REGISTERED,
    AUTOMATION_TRIGGER.MEMBERSHIP_EXPIRING_7_DAYS,
    AUTOMATION_TRIGGER.MEMBERSHIP_EXPIRING_3_DAYS,
    AUTOMATION_TRIGGER.MEMBERSHIP_EXPIRING_1_DAY,
    AUTOMATION_TRIGGER.MEMBERSHIP_EXPIRED,
    AUTOMATION_TRIGGER.ATTENDANCE_INACTIVE_7_DAYS,
    AUTOMATION_TRIGGER.ATTENDANCE_INACTIVE_14_DAYS,
    AUTOMATION_TRIGGER.PAYMENT_DUE,
    AUTOMATION_TRIGGER.TRIAL_COMPLETED,
    AUTOMATION_TRIGGER.BIRTHDAY_TODAY,
    AUTOMATION_TRIGGER.ANNIVERSARY_TODAY,
  ]),
  conditions: z.array(automationRuleConditionSchema).default([]),
  action: automationRuleActionSchema,
  isActive: z.boolean().default(true),
});

export type CreateCampaignDTO = z.infer<typeof createCampaignSchema>;
export type SegmentCriteriaDTO = z.infer<typeof segmentCriteriaSchema>;
export type CreateSegmentDTO = z.infer<typeof createSegmentSchema>;
export type CreateAutomationRuleDTO = z.infer<typeof createAutomationRuleSchema>;
