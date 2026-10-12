import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  Receipt,
  Plus,
  CreditCard,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  DollarSign,
  FileText,
  RotateCcw,
  Building2,
  Wallet,
  Sparkles,
} from 'lucide-react';

interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  financialYear: string;
  memberId?: {
    _id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    email: string;
  };
  memberSnapshot?: {
    name: string;
    phone: string;
    memberCode: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPriceInPaise: number;
    taxRatePercent: number;
    amountInPaise: number;
  }[];
  subtotalInPaise: number;
  taxTotalInPaise: number;
  discountInPaise: number;
  grandTotalInPaise: number;
  paidAmountInPaise: number;
  dueAmountInPaise: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
}

interface PaymentRecord {
  _id: string;
  invoiceId: string;
  memberId?: {
    _id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
  };
  amountInPaise: number;
  paymentMethod: string;
  referenceNumber?: string;
  status: string;
  transactionDate: string;
}

export const BillingPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');

  // Modals
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState(false);
  const [recordPaymentModalOpen, setRecordPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    memberId: '',
    description: 'Gym Membership & Facility Access',
    quantity: 1,
    unitPriceInInr: 3000,
    taxRatePercent: 18,
    discountInInr: 0,
    notes: 'Official Gym GST Tax Invoice',
  });

  // Record Payment Form
  const [paymentForm, setPaymentForm] = useState({
    amountInInr: 0,
    paymentMethod: 'UPI',
    referenceNumber: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [invRes, payRes, mListRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/billing/payments'),
        api.get('/members?limit=100'),
      ]);

      if (invRes.success && Array.isArray(invRes.data)) {
        setInvoices(invRes.data);
      }
      if (payRes.success && Array.isArray(payRes.data)) {
        setPayments(payRes.data);
      }
      if (mListRes.success && Array.isArray(mListRes.data)) {
        setMembersList(mListRes.data);
      }
    } catch {
      toastError('Error', 'Unable to fetch billing & payment data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const totalInvoicedInr = invoices.reduce((acc, inv) => acc + inv.grandTotalInPaise / 100, 0);
  const totalPaidInr = invoices.reduce((acc, inv) => acc + inv.paidAmountInPaise / 100, 0);
  const totalDueInr = invoices.reduce((acc, inv) => acc + inv.dueAmountInPaise / 100, 0);

  // Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.memberId) {
      toastError('Validation', 'Please select a member');
      return;
    }

    try {
      const items = [
        {
          description: invoiceForm.description,
          quantity: Number(invoiceForm.quantity || 1),
          unitPriceInPaise: Math.round(Number(invoiceForm.unitPriceInInr) * 100),
          taxRatePercent: Number(invoiceForm.taxRatePercent || 18),
        },
      ];

      const res = await api.post('/billing/invoices', {
        memberId: invoiceForm.memberId,
        items,
        discountInPaise: Math.round(Number(invoiceForm.discountInInr || 0) * 100),
        notes: invoiceForm.notes,
      });

      if (res.success) {
        success('Invoice Generated', `Invoice ${res.data?.invoiceNumber} created with gapless sequence`);
        setCreateInvoiceModalOpen(false);
        fetchData();
      } else {
        toastError('Failed', res.error?.message || 'Could not create invoice');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await api.post('/billing/payments', {
        invoiceId: selectedInvoice._id,
        memberId: selectedInvoice.memberId?._id || selectedInvoice.memberId,
        amountInPaise: Math.round(Number(paymentForm.amountInInr) * 100),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
      });

      if (res.success) {
        success('Payment Recorded', res.message || 'Payment added to ledger');
        setRecordPaymentModalOpen(false);
        setSelectedInvoice(null);
        fetchData();
      } else {
        toastError('Payment Failed', res.error?.message || 'Unable to record payment');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Open Printable Invoice
  const handlePrintInvoice = (invoiceId: string) => {
    window.open(`/api/billing/invoices/${invoiceId}/print`, '_blank');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const memberName = (
      inv.memberSnapshot?.name ||
      `${inv.memberId?.firstName || ''} ${inv.memberId?.lastName || ''}`
    ).toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || invNum.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing & Invoicing</h1>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
              GST Tax Ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Compliant gapless tax invoices, UPI / Card payments, split installments, and printed customer receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateInvoiceModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
          >
            <Plus className="w-4 h-4" />
            Create Tax Invoice
          </Button>
        </div>
      </div>

      {/* Financial Health Overview Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Total Invoiced Revenue
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground font-mono">
            ₹{totalInvoicedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Across {invoices.length} generated tax invoices
          </p>
        </Card>

        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Collected Payments
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">
            ₹{totalPaidInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Settled via UPI, Card, Net Banking & Cash
          </p>
        </Card>

        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Pending Receivable Dues
            </span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 font-mono">
            ₹{totalDueInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Outstanding balance awaiting settlement
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'INVOICES'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tax Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'PAYMENTS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Payment Transactions ({payments.length})
          </button>
        </div>

        {activeTab === 'INVOICES' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice # or member..."
                className="pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'INVOICES' && (
        <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-sm">
          {filteredInvoices.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Invoices Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No tax invoices have been generated yet. Click &quot;Create Tax Invoice&quot; to issue a new bill.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Due Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredInvoices.map((inv) => {
                    const memberName =
                      inv.memberSnapshot?.name ||
                      (inv.memberId ? `${inv.memberId.firstName} ${inv.memberId.lastName}` : 'Walk-in Member');
                    const code = inv.memberSnapshot?.memberCode || inv.memberId?.memberCode || 'N/A';
                    const isPaid = inv.status === 'PAID';
                    const isPartial = inv.status === 'PARTIAL';

                    return (
                      <tr key={inv._id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4 font-mono font-semibold text-foreground text-xs">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{memberName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{code}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">
                          ₹{(inv.grandTotalInPaise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold text-xs">
                          ₹{(inv.paidAmountInPaise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-amber-400">
                          ₹{(inv.dueAmountInPaise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          {isPaid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Paid
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Partial
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintInvoice(inv._id)}
                            className="text-xs h-7 px-2.5 border-border hover:bg-secondary"
                            title="Open Printable Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print
                          </Button>

                          {!isPaid && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentForm({
                                  amountInInr: inv.dueAmountInPaise / 100,
                                  paymentMethod: 'UPI',
                                  referenceNumber: '',
                                });
                                setRecordPaymentModalOpen(true);
                              }}
                              className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" />
                              Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Payments Ledger Table */}
      {activeTab === 'PAYMENTS' && (
        <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-sm">
          {payments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Payments Recorded</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No payment transactions have been logged. Settle invoices to populate this audit ledger.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4">Transaction Date</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / UTR #</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {payments.map((p) => {
                    const memberName = p.memberId
                      ? `${p.memberId.firstName} ${p.memberId.lastName}`
                      : 'Gym Member';

                    return (
                      <tr key={p._id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(p.transactionDate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {memberName}
                          {p.memberId?.memberCode && (
                            <span className="text-xs text-muted-foreground font-mono ml-1.5">
                              ({p.memberId.memberCode})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ₹{(p.amountInPaise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {p.paymentMethod}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {p.referenceNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Success
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Create Tax Invoice */}
      <Modal
        isOpen={createInvoiceModalOpen}
        onClose={() => setCreateInvoiceModalOpen(false)}
        title="Generate Official GST Tax Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Bill To Member</label>
            <select
              value={invoiceForm.memberId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, memberId: e.target.value })}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">-- Choose Member --</option>
              {membersList.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.firstName} {m.lastName} ({m.memberCode || m.phone})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Service / Product Description"
            placeholder="e.g. 3-Month Membership Plan / Personal Training"
            value={invoiceForm.description}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={invoiceForm.quantity}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: Number(e.target.value) })}
              required
            />
            <Input
              label="Unit Price (₹ INR)"
              type="number"
              value={invoiceForm.unitPriceInInr}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, unitPriceInInr: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">GST Tax Rate</label>
              <select
                value={invoiceForm.taxRatePercent}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRatePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={18}>18% GST (Standard Fitness Service)</option>
                <option value={12}>12% GST</option>
                <option value={5}>5% GST (Nutritional Food Supplements)</option>
                <option value={0}>0% GST (Exempt)</option>
              </select>
            </div>
            <Input
              label="Discount (₹ INR)"
              type="number"
              value={invoiceForm.discountInInr}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, discountInInr: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Invoice Memo / Notes"
            value={invoiceForm.notes}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setCreateInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Generate Tax Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={recordPaymentModalOpen}
        onClose={() => setRecordPaymentModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-secondary/40 rounded-xl border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Due:</span>
              <strong className="text-amber-400 font-mono">
                ₹{selectedInvoice ? (selectedInvoice.dueAmountInPaise / 100).toLocaleString('en-IN') : 0}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Invoiced:</span>
              <span className="font-mono text-foreground">
                ₹{selectedInvoice ? (selectedInvoice.grandTotalInPaise / 100).toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>

          <Input
            label="Payment Amount (₹ INR)"
            type="number"
            value={paymentForm.amountInInr}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountInInr: Number(e.target.value) })}
            required
          />

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
              <option value="CARD">Credit / Debit Card (POS)</option>
              <option value="CASH">Cash at Reception</option>
              <option value="BANK_TRANSFER">NEFT / RTGS / IMPS Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <Input
            label="Transaction Reference / UTR Number"
            placeholder="e.g. 429381029481 (Optional for cash)"
            value={paymentForm.referenceNumber}
            onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setRecordPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Settle &amp; Update Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
