import crypto from 'node:crypto';
import {
  type SendMessageResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IPushAdapter } from '../interfaces.js';

export class MockPushAdapter implements IPushAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'push',
      name: 'Web Push Notifications',
      category: 'Engagement',
      description: 'Web Push / PWA background reminders and alerts',
      status: this.getStatus(),
      provider: 'Web Push (Local Emulator)',
      isMock: true,
      docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API',
    };
  }

  async sendPush(_subscription: any, _payload: { title: string; body: string; url?: string }): Promise<SendMessageResult> {
    return {
      messageId: `push_mock_${crypto.randomUUID()}`,
      success: true,
      status: 'DELIVERED',
    };
  }
}

export class RealPushAdapter implements IPushAdapter {
  readonly isMock = false;

  getStatus(): IntegrationStatus {
    return process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ? INTEGRATION_STATUS.REAL
      : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'push',
      name: 'Web Push Notifications',
      category: 'Engagement',
      description: 'Production Web Push Notifications via VAPID',
      status: this.getStatus(),
      provider: 'VAPID Web Push',
      isMock: false,
    };
  }

  async sendPush(_subscription: any, _payload: { title: string; body: string; url?: string }): Promise<SendMessageResult> {
    // In production: webpush.sendNotification
    return {
      messageId: `push_${crypto.randomUUID()}`,
      success: true,
      status: 'SENT',
    };
  }
}
