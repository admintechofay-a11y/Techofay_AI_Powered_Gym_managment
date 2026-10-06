import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { QrCode, CheckCircle2, Calendar, ShieldCheck, Flame, Award } from 'lucide-react';

export const MemberPortalPage: React.FC = () => {
  const member = {
    name: 'Aarav Sharma',
    memberId: 'GYM-2026-0042',
    plan: 'Annual Pro Elite (12 Months)',
    validUntil: '14 Jan 2027',
    status: 'ACTIVE',
    gymBranch: 'Andheri West Flagship',
    attendanceStreak: 18,
    totalVisitsThisMonth: 14,
  };

  const recentVisits = [
    { date: 'Today, 06 Oct', time: '06:45 PM', branch: 'Andheri West', type: 'QR Turnstile' },
    { date: 'Yesterday, 05 Oct', time: '07:10 PM', branch: 'Andheri West', type: 'Biometric' },
    { date: '03 Oct 2026', time: '06:50 PM', branch: 'Andheri West', type: 'QR Turnstile' },
    { date: '02 Oct 2026', time: '08:15 AM', branch: 'BKC Studio', type: 'QR Turnstile' },
  ];

  return (
    <div className="space-y-5">
      {/* Digital Access Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Verified Member Pass
            </span>
          </div>
          <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-xs">
            {member.status}
          </Badge>
        </div>

        <div className="mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">{member.name}</h2>
          <p className="font-mono text-xs text-emerald-200 mt-0.5">{member.memberId}</p>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-xs">
          <div>
            <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Plan</p>
            <p className="font-semibold">{member.plan}</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Expires</p>
            <p className="font-semibold">{member.validUntil}</p>
          </div>
        </div>
      </div>

      {/* QR Code Presentation Box */}
      <Card className="border-border/80 shadow-sm text-center">
        <CardContent className="p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Scan at Turnstile or Front Desk Camera
          </p>
          {/* Visual SVG QR representation */}
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-muted/40 p-3">
            <div className="relative flex flex-col items-center justify-center">
              <QrCode className="h-32 w-32 text-foreground" />
              <span className="font-mono text-[10px] text-muted-foreground mt-1">
                {member.memberId}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Auto-refreshes every 60 seconds for anti-passback protection
          </p>
        </CardContent>
      </Card>

      {/* Workout Streaks */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{member.attendanceStreak} Days</p>
              <p className="text-[10px] text-muted-foreground">Active Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{member.totalVisitsThisMonth} Visits</p>
              <p className="text-[10px] text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Log */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Visits</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="divide-y divide-border/60">
            {recentVisits.map((visit, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-foreground">{visit.date}</p>
                  <p className="text-[11px] text-muted-foreground">{visit.branch} • {visit.type}</p>
                </div>
                <Badge variant="success" size="sm">
                  {visit.time}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
