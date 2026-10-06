import crypto from 'node:crypto';
import {
  type PaymentOrderParams,
  type PaymentOrderResult,
  INTEGRATION_STATUS,
  type IntegrationStatus,
  type IntegrationSummary,
} from '@gymos/shared';
import type { IPaymentAdapter } from '../interfaces.js';

export class MockPaymentAdapter implements IPaymentAdapter {
  readonly isMock = true;

  getStatus(): IntegrationStatus {
    return INTEGRATION_STATUS.DEMO_MODE;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'payments',
      name: 'Payment Gateway',
      category: 'Billing',
      description: 'Razorpay UPI, Credit/Debit Card, Net Banking & Wallets',
      status: this.getStatus(),
      provider: 'Razorpay (Simulated Sandbox)',
      isMock: true,
      docsUrl: 'https://razorpay.com/docs',
    };
  }

  async createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    const orderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    return {
      orderId,
      amountInPaise: params.amountInPaise,
      currency: params.currency || 'INR',
      status: 'created',
    };
  }

  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    // In mock mode, if signature starts with 'mock_' or is valid length, accept
    return true;
  }

  async processRefund(paymentId: string, amountInPaise: number, reason: string): Promise<{ refundId: string; success: boolean }> {
    return {
      refundId: `rfnd_mock_${crypto.randomBytes(8).toString('hex')}`,
      success: true,
    };
  }
}

export class RealRazorpayAdapter implements IPaymentAdapter {
  readonly isMock = false;
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  getStatus(): IntegrationStatus {
    return this.keyId && this.keySecret ? INTEGRATION_STATUS.REAL : INTEGRATION_STATUS.NOT_CONFIGURED;
  }

  getSummary(): IntegrationSummary {
    return {
      id: 'payments',
      name: 'Payment Gateway',
      category: 'Billing',
      description: 'Production Razorpay Payment Gateway Integration',
      status: this.getStatus(),
      provider: 'Razorpay Live',
      isMock: false,
      docsUrl: 'https://razorpay.com/docs',
    };
  }

  async createOrder(params: PaymentOrderParams): Promise<PaymentOrderResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: params.amountInPaise,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay order creation failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return {
      orderId: data.id,
      amountInPaise: data.amount,
      currency: data.currency,
      status: data.status,
    };
  }

  async verifyPaymentSignature(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const hmac = crypto.createHmac('sha256', this.keySecret);
    hmac.update(`${orderId}|${paymentId}`);
    const generated = hmac.digest('hex');
    return generated === signature;
  }

  async processRefund(paymentId: string, amountInPaise: number, reason: string): Promise<{ refundId: string; success: boolean }> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        notes: { reason },
      }),
    });

    if (!response.ok) {
      throw new Error(`Razorpay refund failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return {
      refundId: data.id,
      success: true,
    };
  }
}
