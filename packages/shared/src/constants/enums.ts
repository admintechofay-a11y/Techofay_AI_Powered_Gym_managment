export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  TRIAL: 'TRIAL',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;
export type TenantStatus = (typeof TENANT_STATUS)[keyof typeof TENANT_STATUS];

export const SUBSCRIPTION_TIER = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export interface TierLimitConfig {
  maxBranches: number;
  maxMembers: number;
  maxStaff: number;
  dailyAiCalls: number;
  monthlyMessages: number;
  pricePerMonthInPaise: number;
  monthlyPriceInPaise: number;
  yearlyPriceInPaise: number;
  maxAiCallsPerDay: number;
  maxMessagesPerMonth: number;
  features: string[];
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimitConfig> = {
  [SUBSCRIPTION_TIER.STARTER]: {
    maxBranches: 1,
    maxMembers: 500,
    maxStaff: 5,
    dailyAiCalls: 100,
    monthlyMessages: 1000,
    pricePerMonthInPaise: 499900, // ₹4,999
    monthlyPriceInPaise: 499900,
    yearlyPriceInPaise: 4999000,
    maxAiCallsPerDay: 100,
    maxMessagesPerMonth: 1000,
    features: ['Single Branch', 'Member Management', 'Basic AI Mode', 'SMS & WhatsApp Notifications', 'Standard Reports'],
  },
  [SUBSCRIPTION_TIER.PROFESSIONAL]: {
    maxBranches: 3,
    maxMembers: 2500,
    maxStaff: 20,
    dailyAiCalls: 500,
    monthlyMessages: 10000,
    pricePerMonthInPaise: 1499900, // ₹14,999
    monthlyPriceInPaise: 1499900,
    yearlyPriceInPaise: 14999000,
    maxAiCallsPerDay: 500,
    maxMessagesPerMonth: 10000,
    features: ['Up to 3 Branches', 'Multi-Branch Comparison', 'Advanced AI & Claude', 'A/B Campaigns', 'Custom Domain', 'Biometric Turnstiles'],
  },
  [SUBSCRIPTION_TIER.ENTERPRISE]: {
    maxBranches: 999,
    maxMembers: 999999,
    maxStaff: 100,
    dailyAiCalls: 5000,
    monthlyMessages: 100000,
    pricePerMonthInPaise: 3999900, // ₹39,999
    monthlyPriceInPaise: 3999900,
    yearlyPriceInPaise: 39999000,
    maxAiCallsPerDay: 5000,
    maxMessagesPerMonth: 100000,
    features: ['Unlimited Branches', 'Unlimited Members', 'Dedicated Account Manager', 'White-Label Branding', 'Priority 24/7 SLA', 'Custom ERP Integrations'],
  },
};

export const MEMBER_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const PLAN_TYPE = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  ANNUAL: 'ANNUAL',
  CUSTOM: 'CUSTOM',
  TRIAL: 'TRIAL',
  COUPLE: 'COUPLE',
  FAMILY: 'FAMILY',
  CORPORATE: 'CORPORATE',
} as const;
export type PlanType = (typeof PLAN_TYPE)[keyof typeof PLAN_TYPE];

export const MEMBERSHIP_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  FROZEN: 'FROZEN',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[keyof typeof MEMBERSHIP_STATUS];

export const ATTENDANCE_METHOD = {
  QR: 'QR',
  MEMBER_ID: 'MEMBER_ID',
  MOBILE: 'MOBILE',
  BIOMETRIC: 'BIOMETRIC',
  RFID: 'RFID',
  MANUAL: 'MANUAL',
} as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHOD)[keyof typeof ATTENDANCE_METHOD];

export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  NET_BANKING: 'NET_BANKING',
  RAZORPAY: 'RAZORPAY',
  WALLET: 'WALLET',
} as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESSFUL: 'SUCCESSFUL',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const LEAD_PIPELINE_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  TRIAL_BOOKED: 'TRIAL_BOOKED',
  TRIAL_COMPLETED: 'TRIAL_COMPLETED',
  CONVERTED: 'CONVERTED',
  LOST: 'LOST',
} as const;
export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUS)[keyof typeof LEAD_PIPELINE_STATUS];
export const LEAD_STATUS = LEAD_PIPELINE_STATUS;
export type LeadStatus = LeadPipelineStatus;

export const LEAD_SCORE = {
  HOT: 'HOT',
  WARM: 'WARM',
  COLD: 'COLD',
} as const;
export type LeadScore = (typeof LEAD_SCORE)[keyof typeof LEAD_SCORE];

export const LEAD_SOURCE = {
  WEBSITE: 'WEBSITE',
  GOOGLE: 'GOOGLE',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  WHATSAPP: 'WHATSAPP',
  WALK_IN: 'WALK_IN',
  REFERRAL: 'REFERRAL',
  ADS: 'ADS',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

export const COMMUNICATION_CHANNEL = {
  IN_APP: 'IN_APP',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
} as const;
export type CommunicationChannel = (typeof COMMUNICATION_CHANNEL)[keyof typeof COMMUNICATION_CHANNEL];

export const INTEGRATION_STATUS = {
  REAL: 'REAL',
  DEMO_MODE: 'DEMO_MODE',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
} as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUS)[keyof typeof INTEGRATION_STATUS];

export const NOTIFICATION_STATUS = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  READ: 'READ',
} as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export const NOTIFICATION_TYPE = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  SUCCESS: 'SUCCESS',
  REMINDER: 'REMINDER',
  PROMOTIONAL: 'PROMOTIONAL',
  EXPIRY: 'EXPIRY',
  PAYMENT: 'PAYMENT',
  BIRTHDAY: 'BIRTHDAY',
  ANNIVERSARY: 'ANNIVERSARY',
} as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const WHATSAPP_TEMPLATE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type WhatsAppTemplateStatus = (typeof WHATSAPP_TEMPLATE_STATUS)[keyof typeof WHATSAPP_TEMPLATE_STATUS];

export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_TYPE = {
  WELCOME: 'WELCOME',
  RENEWAL: 'RENEWAL',
  WIN_BACK: 'WIN_BACK',
  FESTIVAL: 'FESTIVAL',
  REFERRAL: 'REFERRAL',
  TRIAL: 'TRIAL',
  BIRTHDAY: 'BIRTHDAY',
} as const;
export type CampaignType = (typeof CAMPAIGN_TYPE)[keyof typeof CAMPAIGN_TYPE];

export const AUTOMATION_TRIGGER = {
  MEMBER_REGISTERED: 'MEMBER_REGISTERED',
  MEMBERSHIP_EXPIRING_7_DAYS: 'MEMBERSHIP_EXPIRING_7_DAYS',
  MEMBERSHIP_EXPIRING_3_DAYS: 'MEMBERSHIP_EXPIRING_3_DAYS',
  MEMBERSHIP_EXPIRING_1_DAY: 'MEMBERSHIP_EXPIRING_1_DAY',
  MEMBERSHIP_EXPIRED: 'MEMBERSHIP_EXPIRED',
  ATTENDANCE_INACTIVE_7_DAYS: 'ATTENDANCE_INACTIVE_7_DAYS',
  ATTENDANCE_INACTIVE_14_DAYS: 'ATTENDANCE_INACTIVE_14_DAYS',
  PAYMENT_DUE: 'PAYMENT_DUE',
  TRIAL_COMPLETED: 'TRIAL_COMPLETED',
  BIRTHDAY_TODAY: 'BIRTHDAY_TODAY',
  ANNIVERSARY_TODAY: 'ANNIVERSARY_TODAY',
} as const;
export type AutomationTrigger = (typeof AUTOMATION_TRIGGER)[keyof typeof AUTOMATION_TRIGGER];

export const AI_MODE = {
  BASIC: 'BASIC',
  CLAUDE: 'CLAUDE',
} as const;
export type AiMode = (typeof AI_MODE)[keyof typeof AI_MODE];

export const AI_FEATURE = {
  CHURN_PREDICTION: 'CHURN_PREDICTION',
  LEAD_SCORING: 'LEAD_SCORING',
  FOLLOW_UP_GEN: 'FOLLOW_UP_GEN',
  NATURAL_LANGUAGE_REPORT: 'NATURAL_LANGUAGE_REPORT',
  WORKOUT_SUGGESTION: 'WORKOUT_SUGGESTION',
  DIET_SUGGESTION: 'DIET_SUGGESTION',
  CHATBOT: 'CHATBOT',
} as const;
export type AiFeature = (typeof AI_FEATURE)[keyof typeof AI_FEATURE];

export const CHURN_RISK_LEVEL = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type ChurnRiskLevel = (typeof CHURN_RISK_LEVEL)[keyof typeof CHURN_RISK_LEVEL];

export const REPORT_TYPE = {
  MEMBER: 'MEMBER',
  MEMBERSHIP: 'MEMBERSHIP',
  REVENUE: 'REVENUE',
  PAYMENT: 'PAYMENT',
  ATTENDANCE: 'ATTENDANCE',
  TRAINER: 'TRAINER',
  PT: 'PT',
  LEAD: 'LEAD',
  CONVERSION: 'CONVERSION',
  RENEWAL: 'RENEWAL',
  CHURN: 'CHURN',
  EXPENSE: 'EXPENSE',
} as const;
export type ReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

export const REPORT_FORMAT = {
  PDF: 'PDF',
  EXCEL: 'EXCEL',
  CSV: 'CSV',
} as const;
export type ReportFormat = (typeof REPORT_FORMAT)[keyof typeof REPORT_FORMAT];

export const SCHEDULE_FREQUENCY = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCY)[keyof typeof SCHEDULE_FREQUENCY];

