import mongoose, { Types, ClientSession } from 'mongoose';
import {
  Booking,
  type IBooking,
  Class,
  type IClass,
  ClassSlot,
  Trial,
  type ITrial,
  Lead,
  Member,
  User,
} from '../models/index.js';
import { CrmService } from './crmService.js';
import { LEAD_PIPELINE_STATUS } from '@gymos/shared';

export class BookingService {
  /**
   * Helper to execute in transaction when replica set is active, or direct fallback
   */
  private static async withTransaction<T>(fn: (session: ClientSession | null) => Promise<T>): Promise<T> {
    let session: ClientSession | null = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err: any) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // Ignore rollback error if transaction was not started
        }
      }
      // If error indicates standalone server without replica set, retry without session
      if (
        err?.message?.includes('Transactions are not supported') ||
        err?.message?.includes('replica set')
      ) {
        return fn(null);
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  // ==========================================================================
  // CLASSES
  // ==========================================================================
  static async createClass(tenantId: string, data: any) {
    return Class.create({
      tenantId: new Types.ObjectId(tenantId),
      branchId: new Types.ObjectId(data.branchId),
      name: data.name,
      description: data.description,
      trainerId: data.trainerId ? new Types.ObjectId(data.trainerId) : undefined,
      scheduleDays: data.scheduleDays,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
      waitlistCapacity: data.waitlistCapacity ?? 5,
      color: data.color || '#6366f1',
    });
  }

  static async getClasses(tenantId: string, branchId?: string) {
    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      isActive: true,
    };
    if (branchId) query.branchId = new Types.ObjectId(branchId);

    return Class.find(query)
      .populate('trainerId', 'name email')
      .populate('branchId', 'name code')
      .sort({ name: 1 });
  }

  static async getClassById(tenantId: string, classId: string) {
    const cls = await Class.findOne({
      _id: new Types.ObjectId(classId),
      tenantId: new Types.ObjectId(tenantId),
    }).populate('trainerId', 'name email');
    if (!cls) throw new Error('Class not found');
    return cls;
  }

  // ==========================================================================
  // RACE-SAFE BOOKINGS WITH ATOMIC CONDITIONAL CAPACITY & WAITLIST
  // ==========================================================================
  static async bookClassSlot(tenantId: string, data: {
    branchId: string;
    memberId: string;
    classId: string;
    slotTime: string | Date;
  }) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const branchObjId = new Types.ObjectId(data.branchId);
    const memberObjId = new Types.ObjectId(data.memberId);
    const classObjId = new Types.ObjectId(data.classId);
    const slotTimeDate = new Date(data.slotTime);

    // Prevent duplicate booking for same member and slot
    const existingBooking = await Booking.findOne({
      tenantId: tenantObjId,
      memberId: memberObjId,
      classId: classObjId,
      slotTime: slotTimeDate,
      status: { $in: ['CONFIRMED', 'WAITLIST'] },
    });

    if (existingBooking) {
      throw new Error(`Member already has an active ${existingBooking.status} booking for this slot`);
    }

    // Ensure class exists
    const cls = await Class.findOne({ _id: classObjId, tenantId: tenantObjId });
    if (!cls || !cls.isActive) {
      throw new Error('Class not found or inactive');
    }

    // Upsert slot capacity record
    try {
      await ClassSlot.updateOne(
        { tenantId: tenantObjId, classId: classObjId, slotTime: slotTimeDate },
        {
          $setOnInsert: {
            tenantId: tenantObjId,
            classId: classObjId,
            slotTime: slotTimeDate,
            capacity: cls.capacity,
            waitlistCapacity: cls.waitlistCapacity ?? 5,
            bookedCount: 0,
            waitlistCount: 0,
          },
        },
        { upsert: true },
      );
    } catch (err: any) {
      if (err.code !== 11000) throw err;
    }

    return this.withTransaction(async (session) => {
      // 1. ATOMIC CONDITIONAL UPDATE: Attempt to claim a CONFIRMED slot
      const confirmedSlot = await ClassSlot.findOneAndUpdate(
        {
          tenantId: tenantObjId,
          classId: classObjId,
          slotTime: slotTimeDate,
          bookedCount: { $lt: cls.capacity },
        },
        { $inc: { bookedCount: 1 } },
        { new: true, session: session || undefined },
      );

      if (confirmedSlot) {
        const bookingDocs = await Booking.create(
          [
            {
              tenantId: tenantObjId,
              branchId: branchObjId,
              memberId: memberObjId,
              classId: classObjId,
              slotTime: slotTimeDate,
              status: 'CONFIRMED',
            },
          ],
          session ? { session } : {},
        );

        return {
          booking: bookingDocs[0],
          status: 'CONFIRMED',
          confirmedCount: confirmedSlot.bookedCount,
          capacity: cls.capacity,
          message: 'Booking confirmed successfully',
        };
      }

      // 2. Confirmed capacity is full: ATOMIC CONDITIONAL UPDATE for WAITLIST slot
      const waitlistSlot = await ClassSlot.findOneAndUpdate(
        {
          tenantId: tenantObjId,
          classId: classObjId,
          slotTime: slotTimeDate,
          waitlistCount: { $lt: cls.waitlistCapacity },
        },
        { $inc: { waitlistCount: 1 } },
        { new: true, session: session || undefined },
      );

      if (waitlistSlot) {
        const waitlistPosition = waitlistSlot.waitlistCount;
        const bookingDocs = await Booking.create(
          [
            {
              tenantId: tenantObjId,
              branchId: branchObjId,
              memberId: memberObjId,
              classId: classObjId,
              slotTime: slotTimeDate,
              status: 'WAITLIST',
              waitlistPosition,
            },
          ],
          session ? { session } : {},
        );

        return {
          booking: bookingDocs[0],
          status: 'WAITLIST',
          waitlistPosition,
          waitlistCapacity: cls.waitlistCapacity,
          message: `Class is full. Added to waitlist at position #${waitlistPosition}.`,
        };
      }

      // 3. Both confirmed capacity and waitlist capacity are full
      throw new Error(`Class and waitlist are at maximum capacity (${cls.capacity} booked, ${cls.waitlistCapacity} waitlisted)`);
    });
  }

  /**
   * Cancel booking with automatic promotion of next waitlisted member
   */
  static async cancelBooking(tenantId: string, bookingId: string) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const bookingObjId = new Types.ObjectId(bookingId);

    return this.withTransaction(async (session) => {
      const bQuery = Booking.findOne({ _id: bookingObjId, tenantId: tenantObjId });
      const booking = session ? await bQuery.session(session) : await bQuery;

      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'CANCELLED') {
        return { booking, promotedBooking: null, message: 'Booking already cancelled' };
      }

      const wasConfirmed = booking.status === 'CONFIRMED';
      booking.status = 'CANCELLED';
      booking.cancelledAt = new Date();
      booking.waitlistPosition = undefined;
      await booking.save(session ? { session } : undefined);

      let promotedBooking: IBooking | null = null;

      if (wasConfirmed) {
        // Automatically promote the first person on waitlist
        const nextQuery = Booking.findOne({
          tenantId: tenantObjId,
          classId: booking.classId,
          slotTime: booking.slotTime,
          status: 'WAITLIST',
        }).sort({ waitlistPosition: 1, createdAt: 1 });

        const nextInLine = session ? await nextQuery.session(session) : await nextQuery;

        if (nextInLine) {
          nextInLine.status = 'CONFIRMED';
          nextInLine.waitlistPosition = undefined;
          await nextInLine.save(session ? { session } : undefined);
          promotedBooking = nextInLine;

          // Re-index remaining waitlist positions
          const remainingWaitlistQuery = Booking.find({
            tenantId: tenantObjId,
            classId: booking.classId,
            slotTime: booking.slotTime,
            status: 'WAITLIST',
          }).sort({ waitlistPosition: 1 });

          const remaining = session ? await remainingWaitlistQuery.session(session) : await remainingWaitlistQuery;

          for (let i = 0; i < remaining.length; i++) {
            remaining[i].waitlistPosition = i + 1;
            await remaining[i].save(session ? { session } : undefined);
          }

          // Decrement waitlist count atomically on ClassSlot
          await ClassSlot.updateOne(
            { tenantId: tenantObjId, classId: booking.classId, slotTime: booking.slotTime },
            { $inc: { waitlistCount: -1 } },
            session ? { session } : {},
          );
        } else {
          // No waitlisted members: decrement bookedCount atomically on ClassSlot
          await ClassSlot.updateOne(
            { tenantId: tenantObjId, classId: booking.classId, slotTime: booking.slotTime },
            { $inc: { bookedCount: -1 } },
            session ? { session } : {},
          );
        }
      } else {
        // Was on waitlist: decrement waitlistCount atomically on ClassSlot
        await ClassSlot.updateOne(
          { tenantId: tenantObjId, classId: booking.classId, slotTime: booking.slotTime },
          { $inc: { waitlistCount: -1 } },
          session ? { session } : {},
        );
      }

      return {
        booking,
        promotedBooking,
        message: promotedBooking
          ? 'Booking cancelled. Waitlisted member was automatically promoted to Confirmed.'
          : 'Booking cancelled successfully.',
      };
    });
  }

  /**
   * Get bookings with filters and status
   */
  static async getBookings(tenantId: string, filters: {
    branchId?: string;
    classId?: string;
    memberId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (filters.branchId) query.branchId = new Types.ObjectId(filters.branchId);
    if (filters.classId) query.classId = new Types.ObjectId(filters.classId);
    if (filters.memberId) query.memberId = new Types.ObjectId(filters.memberId);
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.slotTime = {};
      if (filters.startDate) query.slotTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.slotTime.$lte = new Date(filters.endDate);
    }

    return Booking.find(query)
      .populate('memberId', 'memberCode firstName lastName phone email')
      .populate('classId', 'name startTime endTime capacity waitlistCapacity color')
      .populate('branchId', 'name code')
      .sort({ slotTime: 1 });
  }

  // ==========================================================================
  // TRIALS & TRIAL-TO-MEMBER TRACKING
  // ==========================================================================
  static async registerTrial(tenantId: string, data: {
    branchId: string;
    leadId?: string;
    memberId?: string;
    name?: string;
    phone?: string;
    email?: string;
    classId?: string;
    trainerId?: string;
    slotTime: string | Date;
    notes?: string;
  }) {
    const tenantObjId = new Types.ObjectId(tenantId);
    const branchObjId = new Types.ObjectId(data.branchId);

    let leadId = data.leadId ? new Types.ObjectId(data.leadId) : undefined;

    // If no leadId but phone provided, find or create CRM lead
    if (!leadId && data.phone && data.name) {
      let lead = await Lead.findOne({ tenantId: tenantObjId, phone: data.phone, isDeleted: false });
      if (!lead) {
        lead = await Lead.create({
          tenantId: tenantObjId,
          branchId: branchObjId,
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          source: 'WEBSITE',
          pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_BOOKED,
          leadScore: 'HOT',
          notes: data.notes || 'Registered for trial class',
        });
      } else {
        lead.pipelineStatus = LEAD_PIPELINE_STATUS.TRIAL_BOOKED;
        lead.leadScore = 'HOT';
        await lead.save();
      }
      leadId = lead._id;
    } else if (leadId) {
      // Update lead pipeline status to TRIAL_BOOKED
      await Lead.findByIdAndUpdate(leadId, {
        $set: { pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_BOOKED, leadScore: 'HOT' },
      });
    }

    const trial = await Trial.create({
      tenantId: tenantObjId,
      branchId: branchObjId,
      leadId,
      memberId: data.memberId ? new Types.ObjectId(data.memberId) : undefined,
      classId: data.classId ? new Types.ObjectId(data.classId) : undefined,
      trainerId: data.trainerId ? new Types.ObjectId(data.trainerId) : undefined,
      slotTime: new Date(data.slotTime),
      status: 'SCHEDULED',
      notes: data.notes,
    });

    return trial;
  }

  static async getTrials(tenantId: string, filters: {
    branchId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };
    if (filters.branchId) query.branchId = new Types.ObjectId(filters.branchId);
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.slotTime = {};
      if (filters.startDate) query.slotTime.$gte = new Date(filters.startDate);
      if (filters.endDate) query.slotTime.$lte = new Date(filters.endDate);
    }

    return Trial.find(query)
      .populate('leadId', 'name phone email pipelineStatus')
      .populate('trainerId', 'name email')
      .populate('classId', 'name startTime endTime')
      .populate('branchId', 'name code')
      .sort({ slotTime: 1 });
  }

  static async updateTrialStatus(tenantId: string, trialId: string, status: string, notes?: string) {
    const trial = await Trial.findOne({
      _id: new Types.ObjectId(trialId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!trial) throw new Error('Trial not found');

    trial.status = status as any;
    if (notes) trial.notes = notes;
    await trial.save();

    // If attended, advance lead pipeline status to TRIAL_COMPLETED
    if (status === 'ATTENDED' && trial.leadId) {
      await Lead.findByIdAndUpdate(trial.leadId, {
        $set: { pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_COMPLETED },
      });
    }

    return trial;
  }

  static async convertTrialToMember(tenantId: string, trialId: string, planId?: string, staffId?: string) {
    const trial = await Trial.findOne({
      _id: new Types.ObjectId(trialId),
      tenantId: new Types.ObjectId(tenantId),
    });
    if (!trial) throw new Error('Trial not found');
    if (!trial.leadId) throw new Error('No lead associated with this trial to convert');

    const result = await CrmService.convertLeadToMember(
      tenantId,
      trial.leadId.toString(),
      { planId },
      staffId,
    );

    trial.status = 'CONVERTED';
    if (result.member) {
      trial.memberId = (result.member as any)._id;
    }
    await trial.save();

    return { trial, member: result.member };
  }

  /**
   * Calendar view schedule combining classes, bookings, and trials
   */
  static async getCalendarView(tenantId: string, branchId?: string, dateStr?: string) {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999));

    const [classes, bookings, trials] = await Promise.all([
      this.getClasses(tenantId, branchId),
      this.getBookings(tenantId, {
        branchId,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      }),
      this.getTrials(tenantId, {
        branchId,
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      }),
    ]);

    return {
      date: startOfDay,
      classes,
      bookings,
      trials,
    };
  }
}
