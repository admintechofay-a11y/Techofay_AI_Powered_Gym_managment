import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CrmService } from '../src/services/crmService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { User } from '../src/models/User.js';
import { Lead } from '../src/models/Lead.js';
import { LeadActivity } from '../src/models/LeadActivity.js';
import { Member } from '../src/models/Member.js';
import { runInContext } from '../src/context/requestContext.js';
import { LEAD_SOURCE, LEAD_PIPELINE_STATUS, SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('CrmService - Lead Pipeline, Duplicate Merge & 1-Click Member Conversion', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let rep1UserId: string;
  let rep2UserId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-crm-test',
      contactEmail: 'contact@ironpulse-crm.org',
      contactPhone: '+919820011888',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC-CRM',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011887',
      email: 'bkc@ironpulse-crm.org',
    });
    branchId = branch._id.toString();

    const rep1 = await User.create({
      tenantId: tenant._id,
      name: 'Aman Gupta',
      email: 'rep1@ironpulse-crm.org',
      passwordHash: 'hash123',
      role: 'SALES_EXEC',
      status: 'ACTIVE',
    });
    rep1UserId = rep1._id.toString();

    const rep2 = await User.create({
      tenantId: tenant._id,
      name: 'Simran Kaur',
      email: 'rep2@ironpulse-crm.org',
      passwordHash: 'hash123',
      role: 'SALES_EXEC',
      status: 'ACTIVE',
    });
    rep2UserId = rep2._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('captures public inbound leads and creates an initial system activity record', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const { lead } = await CrmService.capturePublicLead({
        tenantId,
        branchId,
        name: 'Rohan Mehra',
        email: 'rohan.mehra@prospects.ironpulse.org',
        phone: '+919822233445',
        source: LEAD_SOURCE.WEBSITE,
        notes: 'Interested in annual CrossFit membership package',
      });

      expect(lead).toBeDefined();
      expect(lead.name).toBe('Rohan Mehra');
      expect(lead.pipelineStatus).toBe(LEAD_PIPELINE_STATUS.NEW);
      expect(lead.source).toBe(LEAD_SOURCE.WEBSITE);

      const activities = await LeadActivity.find({ leadId: lead._id, tenantId: new Types.ObjectId(tenantId) });
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].type).toBe('NOTE');
    });
  });

  it('transitions lead status through Kanban stages with notes, call logs and lost reasons', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const lead = await CrmService.createLead(tenantId, {
        branchId,
        name: 'Pooja Bhatt',
        email: 'pooja.bhatt@prospects.ironpulse.org',
        phone: '+919822233446',
        source: LEAD_SOURCE.SOCIAL_MEDIA,
        assignedToStaffId: rep1UserId,
      }, rep1UserId);

      // 1. Move to CONTACTED
      const contacted = await CrmService.updateLeadStatus(
        tenantId,
        lead._id.toString(),
        LEAD_PIPELINE_STATUS.CONTACTED,
        undefined,
        'Called prospect; discussed personal training goals.',
        rep1UserId,
      );
      expect(contacted.pipelineStatus).toBe(LEAD_PIPELINE_STATUS.CONTACTED);

      // 2. Move to TRIAL_BOOKED
      const trialBooked = await CrmService.updateLeadStatus(
        tenantId,
        lead._id.toString(),
        LEAD_PIPELINE_STATUS.TRIAL_BOOKED,
        undefined,
        'Complimentary personal training trial booked for Saturday morning.',
        rep1UserId,
      );
      expect(trialBooked.pipelineStatus).toBe(LEAD_PIPELINE_STATUS.TRIAL_BOOKED);

      // 3. Move to LOST with explicit reason
      const lostLead = await CrmService.updateLeadStatus(
        tenantId,
        lead._id.toString(),
        LEAD_PIPELINE_STATUS.LOST,
        'Budget constraints - relocated to another city',
        'Prospect moving to Delhi next month; unable to join.',
        rep1UserId,
      );
      expect(lostLead.pipelineStatus).toBe(LEAD_PIPELINE_STATUS.LOST);
      expect(lostLead.lostReason).toBe('Budget constraints - relocated to another city');
    });
  });

  it('merges duplicate leads transferring communication history and activities', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      // Lead A (Target / Primary)
      const targetLead = await CrmService.createLead(tenantId, {
        branchId,
        name: 'Siddharth Roy',
        email: 'siddharth.roy@prospects.ironpulse.org',
        phone: '+919811122233',
        source: LEAD_SOURCE.WALK_IN,
        assignedToStaffId: rep1UserId,
      }, rep1UserId);

      await CrmService.addActivity(tenantId, targetLead._id.toString(), {
        type: 'CALL',
        content: 'Walk-in tour of cardio section',
      }, rep1UserId);

      // Lead B (Source / Duplicate)
      const sourceLead = await CrmService.createLead(tenantId, {
        branchId,
        name: 'Sid Roy',
        email: 'siddharth.roy@prospects.ironpulse.org',
        phone: '+919811122233',
        source: LEAD_SOURCE.WEBSITE,
        assignedToStaffId: rep2UserId,
      }, rep2UserId);

      await CrmService.addActivity(tenantId, sourceLead._id.toString(), {
        type: 'EMAIL',
        content: 'Sent brochure pdf via email',
      }, rep2UserId);

      // Merge sourceLead into targetLead
      const mergedTarget = await CrmService.mergeLeads(
        tenantId,
        targetLead._id.toString(),
        sourceLead._id.toString(),
        rep1UserId,
      );

      expect(mergedTarget).toBeDefined();
      expect(mergedTarget._id.toString()).toBe(targetLead._id.toString());

      // Check source lead is marked deleted with mergedIntoLeadId
      const updatedSource = await Lead.findById(sourceLead._id);
      expect(updatedSource?.isDeleted).toBe(true);
      expect(updatedSource?.mergedIntoLeadId?.toString()).toBe(targetLead._id.toString());

      // Verify all activities now belong to target lead
      const targetActivities = await LeadActivity.find({ leadId: targetLead._id, tenantId: new Types.ObjectId(tenantId) });
      expect(targetActivities.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('converts a lead to a member with one click, establishing member record and updating status', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const lead = await CrmService.createLead(tenantId, {
        branchId,
        name: 'Ananya Sharma',
        email: 'ananya.sharma@ironpulse-crm.org',
        phone: '+919833344455',
        source: LEAD_SOURCE.REFERRAL,
        assignedToStaffId: rep2UserId,
      }, rep2UserId);

      const conversionResult = await CrmService.convertLeadToMember(tenantId, lead._id.toString(), {
        gender: 'FEMALE',
      }, rep2UserId);

      expect(conversionResult.member).toBeDefined();
      expect(conversionResult.member.email).toBe('ananya.sharma@ironpulse-crm.org');
      expect(conversionResult.member.firstName).toBe('Ananya');
      expect(conversionResult.member.status).toBe('ACTIVE');

      expect(conversionResult.lead.pipelineStatus).toBe(LEAD_PIPELINE_STATUS.CONVERTED);
      expect(conversionResult.lead.convertedMemberId?.toString()).toBe(conversionResult.member._id.toString());

      // Verify Member exists in DB
      const memberDoc = await Member.findById(conversionResult.member._id);
      expect(memberDoc).not.toBeNull();
    });
  });

  it('calculates sales rep performance and pipeline conversion analytics', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const report = await CrmService.getSalesReport(tenantId);
      expect(report).toBeDefined();
      expect(report.totalLeads).toBeGreaterThan(0);
      expect(report.convertedLeads).toBeGreaterThan(0);
      expect(Array.isArray(report.repPerformance)).toBe(true);
      expect(Array.isArray(report.sourceBreakdown)).toBe(true);
    });
  });
});
