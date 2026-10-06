import { integrations } from '../src/integrations/index.js';
import { INTEGRATION_STATUS } from '@gymos/shared';

describe('Integration Framework Adapters & Status Suite', () => {
  test('1. Integration registry lists all 8 supported third-party services', () => {
    const list = integrations.getSummaries();
    expect(list.length).toBe(8);

    const ids = list.map((i) => i.id);
    expect(ids).toContain('payments');
    expect(ids).toContain('whatsapp');
    expect(ids).toContain('sms');
    expect(ids).toContain('email');
    expect(ids).toContain('storage');
    expect(ids).toContain('push');
    expect(ids).toContain('ai');
    expect(ids).toContain('biometric');

    // In default dev mode without external keys, all adapters run in DEMO_MODE
    list.forEach((item) => {
      expect([INTEGRATION_STATUS.DEMO_MODE, INTEGRATION_STATUS.REAL]).toContain(item.status);
    });
  });

  test('2. Payment adapter creates orders and processes refunds safely', async () => {
    const order = await integrations.payment.createOrder({
      amountInPaise: 250000,
      currency: 'INR',
      receipt: 'test_rcpt_999',
    });
    expect(order.orderId).toBeDefined();
    expect(order.amountInPaise).toBe(250000);

    const refund = await integrations.payment.processRefund('pay_mock_123', 50000, 'Customer requested');
    expect(refund.success).toBe(true);
    expect(refund.refundId).toBeDefined();
  });

  test('3. AI adapter performs rule-based lead scoring and retention prediction', async () => {
    const leadScoreHot = await integrations.ai.scoreLead({
      name: 'Vikas Gupta',
      source: 'WALK_IN',
      activitiesCount: 3,
    });
    expect(leadScoreHot.score).toBe('HOT');

    const leadScoreCold = await integrations.ai.scoreLead({
      name: 'Ritu Sen',
      source: 'WEBSITE',
      activitiesCount: 0,
    });
    expect(leadScoreCold.score).toBe('COLD');

    const churnHigh = await integrations.ai.predictChurnRisk({
      attendanceCountLast30Days: 1,
      daysSinceLastVisit: 20,
      membershipDaysRemaining: 15,
    });
    expect(churnHigh.riskLevel).toBe('HIGH');
  });

  test('4. Storage adapter handles local upload and URL generation', async () => {
    const result = await integrations.storage.uploadFile({
      key: 'members/photo_001.png',
      buffer: Buffer.from('mock_image_bytes'),
      contentType: 'image/png',
    });
    expect(result.url).toBeDefined();
    expect(result.sizeBytes).toBeGreaterThan(0);
  });
});
