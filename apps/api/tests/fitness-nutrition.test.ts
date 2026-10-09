import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { WorkoutService } from '../src/services/workoutService.js';
import { NutritionService } from '../src/services/nutritionService.js';
import { AssessmentService } from '../src/services/assessmentService.js';
import { EngagementService } from '../src/services/engagementService.js';
import { TrainerService } from '../src/services/trainerService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { User } from '../src/models/User.js';
import { Member } from '../src/models/Member.js';
import { Exercise } from '../src/models/Exercise.js';
import { Food } from '../src/models/Food.js';
import { Wallet } from '../src/models/Wallet.js';
import { Trainer } from '../src/models/Trainer.js';
import { PtPackage } from '../src/models/PtPackage.js';
import { SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';
import { runInContext } from '../src/context/requestContext.js';

describe('Fitness, Nutrition, Assessments, Trainers & Engagement Services', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let trainerUserId: string;
  let trainerId: string;
  let nutritionistUserId: string;
  let member1: any;
  let member2: any;
  let squatExercise: any;
  let benchExercise: any;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-fitness-test',
      contactEmail: 'contact@ironpulse-fitness.org',
      contactPhone: '+919820011777',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC-FIT',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011776',
      email: 'bkc@ironpulse-fitness.org',
    });
    branchId = branch._id.toString();

    const trainerUser = await User.create({
      tenantId: tenant._id,
      name: 'Kabir Bhasin',
      email: 'trainer.fit@ironpulse-fitness.org',
      passwordHash: 'hash123',
      role: 'TRAINER',
      status: 'ACTIVE',
    });
    trainerUserId = trainerUser._id.toString();

    const trainerDoc = await Trainer.create({
      tenantId: tenant._id,
      userId: trainerUser._id,
      name: 'Kabir Bhasin',
      email: 'trainer.fit@ironpulse-fitness.org',
      specializations: ['Strength & Conditioning', 'Olympic Weightlifting'],
      certifications: ['CSCS', 'CrossFit Level 2'],
      commissionRatePercent: 25,
    });
    trainerId = trainerDoc._id.toString();

    const nutritionistUser = await User.create({
      tenantId: tenant._id,
      name: 'Dr. Riya Sen',
      email: 'nutritionist.fit@ironpulse-fitness.org',
      passwordHash: 'hash123',
      role: 'NUTRITIONIST',
      status: 'ACTIVE',
    });
    nutritionistUserId = nutritionistUser._id.toString();

    member1 = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-FIT-001',
      firstName: 'Aarav',
      lastName: 'Nambiar',
      email: 'aarav.nambiar@ironpulse-fitness.org',
      phone: '+919844455566',
      gender: 'MALE',
      dob: new Date('1994-06-12'),
      status: 'ACTIVE',
      leaderboardOptIn: true,
      referralCode: 'AARAV2026',
    });

    member2 = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-FIT-002',
      firstName: 'Kavita',
      lastName: 'Iyer',
      email: 'kavita.iyer@ironpulse-fitness.org',
      phone: '+919844455577',
      gender: 'FEMALE',
      dob: new Date('1997-09-24'),
      status: 'ACTIVE',
      leaderboardOptIn: true,
      referralCode: 'KAVITA2026',
      referredByMemberId: member1._id,
    });

    squatExercise = await Exercise.create({
      tenantId: tenant._id,
      name: 'Barbell Back Squat',
      category: 'Strength',
      targetMuscleGroup: 'Quads',
      secondaryMuscles: ['Glutes', 'Hamstrings'],
      difficulty: 'INTERMEDIATE',
      equipmentRequired: 'Squat Rack & Olympic Barbell',
      instructions: 'Bar resting on upper traps. Break at hips and knees, descend below parallel and drive upward.',
      imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80',
    });

    benchExercise = await Exercise.create({
      tenantId: tenant._id,
      name: 'Barbell Flat Bench Press',
      category: 'Strength',
      targetMuscleGroup: 'Chest',
      secondaryMuscles: ['Triceps', 'Shoulders'],
      difficulty: 'INTERMEDIATE',
      equipmentRequired: 'Bench & Barbell',
      instructions: 'Lower bar to mid-chest with elbows tucked 45 degrees, press vertically to full extension.',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    });

    await Food.create({
      tenantId: tenant._id,
      name: 'Steamed Brown Rice',
      servingSize: '1 cup (150g)',
      calories: 185,
      proteinGrams: 4.5,
      carbsGrams: 38.5,
      fatsGrams: 1.6,
      category: 'Breads & Grains',
    });

    await Food.create({
      tenantId: tenant._id,
      name: 'Paneer Bhurji',
      servingSize: '1 cup (150g)',
      calories: 280,
      proteinGrams: 20.0,
      carbsGrams: 6.0,
      fatsGrams: 20.0,
      category: 'Dairy & Plant Protein',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('Workouts & Exercise Library', () => {
    it('retrieves exercises filtered by target muscle group and difficulty', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const { exercises: quadExercises } = await WorkoutService.getExercises(tenantId, { muscleGroup: 'Quads' });
        expect(quadExercises.length).toBeGreaterThan(0);
        expect(quadExercises[0].name).toBe('Barbell Back Squat');

        const { exercises: chestExercises } = await WorkoutService.getExercises(tenantId, { muscleGroup: 'Chest' });
        expect(chestExercises.length).toBeGreaterThan(0);
        expect(chestExercises[0].name).toBe('Barbell Flat Bench Press');
      });
    });

    it('creates a workout plan template and assigns it to a member', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const template = await WorkoutService.createPlan(tenantId, {
          createdByTrainerId: trainerUserId,
          title: '3-Day Power Foundation',
          daysPerWeek: 3,
          isTemplate: true,
          schedule: [
            {
              dayOfWeek: 'MON',
              focus: 'Lower Body Strength',
              exercises: [
                { exerciseId: squatExercise._id.toString(), sets: 4, reps: 8, weightInKg: 80, restSeconds: 90 },
              ],
            },
            {
              dayOfWeek: 'WED',
              focus: 'Upper Body Strength',
              exercises: [
                { exerciseId: benchExercise._id.toString(), sets: 4, reps: 10, weightInKg: 60, restSeconds: 90 },
              ],
            },
          ],
        });

        expect(template.isTemplate).toBe(true);

        const assigned = await WorkoutService.assignPlanToMember(tenantId, {
          memberId: member1._id.toString(),
          planId: template._id.toString(),
        });

        expect(assigned).toBeDefined();
        expect(assigned.memberId?.toString()).toBe(member1._id.toString());
        expect(assigned.isTemplate).toBe(false);
        expect(assigned.title).toContain('3-Day Power Foundation');
      });
    });

    it('logs member workout session and calculates completed volume metrics', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const log = await WorkoutService.logWorkoutSession(tenantId, {
          memberId: member1._id.toString(),
          title: 'Monday Heavy Squats',
          durationMinutes: 50,
          exercises: [
            {
              exerciseId: squatExercise._id.toString(),
              exerciseName: 'Barbell Back Squat',
              setsCompleted: 4,
              repsCompleted: 8,
              weightKg: 80,
            },
          ],
          notes: 'Felt explosive on 3rd set',
        });

        expect(log).toBeDefined();
        expect(log.durationMinutes).toBe(50);
        expect(log.exercises[0].setsCompleted).toBe(4);

        const progress = await WorkoutService.getMemberProgress(tenantId, member1._id.toString());
        expect(progress.totalSessions).toBeGreaterThan(0);
        expect(progress.totalVolumeKg).toBe(4 * 8 * 80); // 2560 kg
      });
    });
  });

  describe('Nutrition, Macros & Approval Workflow', () => {
    it('calculates personalized BMR, TDEE and macro targets based on member stats and goal', async () => {
      const targets = NutritionService.calculateTargets({
        weightKg: 78,
        heightCm: 178,
        age: 30,
        gender: 'MALE',
        activityLevel: 'MODERATE',
        goal: 'FAT_LOSS',
      });

      expect(targets.bmr).toBeGreaterThan(1500);
      expect(targets.tdee).toBeGreaterThan(targets.dailyCalories); // Caloric deficit for fat loss
      expect(targets.proteinGrams).toBeGreaterThan(130);
      expect(targets.carbsGrams).toBeGreaterThan(100);
      expect(targets.fatsGrams).toBeGreaterThan(30);
    });

    it('searches authentic Indian food database with macros', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const results = await NutritionService.searchFoods(tenantId, 'Paneer');
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toContain('Paneer');
        expect(results[0].proteinGrams).toBeGreaterThan(10);
      });
    });

    it('supports diet plan submission, nutritionist review, approval and water tracking', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        // 1. Create Diet Plan in DRAFT
        const diet = await NutritionService.createDietPlan(tenantId, {
          memberId: member1._id.toString(),
          createdByStaffId: nutritionistUserId,
          title: 'Clean Muscle Hypertrophy Meal Plan',
          dailyCalorieTarget: 2500,
          proteinGrams: 160,
          carbsGrams: 280,
          fatsGrams: 65,
          waterIntakeLiters: 3.5,
          meals: [
            {
              mealName: 'Lunch',
              time: '13:00',
              foods: [
                { foodName: 'Steamed Brown Rice', quantity: '1 cup', calories: 185, protein: 4.5, carbs: 38.5, fats: 1.6 },
                { foodName: 'Paneer Bhurji', quantity: '1 cup', calories: 280, protein: 20, carbs: 6, fats: 20 },
              ],
            },
          ],
        });

        expect(diet.status).toBe('DRAFT');

        // 2. Submit for review
        const submitted = await NutritionService.reviewDietPlan(tenantId, diet._id.toString(), {
          status: 'PENDING_REVIEW',
          reviewerId: nutritionistUserId,
          reviewNotes: 'Ready for nutritionist verification',
        });
        expect(submitted.status).toBe('PENDING_REVIEW');

        // 3. Nutritionist approves plan
        const approved = await NutritionService.reviewDietPlan(tenantId, diet._id.toString(), {
          status: 'APPROVED',
          reviewerId: nutritionistUserId,
          reviewNotes: 'Macros verified and balanced for hypertrophic gains.',
        });
        expect(approved.status).toBe('APPROVED');
        expect(approved.approvedByNutritionistId?.toString()).toBe(nutritionistUserId);

        // 4. Log water intake
        const water = await NutritionService.logWater(tenantId, {
          memberId: member1._id.toString(),
          amountLiters: 3.0,
        });
        expect(water.amountLiters).toBe(3.0);
      });
    });
  });

  describe('Assessments, Milestone Badges & Progress', () => {
    it('creates fitness assessment with auto-calculated BMI, milestone goals and photos', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const assessment = await AssessmentService.createAssessment(tenantId, {
          memberId: member1._id.toString(),
          conductedByTrainerId: trainerUserId,
          weightKg: 78.5,
          heightCm: 178,
          bodyFatPercent: 18.5,
          muscleMassKg: 38.2,
          chestCm: 104,
          waistCm: 83,
          armsCm: 37,
          photos: [
            { url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80', type: 'FRONT' },
            { url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80', type: 'SIDE' },
          ],
          goals: [
            { goalType: 'Bench Press', targetValue: 100, achieved: true, milestoneBadge: 'Century Club 100kg' },
          ],
        });

        expect(assessment).toBeDefined();
        expect(assessment.bmi).toBeCloseTo(24.78, 1); // 78.5 / (1.78 * 1.78)
        expect(assessment.goals[0].milestoneBadge).toBe('Century Club 100kg');

        const result = await AssessmentService.getMemberAssessments(tenantId, member1._id.toString());
        expect(result.assessments.length).toBeGreaterThan(0);
        expect(result.assessments[0].weightKg).toBe(78.5);
      });
    });
  });

  describe('Trainers, PT Packages & Commissions', () => {
    it('creates PT package and manages trainer commissions', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const ptPackage = await PtPackage.create({
          tenantId: new Types.ObjectId(tenantId),
          name: '12-Session Strength Masterclass',
          numberOfSessions: 12,
          priceInPaise: 1800000, // Rs. 18,000
          validityDays: 60,
        });

        expect(ptPackage).toBeDefined();

        const profile = await TrainerService.getTrainerProfile(tenantId, trainerId);
        expect(profile).toBeDefined();
        expect(profile.commissionRatePercent).toBe(25);
      });
    });
  });

  describe('Member Engagement: Streaks, Leaderboard & Transactional Wallet Ledger', () => {
    it('calculates attendance streaks and opt-in leaderboard', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const streak = await EngagementService.getAttendanceStreak(tenantId, member1._id.toString());
        expect(typeof streak.currentStreakDays).toBe('number');

        const leaderboard = await EngagementService.getLeaderboard(tenantId);
        expect(Array.isArray(leaderboard)).toBe(true);
        // Both members opted in, should be included
        const foundAarav = leaderboard.find((l: any) => l.name.includes('Aarav'));
        expect(foundAarav).toBeDefined();
      });
    });

    it('credits referral reward via immutable transactional wallet ledger (never bare balance)', async () => {
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const refCreated = await EngagementService.createReferral(tenantId, {
          referrerMemberId: member1._id.toString(),
          referredName: 'Kavita Iyer',
          referredPhone: '+919844455577',
        });

        const referralResult = await EngagementService.rewardReferral(
          tenantId,
          refCreated.referral._id.toString(),
          50000,
          'Referral reward credit for inviting a new member',
        );

        expect(referralResult).toBeDefined();
        expect(referralResult.wallet.balanceInPaise).toBe(50000);
        expect(referralResult.creditedAmountInPaise).toBe(50000);
        expect(referralResult.newBalanceInPaise).toBe(50000);

        // Verify wallet document in database has transactional ledger
        const walletDoc = await Wallet.findOne({
          tenantId: new Types.ObjectId(tenantId),
          memberId: member1._id,
        });

        expect(walletDoc).not.toBeNull();
        expect(walletDoc!.balanceInPaise).toBe(50000);
        expect(walletDoc!.transactions.length).toBe(1);
        expect(walletDoc!.transactions[0].reason).toContain('Referral reward');

        // Second credit - verify cumulative ledger
        const refCreated2 = await EngagementService.createReferral(tenantId, {
          referrerMemberId: member1._id.toString(),
          referredName: 'Sameer Joshi',
          referredPhone: '+919844455588',
        });

        const secondCredit = await EngagementService.rewardReferral(
          tenantId,
          refCreated2.referral._id.toString(),
          25000,
          'Second referral reward',
        );

        expect(secondCredit.wallet.balanceInPaise).toBe(75000);
        expect(secondCredit.newBalanceInPaise).toBe(75000);

        const updatedWallet = await Wallet.findOne({
          tenantId: new Types.ObjectId(tenantId),
          memberId: member1._id,
        });

        expect(updatedWallet!.transactions.length).toBe(2);
        // Verify balance strictly equals sum of credits minus debits
        const computedSum = updatedWallet!.transactions.reduce(
          (sum, t) => sum + (t.type === 'CREDIT' ? t.amountInPaise : -t.amountInPaise),
          0,
        );
        expect(updatedWallet!.balanceInPaise).toBe(computedSum);
      });
    });
  });
});
