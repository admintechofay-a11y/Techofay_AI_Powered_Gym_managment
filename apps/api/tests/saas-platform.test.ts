import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { User } from '../src/models/User.js';
import { Subscription } from '../src/models/Subscription.js';
import { Member } from '../src/models/Member.js';
import { Membership } from '../src/models/Membership.js';
import { Inventory } from '../src/models/Inventory.js';
import { Expense } from '../src/models/Expense.js';
import { Invoice } from '../src/models/Invoice.js';
import { Lead } from '../src/models/Lead.js';
import { Trial } from '../src/models/Trial.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { env } from '../src/config/env.js';
import { SUBSCRIPTION_TIER, TENANT_STATUS, PLAN_TYPE } from '@gymos/shared';

describe('Phase 6: SaaS Platform, Multi-Branch, Public Website & Member PWA Suite', () => {
  let mongod: MongoMemoryServer;
  let app: any;
  let superAdminToken: string;
  let tenantAdminToken: string;
  let testTenantId: string;
  let testBranchId: string;
  let testMemberId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = createApp();

    // Setup Platform Ops Tenant & Super Admin User
    const platformTenant = await Tenant.create({
      name: 'Techofay Platform Admin',
      subdomain: 'techofay-admin',
      tier: SUBSCRIPTION_TIER.ENTERPRISE,
      status: TENANT_STATUS.ACTIVE,
      contactEmail: 'admin@techofay.com',
      contactPhone: '+919999999999',
    });

    const superAdminUser = await User.create({
      tenantId: platformTenant._id,
      name: 'Platform Super Admin',
      email: 'admin@techofay.com',
      passwordHash: 'argon_hash_dummy',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    superAdminToken = jwt.sign(
      {
        userId: superAdminUser._id.toString(),
        tenantId: platformTenant._id.toString(),
        role: 'SUPER_ADMIN',
        sessionId: 'session_super_admin',
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' },
    );

    // Initial Test Tenant
    const tenant = await Tenant.create({
      name: 'Pulse Fitness Hub',
      subdomain: 'pulse-fit',
      tier: SUBSCRIPTION_TIER.STARTER,
      status: TENANT_STATUS.ACTIVE,
      contactEmail: 'pulse@gymos.com',
      contactPhone: '+919988776655',
    });
    testTenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'Pulse Central',
      code: 'PC01',
      address: '123 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      phone: '+919988776655',
      email: 'pulse@gymos.com',
      isActive: true,
    });
    testBranchId = branch._id.toString();

    const tenantAdmin = await User.create({
      tenantId: tenant._id,
      branchIds: [branch._id],
      name: 'Pulse Owner',
      email: 'owner@pulsefit.com',
      passwordHash: 'dummy',
      role: 'GYM_OWNER',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    tenantAdminToken = jwt.sign(
      {
        userId: tenantAdmin._id.toString(),
        tenantId: testTenantId,
        branchId: testBranchId,
        role: 'GYM_OWNER',
        sessionId: 'session_tenant_admin',
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' },
    );

    await Subscription.create({
      tenantId: tenant._id,
      planTier: SUBSCRIPTION_TIER.STARTER,
      billingCycle: 'MONTHLY',
      amountInPaise: 499900,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      maxBranches: 1,
      maxMembers: 500,
    });

    // Create an initial Member
    const member = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'PF-001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+919876543210',
      email: 'rahul.sharma@gmail.com',
      gender: 'MALE',
      dateOfBirth: new Date('1995-05-15'),
      status: 'ACTIVE',
    });
    testMemberId = member._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // 1. Super Admin Console: Tenant Onboarding Wizard
  test('1. Super Admin onboarding wizard creates tenant, primary branch, owner, subscription and default plan', async () => {
    const res = await request(app)
      .post('/api/super-admin/onboard')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Iron Forge Gym',
        subdomain: 'iron-forge',
        tier: SUBSCRIPTION_TIER.PROFESSIONAL,
        billingCycle: 'YEARLY',
        contactEmail: 'contact@ironforge.com',
        contactPhone: '+919123456789',
        trialDays: 14,
        ownerName: 'Vikram Singh',
        ownerEmail: 'vikram@ironforge.com',
        ownerPassword: 'IronPassword@123',
        branchName: 'Iron Forge Flagship',
        branchCode: 'IF01',
        branchAddress: '45 Ring Road',
        branchCity: 'Mumbai',
        branchState: 'Maharashtra',
        branchPincode: '400001',
        branchPhone: '+919123456789',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenant.name).toBe('Iron Forge Gym');
    expect(res.body.data.tenant.tier).toBe(SUBSCRIPTION_TIER.PROFESSIONAL);
    expect(res.body.data.branch.code).toBe('IF01');
    expect(res.body.data.ownerUser.email).toBe('vikram@ironforge.com');
    expect(res.body.data.subscription.planTier).toBe(SUBSCRIPTION_TIER.PROFESSIONAL);

    // Verify audit log
    const audit = await AuditLog.findOne({
      tenantId: res.body.data.tenant._id,
      action: 'ONBOARD_TENANT',
      entityId: res.body.data.tenant._id,
    });
    expect(audit).not.toBeNull();
  });

  // 2. Super Admin: Impersonate Tenant
  test('2. Super Admin impersonation generates valid JWT session with audit log', async () => {
    const res = await request(app)
      .post(`/api/super-admin/tenants/${testTenantId}/impersonate`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.isImpersonated).toBe(true);
    expect(res.body.data.tenant.subdomain).toBe('pulse-fit');

    // Decode token and verify claims
    const decoded: any = jwt.verify(res.body.data.accessToken, env.JWT_ACCESS_SECRET);
    expect(decoded.isImpersonated).toBe(true);
    expect(decoded.tenantId).toBe(testTenantId);
  });

  // 3. Subscription Limit Enforcement
  test('3. API enforces subscription quota limits: Starter tier cannot exceed maxBranches', async () => {
    // Pulse Fitness Hub is STARTER (maxBranches = 1). Since it already has 1 branch, adding another must fail.
    const res = await request(app)
      .post('/api/branches')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        name: 'Pulse South',
        code: 'PS02',
        address: '78 Jayanagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560041',
        phone: '+919988776656',
        email: 'south@pulsefit.com',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
    expect(res.body.error.message).toContain('Branch limit reached for STARTER tier');
  });

  // 4. Multi-Branch: Cross-Branch Comparison and Member Transfer
  test('4. Upgraded tenant can create 2nd branch, compare branches, and transfer member', async () => {
    // 4.1 Upgrade Pulse to PROFESSIONAL via Super Admin
    const upgradeRes = await request(app)
      .patch(`/api/super-admin/tenants/${testTenantId}/subscription`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        planTier: SUBSCRIPTION_TIER.PROFESSIONAL,
        billingCycle: 'MONTHLY',
        maxBranches: 3,
        maxMembers: 2500,
      });
    expect(upgradeRes.status).toBe(200);

    // 4.2 Create 2nd Branch now that quota is 3
    const branch2Res = await request(app)
      .post('/api/branches')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        name: 'Pulse Indiranagar',
        code: 'PI02',
        address: '100 Feet Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        phone: '+919988776657',
        email: 'indiranagar@pulsefit.com',
      });
    expect(branch2Res.status).toBe(201);
    const branch2Id = branch2Res.body.data._id;

    // 4.3 Query Cross-Branch Comparison
    const compRes = await request(app)
      .get('/api/branches/comparison')
      .set('Authorization', `Bearer ${tenantAdminToken}`);
    expect(compRes.status).toBe(200);
    expect(compRes.body.data.totalBranches).toBe(2);

    // 4.4 Member Transfer between Branches
    const transferRes = await request(app)
      .post('/api/branches/transfer-member')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        memberId: testMemberId,
        destinationBranchId: branch2Id,
        reason: 'Relocated closer to Indiranagar center',
        transferActiveMemberships: true,
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.data.member.newBranchId.toString()).toBe(branch2Id.toString());

    // Verify in database
    const updatedMember = await Member.findOne({ _id: testMemberId, tenantId: testTenantId });
    expect(updatedMember?.branchId.toString()).toBe(branch2Id.toString());
  });

  // 5. Inventory & Atomic Stock Conditional Decrement
  test('5. Atomic Stock Adjustment prevents negative stock via conditional $gte update', async () => {
    // 5.1 Create Inventory Item
    const itemRes = await request(app)
      .post('/api/inventory')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        branchId: testBranchId,
        name: 'Optimum Nutrition Gold Standard Whey 2kg',
        sku: 'WHEY-ON-2KG',
        category: 'SUPPLEMENTS',
        costPriceInPaise: 450000,
        sellingPriceInPaise: 620000,
        initialStock: 10,
        minThresholdAlert: 3,
        unit: 'tub',
      });

    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.data._id;

    // 5.2 Stock In +5 (new total = 15)
    const stockInRes = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        inventoryId: itemId,
        type: 'STOCK_IN',
        quantity: 5,
        reason: 'Restocked from distributor',
      });
    expect(stockInRes.status).toBe(200);
    expect(stockInRes.body.data.adjustment.newStock).toBe(15);

    // 5.3 Attempt Oversell / Negative Stock (Stock Out 20 when only 15 available)
    const oversellRes = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        inventoryId: itemId,
        type: 'STOCK_OUT',
        quantity: 20,
        reason: 'Bulk member purchase',
      });

    expect(oversellRes.status).toBe(400);
    expect(oversellRes.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(oversellRes.body.error.message).toContain('Insufficient stock');

    // 5.4 Valid Stock Out 10 (remaining = 5)
    const validOutRes = await request(app)
      .post('/api/inventory/adjust')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        inventoryId: itemId,
        type: 'STOCK_OUT',
        quantity: 10,
        reason: 'Store sales',
      });
    expect(validOutRes.status).toBe(200);
    expect(validOutRes.body.data.adjustment.newStock).toBe(5);
  });

  // 6. Expenses & Profit and Loss (P&L) Statement
  test('6. Record expenses and calculate complete Profit & Loss (P&L) breakdown', async () => {
    // 6.1 Create Invoices for revenue
    await Invoice.create({
      tenantId: new Types.ObjectId(testTenantId),
      branchId: new Types.ObjectId(testBranchId),
      invoiceNumber: 'INV-TEST-001',
      financialYear: '2026-2027',
      memberId: new Types.ObjectId(testMemberId),
      memberSnapshot: {
        memberId: testMemberId,
        memberCode: 'PF-001',
        name: 'Rahul Sharma',
        email: 'rahul@gmail.com',
        phone: '+919876543210',
      },
      items: [{
        description: 'Annual Gym Access',
        quantity: 1,
        unitPriceInPaise: 2500000,
        amountInPaise: 2500000,
        taxRatePercent: 18,
        taxAmountInPaise: 450000,
      }],
      subtotalInPaise: 2500000,
      taxTotalInPaise: 450000,
      discountInPaise: 0,
      grandTotalInPaise: 2950000,
      paidAmountInPaise: 2950000,
      dueAmountInPaise: 0,
      status: 'PAID',
      issueDate: new Date(),
      dueDate: new Date(),
    });

    // 6.2 Record Expenses
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        branchId: testBranchId,
        category: 'RENT',
        amountInPaise: 800000, // ₹8,000
        vendorName: 'Property Management Ltd',
        paymentMethod: 'BANK_TRANSFER',
      });

    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({
        branchId: testBranchId,
        category: 'UTILITIES',
        amountInPaise: 200000, // ₹2,000
        vendorName: 'Electricity Board',
        paymentMethod: 'UPI',
      });

    // 6.3 Query P&L Statement
    const pnlRes = await request(app)
      .get('/api/expenses/profit-and-loss')
      .set('Authorization', `Bearer ${tenantAdminToken}`);

    expect(pnlRes.status).toBe(200);
    expect(pnlRes.body.data.revenue.grossRevenueInPaise).toBe(2950000);
    expect(pnlRes.body.data.expenses.totalExpensesInPaise).toBe(1000000);
    expect(pnlRes.body.data.profitability.netProfitInPaise).toBe(1950000);
    expect(pnlRes.body.data.profitability.isProfitable).toBe(true);
  });

  // 7. Public Gym Website & SEO Data
  test('7. Public website endpoint serves gym branding, schema.org JSON-LD and branches', async () => {
    const res = await request(app).get('/api/public/gym/pulse-fit');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tenant.name).toBe('Pulse Fitness Hub');
    expect(res.body.data.tenant.brandColor).toBe('#10b981');
    expect(res.body.data.seo.jsonLd['@type']).toBe('ExerciseGym');
    expect(res.body.data.branches.length).toBeGreaterThanOrEqual(1);
  });

  // 8. Public Trial Booking straight into CRM
  test('8. Public trial booking ingests lead into CRM pipeline as HOT lead', async () => {
    const res = await request(app)
      .post('/api/public/gym/pulse-fit/trial')
      .send({
        name: 'Ananya Deshmukh',
        email: 'ananya@yahoo.com',
        phone: '+919811223344',
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        preferredTimeSlot: 'Evening (6 PM - 8 PM)',
        fitnessGoal: 'Weight Loss & Toning',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingId).toBeDefined();

    // Verify in CRM Lead collection
    const lead = await Lead.findOne({ phone: '+919811223344', tenantId: testTenantId });
    expect(lead).not.toBeNull();
    expect(lead?.pipelineStatus).toBe('TRIAL_BOOKED');
    expect(lead?.leadScore).toBe('HOT');

    // Verify in Trial collection
    const trial = await Trial.findOne({ _id: res.body.data.bookingId, tenantId: testTenantId });
    expect(trial).not.toBeNull();
    expect(trial?.status).toBe('SCHEDULED');
  });

  // 9. Member PWA: Profile, Dynamic QR, Attendance Streaks
  test('9. Member PWA endpoints provide profile, rotating signed QR check-in and attendance streak', async () => {
    // 9.1 Profile
    const profileRes = await request(app)
      .get('/api/member-pwa/profile')
      .set('x-tenant-id', testTenantId)
      .set('x-member-id', testMemberId);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.member.firstName).toBe('Rahul');
    expect(profileRes.body.data.branding.gymName).toBe('Pulse Fitness Hub');

    // 9.2 Dynamic QR Check-in Token
    const qrRes = await request(app)
      .get('/api/member-pwa/qr')
      .set('x-tenant-id', testTenantId)
      .set('x-member-id', testMemberId);

    expect(qrRes.status).toBe(200);
    expect(qrRes.body.data.qrPayload).toBeDefined();
    const parsedQr = JSON.parse(qrRes.body.data.qrPayload);
    expect(parsedQr.m).toBe(testMemberId);
    expect(parsedQr.sig).toBeDefined();

    // 9.3 Attendance & Streak
    const attRes = await request(app)
      .get('/api/member-pwa/attendance')
      .set('x-tenant-id', testTenantId)
      .set('x-member-id', testMemberId);

    expect(attRes.status).toBe(200);
    expect(attRes.body.data.streakBadge).toBeDefined();
  });

  // 10. Member PWA: DPDP Act Compliance (Personal Data Export & Account Deletion)
  test('10. India DPDP Act compliance: 1-click personal data export JSON and verified deletion request', async () => {
    // 10.1 1-click personal data export
    const exportRes = await request(app)
      .get('/api/member-pwa/dpdp/export')
      .set('x-tenant-id', testTenantId)
      .set('x-member-id', testMemberId);

    expect(exportRes.status).toBe(200);
    expect(exportRes.body.data.dpdpCompliance.regulation).toContain('Digital Personal Data Protection Act');
    expect(exportRes.body.data.profile.firstName).toBe('Rahul');

    // 10.2 Account deletion request (with phone verification)
    const deleteRes = await request(app)
      .post('/api/member-pwa/dpdp/delete-request')
      .set('x-tenant-id', testTenantId)
      .set('x-member-id', testMemberId)
      .send({
        reason: 'Relocated overseas permanently',
        confirmPhone: '+919876543210',
      });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.data.scheduledPurgeDate).toBeDefined();

    // Verify member is marked isDeleted
    const deletedMember = await Member.findOne({ _id: testMemberId, tenantId: testTenantId });
    expect(deletedMember?.isDeleted).toBe(true);
    expect(deletedMember?.status).toBe('INACTIVE');
  });
});
