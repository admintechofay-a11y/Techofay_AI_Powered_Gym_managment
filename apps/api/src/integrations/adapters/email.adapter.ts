import nodemailer from 'nodemailer';
import crypto from 'node:crypto';
import {
  type SendMessageResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IEmailAdapter } from '../interfaces.js';

export class MockEmailAdapter implements IEmailAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'email',
      name: 'Transactional Email',
      category: 'Communication',
      description: 'Transactional & alert emails via Mailpit / Simulated SMTP',
      status: this.getStatus(),
      provider: 'Mailpit (Local Inbox)',
      isMock: true,
      docsUrl: 'https://mailpit.axllent.org',
    };
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<SendMessageResult> {
    const messageId = `mock_mail_${crypto.randomUUID()}`;
    // Also try sending to local Mailpit on 1025 if running, otherwise log
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT) || 1025,
        secure: false,
        tls: { rejectUnauthorized: false },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@gymos.techofay.com',
        to,
        subject,
        html,
        text: text || subject,
      });
    } catch {
      // In-memory mock fallback
    }

    return {
      messageId,
      success: true,
      status: 'DELIVERED',
    };
  }
}

export class RealEmailAdapter implements IEmailAdapter {
  readonly isMock = false;
  private transporter: nodemailer.Transporter;

  constructor(options: { host: string; port: number; user?: string; pass?: string; secure?: boolean }) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure || false,
      auth: options.user && options.pass ? { user: options.user, pass: options.pass } : undefined,
    });
  }

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.REAL;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'email',
      name: 'Transactional Email',
      category: 'Communication',
      description: 'Production SMTP / Amazon SES Email Service',
      status: this.getStatus(),
      provider: 'Production SMTP',
      isMock: false,
    };
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<SendMessageResult> {
    const info = await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@gymos.techofay.com',
      to,
      subject,
      html,
      text: text || subject,
    });

    return {
      messageId: info.messageId,
      success: true,
      status: 'SENT',
    };
  }
}
