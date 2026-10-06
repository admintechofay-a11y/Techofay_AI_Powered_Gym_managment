import { env } from '../config/env.js';
import type {
  IPaymentAdapter,
  IWhatsAppAdapter,
  ISmsAdapter,
  IEmailAdapter,
  IStorageAdapter,
  IPushAdapter,
  IAiAdapter,
  IBiometricAdapter,
} from './interfaces.js';
import { MockPaymentAdapter, RealRazorpayAdapter } from './adapters/payment.adapter.js';
import { MockWhatsAppAdapter, RealWhatsAppAdapter } from './adapters/whatsapp.adapter.js';
import { MockSmsAdapter, RealSmsAdapter } from './adapters/sms.adapter.js';
import { MockEmailAdapter, RealEmailAdapter } from './adapters/email.adapter.js';
import { MockStorageAdapter, RealStorageAdapter } from './adapters/storage.adapter.js';
import { MockPushAdapter, RealPushAdapter } from './adapters/push.adapter.js';
import { MockAiAdapter, RealAnthropicAiAdapter } from './adapters/ai.adapter.js';
import { MockBiometricAdapter, RealBiometricAdapter } from './adapters/biometric.adapter.js';
import type { IntegrationSummary } from '@gymos/shared';

class IntegrationRegistry {
  public payment: IPaymentAdapter;
  public whatsapp: IWhatsAppAdapter;
  public sms: ISmsAdapter;
  public email: IEmailAdapter;
  public storage: IStorageAdapter;
  public push: IPushAdapter;
  public ai: IAiAdapter;
  public biometric: IBiometricAdapter;

  constructor() {
    // 1. Payment
    if (env.PAYMENT_ADAPTER === 'real' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.payment = new RealRazorpayAdapter(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
    } else {
      this.payment = new MockPaymentAdapter();
    }

    // 2. WhatsApp
    if (env.WHATSAPP_ADAPTER === 'real' && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      this.whatsapp = new RealWhatsAppAdapter(process.env.WHATSAPP_PHONE_NUMBER_ID, process.env.WHATSAPP_ACCESS_TOKEN);
    } else {
      this.whatsapp = new MockWhatsAppAdapter();
    }

    // 3. SMS
    if (env.SMS_ADAPTER === 'real' && process.env.SMS_API_KEY) {
      this.sms = new RealSmsAdapter(process.env.SMS_API_KEY);
    } else {
      this.sms = new MockSmsAdapter();
    }

    // 4. Email
    if (env.EMAIL_ADAPTER === 'real' && process.env.SMTP_HOST) {
      this.email = new RealEmailAdapter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      });
    } else {
      this.email = new MockEmailAdapter();
    }

    // 5. Storage
    if (env.STORAGE_ADAPTER === 'real' && process.env.S3_ACCESS_KEY) {
      this.storage = new RealStorageAdapter();
    } else {
      this.storage = new MockStorageAdapter();
    }

    // 6. Push
    if (env.PUSH_ADAPTER === 'real' && process.env.VAPID_PUBLIC_KEY) {
      this.push = new RealPushAdapter();
    } else {
      this.push = new MockPushAdapter();
    }

    // 7. AI
    if (env.AI_ADAPTER === 'real' && process.env.ANTHROPIC_API_KEY) {
      this.ai = new RealAnthropicAiAdapter(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL);
    } else {
      this.ai = new MockAiAdapter();
    }

    // 8. Biometric
    if (env.BIOMETRIC_ADAPTER === 'real' && process.env.BIOMETRIC_DEVICE_IP) {
      this.biometric = new RealBiometricAdapter(process.env.BIOMETRIC_DEVICE_IP, Number(process.env.BIOMETRIC_DEVICE_PORT) || 4370);
    } else {
      this.biometric = new MockBiometricAdapter();
    }
  }

  public getSummaries(): IntegrationSummary[] {
    return [
      this.payment.getSummary(),
      this.whatsapp.getSummary(),
      this.sms.getSummary(),
      this.email.getSummary(),
      this.storage.getSummary(),
      this.push.getSummary(),
      this.ai.getSummary(),
      this.biometric.getSummary(),
    ];
  }
}

export const integrations = new IntegrationRegistry();
export * from './interfaces.js';
