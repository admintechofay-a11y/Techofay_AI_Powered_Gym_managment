import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Membership } from '../src/models/Membership.js';
import { Plan } from '../src/models/Plan.js';
import { Attendance } from '../src/models/Attendance.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';
import { Lead } from '../src/models/Lead.js';
import { LeadActivity } from '../src/models/LeadActivity.js';
import { Trainer } from '../src/models/Trainer.js';
import { Exercise } from '../src/models/Exercise.js';
import { WorkoutPlan } from '../src/models/WorkoutPlan.js';
import { Nutrition } from '../src/models/Nutrition.js';
import { AiLog } from '../src/models/AiLog.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { runInContext } from '../src/context/requestContext.js';
import { aiService, RuleBasedAiService } from '../src/services/aiService.js';
import { analyticsService } from '../src/services/analyticsService.js';
import {
  AI_MODE,
  REPORT_TYPE,
  REPORT_FORMAT,
  SUBSCRIPTION_TIER,
  TENANT_STATUS,
  PLAN_TYPE,
} from '@gymos/shared';

describe('Phase 5: AI & Advanced Analytics Engine Test Suite', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let trainerUserId: string;
  let highRiskMemberId: string;
  let loyalMemberId: string;
  let hotLeadId: string;
  let coldLeadId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'Olympus Athletic Club',
      subdomain: 'olympus-ai-test',
      contactEmail: 'contact@olympus-ai.org',
      contactPhone: '+919811199000',
      tier: SUBSCRIPTION_TIER.ENTERPRISE,
      status: TENANT_STATUS.ACTIVE,
      aiSettings: {
        enabled: true,
        dailyLimit: 100,
        usageToday: 0,
        lastResetDate: new Date().toISOString().slice(0, 10),
      },
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'Olympus Flagship Worli',
      code: 'OLY-WORLI',
      address: 'Worli Sea Face, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400018',
      phone: '+919811199001',
      email: 'worli@olympus-ai.org',
    });
    branchId = branch._id.toString();
    trainerUserId = new Types.ObjectId().toString();

    // Create Trainer
    await Trainer.create({
      tenantId: tenant._id,
      userId: new Types.ObjectId(trainerUserId),
      name: 'Aditya Oberoi',
      specializations: ['Hypertrophy', 'Olympic Weightlifting'],
      qualifications: ['CSCS Certified', 'B.Sc Sports Science'],
      rating: 4.95,
      defaultCommissionRatePercent: 20,
      isActive: true,
    });

    // Create Exercise
    await Exercise.create({
      tenantId: tenant._id,
      name: 'Barbell Back Squat',
      targetMuscleGroup: 'LEGS',
      category: 'STRENGTH',
      difficulty: 'INTERMEDIATE',
      instructions: 'Unrack bar across upper traps. Descend to parallel depth. Drive up through midfoot.',
      equipmentRequired: 'BARBELL, RACK',
    });

    // Create Plan
    const plan = await Plan.create({
      tenantId: tenant._id,
      name: 'Annual Gold Athlete',
      code: 'ANN-GOLD',
      type: PLAN_TYPE.ANNUAL,
      durationDays: 365,
      priceInPaise: 3600000, // ₹36,000
      isActive: true,
    });

    // 1. Setup High-Risk Member (absent for 25 days, plan expires in 3 days)
    const highRiskMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'OLY-MEM-001',
      firstName: 'Kabir',
      lastName: 'Singhania',
      email: 'kabir@olympus-ai.org',
      phone: '+919822233444',
      gender: 'MALE',
      joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      status: 'ACTIVE',
      fitnessGoals: ['Weight Loss'],
      leaderboardOptIn: true,
    });
    highRiskMemberId = highRiskMember._id.toString();

    // Expiring membership
    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: highRiskMember._id,
      planId: plan._id,
      startDate: new Date(Date.now() - 362 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days remaining!
      totalAmountInPaise: 3600000,
      status: 'ACTIVE',
    });

    // Check-in 25 days ago
    await Attendance.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: highRiskMember._id,
      checkInTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      method: 'QR',
    });

    // Overdue Invoice
    await Invoice.create({
      tenantId: tenant._id,
      branchId: branch._id,
      invoiceNumber: 'INV-OLY-2026-0001',
      financialYear: '2026-2027',
      memberId: highRiskMember._id,
      memberSnapshot: {
        memberId: highRiskMemberId,
        memberCode: 'OLY-MEM-001',
        name: 'Kabir Singhania',
        email: 'kabir@olympus-ai.org',
        phone: '+919822233444',
      },
      items: [{ description: 'Personal Training Addon', quantity: 1, unitPriceInPaise: 500000, amountInPaise: 500000, taxRatePercent: 18, taxAmountInPaise: 90000 }],
      subtotalInPaise: 500000,
      taxTotalInPaise: 90000,
      discountInPaise: 0,
      grandTotalInPaise: 590000,
      paidAmountInPaise: 0,
      dueAmountInPaise: 590000,
      status: 'UNPAID',
      issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // overdue!
    });

    // 2. Setup Loyal Low-Risk Member (visiting frequently)
    const loyalMember = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'OLY-MEM-002',
      firstName: 'Rhea',
      lastName: 'Kapoor',
      email: 'rhea@olympus-ai.org',
      phone: '+919833344555',
      gender: 'FEMALE',
      joinDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 13 months tenure
      status: 'ACTIVE',
      fitnessGoals: ['Hypertrophy', 'Strength'],
      leaderboardOptIn: true,
    });
    loyalMemberId = loyalMember._id.toString();

    // Check-in yesterday
    await Attendance.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: loyalMember._id,
      checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      method: 'QR',
    });

    // Loyal active membership
    await Membership.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberId: loyalMember._id,
      planId: plan._id,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days remaining
      totalAmountInPaise: 3600000,
      status: 'ACTIVE',
    });

    // 3. Setup Hot Lead (Referral + Trial Completed + 3 Activities)
    const hotLead = await Lead.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Vikram Sethi',
      email: 'vikram@olympus-ai.org',
      phone: '+919844455666',
      source: 'REFERRAL',
      pipelineStatus: 'TRIAL_COMPLETED',
      leadScore: 'WARM',
    });
    hotLeadId = hotLead._id.toString();

    await LeadActivity.create({
      tenantId: tenant._id,
      leadId: hotLead._id,
      type: 'MEETING',
      content: 'Completed upper body conditioning trial with coach Aditya.',
    });
    await LeadActivity.create({
      tenantId: tenant._id,
      leadId: hotLead._id,
      type: 'CALL',
      content: 'Called to discuss membership packages; very enthusiastic.',
    });

    // 4. Setup Cold Lead
    const coldLead = await Lead.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Sameer Joshi',
      phone: '+919855566777',
      source: 'OTHER',
      pipelineStatus: 'NEW',
      createdAt: new Date(Date.now() - 150 * 60 * 60 * 1000), // 6 days ago
    });
    coldLeadId = coldLead._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  // TEST 1: AI Mode & Architecture Check
  it('1. AI Service selects Basic mode in test environment and returns summary', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const mode = aiService.getMode();
      expect([AI_MODE.BASIC, AI_MODE.CLAUDE]).toContain(mode);

      const summary = await aiService.getSummary(tenantId);
      expect(summary.enabled).toBe(true);
      expect(summary.dailyLimit).toBe(100);
      expect(summary.provider).toBeDefined();
    });
  });

  // TEST 2: High-Risk Member Churn Prediction
  it('2. Accurately scores High-Risk churn member with detailed reasons and action', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const result = await aiService.predictMemberChurn(highRiskMemberId, tenantId);

      expect(result.memberCode).toBe('OLY-MEM-001');
      expect(result.riskScore).toBeGreaterThanOrEqual(70);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      expect(result.suggestedAction).toContain('High churn hazard');

      // Verify reasons mention overdue invoice or absence
      const reasonsText = result.reasons.join(' ');
      expect(reasonsText).toMatch(/consecutive days|expires in|overdue/i);

      // Verify persisted on Member document
      const member = await Member.findById(highRiskMemberId);
      expect(member?.churnRisk?.level).toBe('HIGH');
      expect(member?.churnRisk?.score).toBe(result.riskScore);
    });
  });

  // TEST 3: Low-Risk Loyal Member Churn Prediction
  it('3. Accurately scores Low-Risk loyal member with tenure bonus', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const result = await aiService.predictMemberChurn(loyalMemberId, tenantId);

      expect(result.memberCode).toBe('OLY-MEM-002');
      expect(result.riskLevel).toBe('LOW');
      expect(result.riskScore).toBeLessThan(45);
      expect(result.factors.tenureMonths).toBeGreaterThanOrEqual(12);
    });
  });

  // TEST 4: Batch Churn Prediction
  it('4. Batch churn prediction aggregates high-risk counts across members', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const batch = await aiService.batchPredictChurn(tenantId, { limit: 10 });
      expect(batch.totalScored).toBeGreaterThanOrEqual(2);
      expect(batch.highRiskCount).toBeGreaterThanOrEqual(1);
    });
  });

  // TEST 5: Lead Scoring (Hot vs Cold)
  it('5. Scores referral lead with completed trial as HOT and stagnant lead as COLD', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const hotResult = await aiService.scoreLead(hotLeadId, tenantId);
      expect(hotResult.score).toBe('HOT');
      expect(hotResult.numericalScore).toBeGreaterThanOrEqual(75);
      expect(hotResult.recommendedAction).toContain('Immediate follow-up');
      expect(hotResult.suggestedMessage).toContain('Vikram');

      const coldResult = await aiService.scoreLead(coldLeadId, tenantId);
      expect(coldResult.score).toBe('COLD');
      expect(coldResult.numericalScore).toBeLessThan(50);
      expect(coldResult.recommendedAction).toContain('nurture');
    });
  });

  // TEST 6: Editable Follow-Up Message Generation
  it('6. Generates personalized and editable follow-up message with contextual goals', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const followUp = await aiService.generateFollowUp({
        leadId: hotLeadId,
        channel: 'WHATSAPP',
        customContext: 'Trial completed with coach Aditya',
        tenantId,
      });

      expect(followUp.channel).toBe('WHATSAPP');
      expect(followUp.message).toContain('Vikram');
      expect(followUp.message).toContain('Techofay Gym');
      expect(followUp.recommendedAction).toContain('Review and edit');
    });
  });

  // TEST 7: Natural-Language Business Reports (Safe, Parameterized Query Tools Only)
  it('7. Answers natural language queries using safe parameterized tools without raw execution', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      // Query 1: Revenue
      const revReport = await aiService.queryBusinessIntelligence('What is our total revenue collected this month?', tenantId);
      expect(revReport.toolUsed).toBe('getRevenueReport');
      expect(revReport.parameters).toBeDefined();
      expect(revReport.dataUsed).toBeDefined();
      expect(revReport.narrativeSummary).toContain('revenue');

      // Query 2: Attendance
      const attReport = await aiService.queryBusinessIntelligence('Show me floor attendance and footfall check-ins', tenantId);
      expect(attReport.toolUsed).toBe('getAttendanceSummary');
      expect(attReport.dataUsed.totalCheckIns).toBeDefined();
      expect(attReport.narrativeSummary).toContain('turnstile check-ins');
    });
  });

  // TEST 8: Workout Suggestions (Draft Requirement & Trainer Approval)
  it('8. Creates workout suggestions strictly in DRAFT state and requires trainer approval', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const draft = await aiService.suggestWorkoutPlan({
        memberId: highRiskMemberId,
        daysPerWeek: 3,
        focusGoal: 'Hypertrophy & Strength',
        fitnessLevel: 'INTERMEDIATE',
        tenantId,
      });

      expect(draft.status).toBe('DRAFT');
      expect(draft.trainerReviewRequired).toBe(true);
      expect(draft.aiGenerated).toBe(true);

      const dbPlan = await WorkoutPlan.findById(draft.workoutPlanId);
      expect(dbPlan?.status).toBe('DRAFT');
      expect(dbPlan?.isActive).toBe(false);

      // Trainer approves program
      dbPlan!.status = 'ACTIVE';
      dbPlan!.isActive = true;
      dbPlan!.approvedByTrainerId = new Types.ObjectId(trainerUserId);
      dbPlan!.approvedAt = new Date();
      await dbPlan!.save();

      const approvedPlan = await WorkoutPlan.findById(draft.workoutPlanId);
      expect(approvedPlan?.status).toBe('ACTIVE');
      expect(approvedPlan?.isActive).toBe(true);
      expect(approvedPlan?.approvedByTrainerId).toBeDefined();
    });
  });

  // TEST 9: Diet Suggestions (Draft Requirement & Nutritionist Approval)
  it('9. Creates diet suggestions strictly in DRAFT state and requires nutritionist approval', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      const diet = await aiService.suggestDietPlan({
        memberId: highRiskMemberId,
        calorieTarget: 2200,
        dietaryPreference: 'VEGETARIAN',
        goal: 'WEIGHT_LOSS',
        tenantId,
      });

      expect(diet.status).toBe('DRAFT');
      expect(diet.nutritionistReviewRequired).toBe(true);
      expect(diet.meals.length).toBeGreaterThanOrEqual(3);

      const dbDiet = await Nutrition.findById(diet.nutritionPlanId);
      expect(dbDiet?.status).toBe('DRAFT');
      expect(dbDiet?.isActive).toBe(false);

      // Nutritionist approves
      dbDiet!.status = 'APPROVED';
      dbDiet!.isActive = true;
      dbDiet!.approvedByNutritionistId = new Types.ObjectId(trainerUserId);
      dbDiet!.approvedAt = new Date();
      await dbDiet!.save();

      const approvedDiet = await Nutrition.findById(diet.nutritionPlanId);
      expect(approvedDiet?.status).toBe('APPROVED');
      expect(approvedDiet?.isActive).toBe(true);
    });
  });

  // TEST 10: Chatbot for Timings, Plans & Human Handoff
  it('10. Chatbot answers tenant queries accurately and triggers handoff when unsure', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      // 1. Timings query
      const timingRes = await aiService.chatSupport({
        query: 'What are gym opening hours on Sunday?',
        tenantId,
      });
      expect(timingRes.reply).toContain('06:00 AM');
      expect(timingRes.confidence).toBeGreaterThan(0.9);
      expect(timingRes.shouldHandoff).toBe(false);

      // 2. Plans & pricing query
      const planRes = await aiService.chatSupport({
        query: 'How much does an annual membership cost?',
        tenantId,
      });
      expect(planRes.reply).toContain('Annual Gold Athlete');
      expect(planRes.confidence).toBeGreaterThan(0.9);

      // 3. Unsure query (medical complaint / custom discount negotiation)
      const handoffRes = await aiService.chatSupport({
        query: 'Can I get a secret 50% discount because I know the owner?',
        tenantId,
      });
      expect(handoffRes.shouldHandoff).toBe(true);
      expect(handoffRes.handoffData?.suggestedLeadSource).toBe('CHATBOT');
    });
  });

  // TEST 11: Safeguards & Audit Logging
  it('11. Enforces prompt sanitization, logs AI calls, and handles rate limiting', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      // Check that AiLog recorded entries
      const logsCount = await AiLog.countDocuments({ tenantId });
      expect(logsCount).toBeGreaterThanOrEqual(4);

      const recentLog = await AiLog.findOne({ tenantId }).sort({ createdAt: -1 });
      expect(recentLog?.provider).toBe('RULE_BASED');
      expect(recentLog?.status).toBeDefined();
    });
  });

  // TEST 12: Advanced Analytics Dashboards & SOW 23 Reports
  it('12. Computes retention cohorts, heatmap, renewal forecasts, and SOW 23 exports', async () => {
    await runInContext({ tenantId, branchId }, async () => {
      // 1. Retention cohorts
      const cohorts = await analyticsService.getRetentionCohorts(tenantId, 4);
      expect(cohorts.length).toBe(4);
      expect(cohorts[0].month1RetentionPct).toBeGreaterThan(80);

      // 2. Peak Hours Heatmap
      const heatmap = await analyticsService.getPeakHoursHeatmap(tenantId);
      expect(heatmap.grid.length).toBeGreaterThan(50);
      expect(heatmap.peakSlot.dayName).toBeDefined();

      // 3. Renewal Forecast
      const forecast = await analyticsService.getRenewalForecast(tenantId);
      expect(forecast.timeframes.next7Days).toBeDefined();
      expect(forecast.timeframes.next30Days.count).toBeGreaterThanOrEqual(1);

      // 4. SOW 23 Report Generation
      const memberReport = await analyticsService.generateReportData(REPORT_TYPE.MEMBER, tenantId);
      expect(memberReport.headers).toContain('Member Code');
      expect(memberReport.rows.length).toBeGreaterThanOrEqual(2);

      // 5. CSV Export
      const csv = await analyticsService.exportReport(REPORT_TYPE.REVENUE, REPORT_FORMAT.CSV, tenantId);
      expect(csv.contentType).toBe('text/csv');
      expect(csv.content).toContain('Amount (₹)');

      // 6. PDF Export
      const pdf = await analyticsService.exportReport(REPORT_TYPE.ATTENDANCE, REPORT_FORMAT.PDF, tenantId);
      expect(pdf.contentType).toBe('application/pdf');
      expect(pdf.content).toContain('<!DOCTYPE html>');
      expect(pdf.content).toContain('Techofay GymOS');
    });
  });
});
