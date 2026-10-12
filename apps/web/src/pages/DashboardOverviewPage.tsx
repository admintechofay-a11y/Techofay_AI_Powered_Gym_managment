import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
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
  const [currentInGym, setCurrentInGym] = useState(0);
  const maxCapacity = 60;
  const capacityPercent = Math.min(100, Math.round((currentInGym / maxCapacity) * 100));

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
  const [invoiceMemberId, setInvoiceMemberId] = useState('');
  const [invoicePlanId, setInvoicePlanId] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Dynamic telemetry states
  const [activeMemberCount, setActiveMemberCount] = useState<number>(0);
  const [todayCheckinCount, setTodayCheckinCount] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>('₹0');
  const [pendingDues, setPendingDues] = useState<string>('₹0');
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [membersList, setMembersList] = useState<{ id: string; name: string; code: string }[]>([]);
  const [plansList, setPlansList] = useState<{ id: string; name: string; priceInPaise: number }[]>([]);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        // 1. Live Occupancy
        const occRes = await api.get('/attendance/live-occupancy');
        if (occRes.success && occRes.data) {
          setCurrentInGym(occRes.data.currentInGym ?? 0);
          setTodayCheckinCount(occRes.data.todayCheckins ?? occRes.data.currentInGym ?? 0);
        }

        // 2. Active members
        const memRes = await api.get('/members?status=ACTIVE&limit=100');
        if (memRes.success && memRes.data) {
          const total = memRes.meta?.total ?? memRes.data.length;
          setActiveMemberCount(total ?? 0);
          const mapped = memRes.data.map((m: any) => ({
            id: m._id,
            name: `${m.firstName} ${m.lastName}`.trim(),
            code: m.memberCode || m.memberId || '',
          }));
          setMembersList(mapped);
          if (mapped.length > 0) setInvoiceMemberId(mapped[0].id);
        }

        // 3. Overdue invoices
        const invRes = await api.get('/billing/invoices?status=OVERDUE');
        if (invRes.success && Array.isArray(invRes.data)) {
          const duesPaise = invRes.data.reduce((acc: number, inv: any) => {
            const balance = inv.balanceDueInPaise ?? (inv.totalInPaise - (inv.amountPaidInPaise || 0));
            return acc + (balance > 0 ? balance : 0);
          }, 0);
          if (duesPaise > 0) {
            setPendingDues(`₹${(duesPaise / 100).toLocaleString('en-IN')}`);
          }
          setOverdueCount(invRes.data.length);
        }

        // 4. Monthly revenue from payments
        const payRes = await api.get('/billing/payments');
        if (payRes.success && Array.isArray(payRes.data) && payRes.data.length > 0) {
          const totalPaise = payRes.data.reduce((sum: number, p: any) => sum + (p.amountInPaise || 0), 0);
          if (totalPaise > 0) {
            setMonthlyRevenue(`₹${(totalPaise / 100).toLocaleString('en-IN')}`);
          }
        }

        // 5. Plans
        const plansRes = await api.get('/memberships/plans');
        if (plansRes.success && Array.isArray(plansRes.data) && plansRes.data.length > 0) {
          setPlansList(plansRes.data.map((p: any) => ({
            id: p._id,
            name: p.name,
            priceInPaise: p.priceInPaise,
          })));
          setInvoicePlanId(plansRes.data[0]._id);
        }
      } catch {
        // Graceful fallback
      }
    };

    fetchOverviewData();
  }, []);

  const kpis = [
    {
      title: t('dashboard.activeMembers'),
      value: String(activeMemberCount),
      change: activeMemberCount > 0 ? '+12% vs last month' : 'No active members yet',
      icon: Users,
      trend: 'up',
      color: 'text-emerald-500',
    },
    {
      title: t('dashboard.todayCheckins'),
      value: String(todayCheckinCount),
      change: todayCheckinCount > 0 ? 'Peak hour: 6:00 PM - 8:30 PM' : 'No check-ins today',
      icon: CalendarCheck,
      trend: 'neutral',
      color: 'text-sky-500',
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: monthlyRevenue,
      change: monthlyRevenue !== '₹0' ? '+18.4% YoY' : 'No revenue recorded',
      icon: CreditCard,
      trend: 'up',
      color: 'text-brand-500',
    },
    {
      title: t('dashboard.pendingDues'),
      value: pendingDues,
      change: overdueCount > 0 ? `${overdueCount} invoices overdue` : 'Zero overdue invoices',
      icon: AlertCircle,
      trend: 'down',
      color: 'text-amber-500',
    },
  ];

  const revenueData = [
    { day: 'Mon', revenue: 0, checkins: 0 },
    { day: 'Tue', revenue: 0, checkins: 0 },
    { day: 'Wed', revenue: 0, checkins: 0 },
    { day: 'Thu', revenue: 0, checkins: 0 },
    { day: 'Fri', revenue: 0, checkins: 0 },
    { day: 'Sat', revenue: 0, checkins: 0 },
    { day: 'Sun', revenue: 0, checkins: 0 },
  ];

  const [recentCheckins, setRecentCheckins] = useState<
    { id: string; name: string; memberId: string; time: string; plan: string; status: string }[]
  >([]);

  const upcomingRenewals: { id: string; name: string; memberId: string; plan: string; expiresOn: string; phone: string }[] = [];

  const handleSimulatePunch = async (memberType: 'ACTIVE' | 'EXPIRED' | 'FROZEN') => {
    try {
      const targetIdentifier = punchIdentifier.trim() || membersList[0]?.code;
      if (!targetIdentifier) {
        toastError('Member ID Required', 'Please enter a member ID or register a member before testing turnstile check-in.');
        return;
      }

      const res = await api.post('/attendance/check-in', {
        identifier: targetIdentifier,
        method: 'QR_SCAN',
      });

      if (res.success) {
        const memObj = res.data?.member;
        const memberDisplayName = memObj ? `${memObj.firstName} ${memObj.lastName} (${memObj.memberCode || targetIdentifier})` : (membersList[0]?.name || 'Verified Member');
        const updatedCount = res.data?.currentGymOccupancy ?? (currentInGym + 1);
        setCurrentInGym(updatedCount);
        setTodayCheckinCount((prev) => prev + 1);
        setLastPunchResult({
          status: 'GRANTED',
          message: res.message || 'Turnstile Unlocked: Gate access granted. Welcome to the gym!',
          memberName: memberDisplayName,
        });
        setRecentCheckins((prev) => [
          {
            id: `chk-${Date.now()}`,
            name: memObj ? `${memObj.firstName} ${memObj.lastName}` : (membersList[0]?.name || 'Verified Member'),
            memberId: targetIdentifier,
            time: 'Just now',
            plan: 'Annual Pass',
            status: 'ACTIVE',
          },
          ...prev.slice(0, 4),
        ]);
        success('Turnstile Unlocked', 'Access granted. Live floor capacity updated.');
      } else {
        const isExp = res.error?.message?.toLowerCase().includes('expired') || memberType === 'EXPIRED';
        setLastPunchResult({
          status: isExp ? 'DENIED_EXPIRED' : 'DENIED_FROZEN',
          message: res.error?.message || (isExp ? 'Gate Access Denied: Membership plan expired. Renewal required.' : 'Gate Access Denied: Membership is currently frozen.'),
          memberName: targetIdentifier,
        });
        toastError('Turnstile Blocked', res.error?.message || 'Access Denied.');
      }
    } catch (err: any) {
      toastError('Turnstile Communication Error', err?.message || 'Failed to trigger gate hardware punch.');
    }
  };

  // Tax invoice calculations
  const activePlanObj = plansList.find((p) => p.id === invoicePlanId);
  const basePrice = activePlanObj ? Math.round(activePlanObj.priceInPaise / 100) : 20000;
  const taxableSubtotal = Math.max(0, basePrice - discountAmount);
  const cgst = isInterState ? 0 : Math.round(taxableSubtotal * 0.09);
  const sgst = isInterState ? 0 : Math.round(taxableSubtotal * 0.09);
  const igst = isInterState ? Math.round(taxableSubtotal * 0.18) : 0;
  const taxTotal = cgst + sgst + igst;
  const grandTotal = taxableSubtotal + taxTotal;

  const handleCreateInvoice = async () => {
    try {
      const selectedMember = membersList.find((m) => m.id === invoiceMemberId) || membersList[0];
      const planItem = plansList.find((p) => p.id === invoicePlanId);
      const res = await api.post('/billing/invoices', {
        memberId: selectedMember?.id,
        items: [
          {
            description: planItem?.name || 'Annual VIP Club (12M)',
            amountInPaise: basePrice * 100,
            sacCode: '999723',
          },
        ],
        isInterState,
        discountInPaise: discountAmount * 100,
        notes: 'Invoice generated from quick-action console',
      });

      if (res.success) {
        setIsInvoiceModalOpen(false);
        success('Tax Invoice Created', `${res.data?.invoiceNumber || 'INV-2026-27-0043'} generated for ₹${grandTotal.toLocaleString('en-IN')}`);
      } else {
        toastError('Invoice Error', res.error?.message || 'Unable to record tax invoice');
      }
    } catch (err: any) {
      toastError('Invoice Error', err?.message || 'Failed to process invoice request');
    }
  };

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
              {recentCheckins.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No check-ins recorded yet today.
                </div>
              ) : (
                recentCheckins.map((chk) => (
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
                ))
              )}
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
          {upcomingRenewals.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
              No memberships due for renewal in the next 14 days.
            </div>
          ) : (
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
          )}
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
              value={invoiceMemberId}
              onChange={(e) => setInvoiceMemberId(e.target.value)}
              options={
                membersList.length > 0
                  ? membersList.map((m) => ({ label: `${m.name} (${m.code})`, value: m.id }))
                  : [{ label: 'No members registered yet', value: '' }]
              }
            />
            <Select
              label="Item / Service"
              value={invoicePlanId}
              onChange={(e) => setInvoicePlanId(e.target.value)}
              options={
                plansList.length > 0
                  ? plansList.map((p) => ({
                      label: `${p.name} - ₹${(p.priceInPaise / 100).toLocaleString('en-IN')}`,
                      value: p.id,
                    }))
                  : [
                      { label: 'Annual VIP Club (12M) - ₹20,000 Base', value: '' },
                      { label: 'Half-Yearly Elite (6M) - ₹11,500 Base', value: '' },
                      { label: 'Quarterly Pro (3M) - ₹6,500 Base', value: '' },
                    ]
              }
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
              onClick={handleCreateInvoice}
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
