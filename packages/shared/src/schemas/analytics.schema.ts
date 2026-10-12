import { z } from 'zod';
import { REPORT_FORMAT, REPORT_TYPE, SCHEDULE_FREQUENCY } from '../constants/enums.js';

export const NaturalLanguageReportQuerySchema = z
  .object({
    query: z.string().min(3).max(1000).optional(),
    question: z.string().min(3).max(1000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    branchId: z.string().optional(),
  })
  .refine((data) => !!(data.query || data.question), {
    message: 'Either query or question is required',
  });
export type NaturalLanguageReportQuery = z.infer<typeof NaturalLanguageReportQuerySchema>;

export const ChatbotQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  branchId: z.string().optional(),
  memberId: z.string().optional(),
  leadId: z.string().optional(),
});
export type ChatbotQuery = z.infer<typeof ChatbotQuerySchema>;

export const ChurnPredictionQuerySchema = z.object({
  memberId: z.string().optional(),
  branchId: z.string().optional(),
  riskLevel: z.enum(['HIGH', 'MEDIUM', 'LOW', 'ALL']).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});
export type ChurnPredictionQuery = z.infer<typeof ChurnPredictionQuerySchema>;

export const LeadScoreQuerySchema = z.object({
  leadId: z.string(),
});
export type LeadScoreQuery = z.infer<typeof LeadScoreQuerySchema>;

export const FollowUpGenSchema = z.object({
  leadId: z.string().optional(),
  memberId: z.string().optional(),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).optional().default('WHATSAPP'),
  customContext: z.string().optional(),
});
export type FollowUpGen = z.infer<typeof FollowUpGenSchema>;

export const SuggestWorkoutSchema = z.object({
  memberId: z.string(),
  daysPerWeek: z.number().min(1).max(7).default(4),
  focusGoal: z.string().min(2),
  fitnessLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
});
export type SuggestWorkout = z.infer<typeof SuggestWorkoutSchema>;

export const SuggestDietSchema = z.object({
  memberId: z.string(),
  calorieTarget: z.number().min(800).max(5000).optional(),
  dietaryPreference: z.enum(['VEGETARIAN', 'EGGITARIAN', 'NON_VEGETARIAN', 'VEGAN', 'JAIN']).default('VEGETARIAN'),
  goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'ENDURANCE']).default('WEIGHT_LOSS'),
});
export type SuggestDiet = z.infer<typeof SuggestDietSchema>;

export const ExportReportSchema = z.object({
  reportType: z.enum([
    REPORT_TYPE.MEMBER,
    REPORT_TYPE.MEMBERSHIP,
    REPORT_TYPE.REVENUE,
    REPORT_TYPE.PAYMENT,
    REPORT_TYPE.ATTENDANCE,
    REPORT_TYPE.TRAINER,
    REPORT_TYPE.PT,
    REPORT_TYPE.LEAD,
    REPORT_TYPE.CONVERSION,
    REPORT_TYPE.RENEWAL,
    REPORT_TYPE.CHURN,
    REPORT_TYPE.EXPENSE,
  ]),
  format: z.enum([REPORT_FORMAT.PDF, REPORT_FORMAT.EXCEL, REPORT_FORMAT.CSV]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  branchId: z.string().optional(),
});
export type ExportReport = z.infer<typeof ExportReportSchema>;

export const CreateScheduledReportSchema = z.object({
  reportType: z.enum([
    REPORT_TYPE.MEMBER,
    REPORT_TYPE.MEMBERSHIP,
    REPORT_TYPE.REVENUE,
    REPORT_TYPE.PAYMENT,
    REPORT_TYPE.ATTENDANCE,
    REPORT_TYPE.TRAINER,
    REPORT_TYPE.PT,
    REPORT_TYPE.LEAD,
    REPORT_TYPE.CONVERSION,
    REPORT_TYPE.RENEWAL,
    REPORT_TYPE.CHURN,
    REPORT_TYPE.EXPENSE,
  ]),
  frequency: z.enum([
    SCHEDULE_FREQUENCY.DAILY,
    SCHEDULE_FREQUENCY.WEEKLY,
    SCHEDULE_FREQUENCY.MONTHLY,
  ]),
  recipients: z.array(z.string().email()).min(1),
  format: z.enum([REPORT_FORMAT.PDF, REPORT_FORMAT.EXCEL, REPORT_FORMAT.CSV]).default(REPORT_FORMAT.PDF),
  branchId: z.string().optional(),
});
export type CreateScheduledReport = z.infer<typeof CreateScheduledReportSchema>;
