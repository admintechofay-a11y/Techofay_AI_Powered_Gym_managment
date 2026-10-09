import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Membership } from '../src/models/Membership.js';
import { Plan } from '../src/models/Plan.js';
import { Notification } from '../src/models/Notification.js';
import { Template } from '../src/models/Template.js';
import { Coupon } from '../src/models/Coupon.js';
import { runInContext } from '../src/context/requestContext.js';
import { communicationService } from '../src/services/communicationService.js';
import { schedulerService } from '../src/services/schedulerService.js';
import { marketingService } from '../src/services/marketingService.js';
import {
  COMMUNICATION_CHANNEL,
  NOTIFICATION_TYPE,
  NOTIFICATION_STATUS,
  WHATSAPP_TEMPLATE_STATUS,
  CAMPAIGN_TYPE,
  AUTOMATION_TRIGGER,
  SUBSCRIPTION_TIER,
  TENANT_STATUS,
} from '@gymos/shared';

describe('Phase 4: Communication & Marketing Automation Test Suite', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let memberId: string;
  let planId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-comm-test',
      contactEmail: 'contact@ironpulse-comm.org',
      contactPhone: '+919820011888',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'Bandra Flagship',
      code: 'BAN-COMM',
      address: 'Pali Hill, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+919820011887',
      email: 'bandra@ironpulse-comm.org',
    });
    branchId = branch._id.toString();

    const plan = await Plan.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Annual Elite Pass',
      code: 'ELITE-ANNUAL-COMM',
      type: 'ANNUAL',
      durationDays: 365,
      priceInPaise: 2499900,
      isActive: true,
    });
    planId = plan._id.toString();

    const today = new Date();
    const member = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'MEM-COMM-001',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: 'vikram.malhotra@ironpulse-comm.org',
      phone: '+919811122233',
      gender: 'MALE',
      dob: new Date(1994, today.getMonth(), today.getDate()), // Birthday is today!
      joinDate: new Date(2024, today.getMonth(), today.getDate()), // Anniversary is today!
      status: 'ACTIVE',
      fitnessGoals: ['Weight Loss', 'Hypertrophy'],
      notificationPreferences: {
        whatsapp: true,
        sms: true,
        email: true,
        push: true,
        inApp: true,
      },
    });
    memberId = member._id.toString();

    // Create an active membership expiring in 7 days
    const in7Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: member._id,
      planId: plan._id,
      startDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 7),
      endDate: in7Days,
      status: 'ACTIVE',
      totalAmountInPaise: 2499900,
      planSnapshot: {
        planId: plan._id.toString(),
        name: plan.name,
        durationDays: 365,
        priceInPaise: 2499900,
      },
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // ================= 1. NOTIFICATION ENGINE =================

  it('dispatches notifications with simulated labels and status for mock providers', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Disable quiet hours temporarily for this test
      communicationService.setQuietHours(tenantId, { enabled: false });

      // Send WhatsApp (uses MockWhatsAppAdapter)
      const res = await communicationService.sendNotification({
        tenantId,
        memberId,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.REMINDER,
        title: 'Workout Reminder',
        message: 'Your training session is scheduled for tomorrow at 7:00 AM.',
        isUrgent: true,
      });

      expect(res.success).toBe(true);
      expect(res.isSimulated).toBe(true);
      expect(res.status).toBe(NOTIFICATION_STATUS.DELIVERED);
      expect(res.notification).toBeDefined();
      expect(res.notification?.metadata?.simulatedLabel).toBe('simulated');
    });
  });

  it('queues non-urgent notifications during quiet hours', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Configure quiet hours covering current hour
      const now = new Date();
      const currentUtcHours = now.getUTCHours();
      const currentUtcMinutes = now.getUTCMinutes();
      const istHours = (currentUtcHours + 5 + Math.floor((currentUtcMinutes + 30) / 60)) % 24;

      communicationService.setQuietHours(tenantId, {
        enabled: true,
        startHour: istHours,
        endHour: (istHours + 2) % 24,
      });

      const res = await communicationService.sendNotification({
        tenantId,
        memberId,
        channel: COMMUNICATION_CHANNEL.SMS,
        type: NOTIFICATION_TYPE.PROMOTIONAL,
        title: 'Mid-Season Offer',
        message: 'Get 20% off on protein shakes this weekend!',
        isUrgent: false,
      });

      expect(res.status).toBe(NOTIFICATION_STATUS.QUEUED);
      expect(res.notification?.metadata?.isQueuedForQuietHours).toBe(true);
    });
  });

  it('honors member opt-outs and skips message delivery when disabled', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Opt-out member from SMS
      await communicationService.updateMemberPreferences(tenantId, memberId, {
        sms: false,
        whatsapp: true,
      });

      const res = await communicationService.sendNotification({
        tenantId,
        memberId,
        channel: COMMUNICATION_CHANNEL.SMS,
        title: 'Special SMS Notice',
        message: 'Test message that should be skipped',
      });

      expect(res.skipped).toBe(true);
      expect(res.reason).toContain('opted out of SMS');
    });
  });

  it('enforces idempotency and never sends duplicate messages with identical dedupeKey', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      communicationService.setQuietHours(tenantId, { enabled: false });
      const dedupeKey = `test:dedupe:key:${Date.now()}`;

      // First send
      const firstRes = await communicationService.sendNotification({
        tenantId,
        memberId,
        channel: COMMUNICATION_CHANNEL.IN_APP,
        title: 'Unique Security Alert',
        message: 'Password changed successfully',
        dedupeKey,
      });
      expect(firstRes.success).toBe(true);
      expect(firstRes.skipped).toBeUndefined();

      // Second send with same dedupeKey
      const secondRes = await communicationService.sendNotification({
        tenantId,
        memberId,
        channel: COMMUNICATION_CHANNEL.IN_APP,
        title: 'Unique Security Alert',
        message: 'Password changed successfully',
        dedupeKey,
      });
      expect(secondRes.skipped).toBe(true);
      expect(secondRes.reason).toContain('dedupeKey matched');

      // Verify only 1 record exists in database
      const count = await Notification.countDocuments({ tenantId, dedupeKey });
      expect(count).toBe(1);
    });
  });

  // ================= 2. TEMPLATE MANAGER =================

  it('manages templates with variable substitution, multi-language versions, and WhatsApp approval lifecycle', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const template = await communicationService.createTemplate(tenantId, {
        name: 'Welcome Member V1',
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        category: 'TRANSACTIONAL',
        subject: 'Welcome to {{gymName}}!',
        body: 'Hi {{memberName}}, welcome to {{gymName}}! Your membership is active until {{expiryDate}}.',
        variables: ['memberName', 'gymName', 'expiryDate'],
        languages: {
          en: {
            subject: 'Welcome to {{gymName}}!',
            body: 'Hi {{memberName}}, welcome to {{gymName}}! Your membership is active until {{expiryDate}}.',
          },
          hi: {
            subject: '{{gymName}} में आपका स्वागत है!',
            body: 'नमस्ते {{memberName}}, {{gymName}} में आपका स्वागत है! आपकी सदस्यता {{expiryDate}} तक सक्रिय है।',
          },
          gu: {
            subject: '{{gymName}} માં આપનું સ્વાગત છે!',
            body: 'નમસ્તે {{memberName}}, {{gymName}} માં આપનું સ્વાગત છે! તમારું સભ્યપદ {{expiryDate}} સુધી સક્રિય છે.',
          },
        },
        whatsAppApprovalStatus: WHATSAPP_TEMPLATE_STATUS.PENDING_APPROVAL,
      });

      expect(template._id).toBeDefined();
      expect(template.whatsAppApprovalStatus).toBe('PENDING_APPROVAL');

      // Render in English
      const renderedEn = communicationService.renderTemplate(template, {
        memberName: 'Vikram',
        gymName: 'IronPulse Mumbai',
        expiryDate: '15/10/2026',
      }, 'en');
      expect(renderedEn.body).toBe('Hi Vikram, welcome to IronPulse Mumbai! Your membership is active until 15/10/2026.');

      // Render in Hindi
      const renderedHi = communicationService.renderTemplate(template, {
        memberName: 'विक्रम',
        gymName: 'IronPulse',
        expiryDate: '15/10/2026',
      }, 'hi');
      expect(renderedHi.body).toContain('नमस्ते विक्रम');

      // Update approval status to APPROVED
      const updated = await communicationService.updateTemplate(tenantId, template._id.toString(), {
        whatsAppApprovalStatus: WHATSAPP_TEMPLATE_STATUS.APPROVED,
      });
      expect(updated?.whatsAppApprovalStatus).toBe('APPROVED');
    });
  });

  // ================= 3. BULLMQ / SCHEDULED JOBS =================

  it('exposes job dashboard status and executes 7-day membership expiry job idempotently', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      communicationService.setQuietHours(tenantId, { enabled: false });

      const dashboard = schedulerService.getDashboardStatus();
      expect(dashboard.jobs.length).toBe(11);
      expect(dashboard.counts.total).toBe(11);

      // Trigger membership-expiry-7d job
      const result = await schedulerService.triggerJob('membership-expiry-7d', tenantId);
      expect(result.success).toBe(true);
      expect(result.stats?.processed).toBeGreaterThan(0);
      expect(result.stats?.sent).toBeGreaterThan(0);

      // Running it again immediately should skip sending due to dedupe keys!
      const runAgain = await schedulerService.triggerJob('membership-expiry-7d', tenantId);
      expect(runAgain.stats?.sent).toBe(0);
      expect(runAgain.stats?.skipped).toBeGreaterThan(0);
    });
  });

  it('auto-generates birthday coupons with 20% discount and sends personalized greeting', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      communicationService.setQuietHours(tenantId, { enabled: false });

      const result = await schedulerService.triggerJob('birthday-auto-wishes', tenantId);
      expect(result.success).toBe(true);
      expect(result.stats?.processed).toBeGreaterThan(0);
      expect(result.stats?.sent).toBeGreaterThan(0);

      // Verify Coupon was automatically created
      const currentYear = new Date().getFullYear();
      const couponCode = `BDAY-MEM-COMM-001-${currentYear}`;
      const coupon = await Coupon.findOne({ tenantId, code: couponCode });

      expect(coupon).toBeDefined();
      expect(coupon?.discountType).toBe('PERCENTAGE');
      expect(coupon?.discountValue).toBe(20);
      expect(coupon?.isActive).toBe(true);

      // Verify birthday notification
      const notif = await Notification.findOne({
        tenantId,
        memberId,
        type: NOTIFICATION_TYPE.BIRTHDAY,
      });
      expect(notif).toBeDefined();
      expect(notif?.title).toContain('Happy Birthday');
      expect(notif?.message).toContain(couponCode);
    });
  });

  // ================= 4. AUDIENCE SEGMENTATION & AGGREGATION =================

  it('calculates live audience size using indexed MongoDB aggregation', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Calculate count for active members with Weight Loss goal and age 20-40
      const count = await marketingService.calculateAudienceCount(tenantId, {
        membershipStatus: ['ACTIVE'],
        fitnessGoals: ['Weight Loss'],
        minAge: 20,
        maxAge: 40,
      });

      expect(count).toBeGreaterThanOrEqual(1);

      // Save as Segment
      const segment = await marketingService.createSegment(tenantId, {
        name: 'Weight Loss Millennials',
        description: 'Active members focusing on fat loss',
        criteria: {
          membershipStatus: ['ACTIVE'],
          fitnessGoals: ['Weight Loss'],
          minAge: 20,
          maxAge: 40,
        },
      });

      expect(segment._id).toBeDefined();
      expect(segment.estimatedCount).toBe(count);
    });
  });

  // ================= 5. CAMPAIGN BUILDER & A/B TESTING =================

  it('creates marketing campaign with A/B variants, executes dispatches and tracks ROI metrics', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      communicationService.setQuietHours(tenantId, { enabled: false });

      const campaign = await marketingService.createCampaign(tenantId, {
        name: 'Diwali Fitness Fest 2026',
        type: CAMPAIGN_TYPE.FESTIVAL,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        abTestingEnabled: true,
        variants: [
          {
            variantId: 'A',
            subject: 'Diwali Special: Flat 30% Off',
            body: 'Hi {{memberName}}, celebrate Diwali with 30% off your annual renewal at {{gymName}}!',
            percentage: 50,
          },
          {
            variantId: 'B',
            subject: 'Festive Bonus: Free 3 Months',
            body: 'Hi {{memberName}}, get 3 months free on all renewals this festive season at {{gymName}}!',
            percentage: 50,
          },
        ],
      });

      expect(campaign._id).toBeDefined();
      expect(campaign.status).toBe('DRAFT');

      // Execute campaign
      const executed = await marketingService.executeCampaign(tenantId, campaign._id.toString());
      expect(executed.status).toBe('SENT');
      expect(executed.sentCount).toBeGreaterThan(0);
      expect(executed.deliveredCount).toBeGreaterThan(0);
      expect(executed.revenueGeneratedInPaise).toBeGreaterThan(0);
    });
  });

  // ================= 6. AUTOMATION RULES =================

  it('creates automation rules and evaluates conditions with run logs', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const rule = await marketingService.createAutomationRule(tenantId, {
        name: 'Welcome Inactive Member Auto-Engagement',
        trigger: AUTOMATION_TRIGGER.MEMBER_REGISTERED,
        conditions: [
          {
            field: 'status',
            operator: 'EQUALS',
            value: 'ACTIVE',
          },
        ],
        action: {
          type: 'SEND_WHATSAPP',
          channel: COMMUNICATION_CHANNEL.WHATSAPP,
          templateName: 'Welcome Member V1',
        },
        isActive: true,
      });

      expect(rule._id).toBeDefined();
      expect(rule.isActive).toBe(true);

      const evaluation = await marketingService.runRuleEvaluation(tenantId, rule._id.toString());
      expect(evaluation.success).toBe(true);
      expect(evaluation.matchedCount).toBeGreaterThan(0);

      const updatedRule = await marketingService.getAutomationRules(tenantId);
      const matched = updatedRule.find((r) => r._id.toString() === rule._id.toString());
      expect(matched?.executionCount).toBeGreaterThan(0);
      expect(matched?.logs.length).toBeGreaterThan(0);
      expect(matched?.logs[0].status).toBe('SUCCESS');
    });
  });
});
