import mongoose, { Types } from 'mongoose';
import { Invoice, IInvoice, IInvoiceItem } from '../models/Invoice.js';
import { Payment, IPayment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { Member } from '../models/Member.js';
import { Counter } from '../models/Counter.js';
import { IdempotencyKey } from '../models/IdempotencyKey.js';
import { INVOICE_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@gymos/shared';
import { AuditLogService } from './auditLogService.js';

export interface CreateInvoiceInput {
  tenantId: string;
  branchId: string;
  memberId: string;
  membershipId?: string;
  items: {
    description: string;
    quantity: number;
    unitPriceInPaise: number;
    taxRatePercent?: number;
  }[];
  discountInPaise?: number;
  isInterState?: boolean;
  notes?: string;
  idempotencyKey?: string;
  createdById?: string;
}

export interface RecordPaymentInput {
  tenantId: string;
  branchId: string;
  invoiceId: string;
  memberId: string;
  amountInPaise: number;
  paymentMethod: keyof typeof PAYMENT_METHOD;
  referenceNumber?: string;
  idempotencyKey?: string;
  recordedByUserId?: string;
}

export class BillingService {
  static isReplicaSet(): boolean {
    const topology = (mongoose.connection as any).client?.topology?.description;
    return topology?.type === 'ReplicaSetWithPrimary' || topology?.type === 'ReplicaSetNoPrimary';
  }

  /**
   * Helper: determine Indian Financial Year string (e.g. "2026-27")
   */
  static getFinancialYear(date: Date = new Date()): string {
    const month = date.getMonth() + 1; // 1 to 12
    const year = date.getFullYear();
    if (month >= 4) {
      return `${year}-${String(year + 1).slice(2)}`;
    } else {
      return `${year - 1}-${String(year).slice(2)}`;
    }
  }

  /**
   * Create an invoice with Indian GST calculation inside an ACID transaction with idempotency protection.
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const branchObjectId = new Types.ObjectId(input.branchId);
    const memberObjectId = new Types.ObjectId(input.memberId);

    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await IdempotencyKey.findOne({
        tenantId: tenantObjectId,
        key: input.idempotencyKey,
      });
      if (existing && existing.responseBody) {
        return existing.responseBody as unknown as IInvoice;
      }
    }

    const member = await Member.findById(memberObjectId);
    if (!member) throw new Error('Member not found');

    let createdInvoice: IInvoice | null = null;

    const runCreate = async (session?: mongoose.ClientSession) => {
      // 2. Compute Items and Subtotals in integer paise
      let subtotalInPaise = 0;
      let taxTotalInPaise = 0;

      const processedItems: IInvoiceItem[] = input.items.map((item) => {
        const itemAmount = item.unitPriceInPaise * item.quantity;
        const taxRate = item.taxRatePercent !== undefined ? item.taxRatePercent : 18;
        const itemTax = Math.round((itemAmount * taxRate) / 100);

        subtotalInPaise += itemAmount;
        taxTotalInPaise += itemTax;

        return {
          description: item.description,
          quantity: item.quantity,
          unitPriceInPaise: item.unitPriceInPaise,
          amountInPaise: itemAmount,
          taxRatePercent: taxRate,
          taxAmountInPaise: itemTax,
        };
      });

      const discountInPaise = Math.min(subtotalInPaise, input.discountInPaise || 0);
      const grandTotalInPaise = subtotalInPaise - discountInPaise + taxTotalInPaise;

      // 3. Generate Gapless Sequence Invoice Number
      const fy = this.getFinancialYear();
      const invoiceNumber = await Counter.getNextSequence(input.tenantId, 'INVOICE', 'INV', fy);

      // 4. Store snapshot of member at invoice generation time
      const memberSnapshot = {
        memberId: member._id.toString(),
        memberCode: member.memberCode,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        phone: member.phone,
        address: member.address,
      };

      const [invoice] = await Invoice.create(
        [
          {
            tenantId: tenantObjectId,
            branchId: branchObjectId,
            invoiceNumber,
            financialYear: fy,
            memberId: memberObjectId,
            membershipId: input.membershipId ? new Types.ObjectId(input.membershipId) : undefined,
            memberSnapshot,
            items: processedItems,
            subtotalInPaise,
            taxTotalInPaise,
            discountInPaise,
            grandTotalInPaise,
            paidAmountInPaise: 0,
            dueAmountInPaise: grandTotalInPaise,
            status: INVOICE_STATUS.UNPAID,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day payment window
            notes: input.notes,
          },
        ],
        session ? { session } : {},
      );

      createdInvoice = invoice;

      // Save Idempotency Key
      if (input.idempotencyKey) {
        await IdempotencyKey.create(
          [
            {
              tenantId: tenantObjectId,
              key: input.idempotencyKey,
              method: 'POST',
              path: '/api/billing/invoices',
              requestHash: input.idempotencyKey,
              responseBody: invoice.toObject(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
          session ? { session } : {},
        );
      }
    };

    if (this.isReplicaSet()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await runCreate(session);
        });
      } finally {
        await session.endSession();
      }
    } else {
      await runCreate();
    }

    if (!createdInvoice) throw new Error('Failed to create invoice');

    if (input.createdById) {
      await AuditLogService.record({
        tenantId: input.tenantId,
        userId: input.createdById,
        action: 'INVOICE_CREATE',
        entity: 'Invoice',
        entityId: (createdInvoice as IInvoice)._id.toString(),
        afterSnapshot: (createdInvoice as IInvoice).toObject(),
      });
    }

    return createdInvoice;
  }

  /**
   * Record a payment (Full or Partial) in an ACID transaction.
   */
  static async recordPayment(input: RecordPaymentInput): Promise<{
    payment: IPayment;
    invoice: IInvoice;
    isFullyPaid: boolean;
  }> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const branchObjectId = new Types.ObjectId(input.branchId);
    const invoiceObjectId = new Types.ObjectId(input.invoiceId);
    const memberObjectId = new Types.ObjectId(input.memberId);

    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await IdempotencyKey.findOne({
        tenantId: tenantObjectId,
        key: input.idempotencyKey,
      });
      if (existing && existing.responseBody) {
        return existing.responseBody as unknown as { payment: IPayment; invoice: IInvoice; isFullyPaid: boolean };
      }
    }

    let resultPayload: any = null;

    const runPayment = async (session?: mongoose.ClientSession) => {
      const query = Invoice.findById(invoiceObjectId);
      const invoice = session ? await query.session(session) : await query;
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === INVOICE_STATUS.PAID) {
        throw new Error('Invoice is already fully settled');
      }

      if (input.amountInPaise > invoice.dueAmountInPaise) {
        throw new Error(
          `Payment amount (₹${input.amountInPaise / 100}) exceeds balance due (₹${invoice.dueAmountInPaise / 100})`,
        );
      }

      // Generate payment receipt number
      const paymentNumber = await Counter.getNextSequence(input.tenantId, 'PAYMENT', 'RCPT');

      const [payment] = await Payment.create(
        [
          {
            tenantId: tenantObjectId,
            branchId: branchObjectId,
            paymentNumber,
            invoiceId: invoiceObjectId,
            memberId: memberObjectId,
            amountInPaise: input.amountInPaise,
            method: PAYMENT_METHOD[input.paymentMethod] || PAYMENT_METHOD.UPI,
            status: PAYMENT_STATUS.SUCCESSFUL,
            transactionRef: input.referenceNumber || `REF-${Date.now()}`,
            idempotencyKey: input.idempotencyKey || paymentNumber,
          },
        ],
        session ? { session } : {},
      );

      // Update Invoice balances
      invoice.paidAmountInPaise += input.amountInPaise;
      invoice.dueAmountInPaise -= input.amountInPaise;

      const isFullyPaid = invoice.dueAmountInPaise === 0;
      invoice.status = isFullyPaid ? INVOICE_STATUS.PAID : INVOICE_STATUS.PARTIALLY_PAID;
      if (session) {
        await invoice.save({ session });
      } else {
        await invoice.save();
      }

      resultPayload = {
        payment: payment.toObject(),
        invoice: invoice.toObject(),
        isFullyPaid,
      };

      if (input.idempotencyKey) {
        await IdempotencyKey.create(
          [
            {
              tenantId: tenantObjectId,
              key: input.idempotencyKey,
              method: 'POST',
              path: '/api/billing/payments',
              requestHash: input.idempotencyKey,
              responseBody: resultPayload,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          ],
          session ? { session } : {},
        );
      }
    };

    if (this.isReplicaSet()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await runPayment(session);
        });
      } finally {
        await session.endSession();
      }
    } else {
      await runPayment();
    }

    return resultPayload;
  }

  /**
   * Process a refund against an existing payment.
   */
  static async processRefund(
    tenantId: string,
    paymentId: string,
    amountInPaise: number,
    reason: string,
    _performedByUserId?: string,
  ) {
    const session = await mongoose.startSession();
    let refundDoc: any = null;

    try {
      await session.withTransaction(async () => {
        const payment = await Payment.findById(paymentId).session(session);
        if (!payment) throw new Error('Payment not found');
        if (amountInPaise > payment.amountInPaise) {
          throw new Error('Refund amount exceeds original payment amount');
        }

        const invoice = await Invoice.findById(payment.invoiceId).session(session);
        if (!invoice) throw new Error('Associated invoice not found');

        const refundNumber = await Counter.getNextSequence(tenantId, 'REFUND', 'RFND');

        const [createdRefund] = await Refund.create(
          [
            {
              tenantId: new Types.ObjectId(tenantId),
              paymentId: payment._id,
              invoiceId: invoice._id,
              memberId: payment.memberId,
              refundNumber,
              amountInPaise,
              reason,
              status: 'COMPLETED',
              processedDate: new Date(),
            },
          ],
          { session },
        );

        // Adjust invoice balance due
        invoice.paidAmountInPaise -= amountInPaise;
        invoice.dueAmountInPaise += amountInPaise;
        invoice.status = invoice.dueAmountInPaise === invoice.grandTotalInPaise
          ? INVOICE_STATUS.UNPAID
          : INVOICE_STATUS.PARTIALLY_PAID;
        await invoice.save({ session });

        refundDoc = createdRefund;
      });
    } finally {
      await session.endSession();
    }

    return refundDoc;
  }

  /**
   * Generate formatted printable tax invoice / receipt template.
   */
  static generateInvoiceHtml(invoice: IInvoice, gymDetails: { name: string; gstin?: string; address?: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .details { margin: 24px 0; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .totals { margin-top: 24px; width: 320px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${gymDetails.name}</div>
            <div>${gymDetails.address || 'Flagship Gym Location'}</div>
            <div>GSTIN: ${gymDetails.gstin || '27AABCT1332L1Z4'}</div>
          </div>
          <div style="text-align: right;">
            <h2>TAX INVOICE</h2>
            <div><strong>Invoice No:</strong> ${invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}</div>
            <div><strong>Status:</strong> ${invoice.status}</div>
          </div>
        </div>

        <div class="details">
          <div>
            <strong>Billed To:</strong><br>
            ${invoice.memberSnapshot.name} (${invoice.memberSnapshot.memberCode})<br>
            ${invoice.memberSnapshot.phone}<br>
            ${invoice.memberSnapshot.email}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Rate (₹)</th>
              <th>GST</th>
              <th style="text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td><strong>${item.description}</strong></td>
                <td>${item.quantity}</td>
                <td>₹${(item.unitPriceInPaise / 100).toFixed(2)}</td>
                <td>${item.taxRatePercent}%</td>
                <td style="text-align: right;">₹${(item.amountInPaise / 100).toFixed(2)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal:</span><span>₹${(invoice.subtotalInPaise / 100).toFixed(2)}</span></div>
          ${invoice.discountInPaise > 0 ? `<div class="totals-row"><span>Discount:</span><span>-₹${(invoice.discountInPaise / 100).toFixed(2)}</span></div>` : ''}
          <div class="totals-row"><span>GST Tax Total (18%):</span><span>₹${(invoice.taxTotalInPaise / 100).toFixed(2)}</span></div>
          <div class="totals-row grand-total"><span>Total Amount:</span><span>₹${(invoice.grandTotalInPaise / 100).toFixed(2)}</span></div>
          <div class="totals-row"><span>Paid Amount:</span><span>₹${(invoice.paidAmountInPaise / 100).toFixed(2)}</span></div>
          <div class="totals-row" style="color: ${invoice.dueAmountInPaise > 0 ? '#ea580c' : '#16a34a'};">
            <span>Balance Due:</span><span>₹${(invoice.dueAmountInPaise / 100).toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
