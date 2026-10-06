import crypto from 'node:crypto';
import {
  type SendMessageResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IWhatsAppAdapter } from '../interfaces.js';

export class MockWhatsAppAdapter implements IWhatsAppAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'whatsapp',
      name: 'WhatsApp Business API',
      category: 'Communication',
      description: 'Meta Cloud API for automated notifications, renewals & lead chat',
      status: this.getStatus(),
      provider: 'Meta WhatsApp Business API (Simulated)',
      isMock: true,
      docsUrl: 'https://developers.facebook.com/docs/whatsapp',
    };
  }

  async sendTextMessage(_to: string, _message: string): Promise<SendMessageResult> {
    return {
      messageId: `wamid.mock_${crypto.randomUUID()}`,
      success: true,
      status: 'DELIVERED',
    };
  }

  async sendTemplateMessage(_to: string, _templateName: string, _parameters: Record<string, string>): Promise<SendMessageResult> {
    return {
      messageId: `wamid.mock_${crypto.randomUUID()}`,
      success: true,
      status: 'DELIVERED',
    };
  }
}

export class RealWhatsAppAdapter implements IWhatsAppAdapter {
  readonly isMock = false;
  private phoneId: string;
  private accessToken: string;

  constructor(phoneId: string, accessToken: string) {
    this.phoneId = phoneId;
    this.accessToken = accessToken;
  }

  getStatus(): IntegrationStatus {
    return this.phoneId && this.accessToken ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'whatsapp',
      name: 'WhatsApp Business API',
      category: 'Communication',
      description: 'Production Meta Cloud WhatsApp API',
      status: this.getStatus(),
      provider: 'Meta Cloud API',
      isMock: false,
    };
  }

  async sendTextMessage(to: string, message: string): Promise<SendMessageResult> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const data: any = await response.json();
    return {
      messageId: data.messages?.[0]?.id || 'error',
      success: response.ok,
      status: response.ok ? 'SENT' : 'FAILED',
    };
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: Record<string, string>): Promise<SendMessageResult> {
    const components = [
      {
        type: 'body',
        parameters: Object.values(parameters).map((text) => ({ type: 'text', text })),
      },
    ];

    const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components,
        },
      }),
    });

    const data: any = await response.json();
    return {
      messageId: data.messages?.[0]?.id || 'error',
      success: response.ok,
      status: response.ok ? 'SENT' : 'FAILED',
    };
  }
}
