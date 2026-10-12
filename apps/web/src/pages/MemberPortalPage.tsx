import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { api } from '../services/api.js';
import {
  QrCode,
  ShieldCheck,
  Flame,
  Award,
  Activity,
  Trophy,
  Wallet,
  TrendingUp,
  Camera,
  Share2,
  Copy,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Dumbbell,
  Utensils,
  UserCheck,
  Receipt,
  Download,
  AlertTriangle,
  Trash2,
  Lock,
  RefreshCw,
  Star,
  MessageCircle,
  Smartphone,
  Check,
  FileText,
  Clock,
  Calendar,
} from 'lucide-react';

export const MemberPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'PASS' | 'WORKOUTS' | 'DIET' | 'TRAINER' | 'ASSESSMENTS' | 'INVOICES' | 'WALLET' | 'DPDP'
  >('PASS');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [qrToken, setQrToken] = useState('GYMOS:CHK:M7821-TK9042');
  const [isOfflineReady, setIsOfflineReady] = useState(true);
  const [pwaPromptDismissed, setPwaPromptDismissed] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // DPDP Erasure Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('Relocating to another city');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [deleteRequested, setDeleteRequested] = useState(false);

  // Workouts interactive checklist
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({
    ex1: true,
    ex2: true,
    ex3: false,
    ex4: false,
  });

  // Dynamic QR auto-rotation via signed backend tokens
  const fetchDynamicQr = async () => {
    try {
      const res = await api.get('/member-pwa/qr');
      if (res.success && res.data) {
        setQrToken(res.data.token || res.data.qrPayload || `GYMOS:CHK:M7821-TK${Date.now().toString(36).toUpperCase()}`);
        setQrCountdown(res.data.expiresInSeconds || 30);
      } else {
        const timeKey = Date.now().toString(36).substring(2, 7).toUpperCase();
        setQrToken(`GYMOS:CHK:M7821-TK${timeKey}`);
      }
    } catch {
      const timeKey = Date.now().toString(36).substring(2, 7).toUpperCase();
      setQrToken(`GYMOS:CHK:M7821-TK${timeKey}`);
    }
  };

  useEffect(() => {
    fetchDynamicQr();
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchDynamicQr();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [memberData, setMemberData] = useState<any>(null);

  useEffect(() => {
    const fetchMemberProfile = async () => {
      try {
        const [profRes, memRes, attRes] = await Promise.all([
          api.get('/member-pwa/profile'),
          api.get('/member-pwa/membership'),
          api.get('/member-pwa/attendance'),
        ]);

        if (profRes.success && profRes.data) {
          setMemberData({
            name: profRes.data.name || `${profRes.data.firstName || ''} ${profRes.data.lastName || ''}`.trim() || 'Gym Member',
            memberId: profRes.data.memberCode || profRes.data.memberId || 'MEM-001',
            phone: profRes.data.phone || '',
            plan: memRes.data?.planName || profRes.data.plan || 'Standard Membership',
            planType: memRes.data?.planType || 'STANDARD',
            validUntil: memRes.data?.validUntil ? new Date(memRes.data.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            daysRemaining: memRes.data?.daysRemaining ?? 0,
            status: memRes.data?.status || profRes.data.status || 'ACTIVE',
            gymBranch: profRes.data.branchName || 'Main Branch',
            attendanceStreak: attRes.data?.streak ?? 0,
            totalVisitsThisMonth: attRes.data?.visitsThisMonth ?? 0,
            referralCode: profRes.data.referralCode || '',
            walletBalanceInInr: profRes.data.walletBalance ?? 0,
          });
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchMemberProfile();
  }, []);

  const defaultMember = {
    name: 'Gym Member',
    memberId: 'MEM-001',
    phone: '',
    plan: 'Standard Membership',
    planType: 'STANDARD',
    validUntil: 'N/A',
    daysRemaining: 0,
    status: 'ACTIVE',
    gymBranch: 'Main Branch',
    attendanceStreak: 0,
    totalVisitsThisMonth: 0,
    referralCode: '',
    walletBalanceInInr: 0,
  };

  const member = memberData || defaultMember;

  const streakMilestones = [
    { title: 'Consistency Pioneer', days: 7, achieved: member.attendanceStreak >= 7, icon: Flame },
    { title: 'Iron Warrior', days: 14, achieved: member.attendanceStreak >= 14, icon: Award },
    { title: 'Titan of Iron', days: 21, achieved: member.attendanceStreak >= 21, icon: Trophy },
    { title: 'Centurion Legend', days: 30, achieved: member.attendanceStreak >= 30, icon: Sparkles },
  ];

  const attendanceLog: Array<{ date: string; time: string; type: string; branch: string }> = [];

  const todaysWorkout = {
    title: 'Full Body Conditioning & Core',
    durationMin: 45,
    exercises: [
      { id: 'ex1', name: 'Barbell Flat Bench Press', sets: '3 sets', reps: '10 reps', targetWeight: 'Bodyweight' },
      { id: 'ex2', name: 'Barbell Back Squats', sets: '3 sets', reps: '10 reps', targetWeight: 'Bodyweight' },
      { id: 'ex3', name: 'Standing Cable Rows', sets: '3 sets', reps: '12 reps', targetWeight: 'Moderate' },
      { id: 'ex4', name: 'Hanging Knee Raises', sets: '3 sets', reps: '15 reps', targetWeight: 'Bodyweight' },
    ],
  };

  const todaysDiet = {
    targetCalories: 2000,
    consumedCalories: 0,
    macros: {
      protein: { target: 140, current: 0, unit: 'g' },
      carbs: { target: 200, current: 0, unit: 'g' },
      fats: { target: 60, current: 0, unit: 'g' },
      water: { target: 3.0, current: 0, unit: 'L' },
    },
    meals: [] as Array<{ meal: string; calories: number; protein: string; items: string }>,
  };

  const assignedTrainer = {
    name: 'Head Coach',
    title: 'Certified Fitness Specialist',
    experience: 'Certified Trainer',
    certifications: ['CPR/AED', 'CPT'],
    rating: 5.0,
    reviewCount: 0,
    phone: '',
    whatsappUrl: '',
    sessionsRemaining: 0,
    totalSessions: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=400&q=80',
  };

  const invoices: Array<{
    invoiceNumber: string;
    date: string;
    description: string;
    amountInInr: number;
    taxAmountInInr: number;
    paymentMethod: string;
    status: string;
  }> = [];

  const assessment = {
    date: 'Initial Check-in',
    trainerName: 'Staff Coach',
    weightKg: 70,
    heightCm: 175,
    bmi: 22.8,
    bodyFatPercent: 18.0,
    muscleMassKg: 35.0,
    chestCm: 98,
    waistCm: 80,
    armsCm: 34,
    trainerNotes: 'Welcome to the gym! Consistent attendance is key to your progress.',
    beforePhotoUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    goals: [
      { goalType: 'Regular Attendance', targetValue: 20, achieved: member.attendanceStreak >= 20, milestoneBadge: 'Consistency Titan' },
    ],
  };

  const walletTransactions: Array<{
    id: string;
    date: string;
    type: string;
    amountInInr: number;
    balanceAfterInInr: number;
    reason: string;
  }> = [];

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`https://ironpulse.org/join?ref=${member.referralCode}`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportDpdp = () => {
    const payload = {
      compliance: 'Digital Personal Data Protection Act, 2023 (India)',
      exportedAt: new Date().toISOString(),
      member: {
        id: member.memberId,
        name: member.name,
        phone: member.phone,
        branch: member.gymBranch,
        membership: {
          plan: member.plan,
          status: member.status,
          validUntil: member.validUntil,
        },
      },
      attendanceRecordCount: attendanceLog.length,
      attendanceHistory: attendanceLog,
      invoices,
      healthAssessments: [assessment],
      walletLedger: walletTransactions,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Techofay_GymOS_Member_Data_${member.memberId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteRequested(true);
    setTimeout(() => {
      setDeleteModalOpen(false);
    }, 1800);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewModalOpen(false);
      setReviewSubmitted(false);
      setReviewText('');
    }, 1500);
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-10">
      {/* Offline Shell / PWA Banner */}
      {!pwaPromptDismissed && (
        <div className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-card to-brand-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white flex-shrink-0 shadow-md shadow-brand-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">Install IronPulse PWA</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  Offline Shell Ready
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to your home screen for instantaneous turnstile barcode launch and offline gym pass access.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="brand"
              className="text-xs w-full sm:w-auto font-semibold"
              onClick={() => alert('IronPulse PWA is saved and pinned to your device shell.')}
            >
              Add to Home Screen
            </Button>
            <button
              onClick={() => setPwaPromptDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-brand-500/20 flex-shrink-0">
            AN
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{member.name}</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                {member.status}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">{member.memberId}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
              <span>{member.plan}</span>
              <span>•</span>
              <span className="text-brand-600 font-semibold">{member.gymBranch}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-semibold flex-1 sm:flex-initial"
            onClick={() => setReviewModalOpen(true)}
          >
            <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-amber-500" />
            Rate Gym
          </Button>
          <div className="px-3.5 py-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <div className="text-left">
              <div className="text-xs font-extrabold text-foreground leading-none">{member.attendanceStreak} Days</div>
              <div className="text-[10px] text-muted-foreground font-medium">Active Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-2 pb-px scrollbar-none">
        {[
          { id: 'PASS', label: 'Access Pass & QR', icon: QrCode },
          { id: 'WORKOUTS', label: 'Workouts', icon: Dumbbell },
          { id: 'DIET', label: 'Diet & Macros', icon: Utensils },
          { id: 'TRAINER', label: 'My Trainer', icon: UserCheck },
          { id: 'ASSESSMENTS', label: 'Body Metrics', icon: Activity },
          { id: 'INVOICES', label: 'Invoices', icon: Receipt },
          { id: 'WALLET', label: 'Referral Wallet', icon: Wallet },
          { id: 'DPDP', label: 'DPDP Compliance', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
                isActive
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PASS & QR */}
      {activeTab === 'PASS' && (
        <div className="space-y-6">
          {/* Digital Access Card with Rotating QR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-700/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-brand-500/20">
                      IP
                    </div>
                    <div>
                      <div className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                        IronPulse Flagship Pass
                      </div>
                      <div className="text-[10px] text-slate-400">{member.gymBranch}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-400/40 text-emerald-400 bg-emerald-400/10 text-xs">
                    {member.status}
                  </Badge>
                </div>

                {/* Dynamic QR Box */}
                <div className="bg-white p-6 rounded-2xl w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-lg relative group">
                  <QrCode className="w-36 h-36 text-slate-900" />
                  <div className="absolute inset-x-2 bottom-2 bg-slate-900/90 text-[10px] text-white py-1 px-2 rounded-md text-center font-mono truncate">
                    {qrToken}
                  </div>
                </div>

                {/* Rotating timer */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-400" />
                    <span>Rotates in <strong className="text-white font-mono">{qrCountdown}s</strong></span>
                  </div>
                  <span className="text-[11px] text-slate-400">HMAC-Signed Check-in</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Member Name</div>
                  <div className="font-bold text-white text-sm">{member.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Valid Through</div>
                  <div className="font-bold text-emerald-400">{member.validUntil}</div>
                </div>
              </div>
            </div>

            {/* Membership Details & Validity Progress */}
            <div className="space-y-4">
              <Card className="border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-foreground">Membership Status</h3>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {member.daysRemaining} Days Left
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Plan Validity Elapsed</span>
                      <span className="font-medium text-foreground">261 / 365 Days</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-brand-600 h-2.5 rounded-full"
                        style={{ width: `${((365 - member.daysRemaining) / 365) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <div className="text-muted-foreground text-[11px]">Current Plan</div>
                      <div className="font-bold text-foreground mt-0.5 leading-snug">{member.plan}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <div className="text-muted-foreground text-[11px]">Access Privilege</div>
                      <div className="font-bold text-emerald-600 mt-0.5 leading-snug">Multi-Branch Access</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <div className="text-muted-foreground text-[11px]">Assigned Trainer</div>
                      <div className="font-bold text-foreground mt-0.5 leading-snug">Kabir Bhasin</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <div className="text-muted-foreground text-[11px]">Monthly Check-ins</div>
                      <div className="font-bold text-brand-600 mt-0.5 leading-snug">{member.totalVisitsThisMonth} Visits</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Milestones */}
              <Card className="border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-sm font-bold text-foreground">Streak Milestone Badges</h3>
                    <span className="text-xs text-brand-600 font-semibold">{member.attendanceStreak} Consecutive Days</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {streakMilestones.map((m, idx) => {
                      const Icon = m.icon;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all min-h-[96px] ${
                            m.achieved
                              ? 'border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-400'
                              : 'border-border bg-muted/20 text-muted-foreground opacity-60'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1 flex-shrink-0" />
                          <div className="text-xs font-bold leading-tight break-words">{m.title}</div>
                          <div className="text-[10px] mt-1 text-muted-foreground font-medium">{m.days} Days</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Attendance Logs */}
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Recent Gate Entries (Automated Log)</span>
                </h3>
                <span className="text-xs text-muted-foreground">Last 6 Punches</span>
              </div>
              <div className="divide-y divide-border">
                {attendanceLog.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No gate entries recorded yet.
                  </div>
                ) : (
                  attendanceLog.map((log, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <span className="font-bold text-foreground">{log.date}</span>
                          <span className="text-muted-foreground ml-2">{log.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">
                          {log.type}
                        </Badge>
                        <span className="text-muted-foreground">{log.branch}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: WORKOUTS */}
      {activeTab === 'WORKOUTS' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <Badge variant="outline" className="mb-2 bg-brand-500/10 text-brand-600 border-brand-500/20 text-xs">
                    Assigned by Coach Kabir Bhasin
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground">{todaysWorkout.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated duration: {todaysWorkout.durationMin} minutes • Target: Hypertrophy & Density
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-brand-600">
                    {Object.values(completedExercises).filter(Boolean).length} / {todaysWorkout.exercises.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Exercises Completed</div>
                </div>
              </div>

              <div className="space-y-3">
                {todaysWorkout.exercises.map((ex) => {
                  const isDone = !!completedExercises[ex.id];
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-border bg-card hover:border-brand-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-muted-foreground/40 bg-background'
                          }`}
                        >
                          {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div>
                          <h4
                            className={`text-sm font-bold ${
                              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {ex.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{ex.sets}</span>
                            <span>•</span>
                            <span>{ex.reps}</span>
                            <span>•</span>
                            <span className="font-semibold text-brand-600">{ex.targetWeight}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {isDone ? 'Finished' : 'Pending'}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Standard rest between compound sets: 90 seconds</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Start 90s Rest Timer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: DIET */}
      {activeTab === 'DIET' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Custom Nutrition Plan</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target: Lean Bulking (Calorie Surplus + High Protein)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-foreground">
                    {todaysDiet.consumedCalories} / {todaysDiet.targetCalories} kcal
                  </div>
                  <div className="text-xs text-muted-foreground">Daily Calorie Target</div>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Protein (160g target)</div>
                  <div className="text-lg font-bold text-brand-600 mt-0.5">120g / 160g</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Carbs (220g target)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">155g / 220g</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Healthy Fats</div>
                  <div className="text-lg font-bold text-amber-600 mt-0.5">42g / 65g</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Hydration (3.5L)</div>
                  <div className="text-lg font-bold text-sky-600 mt-0.5">0.0L / 3.0L</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              {/* Meals List */}
              <div className="space-y-3">
                {todaysDiet.meals.length > 0 ? (
                  todaysDiet.meals.map((meal, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{meal.meal}</span>
                        <span className="text-xs font-semibold text-brand-600">{meal.calories} kcal • {meal.protein} Protein</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{meal.items}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    No custom meals assigned for today. Inquire with your coach for a personalized macro plan.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: TRAINER */}
      {activeTab === 'TRAINER' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <img
                  src={assignedTrainer.avatarUrl}
                  alt={assignedTrainer.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-brand-500/30"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-foreground">{assignedTrainer.name}</h2>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {assignedTrainer.rating} ({assignedTrainer.reviewCount} Reviews)
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{assignedTrainer.title}</p>
                  <p className="text-xs text-brand-600 font-semibold">{assignedTrainer.experience}</p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {assignedTrainer.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <a
                    href={assignedTrainer.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button variant="brand" className="w-full text-xs flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => alert('PT Consultation Slot requested. Coach Kabir will confirm via WhatsApp.')}
                  >
                    Schedule PT Session
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground">1-on-1 PT Package Remaining</div>
                  <div className="text-xl font-extrabold text-foreground mt-1">
                    {assignedTrainer.sessionsRemaining} of {assignedTrainer.totalSessions} Sessions Left
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Valid till membership expiration date.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="text-xs text-muted-foreground">Coach Guidance Note</div>
                  <p className="text-xs text-foreground font-medium mt-1">
                    "Great progressive overload on the bench press this week. Maintain current calorie surplus and ensure 7.5+ hours of sleep."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: BODY ASSESSMENTS */}
      {activeTab === 'ASSESSMENTS' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Body Composition Analysis</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Latest InBody Scan: {assessment.date} • Evaluated by Coach {assessment.trainerName}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-xs" onClick={() => alert('Booking InBody Biometric scan...')}>
                  Book New Scan
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{assessment.weightKg} kg</div>
                  <span className="text-[11px] text-emerald-600 font-medium">-2.8 kg from start</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Body Fat %</div>
                  <div className="text-2xl font-bold text-brand-600 mt-1">{assessment.bodyFatPercent}%</div>
                  <span className="text-[11px] text-emerald-600 font-medium">-3.4% dropped</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">Skeletal Muscle Mass</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">{assessment.muscleMassKg} kg</div>
                  <span className="text-[11px] text-emerald-600 font-medium">+1.6 kg gained</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="text-xs text-muted-foreground">BMI</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{assessment.bmi}</div>
                  <span className="text-[11px] text-muted-foreground">Normal Range</span>
                </div>
              </div>

              {/* Transformation Comparison Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Visual Transformation Progress</span>
                  <span className="text-muted-foreground">Drag slider to compare Before & After</span>
                </div>

                <div className="relative h-80 rounded-2xl overflow-hidden select-none border border-border bg-black">
                  <img
                    src={assessment.afterPhotoUrl}
                    alt="After Transformation"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-white"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={assessment.beforePhotoUrl}
                      alt="Before Transformation"
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                  />
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white">
                    BEFORE (Day 1)
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-bold text-white">
                    AFTER (Day 90)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 6: INVOICES */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Tax Invoices & Billing History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    GST-compliant receipts with verifiable transaction signatures
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {invoices.length} Paid Receipts
                </Badge>
              </div>

              <div className="divide-y divide-border">
                {invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No paid tax invoices found.
                  </div>
                ) : (
                  invoices.map((inv, idx) => (
                    <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">{inv.invoiceNumber}</span>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{inv.description}</p>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Dated: {inv.date} • Mode: {inv.paymentMethod}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-end justify-between sm:justify-center">
                        <div className="text-base font-extrabold text-foreground">
                          ₹{inv.amountInInr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Includes ₹{inv.taxAmountInInr.toLocaleString()} GST (18%)
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-brand-600 hover:text-brand-700 h-7 px-2 mt-1"
                          onClick={() => alert(`Downloading verified Tax Invoice ${inv.invoiceNumber} PDF...`)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 7: WALLET */}
      {activeTab === 'WALLET' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm md:col-span-1">
              <CardContent className="p-6 space-y-4">
                <div className="text-xs text-muted-foreground">GymOS Cash Wallet Balance</div>
                <div className="text-3xl font-extrabold text-foreground">
                  ₹{member.walletBalanceInInr.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usable toward supplement store purchases, personal training sessions, or membership renewal.
                </p>
                <Button size="sm" variant="brand" className="w-full text-xs">
                  Redeem on Next Bill
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm md:col-span-2">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground">Share Your Referral Link</h3>
                <p className="text-xs text-muted-foreground">
                  Earn ₹500 wallet credit whenever a friend signs up using your code. They receive a 10% discount on annual passes.
                </p>

                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`https://ironpulse.org/join?ref=${member.referralCode}`}
                    className="font-mono text-xs bg-muted/40"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyReferral} className="flex-shrink-0 text-xs">
                    {copiedReferral ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="ml-1.5">{copiedReferral ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Referral Wallet Transaction Ledger</h3>
              <div className="divide-y divide-border">
                {walletTransactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No wallet transactions recorded yet.
                  </div>
                ) : (
                  walletTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{tx.reason}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{tx.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">+₹{tx.amountInInr}</div>
                        <div className="text-[10px] text-muted-foreground">Bal: ₹{tx.balanceAfterInInr}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 8: DPDP COMPLIANCE */}
      {activeTab === 'DPDP' && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Digital Personal Data Protection (DPDP) Act, 2023 Compliance
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Under Indian privacy regulations, you have full ownership, portability, and right to erasure of your personal records.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs space-y-2">
                <div className="font-bold text-foreground">Your Statutory Privacy Rights:</div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Right to Data Portability:</strong> Export all records (profile, biometric logs, check-ins, payments) in a machine-readable JSON format.</li>
                  <li><strong>Right to Erasure & Correction:</strong> Request full purging of personal identification, health assessments, and marketing preferences.</li>
                  <li><strong>Statutory Retention Notice:</strong> Tax invoice records and GST compliance audit logs are retained for 6 financial years as mandated by the Central Goods and Services Tax Act, 2017.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportDpdp}
                  className="w-full sm:w-auto text-xs flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-brand-600" />
                  Download My Data Package (JSON)
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full sm:w-auto text-xs flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Request Account & Data Deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Rate & Review Your Experience"
        description="Share feedback about our facilities, equipment, hygiene, and coaching."
      >
        {reviewSubmitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-foreground">Thank You for Your Review!</h4>
            <p className="text-xs text-muted-foreground">Your rating has been recorded and shared with gym management.</p>
          </div>
        ) : (
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">Overall Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-500 transition-transform hover:scale-110"
                  >
                    <Star className={`w-7 h-7 ${star <= rating ? 'fill-amber-500' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Your Feedback & Review</label>
              <textarea
                required
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="The coaching, cleanliness, and barbell equipment quality have been phenomenal..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" size="sm">
                Submit Review
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DPDP Deletion Request Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Request Right to Erasure (DPDP Act, 2023)"
        description="Verify your registered mobile number to file an official account deletion request."
      >
        {deleteRequested ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-foreground">Erasure Request Registered</h4>
            <p className="text-xs text-muted-foreground">
              Reference #DPDP-DEL-9082. Our Data Protection Officer (DPO) will execute the deletion sequence within 72 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDeleteRequest} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold mb-1">Warning: Irreversible Account Action</p>
              <p>Your gym membership pass will be deactivated. Unredeemed wallet balance will be forfeited.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Reason for Erasure</label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background"
              >
                <option value="Relocating to another city">Relocating to another city</option>
                <option value="No longer exercising at gym">No longer exercising at gym</option>
                <option value="Privacy and data minimization">Privacy and data minimization</option>
                <option value="Switching to home workouts">Switching to home workouts</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Confirm Registered Phone Number (+91 98201 44521)
              </label>
              <Input
                required
                placeholder="+91 98201 44521"
                value={confirmPhone}
                onChange={(e) => setConfirmPhone(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm">
                Confirm Erasure Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MemberPortalPage;
