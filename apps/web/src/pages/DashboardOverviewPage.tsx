import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import {
  Users,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Activity,
  UserPlus,
  QrCode,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const DashboardOverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  // Live floor capacity metric
  const [currentInGym, setCurrentInGym] = useState(32);
  const maxCapacity = 60;
  const capacityPercent = Math.round((currentInGym / maxCapacity) * 100);

  // Turnstile Simulation Modal State
  const [isTurnstileModalOpen, setIsTurnstileModalOpen] = useState(false);
  const [punchIdentifier, setPunchIdentifier] = useState('');
  const [lastPunchResult, setLastPunchResult] = useState<{
    status: 'GRANTED' | 'DENIED_EXPIRED' | 'DENIED_FROZEN' | 'PASSBACK' | null;
    message: string;
    memberName?: string;
  }>({ status: null, message: '' });

  // Tax Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceMember, setInvoiceMember] = useState('Aarav Sharma (IP-2026-0001)');
  const [invoiceItem, setInvoiceItem] = useState('Annual VIP Club (12M)');
  const [isInterState, setIsInterState] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const kpis = [
    {
      title: t('dashboard.activeMembers'),
      value: '248',
      change: '+12% vs last month',
      icon: Users,
      trend: 'up',
      color: 'text-emerald-500',
    },
    {
      title: t('dashboard.todayCheckins'),
      value: `${84 + (currentInGym - 32)}`,
      change: 'Peak hour: 6:00 PM - 8:30 PM',
      icon: CalendarCheck,
      trend: 'neutral',
      color: 'text-sky-500',
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: '₹3,48,500',
      change: '+18.4% YoY',
      icon: CreditCard,
      trend: 'up',
      color: 'text-brand-500',
    },
    {
      title: t('dashboard.pendingDues'),
      value: '₹42,000',
      change: '6 invoices overdue',
      icon: AlertCircle,
      trend: 'down',
      color: 'text-amber-500',
    },
  ];

  const revenueData = [
    { day: 'Mon', revenue: 42000, checkins: 78 },
    { day: 'Tue', revenue: 58000, checkins: 92 },
    { day: 'Wed', revenue: 64000, checkins: 88 },
    { day: 'Thu', revenue: 49000, checkins: 81 },
    { day: 'Fri', revenue: 72000, checkins: 99 },
    { day: 'Sat', revenue: 95000, checkins: 130 },
    { day: 'Sun', revenue: 84000, checkins: 114 },
  ];

  const [recentCheckins, setRecentCheckins] = useState([
    { id: '1', name: 'Arjun Verma', memberId: 'IP-2026-0042', time: '2 mins ago', plan: 'Annual VIP Club', status: 'ACTIVE' },
    { id: '2', name: 'Neha Singhal', memberId: 'IP-2026-0089', time: '7 mins ago', plan: 'Quarterly Pro', status: 'ACTIVE' },
    { id: '3', name: 'Rohan Mehra', memberId: 'IP-2026-0015', time: '14 mins ago', plan: 'Monthly Gold', status: 'ACTIVE' },
    { id: '4', name: 'Ananya Deshmukh', memberId: 'IP-2026-0104', time: '22 mins ago', plan: 'PT 24 Sessions', status: 'ACTIVE' },
    { id: '5', name: 'Kabir Kapoor', memberId: 'IP-2026-0071', time: '35 mins ago', plan: 'Half-Yearly Elite', status: 'ACTIVE' },
  ]);

  const upcomingRenewals = [
    { id: 'r1', name: 'Dev Patel', memberId: 'IP-2026-0018', plan: 'Quarterly Pro', expiresOn: '2026-10-12 (in 6 days)', phone: '+91 98200 44332' },
    { id: 'r2', name: 'Meera Sen', memberId: 'IP-2026-0029', plan: 'Monthly Gold', expiresOn: '2026-10-15 (in 9 days)', phone: '+91 98200 55443' },
    { id: 'r3', name: 'Vikram Joshi', memberId: 'IP-2026-0007', plan: 'Annual VIP Club', expiresOn: '2026-10-18 (in 12 days)', phone: '+91 98200 66554' },
  ];

  const handleSimulatePunch = (memberType: 'ACTIVE' | 'EXPIRED' | 'FROZEN') => {
    if (memberType === 'ACTIVE') {
      const newOccupancy = currentInGym + 1;
      setCurrentInGym(newOccupancy);
      setLastPunchResult({
        status: 'GRANTED',
        message: 'Turnstile Unlocked: Gate access granted. Welcome to IronPulse!',
        memberName: 'Aarav Sharma (IP-2026-0001)',
      });
      setRecentCheckins([
        { id: `chk-${Date.now()}`, name: 'Aarav Sharma', memberId: 'IP-2026-0001', time: 'Just now', plan: 'Annual VIP Club', status: 'ACTIVE' },
        ...recentCheckins.slice(0, 4),
      ]);
      success('Turnstile Unlocked', 'Access granted. Live floor capacity updated.');
    } else if (memberType === 'EXPIRED') {
      setLastPunchResult({
        status: 'DENIED_EXPIRED',
        message: 'Gate Access Denied: Membership plan expired on 2026-09-30. Renewal required at reception desk.',
        memberName: 'Rohan Mehra (IP-2026-0003)',
      });
      toastError('Turnstile Blocked', 'Access Denied: Membership expired.');
    } else {
      setLastPunchResult({
        status: 'DENIED_FROZEN',
        message: 'Gate Access Denied: Membership is currently frozen until 2026-10-15. Please unfreeze at reception to enter.',
        memberName: 'Kabir Kapoor (IP-2026-0005)',
      });
      toastError('Turnstile Blocked', 'Access Denied: Membership is frozen.');
    }
  };

  // Tax invoice calculations
  const basePrice = invoiceItem.includes('Annual') ? 20000 : invoiceItem.includes('Half') ? 11500 : 6500;
  const taxableSubtotal = Math.max(0, basePrice - discountAmount);
  const cgst = isInterState ? 0 : Math.round(taxableSubtotal * 0.09);
  const sgst = isInterState ? 0 : Math.round(taxableSubtotal * 0.09);
  const igst = isInterState ? Math.round(taxableSubtotal * 0.18) : 0;
  const taxTotal = cgst + sgst + igst;
  const grandTotal = taxableSubtotal + taxTotal;

  return (
    <div className="space-y-6 max-w-full min-w-0">
      {/* Header bar with Live Capacity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time biometric turnstile telemetry, financial ledger, and live gym operations
          </p>
        </div>

        {/* Live Gym Capacity Meter */}
        <div
          onClick={() => setIsTurnstileModalOpen(true)}
          className="flex items-center gap-4 rounded-xl border border-brand-500/30 bg-card p-3 shadow-sm hover:border-brand-500 transition-all cursor-pointer group"
          title="Click to simulate turnstile gate punch"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {currentInGym} in gym now
              </span>
              <Badge variant={capacityPercent > 80 ? 'warning' : 'success'} size="sm">
                {capacityPercent}% Capacity
              </Badge>
            </div>
            <div className="mt-1.5 h-1.5 w-36 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  capacityPercent > 80 ? 'bg-amber-500' : 'bg-brand-500'
                }`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-border/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <div className={`p-2 rounded-lg bg-muted/50 ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold text-foreground">{kpi.value}</div>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <span>{kpi.change}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Interactive Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/members" className="w-full">
          <Button variant="outline" className="w-full justify-start h-12" leftIcon={<UserPlus className="w-4 h-4 text-brand-500" />}>
            Register New Member
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-start h-12"
          onClick={() => setIsTurnstileModalOpen(true)}
          leftIcon={<QrCode className="w-4 h-4 text-sky-500" />}
        >
          Gate / Biometric Simulator
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start h-12"
          onClick={() => setIsInvoiceModalOpen(true)}
          leftIcon={<FileText className="w-4 h-4 text-emerald-500" />}
        >
          Generate GST Tax Invoice
        </Button>
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity Chart */}
        <Card className="lg:col-span-2 border-border/80 min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Weekly Revenue Velocity</CardTitle>
              <p className="text-xs text-muted-foreground">Collections via UPI, Cards, Net Banking & Cash</p>
            </div>
            <Badge variant="outline" size="sm">
              Last 7 Days
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Gate Check-ins Stream */}
        <Card className="border-border/80 min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Live Floor Telemetry</CardTitle>
              <p className="text-xs text-muted-foreground">{currentInGym} active members in gym</p>
            </div>
            <Badge variant="success" size="sm">
              Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {recentCheckins.map((chk) => (
                <div key={chk.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {chk.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{chk.name}</div>
                      <div className="text-[10px] text-muted-foreground">{chk.memberId} • {chk.time}</div>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    {chk.plan.split(' ')[0]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals Table */}
      <Card className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Upcoming Membership Expiries (Next 14 Days)</CardTitle>
            <p className="text-xs text-muted-foreground">Automated WhatsApp retention outreach triggers</p>
          </div>
          <Badge variant="warning" size="sm">
            {upcomingRenewals.length} Renewals Due
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border border border-border rounded-lg text-xs">
            {upcomingRenewals.map((r) => (
              <div key={r.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card">
                <div>
                  <div className="font-semibold text-foreground">{r.name} ({r.memberId})</div>
                  <div className="text-muted-foreground">{r.plan} • {r.expiresOn}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => success('WhatsApp Reminder Dispatched', `Retention message sent to ${r.phone}`)}
                    leftIcon={<Send className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Send WhatsApp Reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="brand"
                    className="h-7 text-xs"
                    onClick={() => success('Renewal Processed', `1-Year renewal invoice generated for ${r.name}`)}
                  >
                    Renew Plan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 1. Turnstile / Gate Check-In Simulator Modal                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTurnstileModalOpen}
        onClose={() => {
          setIsTurnstileModalOpen(false);
          setLastPunchResult({ status: null, message: '' });
        }}
        title="Biometric & QR Turnstile Hardware Simulator"
        description="Emulates physical access control gate decision logic (Gate 01 - Bandra)"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {/* Simulated Scanner Visual */}
          <div className="p-4 rounded-xl border border-border bg-gradient-to-b from-card to-muted/30 flex flex-col items-center justify-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 border border-brand-500/30">
              <QrCode className="w-8 h-8 animate-pulse" />
            </div>
            <div className="font-bold text-sm text-foreground">Turnstile Turngate 01 Active</div>
            <div className="text-[11px] text-muted-foreground">RFID / Biometric / Camera QR Scanner Ready</div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2">
            <div className="font-semibold text-foreground">Quick Test Member RFID/QR Punches:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 justify-center border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => handleSimulatePunch('ACTIVE')}
              >
                Punch Active
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 justify-center border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleSimulatePunch('EXPIRED')}
              >
                Punch Expired
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 justify-center border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => handleSimulatePunch('FROZEN')}
              >
                Punch Frozen
              </Button>
            </div>
          </div>

          {/* Result Alert Feedback */}
          {lastPunchResult.status && (
            <div
              className={`p-3.5 rounded-lg border text-xs ${
                lastPunchResult.status === 'GRANTED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : lastPunchResult.status === 'DENIED_EXPIRED'
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}
            >
              <div className="flex items-start gap-2">
                {lastPunchResult.status === 'GRANTED' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {lastPunchResult.status === 'GRANTED' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5">{lastPunchResult.memberName}</div>
                  <div className="mt-1 leading-relaxed">{lastPunchResult.message}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsTurnstileModalOpen(false)}>
              Close Simulator
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Create Tax Invoice Modal with Indian GST                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate Tax Invoice (GST Compliant)"
        description="Creates gapless FY sequence invoice with SAC 999723 tax schedule"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Member"
              value={invoiceMember}
              onChange={(e) => setInvoiceMember(e.target.value)}
              options={[
                { label: 'Aarav Sharma (IP-2026-0001)', value: 'Aarav Sharma (IP-2026-0001)' },
                { label: 'Priya Iyer (IP-2026-0002)', value: 'Priya Iyer (IP-2026-0002)' },
                { label: 'Ananya Deshmukh (IP-2026-0004)', value: 'Ananya Deshmukh (IP-2026-0004)' },
              ]}
            />
            <Select
              label="Item / Service"
              value={invoiceItem}
              onChange={(e) => setInvoiceItem(e.target.value)}
              options={[
                { label: 'Annual VIP Club (12M) - ₹20,000 Base', value: 'Annual VIP Club (12M)' },
                { label: 'Half-Yearly Elite (6M) - ₹11,500 Base', value: 'Half-Yearly Elite (6M)' },
                { label: 'Quarterly Pro (3M) - ₹6,500 Base', value: 'Quarterly Pro (3M)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-foreground mb-1">Place of Supply / GST Region</label>
              <div className="flex rounded-lg border border-border p-1 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setIsInterState(false)}
                  className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                    !isInterState ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Intra-State (CGST 9% + SGST 9%)
                </button>
                <button
                  type="button"
                  onClick={() => setIsInterState(true)}
                  className={`flex-1 py-1 rounded text-xs font-semibold transition-all ${
                    isInterState ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Inter-State (IGST 18%)
                </button>
              </div>
            </div>

            <Input
              label="Discount (₹ INR)"
              type="number"
              value={String(discountAmount)}
              onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
            />
          </div>

          {/* Tax Breakdown Preview Box */}
          <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
            <div className="flex justify-between font-mono text-muted-foreground">
              <span>Invoice Sequence Number:</span>
              <span className="font-bold text-foreground">INV-2026-27-0043</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Gym GSTIN:</span>
              <span className="font-mono text-foreground">27AABCU9603R1ZM (Maharashtra)</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>SAC Code:</span>
              <span>999723 (Physical Fitness Services)</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxable Subtotal:</span>
              <span className="font-semibold text-foreground">₹{taxableSubtotal.toLocaleString('en-IN')}</span>
            </div>

            {!isInterState ? (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST (9.0%):</span>
                  <span className="font-semibold text-foreground">₹{cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST (9.0%):</span>
                  <span className="font-semibold text-foreground">₹{sgst.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-muted-foreground">
                <span>IGST (18.0%):</span>
                <span className="font-semibold text-foreground">₹{igst.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-sm text-foreground pt-2 border-t border-border">
              <span>Grand Total Payable:</span>
              <span className="text-brand-600">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setIsInvoiceModalOpen(false);
                success('Tax Invoice Created', `INV-2026-27-0043 generated for ₹${grandTotal.toLocaleString('en-IN')}`);
              }}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Generate & Record Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
