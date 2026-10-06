import type { IntegrationStatus } from '../constants/enums.js';

export type IntegrationType =
  | 'payments'
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'storage'
  | 'push'
  | 'ai'
  | 'biometric';

export interface IntegrationSummary {
  id: IntegrationType;
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  provider: string;
  isMock: boolean;
  configuredAt?: string;
  docsUrl?: string;
}

export interface PaymentOrderParams {
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amountInPaise: number;
  currency: string;
  status: string;
}

export interface SendMessageParams {
  to: string;
  subject?: string;
  body: string;
  templateId?: string;
  templateArgs?: Record<string, string>;
}

export interface SendMessageResult {
  messageId: string;
  success: boolean;
  status: string;
  error?: string;
}

export interface StorageUploadParams {
  key: string;
  buffer: Buffer | Uint8Array;
  contentType: string;
  acl?: 'private' | 'public-read';
}

export interface StorageUploadResult {
  key: string;
  url: string;
  sizeBytes: number;
}
