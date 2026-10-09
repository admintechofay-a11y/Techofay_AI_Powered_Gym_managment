import mongoose, { Types } from 'mongoose';
import { Assessment, type IAssessment, Member } from '../models/index.js';

export class AssessmentService {
  /**
   * Record new fitness assessment with measurements, BMI calculation, and goals
   */
  static async createAssessment(tenantId: string, data: any, staffId?: string) {
    const memberObjId = new Types.ObjectId(data.memberId);
    const tenantObjId = new Types.ObjectId(tenantId);

    // Calculate BMI
    const heightInMeters = data.heightCm / 100;
    const bmi = parseFloat((data.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

    const assessment = await Assessment.create({
      tenantId: tenantObjId,
      memberId: memberObjId,
      conductedByTrainerId: staffId ? new Types.ObjectId(staffId) : undefined,
      date: data.date ? new Date(data.date) : new Date(),
      weightKg: data.weightKg,
      heightCm: data.heightCm,
      bmi,
      bodyFatPercent: data.bodyFatPercent,
      muscleMassKg: data.muscleMassKg,
      chestCm: data.chestCm,
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      armsCm: data.armsCm,
      thighsCm: data.thighsCm,
      notes: data.notes,
      photos: data.photos || [],
      goals: data.goals || [],
    });

    return assessment;
  }

  /**
   * Get member assessment history for metric graphs
   */
  static async getMemberAssessments(tenantId: string, memberId: string) {
    const assessments = await Assessment.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
    })
      .populate('conductedByTrainerId', 'name email')
      .sort({ date: 1 });

    // Format historical data points for Recharts charts
    const graphData = assessments.map((a) => ({
      date: a.date.toISOString().split('T')[0],
      weightKg: a.weightKg,
      bmi: a.bmi,
      bodyFatPercent: a.bodyFatPercent || 0,
      muscleMassKg: a.muscleMassKg || 0,
      waistCm: a.waistCm || 0,
      chestCm: a.chestCm || 0,
      armsCm: a.armsCm || 0,
    }));

    return {
      assessments,
      graphData,
    };
  }

  /**
   * Progress photos for before/after comparison slider
   */
  static async getMemberPhotos(tenantId: string, memberId: string) {
    const assessments = await Assessment.find({
      tenantId: new Types.ObjectId(tenantId),
      memberId: new Types.ObjectId(memberId),
      'photos.0': { $exists: true },
    }).sort({ date: 1 });

    const frontPhotos: { date: string; url: string }[] = [];
    const sidePhotos: { date: string; url: string }[] = [];
    const backPhotos: { date: string; url: string }[] = [];

    assessments.forEach((a) => {
      const dateStr = a.date.toISOString().split('T')[0];
      a.photos.forEach((p) => {
        if (p.type === 'FRONT') frontPhotos.push({ date: dateStr, url: p.url });
        if (p.type === 'SIDE') sidePhotos.push({ date: dateStr, url: p.url });
        if (p.type === 'BACK') backPhotos.push({ date: dateStr, url: p.url });
      });
    });

    return {
      front: {
        before: frontPhotos[0] || null,
        after: frontPhotos[frontPhotos.length - 1] || null,
        all: frontPhotos,
      },
      side: {
        before: sidePhotos[0] || null,
        after: sidePhotos[sidePhotos.length - 1] || null,
        all: sidePhotos,
      },
      back: {
        before: backPhotos[0] || null,
        after: backPhotos[backPhotos.length - 1] || null,
        all: backPhotos,
      },
    };
  }
}
