import mongoose from 'mongoose';
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
} from '../models/index.js';
import { AuthService } from '../services/authService.js';
import { runInContext } from '../context/requestContext.js';

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
    console.log('[SEED] Cleaning existing seed data (if any)...');
    await Promise.all([
      Tenant.deleteMany({ subdomain: { $in: ['platform', 'ironpulse'] } }),
      Counter.deleteMany({}),
    ]);

    const defaultPassword = 'Password@123';
    const defaultPasswordHash = await AuthService.hashPassword(defaultPassword);

  // 1. SaaS Platform Super Admin Organization
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

  // 2. Demo Gym Tenant: "IronPulse Fitness Club"
  console.log('[SEED] Creating Demo Tenant: IronPulse Fitness Club...');
  const gymTenant = await Tenant.create({
    name: 'IronPulse Fitness Club',
    subdomain: 'ironpulse',
    status: TENANT_STATUS.ACTIVE,
    contactEmail: 'owner@ironpulse.com',
    contactPhone: '+919876500001',
    tier: 'PROFESSIONAL',
    settings: {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      brandColor: '#10b981',
      gstin: '27AABCU9603R1ZM',
    },
  });

  // 3. Branches
  const bandraBranch = await Branch.create({
    tenantId: gymTenant._id,
    name: 'IronPulse Flagship - Bandra West',
    code: 'BANDRA',
    address: 'Linking Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    phone: '+919876500001',
    email: 'bandra@ironpulse.com',
    facilities: ['Olympic Weightlifting', 'CrossFit Area', 'Steam & Sauna', 'Juice Bar'],
  });

  const andheriBranch = await Branch.create({
    tenantId: gymTenant._id,
    name: 'IronPulse Studio - Andheri East',
    code: 'ANDHERI',
    address: 'Chakala, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    phone: '+919876500002',
    email: 'andheri@ironpulse.com',
    facilities: ['Cardio Deck', 'Functional Rig', 'Shower Rooms'],
  });

  // 4. Staff across all 9 roles
  console.log('[SEED] Creating staff across 9 roles...');
  const owner = await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id, andheriBranch._id],
    name: 'Rohan Deshmukh',
    email: 'owner@ironpulse.com',
    phone: '+919876500001',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.GYM_OWNER,
    isEmailVerified: true,
  });

  const manager = await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Sneha Patil',
    email: 'manager@ironpulse.com',
    phone: '+919876500003',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.BRANCH_MANAGER,
    isEmailVerified: true,
  });

  await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Kavita Nair',
    email: 'reception@ironpulse.com',
    phone: '+919876500004',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.RECEPTIONIST,
    isEmailVerified: true,
  });

  const trainer = await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Arjun Khanna',
    email: 'trainer@ironpulse.com',
    phone: '+919876500005',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.TRAINER,
    isEmailVerified: true,
  });

  await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Dr. Ananya Roy',
    email: 'nutrition@ironpulse.com',
    phone: '+919876500006',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.NUTRITIONIST,
    isEmailVerified: true,
  });

  await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Pooja Verma',
    email: 'sales@ironpulse.com',
    phone: '+919876500007',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.SALES_EXEC,
    isEmailVerified: true,
  });

  await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id, andheriBranch._id],
    name: 'Rajesh Mehta',
    email: 'accounts@ironpulse.com',
    phone: '+919876500008',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.ACCOUNTANT,
    isEmailVerified: true,
  });

  // 5. Membership Plans
  console.log('[SEED] Creating Membership Plans (Money in Integer Paise)...');
  const monthlyPlan = await Plan.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id, andheriBranch._id],
    name: 'Monthly Gold',
    code: 'M-GOLD',
    type: PLAN_TYPE.MONTHLY,
    durationDays: 30,
    priceInPaise: 250000, // INR 2,500.00
    signupFeeInPaise: 50000, // INR 500.00
    taxRatePercent: 18,
    description: 'Full gym floor access, cardio equipment and lockers for 30 days.',
  });

  const annualPlan = await Plan.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id, andheriBranch._id],
    name: 'Annual Elite Club',
    code: 'Y-ELITE',
    type: PLAN_TYPE.ANNUAL,
    durationDays: 365,
    priceInPaise: 2000000, // INR 20,000.00
    signupFeeInPaise: 0,
    taxRatePercent: 18,
    maxFreezes: 2,
    maxFreezeDays: 45,
    description: 'All-inclusive multi-branch access, 2 guest passes, and steam room.',
  });

  // 6. Gym Members
  console.log('[SEED] Creating Gym Members & Invoices...');
  const memberUser = await User.create({
    tenantId: gymTenant._id,
    branchIds: [bandraBranch._id],
    name: 'Aarav Mehta',
    email: 'member@ironpulse.com',
    phone: '+919811122233',
    passwordHash: defaultPasswordHash,
    role: USER_ROLES.MEMBER,
    isEmailVerified: true,
  });

  const member = await Member.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    memberCode: 'MEM-0001',
    userId: memberUser._id,
    firstName: 'Aarav',
    lastName: 'Mehta',
    email: 'member@ironpulse.com',
    phone: '+919811122233',
    gender: 'MALE',
    dob: new Date('1994-05-15'),
    address: 'Bandra West, Mumbai',
    status: MEMBER_STATUS.ACTIVE,
    fitnessGoals: ['Hypertrophy', 'Fat Loss'],
  });

  // Membership & Invoice for Aarav
  const now = new Date();
  const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const invoiceNumber = await Counter.getNextSequence(gymTenant._id, 'INVOICE', 'INV', '2026-2027');

  const invoice = await Invoice.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    invoiceNumber,
    financialYear: '2026-2027',
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
        description: 'Annual Elite Club Membership (1 Year)',
        quantity: 1,
        unitPriceInPaise: 2000000,
        amountInPaise: 2000000,
        taxRatePercent: 18,
        taxAmountInPaise: 360000,
        planSnapshot: {
          planId: annualPlan._id.toString(),
          planName: annualPlan.name,
          durationDays: 365,
        },
      },
    ],
    subtotalInPaise: 2000000,
    taxTotalInPaise: 360000,
    discountInPaise: 0,
    grandTotalInPaise: 2360000, // INR 23,600.00
    paidAmountInPaise: 2360000,
    dueAmountInPaise: 0,
    status: INVOICE_STATUS.PAID,
    dueDate: now,
    issueDate: now,
  });

  const membership = await Membership.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    memberId: member._id,
    planId: annualPlan._id,
    invoiceId: invoice._id,
    startDate: now,
    endDate,
    status: MEMBERSHIP_STATUS.ACTIVE,
    totalAmountInPaise: 2360000,
    balanceInPaise: 0,
  });

  await Payment.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    paymentNumber: 'PAY-2026-0001',
    invoiceId: invoice._id,
    memberId: member._id,
    amountInPaise: 2360000,
    method: PAYMENT_METHOD.UPI,
    status: PAYMENT_STATUS.SUCCESSFUL,
    idempotencyKey: 'idemp_seed_pay_001',
  });

  // 7. Attendance Log
  await Attendance.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    memberId: member._id,
    checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    checkOutTime: new Date(Date.now() - 30 * 60 * 1000),
    method: ATTENDANCE_METHOD.QR,
    notes: 'Bandra turnstile entry',
  });

  // 8. CRM Leads
  console.log('[SEED] Creating CRM Leads...');
  await Lead.create({
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    name: 'Priya Sharma',
    email: 'priya.sharma@example-fake.org',
    phone: '+919877712345',
    source: LEAD_SOURCE.WALK_IN,
    pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_BOOKED,
    leadScore: LEAD_SCORE.HOT,
    notes: 'Interested in personal training and group Pilates classes.',
  });

  // 9. Exercises & Classes
  console.log('[SEED] Creating Exercise Library and Classes...');
  await Exercise.create({
    tenantId: gymTenant._id,
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
    tenantId: gymTenant._id,
    branchId: bandraBranch._id,
    name: 'High Intensity HIIT Blast',
    description: '45-minute metabolic conditioning circuit.',
    trainerId: trainer._id,
    scheduleDays: ['MON', 'WED', 'FRI'],
    startTime: '07:00',
    endTime: '07:45',
    capacity: 20,
    waitlistCapacity: 5,
    isActive: true,
  });

  console.log('------------------------------------------------------------');
  console.log('SEED COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------------');
  console.log('Super Admin Credentials:');
  console.log('  Email:    admin@techofay.com');
  console.log('  Password: Password@123');
  console.log('');
  console.log('Gym Owner Credentials (IronPulse Fitness Club):');
  console.log('  Subdomain: ironpulse');
  console.log('  Email:     owner@ironpulse.com');
  console.log('  Password:  Password@123');
  console.log('');
  console.log('Branch Manager Credentials:');
  console.log('  Email:     manager@ironpulse.com');
  console.log('  Password:  Password@123');
  console.log('');
  console.log('Member Credentials:');
  console.log('  Email:     member@ironpulse.com');
  console.log('  Password:  Password@123');
  console.log('------------------------------------------------------------');
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
