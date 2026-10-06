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
