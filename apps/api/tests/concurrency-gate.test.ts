import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BookingService } from '../src/services/bookingService.js';
import { BillingService } from '../src/services/billingService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { Class } from '../src/models/Class.js';
import { ClassSlot } from '../src/models/ClassSlot.js';
import { Booking } from '../src/models/Booking.js';
import { Invoice } from '../src/models/Invoice.js';
import { Payment } from '../src/models/Payment.js';
import { IdempotencyKey } from '../src/models/IdempotencyKey.js';
import { Counter } from '../src/models/Counter.js';
import { runInContext } from '../src/context/requestContext.js';
import { SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('High-Concurrency Stress Gate: 50 Parallel Bookings & 50 Parallel Payments', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'Olympus Athletics Mumbai',
      subdomain: 'olympus-concurrency',
      contactEmail: 'contact@olympus-athletics.test',
      contactPhone: '+919820011999',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'Bandra Flagship',
      code: 'OLYMP-BND',
      address: 'Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+919820011998',
      email: 'bandra@olympus-athletics.test',
    });
    branchId = branch._id.toString();

    // Ensure model indexes are initialized
    await ClassSlot.init();
    await Booking.init();
    await Class.init();
    await Payment.init();
    await IdempotencyKey.init();
    await Invoice.init();
    await Counter.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('1. 50 Parallel Bookings for a 10-Seat Class', () => {
    it('strictly fills 10 confirmed seats, 5 waitlist slots, rejects 35, with zero overbooking', async () => {
      // 1. Create Class: 10 capacity, 5 waitlist capacity
      const testClass = await Class.create({
        tenantId: new Types.ObjectId(tenantId),
        branchId: new Types.ObjectId(branchId),
        name: 'Iron Crossfit Conditioning',
        description: 'Elite high intensity session',
        scheduleDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        startTime: '06:00',
        endTime: '07:00',
        capacity: 10,
        waitlistCapacity: 5,
        isActive: true,
      });

      // 2. Pre-create 50 distinct members
      const memberDocs = [];
      for (let i = 1; i <= 50; i++) {
        memberDocs.push({
          tenantId: new Types.ObjectId(tenantId),
          branchId: new Types.ObjectId(branchId),
          memberCode: `OLYMP-${String(i).padStart(4, '0')}`,
          firstName: `Athlete${i}`,
          lastName: 'Desai',
          email: `athlete${i}@olympus.test`,
          phone: `+9198200${String(i).padStart(5, '0')}`,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          status: 'ACTIVE',
        });
      }
      const members = await Member.insertMany(memberDocs);
      const slotTime = new Date('2026-10-20T06:00:00.000Z');

      // 3. Fire 50 concurrent booking requests simultaneously
      const bookingPromises = members.map((m) =>
        BookingService.bookClassSlot(tenantId, {
          branchId,
          memberId: m._id.toString(),
          classId: testClass._id.toString(),
          slotTime,
        }),
      );

      const results = await Promise.allSettled(bookingPromises);

      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      // Exactly 15 total accepted: 10 confirmed + 5 waitlist
      expect(fulfilled.length).toBe(15);
      expect(rejected.length).toBe(35);

      // Verify rejected reasons explain maximum capacity
      rejected.forEach((rej) => {
        expect(rej.reason.message).toMatch(/maximum capacity/i);
      });

      // Verify database record counts
      const confirmedDbCount = await Booking.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        classId: testClass._id,
        slotTime,
        status: 'CONFIRMED',
      });
      const waitlistDbCount = await Booking.countDocuments({
        tenantId: new Types.ObjectId(tenantId),
        classId: testClass._id,
        slotTime,
        status: 'WAITLIST',
      });

      expect(confirmedDbCount).toBe(10);
      expect(waitlistDbCount).toBe(5);
    });
  });

  describe('2. 50 Parallel Payments with the Same Idempotency Key', () => {
    it('creates exactly 1 payment record, prevents duplicate charges, and settles invoice once', async () => {
      // 1. Create Member & Unpaid Invoice for ₹5,000 (500000 paise)
      const member = await Member.create({
        tenantId: new Types.ObjectId(tenantId),
        branchId: new Types.ObjectId(branchId),
        memberCode: 'OLYMP-PAY-01',
        firstName: 'Rohan',
        lastName: 'Mehra',
        email: 'rohan.mehra@olympus.test',
        phone: '+919811122334',
        gender: 'MALE',
        status: 'ACTIVE',
      });

      let invoice: any;
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        invoice = await BillingService.createInvoice({
          tenantId,
          branchId,
          memberId: member._id.toString(),
          items: [
            {
              description: 'Annual Platinum Membership',
              itemType: 'MEMBERSHIP',
              quantity: 1,
              unitPriceInPaise: 500000,
            },
          ],
        });
      });

      const sharedIdempotencyKey = 'idemp-concurrency-stress-test-key-50x';

      // 2. Fire 50 concurrent payment recordings with identical idempotencyKey
      const paymentPromises = Array.from({ length: 50 }).map(() =>
        runInContext({ tenantId, isSuperAdmin: false }, () =>
          BillingService.recordPayment({
            tenantId,
            branchId,
            invoiceId: invoice._id.toString(),
            memberId: member._id.toString(),
            amountInPaise: invoice.dueAmountInPaise,
            paymentMethod: 'UPI',
            referenceNumber: 'UPI-TXN-STRESS-999',
            idempotencyKey: sharedIdempotencyKey,
          }),
        ),
      );

      const paymentResults = await Promise.allSettled(paymentPromises);
      const successfulPayments = paymentResults.filter((r) => r.status === 'fulfilled');
      const rejectedPayments = paymentResults.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      if (successfulPayments.length === 0 && rejectedPayments.length > 0) {
        console.error('Payment rejection sample error:', rejectedPayments[0].reason);
      }

      expect(successfulPayments.length).toBeGreaterThan(0);

      // 3. Verify exactly 1 payment document exists in the database
      await runInContext({ tenantId, isSuperAdmin: false }, async () => {
        const totalPaymentsCount = await Payment.countDocuments({
          tenantId: new Types.ObjectId(tenantId),
          idempotencyKey: sharedIdempotencyKey,
        });
        expect(totalPaymentsCount).toBe(1);

        // 4. Verify Invoice was charged exactly once for 590000 paise (₹5,900), not 50 x
        const updatedInvoice = await Invoice.findById(invoice._id);
        expect(updatedInvoice?.paidAmountInPaise).toBe(590000);
        expect(updatedInvoice?.dueAmountInPaise).toBe(0);
        expect(updatedInvoice?.status).toBe('PAID');
      });
    });
  });
});
