import {
  type PaymentOrderParams,
  type PaymentOrderResult,
  type SendMessageParams,
  type SendMessageResult,
  type StorageUploadParams,
  type StorageUploadResult,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';

export interface IBaseAdapter {
  readonly isMock: boolean;
  getStatus(): IntegrationStatus;
  getSummary(): IntegrationSummary;
}

export interface IPaymentAdapter extends IBaseAdapter {
  createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean>;
  processRefund(paymentId: string, amountInPaise: number, reason: string): Promise<{ refundId: string; success: boolean }>;
}

export interface IWhatsAppAdapter extends IBaseAdapter {
  sendTextMessage(to: string, message: string): Promise<SendMessageResult>;
  sendTemplateMessage(to: string, templateName: string, parameters: Record<string, string>): Promise<SendMessageResult>;
}

export interface ISmsAdapter extends IBaseAdapter {
  sendSms(to: string, message: string): Promise<SendMessageResult>;
}

export interface IEmailAdapter extends IBaseAdapter {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<SendMessageResult>;
}

export interface IStorageAdapter extends IBaseAdapter {
  uploadFile(params: StorageUploadParams): Promise<StorageUploadResult>;
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<boolean>;
}

export interface IPushAdapter extends IBaseAdapter {
  sendPush(subscription: any, payload: { title: string; body: string; url?: string }): Promise<SendMessageResult>;
}

export interface IAiAdapter extends IBaseAdapter {
  scoreLead(lead: { name: string; source: string; notes?: string; activitiesCount: number }): Promise<{ score: 'HOT' | 'WARM' | 'COLD'; reasoning: string }>;
  predictChurnRisk(member: { attendanceCountLast30Days: number; daysSinceLastVisit: number; membershipDaysRemaining: number }): Promise<{ riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; recommendedAction: string }>;
  generateFollowUpMessage(lead: { name: string; interest: string }): Promise<string>;
}

export interface IBiometricAdapter extends IBaseAdapter {
  syncLogs(): Promise<Array<{ deviceId: string; userId: string; timestamp: Date }>>;
  pingDevice(): Promise<{ connected: boolean; latencyMs: number }>;
}
