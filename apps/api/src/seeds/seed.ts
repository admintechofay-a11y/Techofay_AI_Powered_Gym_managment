import mongoose, { Types } from 'mongoose';
import { env } from '../config/env.js';
import {
  USER_ROLES,
  TENANT_STATUS,
  PLAN_TYPE,
  MEMBER_STATUS,
  MEMBERSHIP_STATUS,
  ATTENDANCE_METHOD,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  LEAD_SOURCE,
  LEAD_PIPELINE_STATUS,
  LEAD_SCORE,
} from '@gymos/shared';
import {
  Tenant,
  Branch,
  User,
  Member,
  Plan,
  Membership,
  Attendance,
  Invoice,
  Payment,
  Lead,
  LeadActivity,
  Trial,
  Booking,
  Class,
  Trainer,
  PtPackage,
  Exercise,
  WorkoutPlan,
  WorkoutLog,
  Nutrition,
  Food,
  WaterLog,
  Assessment,
  Counter,
  Locker,
  Commission,
  Staff,
  Review,
  Referral,
  Wallet,
} from '../models/index.js';
import { AuthService } from '../services/authService.js';
import { runInContext } from '../context/requestContext.js';
import { EXERCISE_LIBRARY } from './exerciseData.js';
import { INDIAN_FOOD_DATABASE } from './foodData.js';

// Realistic Indian Names Dataset
const FIRST_NAMES_MALE = [
  'Aarav', 'Rohan', 'Kabir', 'Dev', 'Vikram', 'Aditya', 'Ishaan', 'Rajesh', 'Kunal', 'Sanjay',
  'Arjun', 'Sameer', 'Nikhil', 'Manish', 'Alok', 'Gautam', 'Karan', 'Siddharth', 'Varun', 'Tarun',
  'Vivek', 'Pranav', 'Harsh', 'Mayank', 'Dhruv', 'Yash', 'Rishi', 'Abhishek', 'Gaurav', 'Anand',
];

const FIRST_NAMES_FEMALE = [
  'Priya', 'Ananya', 'Neha', 'Simran', 'Sneha', 'Pooja', 'Diya', 'Meera', 'Ritu', 'Sunita',
  'Kavita', 'Rhea', 'Tanvi', 'Isha', 'Divya', 'Shreya', 'Anjali', 'Swati', 'Preeti', 'Deepa',
  'Aarti', 'Komal', 'Sonal', 'Pallavi', 'Aditi', 'Natasha', 'Bhavna', 'Geeta', 'Nandini', 'Tara',
];

const LAST_NAMES = [
  'Sharma', 'Iyer', 'Mehra', 'Deshmukh', 'Kapoor', 'Verma', 'Patel', 'Joshi', 'Reddy', 'Nair',
  'Malhotra', 'Bhatia', 'Chopra', 'Sen', 'Rao', 'Gupta', 'Aggarwal', 'Menon', 'Kulkarni', 'Singhal',
  'Dubey', 'Trivedi', 'Hegde', 'Banerjee', 'Chatterjee', 'Shetty', 'Pillai', 'Pandey', 'Mishra', 'Saxena',
];

export async function runSeed(customMongoUri?: string) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Database seeding is strictly prohibited in production without ALLOW_PRODUCTION_SEED=true');
  }
  let mongoServer: any = null;
  const uri = customMongoUri || env.MONGODB_URI;

  if (mongoose.connection.readyState !== 1) {
    try {
      console.log(`[SEED] Connecting to database at ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    } catch {
      if (uri.includes('replicaSet=')) {
        const fallbackUri = uri.replace(/[?&]replicaSet=[^&]+/, '');
        try {
          console.log(`[SEED] Retrying connection at standalone MongoDB: ${fallbackUri}...`);
          await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 });
        } catch {
          console.log('[SEED] Local MongoDB is not running. Starting embedded in-memory database to seed...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoServer = await MongoMemoryServer.create();
          const inMemoryUri = mongoServer.getUri();
          console.log(`[SEED] Connected to embedded in-memory database at ${inMemoryUri}`);
          await mongoose.connect(inMemoryUri);
        }
      } else {
        console.log('[SEED] Local MongoDB is not running. Starting embedded in-memory database to seed...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoServer.getUri();
        console.log(`[SEED] Connected to embedded in-memory database at ${inMemoryUri}`);
        await mongoose.connect(inMemoryUri);
      }
    }
  }

  await runInContext({ isSuperAdmin: true }, async () => {
    console.log('[SEED] Cleaning existing seed data (platform, ironpulse, powerfit)...');
    await Promise.all([
      Tenant.deleteMany({ subdomain: { $in: ['platform', 'ironpulse', 'powerfit'] } }),
      Counter.deleteMany({}),
      Exercise.deleteMany({ isSystem: true }),
      Food.deleteMany({ isSystem: true }),
    ]);

    const defaultPassword = 'Password@123';
    const defaultPasswordHash = await AuthService.hashPassword(defaultPassword);

    // =========================================================================
    // 1. SaaS Platform Super Admin Organization
    // =========================================================================
    console.log('[SEED] Creating Platform Super Admin...');
    const platformTenant = await Tenant.create({
      name: 'Techofay Platform Administration',
      subdomain: 'platform',
      status: TENANT_STATUS.ACTIVE,
      contactEmail: 'admin@techofay.com',
      contactPhone: '+919999900000',
      tier: 'ENTERPRISE',
      settings: { currency: 'INR', timezone: 'Asia/Kolkata' },
    });

    await User.create({
      tenantId: platformTenant._id,
      name: 'Techofay Super Admin',
      email: 'admin@techofay.com',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.SUPER_ADMIN,
      isEmailVerified: true,
    });

    // =========================================================================
    // 2. Tenant 1: "IronPulse Fitness Club" (Mumbai - 2 Branches)
    // =========================================================================
    console.log('[SEED] Creating Tenant 1: IronPulse Fitness Club (Mumbai)...');
    const ironPulseTenant = await Tenant.create({
      name: 'IronPulse Fitness Club',
      subdomain: 'ironpulse',
      status: TENANT_STATUS.ACTIVE,
      contactEmail: 'owner@ironpulse.com',
      contactPhone: '+919820011000',
      tier: 'PROFESSIONAL',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        brandColor: '#10b981',
        gstin: '27AABCU9603R1ZM',
      },
    });

    const bandraBranch = await Branch.create({
      tenantId: ironPulseTenant._id,
      name: 'IronPulse Flagship - Bandra West',
      code: 'BANDRA',
      address: 'Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+919820011001',
      email: 'bandra@ironpulse.com',
      facilities: ['Olympic Free Weights', 'Cardio Deck', 'CrossFit Rig', 'Steam & Sauna', 'Protein Cafe'],
    });

    const andheriBranch = await Branch.create({
      tenantId: ironPulseTenant._id,
      name: 'IronPulse Studio - Andheri East',
      code: 'ANDHERI',
      address: 'Chakala, Andheri-Kurla Road, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      phone: '+919820011002',
      email: 'andheri@ironpulse.com',
      facilities: ['Functional Training', 'Cardio Area', 'Showers & Lockers'],
    });

    // Staff for IronPulse across all roles
    console.log('[SEED] Creating IronPulse staff across roles...');
    await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Rohan Deshmukh',
      email: 'owner@ironpulse.com',
      phone: '+919820011000',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.GYM_OWNER,
      isEmailVerified: true,
    });

    await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Sneha Patil',
      email: 'manager@ironpulse.com',
      phone: '+919820011003',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.BRANCH_MANAGER,
      isEmailVerified: true,
    });

    await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Kavita Nair',
      email: 'reception@ironpulse.com',
      phone: '+919820011004',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.RECEPTIONIST,
      isEmailVerified: true,
    });

    const ipTrainerUser = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Arjun Khanna',
      email: 'trainer@ironpulse.com',
      phone: '+919820011005',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.TRAINER,
      isEmailVerified: true,
    });

    const ipNutritionistUser = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Dr. Ananya Roy',
      email: 'nutrition@ironpulse.com',
      phone: '+919820011006',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.NUTRITIONIST,
      isEmailVerified: true,
    });

    const ipSalesUser = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Pooja Verma',
      email: 'sales@ironpulse.com',
      phone: '+919820011007',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.SALES_EXEC,
      isEmailVerified: true,
    });

    await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Rajesh Mehta',
      email: 'accounts@ironpulse.com',
      phone: '+919820011008',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.ACCOUNTANT,
      isEmailVerified: true,
    });

    // Plans for IronPulse
    console.log('[SEED] Creating IronPulse membership plans...');
    const ipMonthlyPlan = await Plan.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Monthly Gold',
      code: 'IP-M-GOLD',
      type: PLAN_TYPE.MONTHLY,
      durationDays: 30,
      priceInPaise: 250000, // ₹2,500
      signupFeeInPaise: 50000,
      taxRatePercent: 18,
      description: 'Standard 30-day gym floor access and lockers.',
      isActive: true,
    });

    const ipQuarterlyPlan = await Plan.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Quarterly Pro',
      code: 'IP-Q-PRO',
      type: PLAN_TYPE.QUARTERLY,
      durationDays: 90,
      priceInPaise: 650000, // ₹6,500
      taxRatePercent: 18,
      description: '3-Month transformation pack with body fat assessment.',
      isActive: true,
    });

    const ipAnnualPlan = await Plan.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Annual VIP Club',
      code: 'IP-Y-VIP',
      type: PLAN_TYPE.ANNUAL,
      durationDays: 365,
      priceInPaise: 2000000, // ₹20,000
      taxRatePercent: 18,
      maxFreezes: 2,
      maxFreezeDays: 45,
      description: 'Full multi-branch access, steam room, and 2 guest passes.',
      isActive: true,
    });

    // =========================================================================
    // 3. Tenant 2: "PowerFit Wellness Studio" (Bengaluru - 1 Branch)
    // =========================================================================
    console.log('[SEED] Creating Tenant 2: PowerFit Wellness Studio (Bengaluru)...');
    const powerFitTenant = await Tenant.create({
      name: 'PowerFit Wellness Studio',
      subdomain: 'powerfit',
      status: TENANT_STATUS.ACTIVE,
      contactEmail: 'owner@powerfit.com',
      contactPhone: '+919845011000',
      tier: 'PROFESSIONAL',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        brandColor: '#0ea5e9',
        gstin: '29AABCP1234Q1Z8',
      },
    });

    const indiraBranch = await Branch.create({
      tenantId: powerFitTenant._id,
      name: 'PowerFit Flagship - Indiranagar',
      code: 'INDIRA',
      address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      phone: '+919845011001',
      email: 'indiranagar@powerfit.com',
      facilities: ['Strength Deck', 'Spinning Studio', 'Yoga Lounge', 'Steam Room'],
    });

    await User.create({
      tenantId: powerFitTenant._id,
      branchIds: [indiraBranch._id],
      name: 'Vikramaditya Hegde',
      email: 'owner@powerfit.com',
      phone: '+919845011000',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.GYM_OWNER,
      isEmailVerified: true,
    });

    await User.create({
      tenantId: powerFitTenant._id,
      branchIds: [indiraBranch._id],
      name: 'Deepa Rao',
      email: 'manager@powerfit.com',
      phone: '+919845011002',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.BRANCH_MANAGER,
      isEmailVerified: true,
    });

    const pfMonthlyPlan = await Plan.create({
      tenantId: powerFitTenant._id,
      branchIds: [indiraBranch._id],
      name: 'PowerFit Monthly',
      code: 'PF-M-GOLD',
      type: PLAN_TYPE.MONTHLY,
      durationDays: 30,
      priceInPaise: 300000, // ₹3,000
      taxRatePercent: 18,
      description: 'Monthly unlimited access to gym and functional classes.',
      isActive: true,
    });

    const pfAnnualPlan = await Plan.create({
      tenantId: powerFitTenant._id,
      branchIds: [indiraBranch._id],
      name: 'PowerFit Annual VIP',
      code: 'PF-Y-VIP',
      type: PLAN_TYPE.ANNUAL,
      durationDays: 365,
      priceInPaise: 2400000, // ₹24,000
      taxRatePercent: 18,
      description: 'Full year fitness and wellness membership.',
      isActive: true,
    });

    // =========================================================================
    // 4. Seed 200 Members (140 IronPulse, 60 PowerFit)
    // =========================================================================
    console.log('[SEED] Seeding 200 realistic members with memberships, invoices, payments & attendance...');

    let firstIronPulseMember: any = null;

    const seedTenantMembers = async (
      tenantDoc: any,
      branches: any[],
      plans: any[],
      codePrefix: string,
      targetCount: number,
      currentlyCheckedInTarget: number,
    ) => {
      const now = new Date();
      let currentlyCheckedInCount = 0;

      for (let i = 1; i <= targetCount; i++) {
        const isMale = i % 2 !== 0;
        const firstName = isMale
          ? FIRST_NAMES_MALE[(i - 1) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(i - 1) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
        const memberCode = `${codePrefix}-${String(i).padStart(4, '0')}`;
        const phone = `+9198${String(10000000 + i * 37).slice(0, 8)}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@fitnessclub.test`;
        const branch = branches[(i - 1) % branches.length];
        const plan = plans[(i - 1) % plans.length];

        let status: any = MEMBER_STATUS.ACTIVE;
        let membershipStatus: any = MEMBERSHIP_STATUS.ACTIVE;
        let startDate: Date;
        let endDate: Date;

        if (i % 10 === 0) {
          status = MEMBER_STATUS.ACTIVE;
          membershipStatus = MEMBERSHIP_STATUS.FROZEN;
          startDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() + 70 * 24 * 60 * 60 * 1000);
        } else if (i % 6 === 0) {
          status = MEMBER_STATUS.EXPIRED;
          membershipStatus = MEMBERSHIP_STATUS.EXPIRED;
          startDate = new Date(now.getTime() - (plan.durationDays + 15) * 24 * 60 * 60 * 1000);
          endDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        } else {
          status = MEMBER_STATUS.ACTIVE;
          membershipStatus = MEMBERSHIP_STATUS.ACTIVE;
          startDate = new Date(now.getTime() - ((i % 15) + 1) * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        }

        // 1. Member Document
        const member = await Member.create({
          tenantId: tenantDoc._id,
          branchId: branch._id,
          memberCode,
          firstName,
          lastName,
          email,
          phone,
          gender: isMale ? 'MALE' : 'FEMALE',
          dob: new Date(1985 + (i % 20), (i % 12), (i % 28) + 1),
          address: `${100 + i}, ${branch.name.split('-')[1]?.trim() || branch.city}`,
          emergencyContact: {
            name: `${isMale ? 'Sunita' : 'Vikram'} ${lastName}`,
            phone: `+9198${String(20000000 + i * 19).slice(0, 8)}`,
            relation: isMale ? 'Spouse' : 'Brother',
          },
          fitnessGoals: ['Hypertrophy', 'Fat Loss', 'Cardiovascular Endurance'],
          status,
          joinDate: startDate,
          referralCode: `REF-${memberCode.replace(/[^a-zA-Z0-9]/g, '')}`,
          leaderboardOptIn: true,
        });

        if (!firstIronPulseMember && codePrefix === 'IP-2026') {
          firstIronPulseMember = member;
        }

        // Initialize wallet
        await Wallet.create({
          tenantId: tenantDoc._id,
          memberId: member._id,
          balanceInPaise: i === 1 ? 150000 : 0, // ₹1,500 initial wallet balance for demo
          transactions:
            i === 1
              ? [
                  {
                    type: 'CREDIT',
                    amountInPaise: 150000,
                    balanceAfterInPaise: 150000,
                    reason: 'Referral rewards bonus for inviting 3 gym buddies',
                    timestamp: new Date(),
                  },
                ]
              : [],
        });

        // 2. Invoice Document with GST
        const itemAmount = plan.priceInPaise;
        const taxRate = plan.taxRatePercent || 18;
        const taxAmount = Math.round((itemAmount * taxRate) / 100);
        const grandTotal = itemAmount + taxAmount;
        const invoiceNumber = await Counter.getNextSequence(tenantDoc._id, 'INVOICE', 'INV', '2026-27');

        const isUnpaid = i % 8 === 0;
        const paidAmount = isUnpaid ? 0 : grandTotal;
        const dueAmount = isUnpaid ? grandTotal : 0;
        const invoiceStatus = isUnpaid ? INVOICE_STATUS.UNPAID : INVOICE_STATUS.PAID;

        const invoice = await Invoice.create({
          tenantId: tenantDoc._id,
          branchId: branch._id,
          invoiceNumber,
          financialYear: '2026-27',
          memberId: member._id,
          memberSnapshot: {
            memberId: member._id.toString(),
            memberCode: member.memberCode,
            name: `${member.firstName} ${member.lastName}`,
            email: member.email,
            phone: member.phone,
            address: member.address,
          },
          items: [
            {
              description: `${plan.name} Membership Tenure`,
              quantity: 1,
              unitPriceInPaise: itemAmount,
              amountInPaise: itemAmount,
              taxRatePercent: taxRate,
              taxAmountInPaise: taxAmount,
              planSnapshot: {
                planId: plan._id.toString(),
                planName: plan.name,
                durationDays: plan.durationDays,
              },
            },
          ],
          subtotalInPaise: itemAmount,
          taxTotalInPaise: taxAmount,
          discountInPaise: 0,
          grandTotalInPaise: grandTotal,
          paidAmountInPaise: paidAmount,
          dueAmountInPaise: dueAmount,
          status: invoiceStatus,
          issueDate: startDate,
          dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        });

        // 3. Payment Document
        if (!isUnpaid) {
          const paymentNumber = await Counter.getNextSequence(tenantDoc._id, 'PAYMENT', 'RCPT');
          await Payment.create({
            tenantId: tenantDoc._id,
            branchId: branch._id,
            paymentNumber,
            invoiceId: invoice._id,
            memberId: member._id,
            amountInPaise: grandTotal,
            method: i % 3 === 0 ? PAYMENT_METHOD.UPI : i % 3 === 1 ? PAYMENT_METHOD.CARD : PAYMENT_METHOD.CASH,
            status: PAYMENT_STATUS.SUCCESSFUL,
            transactionRef: `UPI-TXN-${100000 + i}`,
            idempotencyKey: `idemp-seed-${memberCode}`,
          });
        }

        // 4. Membership Document
        await Membership.create({
          tenantId: tenantDoc._id,
          branchId: branch._id,
          memberId: member._id,
          planId: plan._id,
          invoiceId: invoice._id,
          assignedTrainerId: ipTrainerUser._id,
          sessionsRemaining: 8,
          sessionsUsed: 2,
          startDate,
          endDate,
          status: membershipStatus,
          totalAmountInPaise: grandTotal,
          balanceInPaise: dueAmount,
          freezeDaysUsed: membershipStatus === MEMBERSHIP_STATUS.FROZEN ? 7 : 0,
        });

        // 5. Attendance Records (Consecutive streaks for engagement)
        if (status === MEMBER_STATUS.ACTIVE && membershipStatus === MEMBERSHIP_STATUS.ACTIVE) {
          const streakLength = (i % 6) + 1; // 1 to 6 days consecutive check-ins
          for (let dayOffset = streakLength; dayOffset >= 1; dayOffset--) {
            await Attendance.create({
              tenantId: tenantDoc._id,
              branchId: branch._id,
              memberId: member._id,
              checkInTime: new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 + 9 * 3600 * 1000),
              checkOutTime: new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000 + 10.5 * 3600 * 1000),
              method: ATTENDANCE_METHOD.QR,
              deviceId: 'TURNSTILE_01',
            });
          }

          if (currentlyCheckedInCount < currentlyCheckedInTarget && i % 4 === 0) {
            await Attendance.create({
              tenantId: tenantDoc._id,
              branchId: branch._id,
              memberId: member._id,
              checkInTime: new Date(now.getTime() - (15 + i * 2) * 60 * 1000),
              method: ATTENDANCE_METHOD.QR,
              deviceId: 'TURNSTILE_01',
            });
            currentlyCheckedInCount++;
          }
        }
      }

      console.log(`[SEED] Seeded ${targetCount} members for ${tenantDoc.name} (${currentlyCheckedInCount} live on gym floor)`);
    };

    // Seed 140 members for IronPulse & 60 for PowerFit
    await seedTenantMembers(ironPulseTenant, [bandraBranch, andheriBranch], [ipMonthlyPlan, ipQuarterlyPlan, ipAnnualPlan], 'IP-2026', 140, 14);
    await seedTenantMembers(powerFitTenant, [indiraBranch], [pfMonthlyPlan, pfAnnualPlan], 'PF-2026', 60, 6);

    // =========================================================================
    // 5. Seed 150+ Exercises Library & 300+ Indian Foods Database
    // =========================================================================
    console.log(`[SEED] Seeding ${EXERCISE_LIBRARY.length} exercises from comprehensive fitness library...`);
    await Exercise.insertMany(
      EXERCISE_LIBRARY.map((ex) => ({
        tenantId: ironPulseTenant._id,
        ...ex,
        isSystem: true,
      })),
    );

    console.log(`[SEED] Seeding ${INDIAN_FOOD_DATABASE.length} authentic Indian foods with full macros...`);
    await Food.insertMany(
      INDIAN_FOOD_DATABASE.map((f) => ({
        tenantId: ironPulseTenant._id,
        ...f,
        isSystem: true,
      })),
    );

    // =========================================================================
    // 6. Seed CRM Leads (All 7 Pipeline Stages + Lost Reasons + Activities)
    // =========================================================================
    console.log('[SEED] Seeding CRM Leads across all 7 pipeline stages...');
    const leadData = [
      { name: 'Priya Sharma', phone: '+919877712341', email: 'priya.sharma@leadcorp.org', stage: LEAD_PIPELINE_STATUS.NEW, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.WEBSITE, notes: 'Looking for morning CrossFit and personal training.' },
      { name: 'Sameer Sen', phone: '+919877712342', email: 'sameer.sen@leadcorp.org', stage: LEAD_PIPELINE_STATUS.CONTACTED, score: LEAD_SCORE.WARM, source: LEAD_SOURCE.GOOGLE, notes: 'Followed up via WhatsApp. Interested in 3-month package.' },
      { name: 'Ananya Verma', phone: '+919877712343', email: 'ananya.verma@leadcorp.org', stage: LEAD_PIPELINE_STATUS.INTERESTED, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.SOCIAL_MEDIA, notes: 'Wants to lose 8kg before wedding. Very motivated.' },
      { name: 'Kabir Singhal', phone: '+919877712344', email: 'kabir.singhal@leadcorp.org', stage: LEAD_PIPELINE_STATUS.TRIAL_BOOKED, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.WALK_IN, notes: 'Trial scheduled for tomorrow morning.' },
      { name: 'Diya Kulkarni', phone: '+919877712345', email: 'diya.kulkarni@leadcorp.org', stage: LEAD_PIPELINE_STATUS.TRIAL_COMPLETED, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.REFERRAL, notes: 'Loved the trial class with Arjun Khanna. Ready to join.' },
      { name: 'Aditya Pillai', phone: '+919877712346', email: 'aditya.pillai@leadcorp.org', stage: LEAD_PIPELINE_STATUS.CONVERTED, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.ADS, notes: 'Converted to annual member!' },
      { name: 'Manish Dubey', phone: '+919877712347', email: 'manish.dubey@leadcorp.org', stage: LEAD_PIPELINE_STATUS.LOST, score: LEAD_SCORE.COLD, source: LEAD_SOURCE.WALK_IN, lostReason: 'Relocated to Pune for work' },
      { name: 'Tanvi Trivedi', phone: '+919877712348', email: 'tanvi.trivedi@leadcorp.org', stage: LEAD_PIPELINE_STATUS.LOST, score: LEAD_SCORE.COLD, source: LEAD_SOURCE.WEBSITE, lostReason: 'Budget constraints' },
      { name: 'Vikram Joshi', phone: '+919877712349', email: 'vikram.joshi@leadcorp.org', stage: LEAD_PIPELINE_STATUS.NEW, score: LEAD_SCORE.WARM, source: LEAD_SOURCE.WHATSAPP, notes: 'Enquired about couple discount.' },
      { name: 'Rhea Bhatia', phone: '+919877712350', email: 'rhea.bhatia@leadcorp.org', stage: LEAD_PIPELINE_STATUS.CONTACTED, score: LEAD_SCORE.HOT, source: LEAD_SOURCE.SOCIAL_MEDIA, notes: 'Called today at 11 AM. Requested gym tour on Saturday.' },
    ];

    for (const ld of leadData) {
      const lead = await Lead.create({
        tenantId: ironPulseTenant._id,
        branchId: bandraBranch._id,
        name: ld.name,
        email: ld.email,
        phone: ld.phone,
        source: ld.source,
        pipelineStatus: ld.stage,
        leadScore: ld.score,
        assignedToStaffId: ipSalesUser._id,
        notes: ld.notes,
        lostReason: ld.lostReason,
        followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });

      await LeadActivity.create({
        tenantId: ironPulseTenant._id,
        leadId: lead._id,
        staffId: ipSalesUser._id,
        type: ld.stage === LEAD_PIPELINE_STATUS.NEW ? 'NOTE' : 'CALL',
        content: `Lead status updated to ${ld.stage}. ${ld.notes || ld.lostReason || ''}`.trim(),
      });
    }

    // =========================================================================
    // 7. Seed Trainers & PT Packages & Commissions & Reviews
    // =========================================================================
    console.log('[SEED] Creating Trainer profiles, PT Packages, and Ratings...');
    const trainerDoc = await Trainer.create({
      tenantId: ironPulseTenant._id,
      userId: ipTrainerUser._id,
      branchIds: [bandraBranch._id],
      specializations: ['Olympic Weightlifting', 'Functional Hypertrophy', 'Fat Loss Conditioning'],
      qualifications: ['B.Sc. Exercise Science', 'CSCS Certified Strength & Conditioning Specialist'],
      certifications: ['ACE Certified Personal Trainer', 'Kettlebell Athletics Level 2'],
      bio: 'Over 8 years of coaching experience helping clients build lean muscle and recover from injuries.',
      rating: 4.9,
      defaultCommissionRatePercent: 20,
      availabilitySchedule: [
        { dayOfWeek: 'MON', slots: [{ startTime: '06:00', endTime: '12:00' }, { startTime: '16:00', endTime: '21:00' }] },
        { dayOfWeek: 'TUE', slots: [{ startTime: '06:00', endTime: '12:00' }, { startTime: '16:00', endTime: '21:00' }] },
        { dayOfWeek: 'WED', slots: [{ startTime: '06:00', endTime: '12:00' }, { startTime: '16:00', endTime: '21:00' }] },
        { dayOfWeek: 'THU', slots: [{ startTime: '06:00', endTime: '12:00' }, { startTime: '16:00', endTime: '21:00' }] },
        { dayOfWeek: 'FRI', slots: [{ startTime: '06:00', endTime: '12:00' }, { startTime: '16:00', endTime: '21:00' }] },
        { dayOfWeek: 'SAT', slots: [{ startTime: '07:00', endTime: '14:00' }] },
      ],
      isActive: true,
    });

    const pt10Pack = await PtPackage.create({
      tenantId: ironPulseTenant._id,
      name: '10-Session Transformation Pack',
      description: 'Personalized 1-on-1 coaching with nutrition roadmap and bio-mechanical analysis.',
      numberOfSessions: 10,
      validityDays: 60,
      priceInPaise: 1500000, // ₹15,000
      trainerCommissionPercent: 20,
      isActive: true,
    });

    await PtPackage.create({
      tenantId: ironPulseTenant._id,
      name: '25-Session Elite Athlete Pack',
      description: 'Comprehensive transformation package with weekly body fat assessment.',
      numberOfSessions: 25,
      validityDays: 120,
      priceInPaise: 3200000, // ₹32,000
      trainerCommissionPercent: 25,
      isActive: true,
    });

    // Trainer Commission
    await Commission.create({
      tenantId: ironPulseTenant._id,
      staffId: ipTrainerUser._id,
      type: 'PT',
      referenceId: pt10Pack._id,
      amountInPaise: 300000, // ₹3,000 commission
      ratePercent: 20,
      status: 'APPROVED',
      periodMonthYear: '2026-10',
    });

    // Reviews for Trainer
    if (firstIronPulseMember) {
      await Review.create({
        tenantId: ironPulseTenant._id,
        branchId: bandraBranch._id,
        memberId: firstIronPulseMember._id,
        trainerId: ipTrainerUser._id,
        rating: 5,
        reviewText: 'Arjun is an incredible trainer! His focus on form during squats and deadlifts corrected my 2-year lower back pain.',
        isPublic: true,
        isApproved: true,
        status: 'APPROVED',
      });
    }

    // =========================================================================
    // 8. Seed Classes, Trials & Bookings (with Waitlist)
    // =========================================================================
    console.log('[SEED] Creating Group Classes & Bookings with Waitlist...');
    const hiitClass = await Class.create({
      tenantId: ironPulseTenant._id,
      branchId: bandraBranch._id,
      name: 'High Intensity HIIT Blast',
      description: '45-minute metabolic conditioning circuit combining assault bike, kettlebells, and plyometrics.',
      trainerId: ipTrainerUser._id,
      scheduleDays: ['MON', 'WED', 'FRI'],
      startTime: '07:00',
      endTime: '07:45',
      capacity: 5, // low capacity to demonstrate filled class & waitlist
      waitlistCapacity: 3,
      color: '#ef4444',
      isActive: true,
    });

    const yogaClass = await Class.create({
      tenantId: ironPulseTenant._id,
      branchId: bandraBranch._id,
      name: 'Power Vinyasa Flow Yoga',
      description: 'Dynamic breath-synchronized yoga sequence focusing on core strength and flexibility.',
      trainerId: ipTrainerUser._id,
      scheduleDays: ['TUE', 'THU', 'SAT'],
      startTime: '08:00',
      endTime: '09:00',
      capacity: 15,
      waitlistCapacity: 5,
      color: '#10b981',
      isActive: true,
    });

    // Seed 5 confirmed bookings and 2 waitlist bookings for tomorrow's HIIT class
    const tomorrowSlot = new Date();
    tomorrowSlot.setDate(tomorrowSlot.getDate() + 1);
    tomorrowSlot.setHours(7, 0, 0, 0);

    const membersForBooking = await Member.find({ tenantId: ironPulseTenant._id }).limit(7);
    for (let i = 0; i < membersForBooking.length; i++) {
      const isWaitlist = i >= 5;
      await Booking.create({
        tenantId: ironPulseTenant._id,
        branchId: bandraBranch._id,
        memberId: membersForBooking[i]._id,
        classId: hiitClass._id,
        slotTime: tomorrowSlot,
        status: isWaitlist ? 'WAITLIST' : 'CONFIRMED',
        waitlistPosition: isWaitlist ? i - 4 : undefined,
      });
    }

    // Trial
    await Trial.create({
      tenantId: ironPulseTenant._id,
      branchId: bandraBranch._id,
      name: 'Kabir Singhal',
      phone: '+919877712344',
      classId: hiitClass._id,
      trainerId: ipTrainerUser._id,
      slotTime: tomorrowSlot,
      status: 'SCHEDULED',
      notes: 'First time working out in 6 months.',
    });

    // =========================================================================
    // 9. Seed Workout Plans, Templates & Member Workout Logs
    // =========================================================================
    console.log('[SEED] Creating Workout Plans, Templates and Logs...');
    const exercisesInDb = await Exercise.find({ tenantId: ironPulseTenant._id }).limit(10);
    const squatEx = exercisesInDb[0];
    const benchEx = exercisesInDb[1] || exercisesInDb[0];
    const deadliftEx = exercisesInDb[2] || exercisesInDb[0];

    const workoutTemplate = await WorkoutPlan.create({
      tenantId: ironPulseTenant._id,
      createdByTrainerId: ipTrainerUser._id,
      title: '3-Day Strength & Hypertrophy Foundation',
      description: 'Proven full-body progressive overload template for intermediate lifters.',
      daysPerWeek: 3,
      isTemplate: true,
      schedule: [
        {
          dayOfWeek: 'MON',
          focus: 'Full Body Push & Squat Focus',
          exercises: [
            { exerciseId: squatEx._id, sets: 4, reps: 8, weightInKg: 80, restSeconds: 90, notes: 'Warm up thoroughly' },
            { exerciseId: benchEx._id, sets: 4, reps: 10, weightInKg: 60, restSeconds: 90 },
          ],
        },
        {
          dayOfWeek: 'WED',
          focus: 'Full Body Hinge & Pull Focus',
          exercises: [
            { exerciseId: deadliftEx._id, sets: 3, reps: 5, weightInKg: 100, restSeconds: 120 },
          ],
        },
        {
          dayOfWeek: 'FRI',
          focus: 'Full Body Hypertrophy Pump',
          exercises: [
            { exerciseId: squatEx._id, sets: 3, reps: 12, weightInKg: 65, restSeconds: 60 },
            { exerciseId: benchEx._id, sets: 3, reps: 12, weightInKg: 50, restSeconds: 60 },
          ],
        },
      ],
      isActive: true,
    });

    if (firstIronPulseMember) {
      // Assign to member
      await WorkoutPlan.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        createdByTrainerId: ipTrainerUser._id,
        title: `3-Day Strength - ${firstIronPulseMember.firstName}`,
        description: workoutTemplate.description,
        daysPerWeek: 3,
        schedule: workoutTemplate.schedule,
        startDate: new Date(),
        isActive: true,
      });

      // Member workout log
      await WorkoutLog.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        title: 'Push Day Workout',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        durationMinutes: 55,
        exercises: [
          { exerciseId: squatEx._id, exerciseName: squatEx.name, setsCompleted: 4, repsCompleted: 8, weightKg: 85 },
          { exerciseId: benchEx._id, exerciseName: benchEx.name, setsCompleted: 4, repsCompleted: 10, weightKg: 65 },
        ],
        notes: 'Felt strong on bench press today. Hit new 5-rep PR.',
      });
    }

    // =========================================================================
    // 10. Seed Nutrition Plans, Water Logs & Assessments
    // =========================================================================
    console.log('[SEED] Creating Nutrition Plans and Fitness Assessments...');
    if (firstIronPulseMember) {
      await Nutrition.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        createdByStaffId: ipNutritionistUser._id,
        title: 'Lean Muscle Hypertrophy Diet Plan',
        dailyCalorieTarget: 2450,
        proteinGrams: 165,
        carbsGrams: 280,
        fatsGrams: 65,
        waterIntakeLiters: 3.5,
        meals: [
          {
            mealName: 'Breakfast (8:00 AM)',
            time: '08:00',
            foods: [
              { foodName: 'Oats with Milk & Honey', quantity: '1 bowl', calories: 350, protein: 12, carbs: 55, fats: 8 },
              { foodName: 'Boiled Whole Eggs', quantity: '3 eggs', calories: 216, protein: 19, carbs: 1, fats: 14 },
            ],
          },
          {
            mealName: 'Lunch (1:30 PM)',
            time: '13:30',
            foods: [
              { foodName: 'Whole Wheat Roti', quantity: '3 rotis', calories: 255, protein: 9, carbs: 52, fats: 1 },
              { foodName: 'Chicken Breast Curry / Paneer Bhurji', quantity: '1 katori', calories: 260, protein: 28, carbs: 6, fats: 12 },
              { foodName: 'Yellow Moong Dal', quantity: '1 katori', calories: 145, protein: 8, carbs: 20, fats: 3 },
            ],
          },
          {
            mealName: 'Evening Pre-Workout (5:30 PM)',
            time: '17:30',
            foods: [
              { foodName: 'Fresh Banana & Black Coffee', quantity: '1 banana', calories: 105, protein: 1, carbs: 27, fats: 0 },
            ],
          },
          {
            mealName: 'Dinner (8:30 PM)',
            time: '20:30',
            foods: [
              { foodName: 'Steamed Brown Rice', quantity: '1 cup', calories: 185, protein: 5, carbs: 39, fats: 2 },
              { foodName: 'Tandoori Chicken Tikka / Soya Chunks', quantity: '150g', calories: 240, protein: 32, carbs: 4, fats: 9 },
            ],
          },
        ],
        notes: 'Drink at least 1 glass of water every 2 hours. Keep sodium moderate.',
        status: 'APPROVED',
        approvedByNutritionistId: ipNutritionistUser._id,
        approvedAt: new Date(),
        isActive: true,
      });

      // Water log
      await WaterLog.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        amountLiters: 2.8,
        date: new Date(),
      });

      // Assessments with milestones & before/after photos
      await Assessment.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        conductedByTrainerId: ipTrainerUser._id,
        date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        weightKg: 84.5,
        heightCm: 178,
        bmi: 26.7,
        bodyFatPercent: 22.5,
        muscleMassKg: 38.0,
        chestCm: 102,
        waistCm: 88,
        armsCm: 36,
        notes: 'Baseline initial fitness assessment.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80', type: 'FRONT' },
          { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', type: 'SIDE' },
        ],
        goals: [
          { goalType: 'Weight Reduction', targetValue: 79, achieved: false, milestoneBadge: 'Goal: 79kg' },
          { goalType: 'Bench Press', targetValue: 80, achieved: true, milestoneBadge: '80kg Club' },
        ],
      });

      await Assessment.create({
        tenantId: ironPulseTenant._id,
        memberId: firstIronPulseMember._id,
        conductedByTrainerId: ipTrainerUser._id,
        date: new Date(), // today
        weightKg: 80.2,
        heightCm: 178,
        bmi: 25.3,
        bodyFatPercent: 18.2,
        muscleMassKg: 39.8,
        chestCm: 105,
        waistCm: 82,
        armsCm: 38,
        notes: 'Impressive progress! Waist decreased by 6cm while muscle mass increased by 1.8kg.',
        photos: [
          { url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', type: 'FRONT' },
          { url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80', type: 'SIDE' },
        ],
        goals: [
          { goalType: 'Weight Reduction', targetValue: 79, achieved: false, milestoneBadge: 'Goal: 79kg' },
          { goalType: 'Bench Press', targetValue: 80, achieved: true, milestoneBadge: '80kg Club' },
          { goalType: 'Sub-20 Body Fat', targetValue: 20, achieved: true, milestoneBadge: 'Lean Physique' },
        ],
      });
    }

    console.log('============================================================');
    console.log('PHASE 3 COMPREHENSIVE CRM & FITNESS SEED COMPLETED!');
    console.log('============================================================');
    console.log('CRM Leads:        10 across all 7 stages (Hot/Warm/Cold, Activities, Lost reasons)');
    console.log('Exercise Library: 150+ Exercises with muscle groups, instructions, equipment');
    console.log('Food Database:    300+ Indian Foods with calories, protein, carbs, fats');
    console.log('Classes & Trials: Group classes with atomic capacity & waitlists');
    console.log('Trainers & PT:    Trainer profile, PT packages, commissions, ratings');
    console.log('Fitness & Diets:  Workouts, meal schedules, water logs, before/after assessments');
    console.log('Engagement:       Attendance streaks, leaderboard, wallet ledger rewards');
    console.log('============================================================');
  });

  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}
