import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { BillingService } from '../src/services/billingService.js';
import { Tenant } from '../src/models/Tenant.js';
import { Branch } from '../src/models/Branch.js';
import { Member } from '../src/models/Member.js';
import { runInContext } from '../src/context/requestContext.js';
import { INVOICE_STATUS, SUBSCRIPTION_TIER, TENANT_STATUS } from '@gymos/shared';

describe('BillingService - Indian GST & Financial Ledger', () => {
  let mongod: MongoMemoryServer;
  let tenantId: string;
  let branchId: string;
  let memberId: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    const tenant = await Tenant.create({
      name: 'IronPulse Gym Mumbai',
      subdomain: 'ironpulse-billing-test',
      contactEmail: 'contact@ironpulse-test.com',
      contactPhone: '+919820011223',
      tier: SUBSCRIPTION_TIER.PROFESSIONAL,
      status: TENANT_STATUS.ACTIVE,
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        gstin: '27AABCU9603R1ZM',
      },
    });
    tenantId = tenant._id.toString();

    const branch = await Branch.create({
      tenantId: tenant._id,
      name: 'BKC Flagship',
      code: 'BKC01',
      address: 'BKC Complex, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      phone: '+919820011224',
      email: 'bkc@ironpulse-test.com',
    });
    branchId = branch._id.toString();

    const member = await Member.create({
      tenantId: tenant._id,
      branchId: branch._id,
      memberCode: 'IP-2026-0001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@example.test',
      phone: '+919876543210',
      gender: 'MALE',
      dob: new Date('1995-05-15'),
      status: 'ACTIVE',
    });
    memberId = member._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('calculates Intra-State GST (CGST 9% + SGST 9%) in integer paise', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const invoice = await BillingService.createInvoice({
        tenantId,
        branchId,
        memberId,
        items: [
          {
            description: 'Annual Gym Membership',
            itemType: 'MEMBERSHIP',
            quantity: 1,
            unitPriceInPaise: 1000000, // 10,000 INR
            sacCode: '999723',
          },
        ],
        isInterState: false, // Maharashtra to Maharashtra -> CGST + SGST
        idempotencyKey: 'idemp-tax-test-01',
      });

      expect(invoice.subtotalInPaise).toBe(1000000);
      expect(invoice.taxTotalInPaise).toBe(180000); // 18% of 10,000 = 1,800 INR (180,000 paise)
      expect(invoice.grandTotalInPaise).toBe(1180000); // 11,800 INR
      expect(invoice.dueAmountInPaise).toBe(1180000);
      expect(invoice.status).toBe(INVOICE_STATUS.UNPAID);
      expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-\d{4}$/);
    });
  });

  it('calculates Inter-State GST (IGST 18%) in integer paise', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const invoice = await BillingService.createInvoice({
        tenantId,
        branchId,
        memberId,
        items: [
          {
            description: 'Corporate Personal Training Package (10 Sessions)',
            itemType: 'PT_PACKAGE',
            quantity: 1,
            unitPriceInPaise: 2000000, // 20,000 INR
            sacCode: '999723',
          },
        ],
        isInterState: true, // Inter-state -> IGST 18%
        idempotencyKey: 'idemp-tax-test-02',
      });

      expect(invoice.subtotalInPaise).toBe(2000000);
      expect(invoice.taxTotalInPaise).toBe(360000); // 3,600 INR
      expect(invoice.grandTotalInPaise).toBe(2360000);
      expect(invoice.dueAmountInPaise).toBe(2360000);
    });
  });

  it('handles partial payment followed by full settlement', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const invoice = await BillingService.createInvoice({
        tenantId,
        branchId,
        memberId,
        items: [
          {
            description: 'Quarterly Membership',
            itemType: 'MEMBERSHIP',
            quantity: 1,
            unitPriceInPaise: 500000,
          },
        ],
        idempotencyKey: 'idemp-tax-test-03',
      });

      // Partial payment: 2,000 INR (200,000 paise)
      const partialResult = await BillingService.recordPayment({
        tenantId,
        branchId,
        invoiceId: invoice._id.toString(),
        memberId,
        amountInPaise: 200000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI/REF/00112233',
        idempotencyKey: 'idemp-pay-partial',
      });

      expect(partialResult.isFullyPaid).toBe(false);
      expect(partialResult.invoice.status).toBe(INVOICE_STATUS.PARTIALLY_PAID);
      expect(partialResult.invoice.paidAmountInPaise).toBe(200000);

      // Remaining balance payment: remaining paise
      const remainingBalance = partialResult.invoice.dueAmountInPaise;
      const fullResult = await BillingService.recordPayment({
        tenantId,
        branchId,
        invoiceId: invoice._id.toString(),
        memberId,
        amountInPaise: remainingBalance,
        paymentMethod: 'CASH',
        referenceNumber: 'CASH-REC-001',
        idempotencyKey: 'idemp-pay-full',
      });

      expect(fullResult.isFullyPaid).toBe(true);
      expect(fullResult.invoice.status).toBe(INVOICE_STATUS.PAID);
      expect(fullResult.invoice.dueAmountInPaise).toBe(0);
    });
  });

  it('guarantees idempotency replay on invoice creation', async () => {
    await runInContext({ tenantId, isSuperAdmin: false }, async () => {
      const payload = {
        tenantId,
        branchId,
        memberId,
        items: [
          {
            description: 'Monthly Plan',
            itemType: 'MEMBERSHIP',
            quantity: 1,
            unitPriceInPaise: 250000,
          },
        ],
        idempotencyKey: 'idemp-unique-client-uuid-999',
      };

      const firstCall = await BillingService.createInvoice(payload);
      const secondCall = await BillingService.createInvoice(payload);

      expect(firstCall._id.toString()).toBe(secondCall._id.toString());
      expect(firstCall.invoiceNumber).toBe(secondCall.invoiceNumber);
    });
  });
});
