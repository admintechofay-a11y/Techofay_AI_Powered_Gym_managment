import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BookingService } from '../src/services/bookingService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Class } from '../src/models/Class.js';
import { Booking } from '../src/models/Booking.js';
import { ClassSlot } from '../src/models/ClassSlot.js';
import { Trainer } from '../src/models/Trainer.js';
import { User } from '../src/models/User.js';
import { runInContext } from '../src/context/requestContext.js';
import { SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('BookingService - Race-Safe Concurrency & Waitlist Auto-Promotion', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let trainerUserId: string;
  const members: any[] = [];
  let testClass: any;
  const slotDate = new Date('2026-10-15T07:00:00.000Z');

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-booking-test',
      contactEmail: 'contact@ironpulse-booking.org',
      contactPhone: '+919820011999',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC-BKG',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011998',
      email: 'bkc@ironpulse-booking.org',
    });
    branchId = branch._id.toString();

    const trainerUser = await User.create({
      tenantId: tenant._id,
      name: 'Vikram Rathore',
      email: 'trainer.concurrency@ironpulse-booking.org',
      passwordHash: 'hash123',
      role: 'TRAINER',
      status: 'ACTIVE',
    });
    trainerUserId = trainerUser._id.toString();

    await Trainer.create({
      tenantId: tenant._id,
      userId: trainerUser._id,
      name: 'Vikram Rathore',
      email: 'trainer.concurrency@ironpulse-booking.org',
      specializations: ['HIIT', 'CrossFit'],
      commissionRatePercent: 20,
    });

    // Create 16 members for concurrent booking test
    for (let i = 1; i <= 16; i++) {
      const member = await Member.create({
        tenantId: tenant._id,
        branchId: branch._id,
        memberCode: `IP-BKG-${1000 + i}`,
        firstName: `Member${i}`,
        lastName: `Sharma`,
        email: `member${i}@ironpulse-booking.org`,
        phone: `+9198000000${i.toString().padStart(2, '0')}`,
        gender: 'MALE',
        status: 'ACTIVE',
      });
      members.push(member);
    }

    // Create Class with Capacity: 5, Waitlist Capacity: 3
    testClass = await Class.create({
      tenantId: tenant._id,
      branchId: branch._id,
      name: 'Morning Power HIIT',
      description: 'High intensity interval training',
      trainerId: trainerUser._id,
      scheduleDays: ['MON', 'WED', 'FRI'],
      startTime: '07:00',
      endTime: '08:00',
      capacity: 5,
      waitlistCapacity: 3,
      isActive: true,
    });

    await ClassSlot.init();
    await Booking.init();
    await Class.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('demonstrates race-safety: 15 concurrent booking requests strictly fill 5 confirmed and 3 waitlist with zero overbooking', async () => {
    const classId = testClass._id.toString();

    // Fire 15 parallel booking requests simultaneously
    const bookingPromises = members.slice(0, 15).map((m) =>
      BookingService.bookClassSlot(tenantId, {
        branchId,
        memberId: m._id.toString(),
        classId,
        slotTime: slotDate,
      }),
    );

    const results = await Promise.allSettled(bookingPromises);

    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Exactly 8 should succeed (5 confirmed + 3 waitlist), and 7 should be rejected
    expect(fulfilled.length).toBe(8);
    expect(rejected.length).toBe(7);

    // Verify error messages for rejected requests indicate full capacity
    rejected.forEach((rej) => {
      expect(rej.reason.message).toMatch(/maximum capacity/i);
    });

    // Verify database counts
    const confirmedCount = await Booking.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'CONFIRMED',
    });
    expect(confirmedCount).toBe(5);

    const waitlistCount = await Booking.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'WAITLIST',
    });
    expect(waitlistCount).toBe(3);

    // Verify waitlist positions are uniquely 1, 2, 3
    const waitlistedDocs = await Booking.find({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'WAITLIST',
    }).sort({ waitlistPosition: 1 });

    expect(waitlistedDocs.map((w) => w.waitlistPosition)).toEqual([1, 2, 3]);
  });

  it('rejects duplicate booking if member tries to book again for the same slot', async () => {
    const confirmedBooking = await Booking.findOne({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'CONFIRMED',
    });
    expect(confirmedBooking).not.toBeNull();
    const confirmedMemberId = confirmedBooking!.memberId.toString();

    await expect(
      BookingService.bookClassSlot(tenantId, {
        branchId,
        memberId: confirmedMemberId,
        classId: testClass._id.toString(),
        slotTime: slotDate,
      }),
    ).rejects.toThrow(/already has an active/i);
  });

  it('promotes top waitlisted member to CONFIRMED automatically when a confirmed booking is cancelled', async () => {
    // Find one confirmed booking and the first waitlisted booking
    const confirmedBooking = await Booking.findOne({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'CONFIRMED',
    });
    expect(confirmedBooking).not.toBeNull();

    const topWaitlistedBooking = await Booking.findOne({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'WAITLIST',
      waitlistPosition: 1,
    });
    expect(topWaitlistedBooking).not.toBeNull();

    // Cancel the confirmed booking
    const cancelResult = await BookingService.cancelBooking(tenantId, confirmedBooking!._id.toString());

    expect(cancelResult.booking.status).toBe('CANCELLED');
    expect(cancelResult.promotedBooking).not.toBeNull();
    expect(cancelResult.promotedBooking!._id.toString()).toBe(topWaitlistedBooking!._id.toString());
    expect(cancelResult.promotedBooking!.status).toBe('CONFIRMED');

    // Verify database state: confirmed count is still 5, waitlist count is now 2
    const confirmedCountAfter = await Booking.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'CONFIRMED',
    });
    expect(confirmedCountAfter).toBe(5);

    const waitlistCountAfter = await Booking.countDocuments({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'WAITLIST',
    });
    expect(waitlistCountAfter).toBe(2);

    // Verify remaining waitlist members reindexed to position 1 and 2
    const remainingWaitlist = await Booking.find({
      tenantId: new Types.ObjectId(tenantId),
      classId: testClass._id,
      slotTime: slotDate,
      status: 'WAITLIST',
    }).sort({ waitlistPosition: 1 });

    expect(remainingWaitlist.map((w) => w.waitlistPosition)).toEqual([1, 2]);
  });

  it('successfully registers and books a trial session with trainer allocation', async () => {
    const trialSlot = new Date('2026-10-18T10:00:00.000Z');
    const trial = await BookingService.registerTrial(tenantId, {
      branchId,
      name: 'Arjun Kapoor',
      email: 'arjun.kapoor@prospects.ironpulse.org',
      phone: '+919877711223',
      trainerId: trainerUserId,
      slotTime: trialSlot,
      notes: 'Interested in CrossFit conditioning trial',
    });

    expect(trial).toBeDefined();
    expect(trial.status).toBe('SCHEDULED');
    expect(trial.trainerId?.toString()).toBe(trainerUserId);
  });

  it('retrieves calendar schedule with accurate confirmed and waitlist counts', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const calendar = await BookingService.getCalendarView(tenantId, branchId, '2026-10-15');

      expect(calendar).toBeDefined();
      expect(calendar.classes.length).toBeGreaterThan(0);
      expect(calendar.bookings.length).toBeGreaterThanOrEqual(7);
    });
  });
});
