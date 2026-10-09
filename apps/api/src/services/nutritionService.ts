import mongoose, { Types } from 'mongoose';
import {
  Food,
  type IFood,
  Nutrition,
  type INutrition,
  WaterLog,
  type IWaterLog,
  Member,
  User,
} from '../models/index.js';

export class NutritionService {
  /**
   * Scientific BMR / TDEE and Macro Calculator based on Mifflin-St Jeor equation
   */
  static calculateTargets(data: {
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    age: number;
    weightKg: number;
    heightCm: number;
    activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
    goal: 'FAT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN';
  }) {
    // 1. Basal Metabolic Rate (BMR)
    let bmr = 10 * data.weightKg + 6.25 * data.heightCm - 5 * data.age;
    if (data.gender === 'MALE') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // 2. Total Daily Energy Expenditure (TDEE) multipliers
    const activityMultipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };
    const tdee = Math.round(bmr * (activityMultipliers[data.activityLevel] || 1.55));

    // 3. Goal adjustment
    let targetCalories = tdee;
    if (data.goal === 'FAT_LOSS') {
      targetCalories = Math.round(tdee - 500); // 500 kcal deficit
    } else if (data.goal === 'MUSCLE_GAIN') {
      targetCalories = Math.round(tdee + 350); // 350 kcal surplus
    }
    targetCalories = Math.max(1200, targetCalories);

    // 4. Macro Splits: High-protein fitness ratio
    // Protein: 2.0g per kg of bodyweight
    const proteinGrams = Math.round(data.weightKg * 2.0);
    const proteinCalories = proteinGrams * 4;

    // Fats: 25% of total caloric intake
    const fatCalories = targetCalories * 0.25;
    const fatsGrams = Math.round(fatCalories / 9);

    // Carbs: Remaining calories
    const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbsGrams = Math.round(carbCalories / 4);

    // Water: 35ml per kg of bodyweight in liters
    const waterIntakeLiters = parseFloat(((data.weightKg * 38) / 1000).toFixed(1));

    return {
      bmr: Math.round(bmr),
      tdee,
      dailyCalorieTarget: targetCalories,
      dailyCalories: targetCalories,
      proteinGrams,
      carbsGrams,
      fatsGrams,
      waterIntakeLiters: Math.max(2.5, waterIntakeLiters),
    };
  }

  // ==========================================================================
  // FOOD DATABASE
  // ==========================================================================
  static async getFoods(
    tenantId: string,
    filters: {
      category?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(200, Math.max(1, filters.limit || 50));
    const skip = (page - 1) * limit;

    const query: any = {
      $or: [{ tenantId: new Types.ObjectId(tenantId) }, { isSystem: true }],
    };

    if (filters.category) query.category = filters.category;
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$and = [{ $or: [{ name: searchRegex }, { category: searchRegex }] }];
    }

    const [foods, total] = await Promise.all([
      Food.find(query).sort({ category: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Food.countDocuments(query),
    ]);

    return {
      foods,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async searchFoods(tenantId: string, search: string) {
    const res = await this.getFoods(tenantId, { search });
    return res.foods;
  }

  static async createFood(tenantId: string, data: any) {
    return Food.create({
      tenantId: new Types.ObjectId(tenantId),
      name: data.name,
      servingSize: data.servingSize,
      calories: data.calories,
      proteinGrams: data.proteinGrams || 0,
      carbsGrams: data.carbsGrams || 0,
      fatsGrams: data.fatsGrams || 0,
      category: data.category || 'General',
      isSystem: false,
    });
  }

  // ==========================================================================
  // DIET PLANS & NUTRITIONIST APPROVAL FLOW
  // ==========================================================================
  static async getPlans(tenantId: string, memberId?: string) {
    const query: any = { tenantId: new Types.ObjectId(tenantId), isActive: true };
    if (memberId) query.memberId = new Types.ObjectId(memberId);

    return Nutrition.find(query)
      .populate('memberId', 'memberCode firstName lastName')
      .populate('createdByStaffId', 'name email role')
      .populate('approvedByNutritionistId', 'name email')
      .sort({ updatedAt: -1 });
  }

  static async getPlanById(tenantId: string, planId: string) {
    const plan = await Nutrition.findOne({
      _id: new Types.ObjectId(planId),
      tenantId: new Types.ObjectId(tenantId),
    })
      .populate('memberId', 'memberCode firstName lastName')
      .populate('createdByStaffId', 'name email')
      .populate('approvedByNutritionistId', 'name email');

    if (!plan) throw new Error('Nutrition plan not found');
    return plan;
  }

  static async createDietPlan(tenantId: string, data: any, staffId?: string, isNutritionist?: boolean) {
    return this.createPlan(tenantId, data, staffId, isNutritionist);
  }

  static async createPlan(tenantId: string, data: any, staffId?: string, isNutritionist?: boolean) {
    const plan = await Nutrition.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(data.memberId),
      createdByStaffId: staffId ? new Types.ObjectId(staffId) : (data.createdByStaffId ? new Types.ObjectId(data.createdByStaffId) : undefined),
      title: data.title,
      dailyCalorieTarget: data.dailyCalorieTarget,
      proteinGrams: data.proteinGrams || 0,
      carbsGrams: data.carbsGrams || 0,
      fatsGrams: data.fatsGrams || 0,
      waterIntakeLiters: data.waterIntakeLiters || 3,
      meals: data.meals || [],
      notes: data.notes,
      status: data.status || (isNutritionist ? 'APPROVED' : 'DRAFT'),
      approvedByNutritionistId: isNutritionist && staffId ? new Types.ObjectId(staffId) : undefined,
      approvedAt: isNutritionist ? new Date() : undefined,
      isActive: true,
    });

    return plan;
  }

  /**
   * Nutritionist review and approval action
   */
  static async reviewDietPlan(
    tenantId: string,
    planId: string,
    reviewDataOrStatus:
      | 'APPROVED'
      | 'REJECTED'
      | 'PENDING_REVIEW'
      | {
          status: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
          reviewNotes?: string;
          reviewerId?: string;
        },
    reviewNotes?: string,
    nutritionistId?: string,
  ) {
    let resolvedStatus: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
    let resolvedNotes: string | undefined;
    let resolvedReviewerId: string | undefined;

    if (typeof reviewDataOrStatus === 'object') {
      resolvedStatus = reviewDataOrStatus.status;
      resolvedNotes = reviewDataOrStatus.reviewNotes;
      resolvedReviewerId = reviewDataOrStatus.reviewerId;
    } else {
      resolvedStatus = reviewDataOrStatus;
      resolvedNotes = reviewNotes;
      resolvedReviewerId = nutritionistId;
    }

    const plan = await Nutrition.findOne({
      _id: new Types.ObjectId(planId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!plan) throw new Error('Nutrition plan not found');

    plan.status = resolvedStatus;
    plan.reviewNotes = resolvedNotes;
    if (resolvedReviewerId) {
      plan.approvedByNutritionistId = new Types.ObjectId(resolvedReviewerId);
    }
    if (resolvedStatus === 'APPROVED') {
      plan.approvedAt = new Date();
    }
    await plan.save();

    return plan;
  }

  static async reviewPlan(
    tenantId: string,
    planId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
    nutritionistId?: string,
  ) {
    return this.reviewDietPlan(tenantId, planId, status, reviewNotes, nutritionistId);
  }

  // ==========================================================================
  // WATER TRACKING
  // ==========================================================================
  static async logWater(
    tenantId: string,
    memberIdOrData: string | { memberId: string; amountLiters: number; date?: string },
    amountLiters?: number,
    dateStr?: string,
  ): Promise<IWaterLog> {
    if (typeof memberIdOrData === 'object') {
      return this.logWater(tenantId, memberIdOrData.memberId, memberIdOrData.amountLiters, memberIdOrData.date);
    }
    const date = dateStr ? new Date(dateStr) : new Date();

    const log = await WaterLog.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberIdOrData),
      amountLiters: amountLiters!,
      date,
    });

    return log;
  }

  static async getWaterLogs(tenantId: string, memberId: string, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999));

    const todayLogs = await WaterLog.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const totalLitersToday = todayLogs.reduce((sum, l) => sum + l.amountLiters, 0);

    return {
      date: startOfDay,
      totalLitersToday: parseFloat(totalLitersToday.toFixed(1)),
      logs: todayLogs,
    };
  }
}
