import mongoose, { Types } from 'mongoose';
import {
  Exercise,
  type IExercise,
  WorkoutPlan,
  type IWorkoutPlan,
  WorkoutLog,
  type IWorkoutLog,
  Member,
  User,
} from '../models/index.js';

export class WorkoutService {
  /**
   * Exercise Library search & filters
   */
  static async getExercises(
    tenantId: string,
    filters: {
      targetMuscleGroup?: string;
      difficulty?: string;
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

    const muscleGroup = filters.targetMuscleGroup || (filters as any).muscleGroup;
    if (muscleGroup) {
      query.targetMuscleGroup = muscleGroup;
    }
    if (filters.difficulty) {
      query.difficulty = filters.difficulty;
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$and = [
        { $or: [{ name: searchRegex }, { instructions: searchRegex }, { equipmentRequired: searchRegex }] },
      ];
    }

    const [exercises, total] = await Promise.all([
      Exercise.find(query).sort({ targetMuscleGroup: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Exercise.countDocuments(query),
    ]);

    return {
      exercises,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createExercise(tenantId: string, data: any) {
    return Exercise.create({
      tenantId: new Types.ObjectId(tenantId),
      name: data.name,
      category: data.category,
      targetMuscleGroup: data.targetMuscleGroup,
      secondaryMuscles: data.secondaryMuscles || [],
      difficulty: data.difficulty || 'BEGINNER',
      instructions: data.instructions,
      equipmentRequired: data.equipmentRequired,
      videoUrl: data.videoUrl,
      imageUrl: data.imageUrl,
      isSystem: false,
    });
  }

  // ==========================================================================
  // WORKOUT PLANS & TEMPLATES
  // ==========================================================================
  static async getPlans(
    tenantId: string,
    filters: { memberId?: string; isTemplate?: boolean },
  ) {
    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    };
    if (filters.memberId) query.memberId = new Types.ObjectId(filters.memberId);
    if (filters.isTemplate !== undefined) {
      if (filters.isTemplate) {
        query.memberId = { $exists: false };
      } else {
        query.memberId = { $exists: true };
      }
    }

    return WorkoutPlan.find(query)
      .populate('createdByTrainerId', 'name email')
      .populate('memberId', 'memberCode firstName lastName')
      .sort({ updatedAt: -1 });
  }

  static async getPlanById(tenantId: string, planId: string) {
    const plan = await WorkoutPlan.findOne({
      _id: new Types.ObjectId(planId),
      tenantId: new Types.ObjectId(tenantId),
    })
      .populate('createdByTrainerId', 'name email')
      .populate('memberId', 'memberCode firstName lastName')
      .populate('schedule.exercises.exerciseId');

    if (!plan) throw new Error('Workout plan not found');
    return plan;
  }

  static async createPlan(tenantId: string, data: any, staffId?: string) {
    const isTemplate = data.isTemplate !== undefined ? Boolean(data.isTemplate) : !data.memberId;
    const plan = await WorkoutPlan.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: data.memberId ? new Types.ObjectId(data.memberId) : undefined,
      createdByTrainerId: staffId ? new Types.ObjectId(staffId) : (data.createdByTrainerId ? new Types.ObjectId(data.createdByTrainerId) : undefined),
      title: data.title,
      description: data.description,
      daysPerWeek: data.daysPerWeek || 3,
      schedule: data.schedule || [],
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isTemplate,
      isActive: true,
    });

    return plan;
  }

  static async assignPlanToMember(
    tenantId: string,
    planIdOrData: string | { planId: string; memberId: string; startDate?: string },
    memberId?: string,
    startDate?: string,
    staffId?: string,
  ) {
    let resolvedPlanId: string;
    let resolvedMemberId: string;
    let resolvedStartDate: string | undefined;

    if (typeof planIdOrData === 'object') {
      resolvedPlanId = planIdOrData.planId;
      resolvedMemberId = planIdOrData.memberId;
      resolvedStartDate = planIdOrData.startDate;
    } else {
      resolvedPlanId = planIdOrData;
      resolvedMemberId = memberId!;
      resolvedStartDate = startDate;
    }

    const template = await WorkoutPlan.findOne({
      _id: new Types.ObjectId(resolvedPlanId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!template) throw new Error('Workout plan template not found');

    const member = await Member.findOne({
      _id: new Types.ObjectId(resolvedMemberId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!member) throw new Error('Member not found');

    // Deactivate previous active plans for this member
    await WorkoutPlan.updateMany(
      { tenantId: new Types.ObjectId(tenantId), memberId: member._id, isActive: true },
      { $set: { isActive: false } },
    );

    // Create tailored plan copy for member
    const newPlan = await WorkoutPlan.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: member._id,
      createdByTrainerId: staffId ? new Types.ObjectId(staffId) : template.createdByTrainerId,
      title: `${template.title} - ${member.firstName}`,
      description: template.description,
      daysPerWeek: template.daysPerWeek,
      schedule: template.schedule,
      startDate: resolvedStartDate ? new Date(resolvedStartDate) : new Date(),
      isActive: true,
    });

    return newPlan;
  }

  // ==========================================================================
  // WORKOUT LOGGING & PROGRESS TRACKING
  // ==========================================================================
  static async logWorkout(tenantId: string, data: any) {
    const log = await WorkoutLog.create({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(data.memberId),
      workoutPlanId: data.workoutPlanId ? new Types.ObjectId(data.workoutPlanId) : undefined,
      title: data.title,
      date: data.date ? new Date(data.date) : new Date(),
      durationMinutes: data.durationMinutes || 45,
      exercises: (data.exercises || []).map((ex: any) => ({
        exerciseId: new Types.ObjectId(ex.exerciseId),
        exerciseName: ex.exerciseName,
        setsCompleted: ex.setsCompleted,
        repsCompleted: ex.repsCompleted,
        weightKg: ex.weightKg || 0,
      })),
      notes: data.notes,
    });

    return log;
  }

  static async logWorkoutSession(tenantId: string, data: any) {
    return this.logWorkout(tenantId, data);
  }

  static async getMemberWorkoutLogs(tenantId: string, memberId: string) {
    return WorkoutLog.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
    }).sort({ date: -1 });
  }

  static async getMemberProgress(tenantId: string, memberId: string) {
    const res = await this.getMemberProgressTracking(tenantId, memberId);
    return {
      ...res,
      totalSessions: res.totalWorkouts,
    };
  }

  static async getMemberProgressTracking(tenantId: string, memberId: string) {
    const memberObjId = new Types.ObjectId(memberId);
    const tenantObjId = new Types.ObjectId(tenantId);

    const logs = await WorkoutLog.find({
      tenantId: tenantObjId,
      memberId: memberObjId,
    }).sort({ date: 1 });

    const totalWorkouts = logs.length;
    let totalVolumeKg = 0;
    const historyPoints: { date: string; volumeKg: number; durationMinutes: number }[] = [];

    logs.forEach((log) => {
      let dayVolume = 0;
      log.exercises.forEach((ex) => {
        dayVolume += ex.setsCompleted * ex.repsCompleted * (ex.weightKg || 0);
      });
      totalVolumeKg += dayVolume;
      historyPoints.push({
        date: log.date.toISOString().split('T')[0],
        volumeKg: dayVolume,
        durationMinutes: log.durationMinutes,
      });
    });

    return {
      totalWorkouts,
      totalVolumeKg,
      averageDurationMinutes: totalWorkouts > 0 ? Math.round(logs.reduce((s, l) => s + l.durationMinutes, 0) / totalWorkouts) : 0,
      historyPoints,
    };
  }
}
