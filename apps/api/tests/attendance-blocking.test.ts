import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AttendanceService } from '../src/services/attendanceService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Membership } from '../src/models/Membership.js';
import { Plan } from '../src/models/Plan.js';
import { runInContext } from '../src/context/requestContext.js';
import { MEMBER_STATUS, MEMBERSHIP_STATUS, SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('AttendanceService - Gate Access Rules & Live Occupancy', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let activeMemberId: string;
  let expiredMemberId: string;
  let suspendedMemberId: string;
  let frozenMemberId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-attendance-test',
      contactEmail: 'contact@ironpulse-att.com',
      contactPhone: '+919820011228',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC02',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011229',
      email: 'bkc@ironpulse-att.com',
    });
    branchId = branch._id.toString();

    const plan = await Plan.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Standard Monthly',
      code: 'M-STD',
      type: 'MONTHLY',
      durationDays: 30,
      priceInPaise: 250000,
      isActive: true,
    });

    // 1. Active Member
    const activeMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0101',
      firstName: 'Ananya',
      lastName: 'Pandey',
      email: 'ananya@example.test',
      phone: '+919811122233',
      gender: 'FEMALE',
      status: MEMBER_STATUS.ACTIVE,
    });
    activeMemberId = activeMember._id.toString();

    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: activeMember._id,
      planId: plan._id,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days ahead
      status: MEMBERSHIP_STATUS.ACTIVE,
      totalAmountInPaise: 250000,
      paidAmountInPaise: 250000,
      balanceInPaise: 0,
    });

    // 2. Expired Member
    const expiredMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0102',
      firstName: 'Rohit',
      lastName: 'Verma',
      email: 'rohit@example.test',
      phone: '+919822233344',
      gender: 'MALE',
      status: MEMBER_STATUS.ACTIVE,
    });
    expiredMemberId = expiredMember._id.toString();

    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: expiredMember._id,
      planId: plan._id,
      startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago
      status: MEMBERSHIP_STATUS.EXPIRED,
      totalAmountInPaise: 250000,
      paidAmountInPaise: 250000,
      balanceInPaise: 0,
    });

    // 3. Suspended Member
    const suspendedMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0103',
      firstName: 'Karan',
      lastName: 'Mehta',
      email: 'karan@example.test',
      phone: '+919833344455',
      gender: 'MALE',
      status: MEMBER_STATUS.SUSPENDED,
    });
    suspendedMemberId = suspendedMember._id.toString();

    // 4. Frozen Member
    const frozenMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0104',
      firstName: 'Simran',
      lastName: 'Kaur',
      email: 'simran@example.test',
      phone: '+919844455566',
      gender: 'FEMALE',
      status: MEMBER_STATUS.ACTIVE,
    });
    frozenMemberId = frozenMember._id.toString();

    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: frozenMember._id,
      planId: plan._id,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: MEMBERSHIP_STATUS.FROZEN,
      totalAmountInPaise: 250000,
      paidAmountInPaise: 250000,
      balanceInPaise: 0,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('allows check-in for member with valid active membership', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const res = await AttendanceService.processCheckIn({
        tenantId,
        branchId,
        identifier: 'IP-2026-0101',
        method: 'MEMBER_ID',
      });

      expect(res.allowed).toBe(true);
      expect(res.attendance).toBeDefined();
      expect(res.attendance?.checkInTime).toBeDefined();

      const occupancy = await AttendanceService.getCurrentLiveOccupancy(tenantId, branchId);
      expect(occupancy).toBe(1);
    });
  });

  it('prevents duplicate check-in if member is already checked in (Anti-passback)', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const duplicateRes = await AttendanceService.processCheckIn({
        tenantId,
        branchId,
        identifier: 'IP-2026-0101',
        method: 'MEMBER_ID',
      });

      expect(duplicateRes.allowed).toBe(false);
      expect(duplicateRes.reason).toContain('Passback Warning');
    });
  });

  it('releases occupancy after checkout', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const checkoutRecord = await AttendanceService.processCheckOut(tenantId, activeMemberId);
      expect(checkoutRecord.checkOutTime).toBeDefined();

      const occupancy = await AttendanceService.getCurrentLiveOccupancy(tenantId, branchId);
      expect(occupancy).toBe(0);
    });
  });

  it('blocks check-in with descriptive reason for expired membership', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const res = await AttendanceService.processCheckIn({
        tenantId,
        branchId,
        identifier: 'IP-2026-0102',
        method: 'MEMBER_ID',
      });

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Membership plan expired');
    });
  });

  it('blocks check-in with reason for suspended account', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const res = await AttendanceService.processCheckIn({
        tenantId,
        branchId,
        identifier: 'IP-2026-0103',
        method: 'MEMBER_ID',
      });

      expect(res.allowed).toBe(false);
      expect(res.reason?.toLowerCase()).toContain('suspended');
    });
  });

  it('blocks check-in for frozen membership', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const res = await AttendanceService.processCheckIn({
        tenantId,
        branchId,
        identifier: 'IP-2026-0104',
        method: 'MEMBER_ID',
      });

      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Membership is currently frozen');
    });
  });
});
