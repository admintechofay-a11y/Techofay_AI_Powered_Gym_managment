import mongoose, { Types } from 'mongoose';
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { Member } from '../models/Member.js';
import { Membership } from '../models/Membership.js';
import { Invoice } from '../models/Invoice.js';
import { Trial } from '../models/Trial.js';
import { Lead } from '../models/Lead.js';
import { Booking } from '../models/Booking.js';

import { Attendance } from '../models/Attendance.js';
import { Coupon } from '../models/Coupon.js';
import { COMMUNICATION_CHANNEL, NOTIFICATION_TYPE } from '@gymos/shared';
import { communicationService } from './communicationService.js';

export interface ScheduledJobDefinition {
  name: string;
  description: string;
  cronExpression: string; // e.g. "0 8 * * *" (daily at 8 AM)
  repeatIntervalMs: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  status: 'IDLE' | 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  lastRunStats?: {
    processed: number;
    sent: number;
    skipped: number;
    failed: number;
  };
}

export class SchedulerService {
  private queue: Queue | null = null;
  private worker: Worker | null = null;
  private isRedisConnected = false;
  private jobs: Map<string, ScheduledJobDefinition> = new Map();
  private intervalHandles: NodeJS.Timeout[] = [];

  constructor() {
    this.registerJobDefinitions();
    this.initQueueAndWorker();
  }

  private registerJobDefinitions() {
    const defaultJobs: ScheduledJobDefinition[] = [
      {
        name: 'membership-expiry-7d',
        description: 'Sends reminder notification to members whose plans expire in 7 days',
        cronExpression: '0 8 * * *', // Daily 8 AM
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'membership-expiry-3d',
        description: 'Sends urgent reminder to members whose plans expire in 3 days',
        cronExpression: '0 8 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'membership-expiry-1d',
        description: 'Final 24-hour reminder before membership expiration',
        cronExpression: '0 8 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'membership-expiry-today',
        description: 'Midnight transition to EXPIRED and notification on expiration date',
        cronExpression: '0 0 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'renewal-reminders',
        description: 'Follows up with members expired in the last 7 days offering renewal perks',
        cronExpression: '0 10 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'payment-due',
        description: 'Notifies members with outstanding invoice balances and upcoming due dates',
        cronExpression: '0 9 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'birthday-auto-wishes',
        description: 'Auto-detects birthdays, generates BDAY coupon (20% off) & dispatches wishes',
        cronExpression: '0 8 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'anniversary-auto-wishes',
        description: 'Auto-detects membership anniversaries, generates ANNIV coupon (15% off) & sends wishes',
        cronExpression: '0 8 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'trial-reminders',
        description: 'Sends 24-hour preparatory briefing and reminders for booked trials',
        cronExpression: '0 9 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'appointment-reminders',
        description: 'Sends 2-hour pre-class / PT session push notification reminders',
        cronExpression: '*/30 * * * *', // Every 30 mins
        repeatIntervalMs: 30 * 60 * 1000,
        status: 'WAITING',
      },
      {
        name: 'inactivity-followup',
        description: 'Identifies members with 7+ and 14+ days absence and sends encouragement',
        cronExpression: '0 11 * * *',
        repeatIntervalMs: 24 * 60 * 60 * 1000,
        status: 'WAITING',
      },
    ];

    for (const job of defaultJobs) {
      this.jobs.set(job.name, job);
    }
  }

  private async initQueueAndWorker() {
    if (env.NODE_ENV === 'test') {
      this.isRedisConnected = false;
      return;
    }
    try {
      const redisConnection = new (IORedis as any)({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 500,
        lazyConnect: true,
        retryStrategy: () => null,
      });

      redisConnection.on('error', () => {
        this.isRedisConnected = false;
      });

      await redisConnection.connect();
      this.isRedisConnected = true;

      this.queue = new Queue('gymos-scheduled-jobs', { connection: redisConnection });
      this.worker = new Worker(
        'gymos-scheduled-jobs',
        async (job: Job) => {
          await this.executeJobHandler(job.name);
        },
        { connection: redisConnection },
      );
    } catch {
      // Redis offline in current environment - resilient in-memory mode active
      this.isRedisConnected = false;
    }
  }

  /**
   * Return job status overview for dashboard
   */
  getDashboardStatus() {
    const list = Array.from(this.jobs.values());
    const counts = {
      total: list.length,
      waiting: list.filter((j) => j.status === 'WAITING' || j.status === 'IDLE').length,
      active: list.filter((j) => j.status === 'RUNNING').length,
      completed: list.filter((j) => j.status === 'COMPLETED').length,
      failed: list.filter((j) => j.status === 'FAILED').length,
      isRedisConnected: this.isRedisConnected,
    };

    return {
      counts,
      jobs: list,
    };
  }

  /**
   * Manually trigger any job immediately (idempotent, deduplicated)
   */
  async triggerJob(jobName: string, tenantId?: string) {
    const jobDef = this.jobs.get(jobName);
    if (!jobDef) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    jobDef.status = 'RUNNING';
    jobDef.lastRunAt = new Date();

    try {
      const stats = await this.executeJobHandler(jobName, tenantId);
      jobDef.status = 'COMPLETED';
      jobDef.lastRunStats = stats;
      return { success: true, jobName, stats };
    } catch (err: any) {
      jobDef.status = 'FAILED';
      throw err;
    }
  }

  /**
   * Core idempotent job execution router
   */
  private async executeJobHandler(jobName: string, specificTenantId?: string) {
    switch (jobName) {
      case 'membership-expiry-7d':
        return this.runExpiryReminders(7, 'EXPIRY_7D', specificTenantId);
      case 'membership-expiry-3d':
        return this.runExpiryReminders(3, 'EXPIRY_3D', specificTenantId);
      case 'membership-expiry-1d':
        return this.runExpiryReminders(1, 'EXPIRY_1D', specificTenantId);
      case 'membership-expiry-today':
        return this.runExpiryToday(specificTenantId);
      case 'renewal-reminders':
        return this.runRenewalReminders(specificTenantId);
      case 'payment-due':
        return this.runPaymentDueReminders(specificTenantId);
      case 'birthday-auto-wishes':
        return this.runBirthdayWishes(specificTenantId);
      case 'anniversary-auto-wishes':
        return this.runAnniversaryWishes(specificTenantId);
      case 'trial-reminders':
        return this.runTrialReminders(specificTenantId);
      case 'appointment-reminders':
        return this.runAppointmentReminders(specificTenantId);
      case 'inactivity-followup':
        return this.runInactivityFollowup(specificTenantId);
      default:
        return { processed: 0, sent: 0, skipped: 0, failed: 0 };
    }
  }

  // ================= 1. EXPIRY REMINDERS (7/3/1 DAYS) =================

  private async runExpiryReminders(days: number, tag: string, tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const targetDateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 0, 0, 0);
    const targetDateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 23, 59, 59);

    const query: Record<string, any> = {
      status: 'ACTIVE',
      endDate: { $gte: targetDateStart, $lte: targetDateEnd },
    };
    if (tenantId) query.tenantId = tenantId;

    const expiringMemberships = await Membership.find(query).lean();
    stats.processed = expiringMemberships.length;

    const dateStr = now.toISOString().split('T')[0];

    for (const ms of expiringMemberships) {
      const member = await Member.findOne({ _id: ms.memberId, tenantId: ms.tenantId });
      if (!member) continue;

      const dedupeKey = `notif:${ms.tenantId}:${ms.memberId}:${tag}:${dateStr}`;

      const res = await communicationService.sendNotification({
        tenantId: ms.tenantId,
        memberId: ms.memberId,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.EXPIRY,
        title: `Your Gym Membership Expires in ${days} Day${days > 1 ? 's' : ''}`,
        message: `Hi ${member.firstName}, your membership at IronPulse expires on ${ms.endDate.toLocaleDateString()}. Renew today to keep your streak and avoid reactivation fees!`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 2. EXPIRY TODAY =================

  private async runExpiryToday(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const query: Record<string, any> = {
      status: 'ACTIVE',
      endDate: { $lt: todayEnd },
    };
    if (tenantId) query.tenantId = tenantId;

    const expiring = await Membership.find(query);
    stats.processed = expiring.length;

    const dateStr = now.toISOString().split('T')[0];

    for (const ms of expiring) {
      ms.status = 'EXPIRED';
      await ms.save();

      const member = await Member.findOne({ _id: ms.memberId, tenantId: ms.tenantId });
      if (member) {
        member.status = 'EXPIRED';
        await member.save();

        const dedupeKey = `notif:${ms.tenantId}:${ms.memberId}:EXPIRY_TODAY:${dateStr}`;

        const res = await communicationService.sendNotification({
          tenantId: ms.tenantId,
          memberId: ms.memberId,
          channel: COMMUNICATION_CHANNEL.WHATSAPP,
          type: NOTIFICATION_TYPE.EXPIRY,
          title: 'Membership Expired Today',
          message: `Hi ${member.firstName}, your membership expired today. Click here to renew seamlessly and maintain your locker and fitness profile.`,
          dedupeKey,
        });

        if (res.skipped) stats.skipped++;
        else if (res.success) stats.sent++;
        else stats.failed++;
      }
    }

    return stats;
  }

  // ================= 3. RENEWAL REMINDERS =================

  private async runRenewalReminders(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const query: Record<string, any> = {
      status: 'EXPIRED',
      endDate: { $gte: sevenDaysAgo, $lte: now },
    };
    if (tenantId) query.tenantId = tenantId;

    const expired = await Membership.find(query).lean();
    stats.processed = expired.length;
    const dateStr = now.toISOString().split('T')[0];

    for (const ms of expired) {
      const member = await Member.findOne({ _id: ms.memberId, tenantId: ms.tenantId });
      if (!member) continue;

      const dedupeKey = `notif:${ms.tenantId}:${ms.memberId}:RENEWAL_PERK:${dateStr}`;

      const res = await communicationService.sendNotification({
        tenantId: ms.tenantId,
        memberId: ms.memberId,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.PROMOTIONAL,
        title: 'Special 10% Renewal Perk for You',
        message: `We miss having you on the gym floor, ${member.firstName}! Renew your plan this week and use code RENEW10 for 10% instant discount.`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 4. PAYMENT DUE =================

  private async runPaymentDueReminders(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const query: Record<string, any> = {
      status: { $in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    };
    if (tenantId) query.tenantId = tenantId;

    const unpaidInvoices = await Invoice.find(query).lean();
    stats.processed = unpaidInvoices.length;

    for (const inv of unpaidInvoices) {
      const member = await Member.findOne({ _id: inv.memberId, tenantId: inv.tenantId });
      if (!member) continue;

      const balanceInr = (((inv as any).dueAmountInPaise ?? ((inv as any).grandTotalInPaise - (inv.paidAmountInPaise || 0))) / 100).toFixed(2);
      const dedupeKey = `notif:${inv.tenantId}:${inv.memberId}:PAYMENT_DUE:${inv.invoiceNumber}:${dateStr}`;

      const res = await communicationService.sendNotification({
        tenantId: inv.tenantId,
        memberId: inv.memberId,
        channel: COMMUNICATION_CHANNEL.SMS,
        type: NOTIFICATION_TYPE.PAYMENT,
        title: `Payment Reminder: ₹${balanceInr} Outstanding`,
        message: `Dear ${member.firstName}, invoice ${inv.invoiceNumber} has a pending balance of ₹${balanceInr}. Pay online to avoid late fees.`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 5. BIRTHDAY AUTO-WISHES + COUPONS =================

  private async runBirthdayWishes(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();
    const dateStr = now.toISOString().split('T')[0];

    const query: Record<string, any> = {
      isDeleted: false,
      dob: { $exists: true, $ne: null },
    };
    if (tenantId) query.tenantId = tenantId;

    const membersWithDob = await Member.find(query);

    const birthdayMembers = membersWithDob.filter((m) => {
      if (!m.dob) return false;
      const d = new Date(m.dob);
      return d.getMonth() === currentMonth && d.getDate() === currentDay;
    });

    stats.processed = birthdayMembers.length;

    for (const member of birthdayMembers) {
      const code = `BDAY-${member.memberCode}-${currentYear}`;
      const dedupeKey = `notif:${member.tenantId}:${member._id}:BIRTHDAY:${currentYear}`;

      // Create unique coupon if not already present
      let coupon = await Coupon.findOne({ tenantId: member.tenantId, code });
      if (!coupon) {
        coupon = new Coupon({
          tenantId: member.tenantId,
          code,
          discountType: 'PERCENTAGE',
          discountValue: 20, // 20% birthday discount
          validFrom: now,
          validUntil: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days validity
          usageLimit: 1,
          usageCount: 0,
          isActive: true,
        });
        await coupon.save();
      }

      const res = await communicationService.sendNotification({
        tenantId: member.tenantId,
        memberId: member._id,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.BIRTHDAY,
        title: `Happy Birthday, ${member.firstName}! 🎂`,
        message: `Wishing you a very Happy Birthday from all of us at IronPulse Fitness! Here is a special 20% birthday coupon: *${code}* valid for the next 14 days on renewals or training packages. Enjoy your special day!`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 6. ANNIVERSARY AUTO-WISHES + COUPONS =================

  private async runAnniversaryWishes(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();

    const query: Record<string, any> = {
      isDeleted: false,
      joinDate: { $exists: true },
    };
    if (tenantId) query.tenantId = tenantId;

    const members = await Member.find(query);

    const anniversaryMembers = members.filter((m) => {
      const dateToCheck = m.anniversaryDate ? new Date(m.anniversaryDate) : new Date(m.joinDate);
      return dateToCheck.getMonth() === currentMonth && dateToCheck.getDate() === currentDay && dateToCheck.getFullYear() < currentYear;
    });

    stats.processed = anniversaryMembers.length;

    for (const member of anniversaryMembers) {
      const years = currentYear - new Date(member.joinDate).getFullYear();
      const code = `ANNIV-${member.memberCode}-${currentYear}`;
      const dedupeKey = `notif:${member.tenantId}:${member._id}:ANNIVERSARY:${currentYear}`;

      let coupon = await Coupon.findOne({ tenantId: member.tenantId, code });
      if (!coupon) {
        coupon = new Coupon({
          tenantId: member.tenantId,
          code,
          discountType: 'PERCENTAGE',
          discountValue: 15,
          validFrom: now,
          validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          usageLimit: 1,
          usageCount: 0,
          isActive: true,
        });
        await coupon.save();
      }

      const res = await communicationService.sendNotification({
        tenantId: member.tenantId,
        memberId: member._id,
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.ANNIVERSARY,
        title: `Happy ${years} Year Gym Anniversary! 🏆`,
        message: `Congratulations on ${years} year${years > 1 ? 's' : ''} of fitness and dedication with IronPulse! Enjoy 15% off your next package with coupon code *${code}*. Keep crushing your goals!`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 7. TRIAL REMINDERS =================

  private async runTrialReminders(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
    const dateStr = now.toISOString().split('T')[0];

    const query: Record<string, any> = {
      status: 'SCHEDULED',
      slotTime: { $gte: tomorrowStart, $lte: tomorrowEnd },
    };
    if (tenantId) query.tenantId = tenantId;

    const trials = await Trial.find(query).lean();
    stats.processed = trials.length;

    for (const trial of trials) {
      const dedupeKey = `notif:${trial.tenantId}:${trial._id}:TRIAL_REMINDER:${dateStr}`;
      let recipientPhone = '+91 98765 43210';
      let recipientEmail = 'trial@gymos.org';
      let recipientName = 'Fitness Explorer';

      if (trial.leadId) {
        const lead = await Lead.findOne({ _id: trial.leadId, tenantId: trial.tenantId });
        if (lead) {
          if (lead.phone) recipientPhone = lead.phone;
          if (lead.email) recipientEmail = lead.email;
          if (lead.name) recipientName = lead.name;
        }
      } else if (trial.memberId) {
        const member = await Member.findOne({ _id: trial.memberId, tenantId: trial.tenantId });
        if (member) {
          if (member.phone) recipientPhone = member.phone;
          if (member.email) recipientEmail = member.email;
          if (member.firstName) recipientName = member.firstName;
        }
      }

      const res = await communicationService.sendNotification({
        tenantId: trial.tenantId,
        recipientPhone: recipientPhone || '+91 98765 43210',
        recipientEmail: recipientEmail || 'trial@gymos.org',
        channel: COMMUNICATION_CHANNEL.WHATSAPP,
        type: NOTIFICATION_TYPE.REMINDER,
        title: 'Your Free Trial Session is Tomorrow! 🏋️',
        message: `Hi ${recipientName || 'Fitness Explorer'}, we are excited to see you tomorrow for your free trial session. Remember to bring sports shoes, water bottle, and a towel. See you on the gym floor!`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 8. APPOINTMENT REMINDERS =================

  private async runAppointmentReminders(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoAndHalfHours = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const query: Record<string, any> = {
      status: 'BOOKED',
      date: { $gte: twoHoursFromNow, $lte: twoAndHalfHours },
    };
    if (tenantId) query.tenantId = tenantId;

    const bookings = await Booking.find(query).lean();
    stats.processed = bookings.length;

    for (const b of bookings) {
      const member = await Member.findOne({ _id: b.memberId, tenantId: b.tenantId });
      if (!member) continue;

      const dedupeKey = `notif:${b.tenantId}:${b._id}:APT_REMINDER`;

      const res = await communicationService.sendNotification({
        tenantId: b.tenantId,
        memberId: b.memberId,
        channel: COMMUNICATION_CHANNEL.PUSH,
        type: NOTIFICATION_TYPE.REMINDER,
        title: 'Upcoming Session in 2 Hours',
        message: `Your session begins in 2 hours. Don't forget your gear and hydration!`,
        dedupeKey,
      });

      if (res.skipped) stats.skipped++;
      else if (res.success) stats.sent++;
      else stats.failed++;
    }

    return stats;
  }

  // ================= 9. INACTIVITY FOLLOWUP =================

  private async runInactivityFollowup(tenantId?: string) {
    const stats = { processed: 0, sent: 0, skipped: 0, failed: 0 };
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = now.toISOString().split('T')[0];

    const query: Record<string, any> = {
      status: 'ACTIVE',
      isDeleted: false,
    };
    if (tenantId) query.tenantId = tenantId;

    const activeMembers = await Member.find(query).limit(200);

    for (const member of activeMembers) {
      // Find latest checkin
      const lastCheckin = await Attendance.findOne({
        tenantId: member.tenantId,
        memberId: member._id,
      })
        .sort({ checkInTime: -1 })
        .lean();

      const lastVisit = lastCheckin?.checkInTime || member.joinDate;
      const isAbsent7Days = lastVisit < sevenDaysAgo;

      if (isAbsent7Days) {
        stats.processed++;
        const dedupeKey = `notif:${member.tenantId}:${member._id}:INACTIVITY:${dateStr}`;

        const res = await communicationService.sendNotification({
          tenantId: member.tenantId,
          memberId: member._id,
          channel: COMMUNICATION_CHANNEL.WHATSAPP,
          type: NOTIFICATION_TYPE.PROMOTIONAL,
          title: `We Miss You at the Gym, ${member.firstName}! 💪`,
          message: `Consistency is key! It's been over a week since your last workout. Book a trainer consultation or hit your favorite group class this week to keep the momentum going.`,
          dedupeKey,
        });

        if (res.skipped) stats.skipped++;
        else if (res.success) stats.sent++;
        else stats.failed++;
      }
    }

    return stats;
  }
}

export const schedulerService = new SchedulerService();
