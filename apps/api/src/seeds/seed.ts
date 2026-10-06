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
  Class,
  Exercise,
  Counter,
  Locker,
  Commission,
  Staff,
} from '../models/index.js';
import { AuthService } from '../services/authService.js';
import { runInContext } from '../context/requestContext.js';

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
  let mongoServer: any = null;
  const uri = customMongoUri || env.MONGODB_URI;

  if (mongoose.connection.readyState !== 1) {
    try {
      console.log(`[SEED] Connecting to database at ${uri}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    } catch {
      console.log('[SEED] Local MongoDB is not running. Starting embedded in-memory database to seed...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      console.log(`[SEED] Connected to embedded in-memory database at ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
    }
  }

  await runInContext({ isSuperAdmin: true }, async () => {
    console.log('[SEED] Cleaning existing seed data (platform, ironpulse, powerfit)...');
    await Promise.all([
      Tenant.deleteMany({ subdomain: { $in: ['platform', 'ironpulse', 'powerfit'] } }),
      Counter.deleteMany({}),
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

    // Staff for IronPulse across all 9 roles
    console.log('[SEED] Creating IronPulse staff across roles...');
    const ipOwner = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id, andheriBranch._id],
      name: 'Rohan Deshmukh',
      email: 'owner@ironpulse.com',
      phone: '+919820011000',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.GYM_OWNER,
      isEmailVerified: true,
    });

    const ipManager = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Sneha Patil',
      email: 'manager@ironpulse.com',
      phone: '+919820011003',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.BRANCH_MANAGER,
      isEmailVerified: true,
    });

    const ipReception = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Kavita Nair',
      email: 'reception@ironpulse.com',
      phone: '+919820011004',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.RECEPTIONIST,
      isEmailVerified: true,
    });

    const ipTrainer = await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Arjun Khanna',
      email: 'trainer@ironpulse.com',
      phone: '+919820011005',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.TRAINER,
      isEmailVerified: true,
    });

    await User.create({
      tenantId: ironPulseTenant._id,
      branchIds: [bandraBranch._id],
      name: 'Dr. Ananya Roy',
      email: 'nutrition@ironpulse.com',
      phone: '+919820011006',
      passwordHash: defaultPasswordHash,
      role: USER_ROLES.NUTRITIONIST,
      isEmailVerified: true,
    });

    await User.create({
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

        // Status distribution: ~75% ACTIVE, ~18% EXPIRED, ~7% FROZEN
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

        // 3. Payment Document (if paid)
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
          startDate,
          endDate,
          status: membershipStatus,
          totalAmountInPaise: grandTotal,
          balanceInPaise: dueAmount,
          freezeDaysUsed: membershipStatus === MEMBERSHIP_STATUS.FROZEN ? 7 : 0,
        });

        // 5. Attendance Records
        if (status === MEMBER_STATUS.ACTIVE && membershipStatus === MEMBERSHIP_STATUS.ACTIVE) {
          // Historical completed workouts
          await Attendance.create({
            tenantId: tenantDoc._id,
            branchId: branch._id,
            memberId: member._id,
            checkInTime: new Date(now.getTime() - 26 * 60 * 60 * 1000),
            checkOutTime: new Date(now.getTime() - 25 * 60 * 60 * 1000),
            method: ATTENDANCE_METHOD.QR,
            deviceId: 'TURNSTILE_01',
          });

          // Live checked-in members inside the gym right now
          if (currentlyCheckedInCount < currentlyCheckedInTarget && i % 4 === 0) {
            await Attendance.create({
              tenantId: tenantDoc._id,
              branchId: branch._id,
              memberId: member._id,
              checkInTime: new Date(now.getTime() - (15 + i * 2) * 60 * 1000), // checked in 15-45 mins ago
              method: ATTENDANCE_METHOD.QR,
              deviceId: 'TURNSTILE_01',
            });
            currentlyCheckedInCount++;
          }
        }
      }

      console.log(`[SEED] Seeded ${targetCount} members for ${tenantDoc.name} (${currentlyCheckedInCount} live on gym floor)`);
    };

    // Seed 140 members for IronPulse (14 live on floor)
    await seedTenantMembers(
      ironPulseTenant,
      [bandraBranch, andheriBranch],
      [ipMonthlyPlan, ipQuarterlyPlan, ipAnnualPlan],
      'IP-2026',
      140,
      14,
    );

    // Seed 60 members for PowerFit (6 live on floor)
    await seedTenantMembers(
      powerFitTenant,
      [indiraBranch],
      [pfMonthlyPlan, pfAnnualPlan],
      'PF-2026',
      60,
      6,
    );

    // =========================================================================
    // 5. Lockers for IronPulse Bandra West
    // =========================================================================
    console.log('[SEED] Creating Lockers for IronPulse Bandra...');
    const bandraMembers = await Member.find({ branchId: bandraBranch._id }).limit(12);
    for (let i = 1; i <= 20; i++) {
      const lockerNum = `LK-${String(i).padStart(3, '0')}`;
      const isOccupied = i <= bandraMembers.length;
      await Locker.create({
        tenantId: ironPulseTenant._id,
        branchId: bandraBranch._id,
        lockerNumber: lockerNum,
        size: i <= 5 ? 'LARGE' : i <= 15 ? 'MEDIUM' : 'SMALL',
        status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
        assignedMemberId: isOccupied ? bandraMembers[i - 1]._id : undefined,
        assignedFrom: isOccupied ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : undefined,
        assignedUntil: isOccupied ? new Date(Date.now() + 50 * 24 * 60 * 60 * 1000) : undefined,
        feeInPaise: 50000, // ₹500/mo
      });
    }

    // =========================================================================
    // 6. CRM Leads & Classes
    // =========================================================================
    console.log('[SEED] Creating CRM Leads & Exercises...');
    await Lead.create({
      tenantId: ironPulseTenant._id,
      branchId: bandraBranch._id,
      name: 'Priya Sharma',
      email: 'priya.sharma@example-lead.org',
      phone: '+919877712345',
      source: LEAD_SOURCE.WALK_IN,
      pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_BOOKED,
      leadScore: LEAD_SCORE.HOT,
      notes: 'Interested in annual membership and CrossFit classes.',
    });

    await Exercise.create({
      tenantId: ironPulseTenant._id,
      name: 'Barbell Back Squat',
      category: 'Strength',
      targetMuscleGroup: 'Quadriceps',
      secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
      difficulty: 'INTERMEDIATE',
      instructions: 'Place barbell across upper traps. Descend keeping torso upright until thighs are parallel.',
      equipmentRequired: 'Squat Rack & Barbell',
      isSystem: true,
    });

    await Class.create({
      tenantId: ironPulseTenant._id,
      branchId: bandraBranch._id,
      name: 'High Intensity HIIT Blast',
      description: '45-minute metabolic conditioning circuit.',
      trainerId: ipTrainer._id,
      scheduleDays: ['MON', 'WED', 'FRI'],
      startTime: '07:00',
      endTime: '07:45',
      capacity: 20,
      waitlistCapacity: 5,
      isActive: true,
    });

    console.log('============================================================');
    console.log('PHASE 2 COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!');
    console.log('============================================================');
    console.log('Total Tenants:   2 (IronPulse Mumbai, PowerFit Bengaluru)');
    console.log('Total Branches:  3 (Bandra West, Andheri East, Indiranagar)');
    console.log('Total Members:   200 seeded with Memberships, Invoices & Attendance');
    console.log('');
    console.log('Platform Super Admin:');
    console.log('  Email:    admin@techofay.com');
    console.log('  Password: Password@123');
    console.log('');
    console.log('IronPulse Gym Owner (Mumbai):');
    console.log('  Subdomain: ironpulse');
    console.log('  Email:     owner@ironpulse.com');
    console.log('  Password:  Password@123');
    console.log('');
    console.log('PowerFit Gym Owner (Bengaluru):');
    console.log('  Subdomain: powerfit');
    console.log('  Email:     owner@powerfit.com');
    console.log('  Password:  Password@123');
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
