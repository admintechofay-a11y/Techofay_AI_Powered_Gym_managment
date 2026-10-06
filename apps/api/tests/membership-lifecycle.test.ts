import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MembershipLifecycleService } from '../src/services/membershipLifecycleService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Plan } from '../src/models/Plan.js';
import { Membership } from '../src/models/Membership.js';
import { runInContext } from '../src/context/requestContext.js';
import { MEMBERSHIP_STATUS, SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('MembershipLifecycleService - Purchase, Freeze, Upgrade & Expiry Sweep', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let memberId: string;
  let standardPlanId: string;
  let annualPlanId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-lifecycle-test',
      contactEmail: 'contact@ironpulse-life.com',
      contactPhone: '+919820011231',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC03',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011232',
      email: 'bkc@ironpulse-life.com',
    });
    branchId = branch._id.toString();

    const member = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0201',
      firstName: 'Dev',
      lastName: 'Patel',
      email: 'dev.patel@example.test',
      phone: '+919899988877',
      gender: 'MALE',
      status: 'ACTIVE',
    });
    memberId = member._id.toString();

    const stdPlan = await Plan.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Monthly Standard',
      code: 'M-STD',
      type: 'MONTHLY',
      durationDays: 30,
      priceInPaise: 300000, // 3,000 INR
      isActive: true,
    });
    standardPlanId = stdPlan._id.toString();

    const annPlan = await Plan.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Annual VIP',
      code: 'Y-VIP',
      type: 'ANNUAL',
      durationDays: 365,
      priceInPaise: 2500000, // 25,000 INR
      isActive: true,
    });
    annualPlanId = annPlan._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('activates a new membership plan with correct dates and pricing', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const startDate = new Date('2026-05-01T00:00:00.000Z');
      const membership = await MembershipLifecycleService.buyPlan({
        tenantId,
        memberId,
        planId: standardPlanId,
        startDate,
        performedByUserId: 'admin-user-001',
      });

      expect(membership.status).toBe(MEMBERSHIP_STATUS.ACTIVE);
      expect(membership.startDate.toISOString().split('T')[0]).toBe('2026-05-01');
      expect(membership.endDate.toISOString().split('T')[0]).toBe('2026-05-31');
      expect(membership.totalAmountInPaise).toBe(300000);
    });
  });

  it('freezes an active membership and records reason', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const active = await Membership.findOne({ tenantId, memberId, status: MEMBERSHIP_STATUS.ACTIVE });
      expect(active).toBeDefined();

      const freezeResult = await MembershipLifecycleService.freezeMembership(
        tenantId,
        active!._id.toString(),
        'Orthopedic recovery rest',
        new Date('2026-05-10T00:00:00.000Z'),
        undefined,
        'staff-001',
      );

      expect(freezeResult.membership.status).toBe(MEMBERSHIP_STATUS.FROZEN);
      expect(freezeResult.freeze.reason).toBe('Orthopedic recovery rest');
    });
  });

  it('unfreezes membership and extends end date by frozen days', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const frozen = await Membership.findOne({ tenantId, memberId, status: MEMBERSHIP_STATUS.FROZEN });
      expect(frozen).toBeDefined();

      // Resume 10 days later: 2026-05-20
      const unfreezeResult = await MembershipLifecycleService.unfreezeMembership(
        tenantId,
        frozen!._id.toString(),
        new Date('2026-05-20T00:00:00.000Z'),
        'staff-001',
      );

      expect(unfreezeResult.frozenDays).toBe(10);
      expect(unfreezeResult.membership.status).toBe(MEMBERSHIP_STATUS.ACTIVE);
      // Original 2026-05-31 + 10 days = 2026-06-10
      expect(unfreezeResult.newEndDate.getDate()).toBe(10);
      expect(unfreezeResult.newEndDate.getMonth()).toBe(5); // June
    });
  });

  it('upgrades plan with prorated credit calculation', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const active = await Membership.findOne({ tenantId, memberId, status: MEMBERSHIP_STATUS.ACTIVE });
      expect(active).toBeDefined();

      const upgradeResult = await MembershipLifecycleService.changePlanWithProration(
        tenantId,
        active!._id.toString(),
        annualPlanId,
        new Date('2026-05-25T00:00:00.000Z'),
        'staff-001',
      );

      expect(upgradeResult.unconsumedCreditInPaise).toBeGreaterThan(0);
      expect(upgradeResult.newMembership.status).toBe(MEMBERSHIP_STATUS.ACTIVE);
      expect(upgradeResult.previousMembership.status).toBe('CANCELLED');
    });
  });

  it('executes midnight expiry sweep transition correctly', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Create an expired membership that has not yet transitioned
      const oldStartDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const oldEndDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      await Membership.create({
        tenantId,
        branchId,
        memberId,
        planId: standardPlanId,
        startDate: oldStartDate,
        endDate: oldEndDate,
        status: MEMBERSHIP_STATUS.ACTIVE, // still marked active before sweep
        totalAmountInPaise: 300000,
        paidAmountInPaise: 300000,
        balanceInPaise: 0,
      });

      const sweepResult = await MembershipLifecycleService.runAutomatedExpiryJob(tenantId);
      expect(sweepResult.expiredCount).toBeGreaterThanOrEqual(1);

      const postSweep = await Membership.find({
        tenantId,
        endDate: { $lt: new Date() },
        status: MEMBERSHIP_STATUS.ACTIVE,
      });
      expect(postSweep.length).toBe(0);
    });
  });
});
