import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
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
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardOverviewPage: React.FC = () => {
  const { t } = useTranslation();

  // Live floor capacity metric
  const currentInGym = 32;
  const maxCapacity = 50;
  const capacityPercent = Math.round((currentInGym / maxCapacity) * 100);

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
      value: '84',
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

  const recentCheckins = [
    { id: '1', name: 'Arjun Verma', memberId: 'GYM-2026-0042', time: '2 mins ago', plan: 'Annual Pro', status: 'ACTIVE' },
    { id: '2', name: 'Neha Singhal', memberId: 'GYM-2026-0089', time: '7 mins ago', plan: 'Quarterly Fitness', status: 'ACTIVE' },
    { id: '3', name: 'Rohan Mehra', memberId: 'GYM-2026-0015', time: '14 mins ago', plan: 'Monthly Standard', status: 'ACTIVE' },
    { id: '4', name: 'Ananya Deshmukh', memberId: 'GYM-2026-0104', time: '22 mins ago', plan: 'PT 24 Sessions', status: 'ACTIVE' },
    { id: '5', name: 'Kabir Kapoor', memberId: 'GYM-2026-0071', time: '35 mins ago', plan: 'Half-Yearly Elite', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar with Live Capacity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time biometric turnstile telemetry and gym operations metrics
          </p>
        </div>

        {/* Live Gym Capacity Meter */}
        <div className="flex items-center gap-4 rounded-xl border border-brand-500/30 bg-card p-3 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
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

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/members" className="w-full">
          <Button variant="outline" className="w-full justify-start h-12" leftIcon={<UserPlus className="w-4 h-4 text-primary" />}>
            Register New Member
          </Button>
        </Link>
        <Link to="/attendance" className="w-full">
          <Button variant="outline" className="w-full justify-start h-12" leftIcon={<QrCode className="w-4 h-4 text-primary" />}>
            Camera / Biometric Check-In
          </Button>
        </Link>
        <Link to="/billing" className="w-full">
          <Button variant="outline" className="w-full justify-start h-12" leftIcon={<FileText className="w-4 h-4 text-primary" />}>
            Create Tax Invoice
          </Button>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 border-border/80">
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
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
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
                    stroke="#16a34a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Floor Activity */}
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">{t('dashboard.recentAttendance')}</CardTitle>
            <Link to="/attendance" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="divide-y divide-border/60">
              {recentCheckins.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      {item.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{item.memberId} • {item.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" size="sm">
                      Inside
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
