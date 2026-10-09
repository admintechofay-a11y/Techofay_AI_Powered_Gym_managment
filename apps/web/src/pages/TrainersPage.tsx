import React, { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  Users,
  Award,
  Calendar,
  Clock,
  Star,
  DollarSign,
  TrendingUp,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Plus,
  ChevronRight,
  ShieldCheck,
  FileText,
  Percent,
} from 'lucide-react';

export interface TrainerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string;
  bio: string;
  specializations: string[];
  qualifications: string[];
  certifications: string[];
  rating: number;
  totalReviews: number;
  commissionRatePercent: number;
  assignedMembersCount: number;
  activePtSessionsCount: number;
  availability: { day: string; hours: string }[];
}

export interface PtPackageTracker {
  id: string;
  memberName: string;
  memberCode: string;
  trainerName: string;
  trainerId: string;
  packageName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  priceInInr: number;
  expiryDate: string;
  status: 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED';
}

export interface CommissionPayout {
  trainerId: string;
  trainerName: string;
  sessionsConducted: number;
  grossRevenueInInr: number;
  commissionRatePercent: number;
  payoutAmountInInr: number;
  status: 'PAID' | 'PENDING';
}

export interface MemberReview {
  id: string;
  memberName: string;
  trainerName: string;
  rating: number;
  comment: string;
  date: string;
}

const INITIAL_TRAINERS: TrainerProfile[] = [
  {
    id: 'tr-1',
    name: 'Kabir Bhasin',
    email: 'kabir.bhasin@ironpulse-fitness.org',
    phone: '+91 98200 11776',
    photoUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=600&q=80',
    bio: 'Former national level weightlifter and certified CrossFit Level 2 coach with 8+ years coaching athletes.',
    specializations: ['Olympic Weightlifting', 'CrossFit & WODs', 'Strength & Hypertrophy', 'Athletic Conditioning'],
    qualifications: ['B.Sc. Sports Science', 'NSCA Certified Strength & Conditioning Specialist (CSCS)'],
    certifications: ['CrossFit Level 2 Trainer', 'USAW Sports Performance Coach', 'First Aid & CPR'],
    rating: 4.9,
    totalReviews: 48,
    commissionRatePercent: 25,
    assignedMembersCount: 14,
    activePtSessionsCount: 42,
    availability: [
      { day: 'Mon - Fri', hours: '06:00 AM - 12:00 PM & 05:00 PM - 09:00 PM' },
      { day: 'Saturday', hours: '07:00 AM - 01:00 PM' },
    ],
  },
  {
    id: 'tr-2',
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@ironpulse-fitness.org',
    phone: '+91 98200 11778',
    photoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80',
    bio: 'Dedicated Ashtanga Yoga master and functional mobility specialist helping members improve range of motion.',
    specializations: ['Power Yoga', 'Spine & Joint Mobility', 'Core Rehabilitation', 'Breathwork & Mindfulness'],
    qualifications: ['M.A. Yogic Science', 'ACE Certified Personal Trainer'],
    certifications: ['Yoga Alliance RYT-500', 'FMS Level 1 Functional Movement'],
    rating: 4.8,
    totalReviews: 32,
    commissionRatePercent: 20,
    assignedMembersCount: 11,
    activePtSessionsCount: 28,
    availability: [
      { day: 'Mon - Fri', hours: '07:00 AM - 01:00 PM' },
      { day: 'Saturday', hours: '08:00 AM - 12:00 PM' },
    ],
  },
  {
    id: 'tr-3',
    name: 'Sameer Sen',
    email: 'sameer.sen@ironpulse-fitness.org',
    phone: '+91 98200 11779',
    photoUrl: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=600&q=80',
    bio: 'High-energy cardiovascular endurance coach and spinning certified instructor with focus on HIIT.',
    specializations: ['Spinning & Cycling', 'HIIT Circuit Training', 'Kettlebell Flow', 'Fat Loss Conditioning'],
    qualifications: ['B.P.Ed Physical Education', 'ISSA Certified Fitness Trainer'],
    certifications: ['Schwinn Certified Cycling Coach', 'StrongFirst SFG I'],
    rating: 4.7,
    totalReviews: 29,
    commissionRatePercent: 20,
    assignedMembersCount: 9,
    activePtSessionsCount: 19,
    availability: [
      { day: 'Mon - Fri', hours: '06:00 AM - 11:00 AM & 04:00 PM - 08:30 PM' },
      { day: 'Sunday', hours: '08:00 AM - 01:00 PM' },
    ],
  },
];

const INITIAL_PT_PACKAGES: PtPackageTracker[] = [
  {
    id: 'pt-1',
    memberName: 'Aarav Nambiar',
    memberCode: 'IP-FIT-001',
    trainerName: 'Kabir Bhasin',
    trainerId: 'tr-1',
    packageName: '12-Session Strength Masterclass',
    totalSessions: 12,
    usedSessions: 5,
    remainingSessions: 7,
    priceInInr: 18000,
    expiryDate: '2026-11-30',
    status: 'ACTIVE',
  },
  {
    id: 'pt-2',
    memberName: 'Kavita Iyer',
    memberCode: 'IP-FIT-002',
    trainerName: 'Ananya Deshmukh',
    trainerId: 'tr-2',
    packageName: '8-Session Mobility & Core Plan',
    totalSessions: 8,
    usedSessions: 6,
    remainingSessions: 2,
    priceInInr: 12000,
    expiryDate: '2026-10-31',
    status: 'ACTIVE',
  },
  {
    id: 'pt-3',
    memberName: 'Devendra Patel',
    memberCode: 'IP-FIT-006',
    trainerName: 'Kabir Bhasin',
    trainerId: 'tr-1',
    packageName: '24-Session Transformation Pro',
    totalSessions: 24,
    usedSessions: 18,
    remainingSessions: 6,
    priceInInr: 32000,
    expiryDate: '2026-12-15',
    status: 'ACTIVE',
  },
  {
    id: 'pt-4',
    memberName: 'Vikram Singhania',
    memberCode: 'IP-FIT-007',
    trainerName: 'Sameer Sen',
    trainerId: 'tr-3',
    packageName: '10-Session Fat Burn Blitz',
    totalSessions: 10,
    usedSessions: 10,
    remainingSessions: 0,
    priceInInr: 15000,
    expiryDate: '2026-10-10',
    status: 'EXHAUSTED',
  },
];

const INITIAL_PAYOUTS: CommissionPayout[] = [
  {
    trainerId: 'tr-1',
    trainerName: 'Kabir Bhasin',
    sessionsConducted: 46,
    grossRevenueInInr: 69000,
    commissionRatePercent: 25,
    payoutAmountInInr: 17250,
    status: 'PENDING',
  },
  {
    trainerId: 'tr-2',
    trainerName: 'Ananya Deshmukh',
    sessionsConducted: 34,
    grossRevenueInInr: 51000,
    commissionRatePercent: 20,
    payoutAmountInInr: 10200,
    status: 'PENDING',
  },
  {
    trainerId: 'tr-3',
    trainerName: 'Sameer Sen',
    sessionsConducted: 28,
    grossRevenueInInr: 42000,
    commissionRatePercent: 20,
    payoutAmountInInr: 8400,
    status: 'PAID',
  },
];

const INITIAL_REVIEWS: MemberReview[] = [
  {
    id: 'rev-1',
    memberName: 'Aarav Nambiar',
    trainerName: 'Kabir Bhasin',
    rating: 5,
    comment: 'Kabir is phenomenal! Added 15kg to my back squat in just 4 weeks while maintaining immaculate form.',
    date: '2026-10-04',
  },
  {
    id: 'rev-2',
    memberName: 'Kavita Iyer',
    trainerName: 'Ananya Deshmukh',
    rating: 5,
    comment: 'Ananya helped eliminate my chronic lower back stiffness. Her mobility drills are truly life-changing.',
    date: '2026-10-02',
  },
  {
    id: 'rev-3',
    memberName: 'Vikram Singhania',
    trainerName: 'Sameer Sen',
    rating: 4,
    comment: 'Brutal cardio workouts! Dropped 3kg of fat in 3 weeks. Extremely motivating coach.',
    date: '2026-09-28',
  },
];

export const TrainersPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'PT_DASHBOARD' | 'COMMISSIONS' | 'REVIEWS'>('ROSTER');
  const [trainers, setTrainers] = useState<TrainerProfile[]>(INITIAL_TRAINERS);
  const [ptPackages, setPtPackages] = useState<PtPackageTracker[]>(INITIAL_PT_PACKAGES);
  const [payouts, setPayouts] = useState<CommissionPayout[]>(INITIAL_PAYOUTS);
  const [reviews] = useState<MemberReview[]>(INITIAL_REVIEWS);

  // Modals
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PtPackageTracker | null>(null);

  // New Trainer Form
  const [newTrainerForm, setNewTrainerForm] = useState({
    name: '',
    email: '',
    phone: '',
    specializations: 'Strength & Conditioning, Olympic Weightlifting',
    qualifications: 'B.Sc. Sports Science',
    certifications: 'CSCS, CrossFit Level 1',
    commissionRatePercent: 20,
    bio: '',
  });

  // Fetch real trainer data on mount
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get('/trainers');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTrainers(res.data);
        }
      } catch {
        // Fallback to rich initial state
      }
    };
    fetchTrainers();
  }, []);

  // 1-Click Decrement Session
  const handleDecrementSession = async (pkg: PtPackageTracker) => {
    if (pkg.remainingSessions <= 0) {
      addToast({
        title: 'Package Exhausted',
        message: 'No remaining sessions available on this PT package.',
        type: 'error',
      });
      return;
    }

    try {
      await api.post(`/trainers/pt-packages/${pkg.id}/use-session`, {});
    } catch {
      // Local fallback
    }

    const updatedPackages = ptPackages.map((p) => {
      if (p.id === pkg.id) {
        const remaining = p.remainingSessions - 1;
        return {
          ...p,
          usedSessions: p.usedSessions + 1,
          remainingSessions: remaining,
          status: (remaining === 0 ? 'EXHAUSTED' : 'ACTIVE') as any,
        };
      }
      return p;
    });

    setPtPackages(updatedPackages);

    // Update commissions
    setPayouts((prev) =>
      prev.map((pay) => {
        if (pay.trainerName === pkg.trainerName) {
          const sessions = pay.sessionsConducted + 1;
          const revenue = sessions * 1500;
          const payout = Math.round((revenue * pay.commissionRatePercent) / 100);
          return {
            ...pay,
            sessionsConducted: sessions,
            grossRevenueInInr: revenue,
            payoutAmountInInr: payout,
          };
        }
        return pay;
      }),
    );

    addToast({
      title: 'PT Session Logged!',
      message: `Deducted 1 session for ${pkg.memberName}. ${pkg.remainingSessions - 1} sessions remaining.`,
      type: 'success',
    });
  };

  // Add Trainer
  const handleCreateTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerForm.name || !newTrainerForm.email) {
      addToast({ title: 'Validation Error', message: 'Name and email are required', type: 'error' });
      return;
    }

    const created: TrainerProfile = {
      id: `tr-${Date.now()}`,
      name: newTrainerForm.name,
      email: newTrainerForm.email,
      phone: newTrainerForm.phone || '+91 98200 11223',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: newTrainerForm.bio || 'Certified fitness coach specializing in performance.',
      specializations: newTrainerForm.specializations.split(',').map((s) => s.trim()),
      qualifications: newTrainerForm.qualifications.split(',').map((s) => s.trim()),
      certifications: newTrainerForm.certifications.split(',').map((s) => s.trim()),
      rating: 5.0,
      totalReviews: 0,
      commissionRatePercent: Number(newTrainerForm.commissionRatePercent) || 20,
      assignedMembersCount: 0,
      activePtSessionsCount: 0,
      availability: [{ day: 'Mon - Fri', hours: '06:00 AM - 12:00 PM' }],
    };

    setTrainers([created, ...trainers]);
    setIsTrainerModalOpen(false);
    setNewTrainerForm({
      name: '',
      email: '',
      phone: '',
      specializations: 'Strength & Conditioning, Olympic Weightlifting',
      qualifications: 'B.Sc. Sports Science',
      certifications: 'CSCS, CrossFit Level 1',
      commissionRatePercent: 20,
      bio: '',
    });

    addToast({
      title: 'Trainer Registered',
      message: `${created.name} added to staff roster with ${created.commissionRatePercent}% commission rate.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trainers & Personal Training</h1>
            <p className="text-sm text-muted-foreground">
              Certifications, member assignments, session decrements, commission calculation & ratings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('ROSTER')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'ROSTER'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Roster
            </button>
            <button
              onClick={() => setActiveTab('PT_DASHBOARD')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'PT_DASHBOARD'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              PT Packages
            </button>
            <button
              onClick={() => setActiveTab('COMMISSIONS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'COMMISSIONS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Commissions
            </button>
            <button
              onClick={() => setActiveTab('REVIEWS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'REVIEWS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Reviews
            </button>
          </div>

          <Button
            onClick={() => setIsTrainerModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Trainer
          </Button>
        </div>
      </div>

      {/* TAB 1: TRAINER ROSTER & PROFILES */}
      {activeTab === 'ROSTER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((tr) => (
            <div
              key={tr.id}
              className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo & Header */}
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={tr.photoUrl}
                    alt={tr.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{tr.rating}</span>
                    <span className="text-white/80 font-normal">({tr.totalReviews})</span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{tr.name}</h3>
                    <p className="text-xs text-muted-foreground">{tr.email} • {tr.phone}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{tr.bio}</p>
                  </div>

                  {/* Specializations Tags */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.specializations.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.certifications.map((cert, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border"
                        >
                          🏅 {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats: Assigned & Commission */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                    <div className="p-2 bg-muted/40 rounded-xl">
                      <p className="text-muted-foreground">Assigned Clients</p>
                      <p className="font-bold text-sm text-foreground">{tr.assignedMembersCount} Members</p>
                    </div>
                    <div className="p-2 bg-muted/40 rounded-xl">
                      <p className="text-muted-foreground">Commission Rate</p>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {tr.commissionRatePercent}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Availability Footer */}
              <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {tr.availability[0]?.hours.split('&')[0] || 'Flexible'}
                </span>
                <span className="text-primary font-semibold">Available</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ASSIGNED MEMBERS & PT SESSION TRACKING */}
      {activeTab === 'PT_DASHBOARD' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Active Personal Training Packages</h3>
              <p className="text-xs text-muted-foreground">
                Track remaining sessions, expiration dates, and 1-click decrement session conduct
              </p>
            </div>
            <Badge variant="default">{ptPackages.length} Total Packages</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Assigned Trainer</th>
                  <th className="px-4 py-3">PT Package</th>
                  <th className="px-4 py-3">Used / Total</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Session Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ptPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground">{pkg.memberName}</div>
                      <div className="text-xs text-muted-foreground">{pkg.memberCode}</div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-muted-foreground">🏋️ {pkg.trainerName}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{pkg.packageName}</div>
                      <div className="text-xs text-muted-foreground">₹{pkg.priceInInr.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span>{pkg.usedSessions} / {pkg.totalSessions}</span>
                        <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.round((pkg.usedSessions / pkg.totalSessions) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-base text-foreground">{pkg.remainingSessions}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{pkg.expiryDate}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={pkg.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {pkg.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        disabled={pkg.remainingSessions <= 0}
                        onClick={() => handleDecrementSession(pkg)}
                        className="text-xs"
                      >
                        Decrement Session (-1)
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMMISSION CALCULATION & MONTHLY PAYOUT REPORT */}
      {activeTab === 'COMMISSIONS' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Monthly Trainer Commission & Payout Report</h3>
              <p className="text-xs text-muted-foreground">
                Automatic calculation: (Completed PT Sessions × Rate) × Commission %
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Export CSV</Button>
              <Button size="sm">Process All Pending Payouts</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Trainer Name</th>
                  <th className="px-4 py-3">Sessions Conducted</th>
                  <th className="px-4 py-3">Gross PT Value</th>
                  <th className="px-4 py-3">Commission %</th>
                  <th className="px-4 py-3">Net Payout</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((pay, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">{pay.trainerName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{pay.sessionsConducted} sessions</td>
                    <td className="px-4 py-3.5 font-medium">₹{pay.grossRevenueInInr.toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-bold text-primary">{pay.commissionRatePercent}%</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      ₹{pay.payoutAmountInInr.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          pay.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {pay.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPayouts((prev) =>
                              prev.map((p, idx) => (idx === i ? { ...p, status: 'PAID' } : p)),
                            );
                            addToast({
                              title: 'Payout Disbursed',
                              message: `Transferred ₹${pay.payoutAmountInInr.toLocaleString()} to ${pay.trainerName}`,
                              type: 'success',
                            });
                          }}
                        >
                          Disburse Payout
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBER REVIEWS & RATINGS */}
      {activeTab === 'REVIEWS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-card rounded-2xl border border-border p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-muted text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{rev.date}</span>
              </div>

              <p className="text-sm text-foreground italic">"{rev.comment}"</p>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{rev.memberName}</span>
                <span>Coach: <strong>{rev.trainerName}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD TRAINER */}
      <Modal
        isOpen={isTrainerModalOpen}
        onClose={() => setIsTrainerModalOpen(false)}
        title="Add Trainer to Roster"
        size="md"
      >
        <form onSubmit={handleCreateTrainer} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Kabir Bhasin"
            value={newTrainerForm.name}
            onChange={(e) => setNewTrainerForm({ ...newTrainerForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email *"
              type="email"
              placeholder="coach@ironpulse-fitness.org"
              value={newTrainerForm.email}
              onChange={(e) => setNewTrainerForm({ ...newTrainerForm, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              placeholder="+91 98200 11223"
              value={newTrainerForm.phone}
              onChange={(e) => setNewTrainerForm({ ...newTrainerForm, phone: e.target.value })}
            />
          </div>
          <Input
            label="Specializations (comma separated)"
            placeholder="Olympic Weightlifting, CrossFit, Hypertrophy"
            value={newTrainerForm.specializations}
            onChange={(e) => setNewTrainerForm({ ...newTrainerForm, specializations: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Certifications"
              placeholder="CSCS, CrossFit L2, USAW"
              value={newTrainerForm.certifications}
              onChange={(e) => setNewTrainerForm({ ...newTrainerForm, certifications: e.target.value })}
            />
            <Input
              label="Commission Rate (%)"
              type="number"
              placeholder="25"
              value={newTrainerForm.commissionRatePercent}
              onChange={(e) => setNewTrainerForm({ ...newTrainerForm, commissionRatePercent: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Bio & Coaching Experience"
            placeholder="Summary of experience..."
            value={newTrainerForm.bio}
            onChange={(e) => setNewTrainerForm({ ...newTrainerForm, bio: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsTrainerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register Trainer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TrainersPage;
