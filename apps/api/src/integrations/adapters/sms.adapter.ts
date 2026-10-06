import crypto from 'node:crypto';
import {
  type SendMessageResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { ISmsAdapter } from '../interfaces.js';

export class MockSmsAdapter implements ISmsAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'sms',
      name: 'SMS Gateway',
      category: 'Communication',
      description: 'DLT-registered transactional SMS gateway (Fast2SMS / Twilio)',
      status: this.getStatus(),
      provider: 'Fast2SMS / Twilio (Sandbox Simulator)',
      isMock: true,
      docsUrl: 'https://www.fast2sms.com/docs',
    };
  }

  async sendSms(_to: string, _message: string): Promise<SendMessageResult> {
    return {
      messageId: `sms_mock_${crypto.randomUUID()}`,
      success: true,
      status: 'DELIVERED',
    };
  }
}

export class RealSmsAdapter implements ISmsAdapter {
  readonly isMock = false;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getStatus(): IntegrationStatus {
    return this.apiKey ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'sms',
      name: 'SMS Gateway',
      category: 'Communication',
      description: 'Production Fast2SMS / Twilio Gateway',
      status: this.getStatus(),
      provider: 'Fast2SMS DLT',
      isMock: false,
    };
  }

  async sendSms(to: string, message: string): Promise<SendMessageResult> {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: process.env.SMS_SENDER_ID || 'FTOP',
        message,
        language: 'english',
        flash: 0,
        numbers: to,
      }),
    });

    const data: any = await response.json();
    return {
      messageId: data.request_id || 'sms_req',
      success: response.ok && data.return === true,
      status: response.ok ? 'SENT' : 'FAILED',
    };
  }
}
