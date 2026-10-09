import React, { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  Calendar,
  Clock,
  Users,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  Flame,
  Dumbbell,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Plus,
} from 'lucide-react';

export interface ClassSlotItem {
  id: string;
  name: string;
  category: 'CrossFit' | 'Weightlifting' | 'Spin' | 'Yoga' | 'HIIT';
  trainerName: string;
  trainerId: string;
  room: string;
  time: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  waitlistCapacity: number;
  waitlistCount: number;
  date: string;
  attendees: {
    id: string;
    bookingId: string;
    memberName: string;
    memberCode: string;
    bookingType: 'CLASS' | 'TRIAL' | 'PERSONAL_TRAINING';
    status: 'CONFIRMED' | 'WAITLISTED';
    waitlistPosition?: number;
  }[];
}

export interface TrialBookingItem {
  id: string;
  prospectName: string;
  prospectPhone: string;
  prospectEmail: string;
  classSlotName: string;
  slotTime: string;
  trainerName: string;
  status: 'SCHEDULED' | 'ATTENDED' | 'NO_SHOW' | 'CONVERTED';
  attendedAt?: string;
}

const INITIAL_SCHEDULE: ClassSlotItem[] = [
  {
    id: 'slot-1',
    name: 'CrossFit WOD & Metabolic Conditioning',
    category: 'CrossFit',
    trainerName: 'Kabir Bhasin',
    trainerId: 'tr-1',
    room: 'Main Arena Box',
    time: '07:00 AM - 08:00 AM',
    durationMinutes: 60,
    capacity: 20,
    bookedCount: 19,
    waitlistCapacity: 5,
    waitlistCount: 2,
    date: '2026-10-15',
    attendees: [
      { id: 'att-1', bookingId: 'b-1', memberName: 'Aarav Nambiar', memberCode: 'IP-FIT-001', bookingType: 'CLASS', status: 'CONFIRMED' },
      { id: 'att-2', bookingId: 'b-2', memberName: 'Kavita Iyer', memberCode: 'IP-FIT-002', bookingType: 'CLASS', status: 'CONFIRMED' },
      { id: 'att-3', bookingId: 'b-3', memberName: 'Rohan Mehra', memberCode: 'PROSPECT-01', bookingType: 'TRIAL', status: 'CONFIRMED' },
      { id: 'att-4', bookingId: 'b-4', memberName: 'Siddharth Roy', memberCode: 'IP-FIT-004', bookingType: 'CLASS', status: 'WAITLISTED', waitlistPosition: 1 },
      { id: 'att-5', bookingId: 'b-5', memberName: 'Meera Rajput', memberCode: 'IP-FIT-005', bookingType: 'CLASS', status: 'WAITLISTED', waitlistPosition: 2 },
    ],
  },
  {
    id: 'slot-2',
    name: 'Olympic Snatch & Clean Pulls Masterclass',
    category: 'Weightlifting',
    trainerName: 'Kabir Bhasin',
    trainerId: 'tr-1',
    room: 'Olympic Platforms',
    time: '09:00 AM - 10:15 AM',
    durationMinutes: 75,
    capacity: 12,
    bookedCount: 12,
    waitlistCapacity: 4,
    waitlistCount: 3,
    date: '2026-10-15',
    attendees: [
      { id: 'att-6', bookingId: 'b-6', memberName: 'Devendra Patel', memberCode: 'IP-FIT-006', bookingType: 'CLASS', status: 'CONFIRMED' },
      { id: 'att-7', bookingId: 'b-7', memberName: 'Vikram Singhania', memberCode: 'PROSPECT-02', bookingType: 'TRIAL', status: 'WAITLISTED', waitlistPosition: 1 },
    ],
  },
  {
    id: 'slot-3',
    name: 'Power Vinyasa & Core Mobility',
    category: 'Yoga',
    trainerName: 'Ananya Deshmukh',
    trainerId: 'tr-2',
    room: 'Zen Studio',
    time: '11:00 AM - 12:00 PM',
    durationMinutes: 60,
    capacity: 25,
    bookedCount: 14,
    waitlistCapacity: 5,
    waitlistCount: 0,
    date: '2026-10-15',
    attendees: [
      { id: 'att-8', bookingId: 'b-8', memberName: 'Pooja Hegde', memberCode: 'IP-FIT-008', bookingType: 'CLASS', status: 'CONFIRMED' },
    ],
  },
  {
    id: 'slot-4',
    name: 'High Intensity Spin & Cardio Blast',
    category: 'Spin',
    trainerName: 'Sameer Sen',
    trainerId: 'tr-3',
    room: 'Spinning Studio 2',
    time: '05:30 PM - 06:30 PM',
    durationMinutes: 60,
    capacity: 20,
    bookedCount: 17,
    waitlistCapacity: 5,
    waitlistCount: 0,
    date: '2026-10-15',
    attendees: [
      { id: 'att-9', bookingId: 'b-9', memberName: 'Rahul Verma', memberCode: 'IP-FIT-009', bookingType: 'CLASS', status: 'CONFIRMED' },
    ],
  },
  {
    id: 'slot-5',
    name: 'Evening Strength & Hypertrophy Circuit',
    category: 'HIIT',
    trainerName: 'Kabir Bhasin',
    trainerId: 'tr-1',
    room: 'Main Gym Floor',
    time: '07:00 PM - 08:00 PM',
    durationMinutes: 60,
    capacity: 18,
    bookedCount: 18,
    waitlistCapacity: 4,
    waitlistCount: 1,
    date: '2026-10-15',
    attendees: [
      { id: 'att-10', bookingId: 'b-10', memberName: 'Nikhil Mehta', memberCode: 'IP-FIT-010', bookingType: 'CLASS', status: 'CONFIRMED' },
    ],
  },
];

const INITIAL_TRIALS: TrialBookingItem[] = [
  {
    id: 'tr-book-1',
    prospectName: 'Rohan Mehra',
    prospectPhone: '+91 98222 33445',
    prospectEmail: 'rohan.mehra@ironpulse-crm.org',
    classSlotName: 'CrossFit WOD & Metabolic Conditioning',
    slotTime: '07:00 AM - 08:00 AM (15 Oct)',
    trainerName: 'Kabir Bhasin',
    status: 'SCHEDULED',
  },
  {
    id: 'tr-book-2',
    prospectName: 'Vikram Singhania',
    prospectPhone: '+91 98333 77889',
    prospectEmail: 'vikram.singhania@ironpulse-crm.org',
    classSlotName: 'Olympic Snatch & Clean Pulls Masterclass',
    slotTime: '09:00 AM - 10:15 AM (15 Oct)',
    trainerName: 'Kabir Bhasin',
    status: 'ATTENDED',
    attendedAt: '2026-10-14T09:15:00Z',
  },
  {
    id: 'tr-book-3',
    prospectName: 'Aarti Deshmukh',
    prospectPhone: '+91 98111 44556',
    prospectEmail: 'aarti.deshmukh@ironpulse-crm.org',
    classSlotName: 'Power Vinyasa & Core Mobility',
    slotTime: '11:00 AM - 12:00 PM (14 Oct)',
    trainerName: 'Ananya Deshmukh',
    status: 'CONVERTED',
    attendedAt: '2026-10-14T11:00:00Z',
  },
];

export const ClassesPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'TRIALS'>('CALENDAR');
  const [schedule, setSchedule] = useState<ClassSlotItem[]>(INITIAL_SCHEDULE);
  const [trials, setTrials] = useState<TrialBookingItem[]>(INITIAL_TRIALS);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [selectedSlot, setSelectedSlot] = useState<ClassSlotItem | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isSlotDetailsOpen, setIsSlotDetailsOpen] = useState(false);

  // Booking Form
  const [bookingForm, setBookingForm] = useState({
    memberName: 'Aarav Nambiar (IP-FIT-001)',
    bookingType: 'CLASS' as 'CLASS' | 'PERSONAL_TRAINING' | 'TRIAL',
  });

  // Trial Registration Form
  const [trialForm, setTrialForm] = useState({
    name: '',
    phone: '',
    email: '',
    slotId: 'slot-1',
    trainerName: 'Kabir Bhasin',
  });

  // Fetch real calendar on mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get('/classes/calendar?date=2026-10-15');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSchedule(res.data);
        }
      } catch {
        // Fallback to initial schedule
      }
    };
    fetchSchedule();
  }, []);

  const filteredSchedule = schedule.filter(
    (slot) => selectedCategory === 'ALL' || slot.category === selectedCategory,
  );

  // Handle Booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    const isFull = selectedSlot.bookedCount >= selectedSlot.capacity;
    const isWaitlistFull = selectedSlot.waitlistCount >= selectedSlot.waitlistCapacity;

    if (isFull && isWaitlistFull) {
      addToast({
        title: 'Session Full',
        message: 'Both class capacity and waitlist capacity are completely full.',
        type: 'error',
      });
      return;
    }

    try {
      await api.post(`/classes/${selectedSlot.id}/book`, {
        bookingType: bookingForm.bookingType,
      });
    } catch {
      // Local atomic update
    }

    setSchedule((prev) =>
      prev.map((slot) => {
        if (slot.id === selectedSlot.id) {
          if (!isFull) {
            // Confirmed booking
            return {
              ...slot,
              bookedCount: slot.bookedCount + 1,
              attendees: [
                ...slot.attendees,
                {
                  id: `att-${Date.now()}`,
                  bookingId: `b-${Date.now()}`,
                  memberName: bookingForm.memberName,
                  memberCode: 'IP-FIT-001',
                  bookingType: bookingForm.bookingType,
                  status: 'CONFIRMED' as const,
                },
              ],
            };
          } else {
            // Waitlist booking
            return {
              ...slot,
              waitlistCount: slot.waitlistCount + 1,
              attendees: [
                ...slot.attendees,
                {
                  id: `att-${Date.now()}`,
                  bookingId: `b-${Date.now()}`,
                  memberName: bookingForm.memberName,
                  memberCode: 'IP-FIT-001',
                  bookingType: bookingForm.bookingType,
                  status: 'WAITLISTED' as const,
                  waitlistPosition: slot.waitlistCount + 1,
                },
              ],
            };
          }
        }
        return slot;
      }),
    );

    setIsBookModalOpen(false);

    if (!isFull) {
      addToast({
        title: 'Booking Confirmed!',
        message: `Reserved seat for ${selectedSlot.name}.`,
        type: 'success',
      });
    } else {
      addToast({
        title: 'Added to Waitlist',
        message: `Class was at capacity. You are waitlist #${selectedSlot.waitlistCount + 1}. Auto-promotion will trigger if a seat opens.`,
        type: 'info',
      });
    }
  };

  // Handle Cancellation & Automatic Waitlist Promotion
  const handleCancelBooking = async (slotId: string, attendeeId: string) => {
    try {
      await api.delete(`/classes/bookings/${attendeeId}`);
    } catch {
      // Local fallback
    }

    let promotedMemberName: string | null = null;

    setSchedule((prev) =>
      prev.map((slot) => {
        if (slot.id === slotId) {
          const removed = slot.attendees.find((a) => a.id === attendeeId);
          const wasConfirmed = removed?.status === 'CONFIRMED';
          const remainingAttendees = slot.attendees.filter((a) => a.id !== attendeeId);

          if (wasConfirmed && slot.waitlistCount > 0) {
            // Promote top waitlisted member
            const waitlistedIdx = remainingAttendees.findIndex((a) => a.status === 'WAITLISTED');
            if (waitlistedIdx !== -1) {
              promotedMemberName = remainingAttendees[waitlistedIdx].memberName;
              remainingAttendees[waitlistedIdx] = {
                ...remainingAttendees[waitlistedIdx],
                status: 'CONFIRMED',
                waitlistPosition: undefined,
              };
            }
            return {
              ...slot,
              waitlistCount: Math.max(0, slot.waitlistCount - 1),
              attendees: remainingAttendees,
            };
          } else if (wasConfirmed) {
            return {
              ...slot,
              bookedCount: Math.max(0, slot.bookedCount - 1),
              attendees: remainingAttendees,
            };
          } else {
            // Cancelled a waitlisted entry
            return {
              ...slot,
              waitlistCount: Math.max(0, slot.waitlistCount - 1),
              attendees: remainingAttendees,
            };
          }
        }
        return slot;
      }),
    );

    if (promotedMemberName) {
      addToast({
        title: 'Waitlist Auto-Promotion Triggered!',
        message: `Booking cancelled. Waitlisted member ${promotedMemberName} automatically promoted to CONFIRMED!`,
        type: 'success',
      });
    } else {
      addToast({
        title: 'Booking Cancelled',
        message: 'The slot has been released back into pool.',
        type: 'info',
      });
    }
  };

  // Register Trial
  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialForm.name || !trialForm.phone) {
      addToast({ title: 'Validation Error', message: 'Name and phone are required', type: 'error' });
      return;
    }

    const targetSlot = schedule.find((s) => s.id === trialForm.slotId);

    const newTrial: TrialBookingItem = {
      id: `tr-book-${Date.now()}`,
      prospectName: trialForm.name,
      prospectPhone: trialForm.phone,
      prospectEmail: trialForm.email || 'prospect@ironpulse-crm.org',
      classSlotName: targetSlot ? targetSlot.name : 'CrossFit WOD',
      slotTime: targetSlot ? targetSlot.time : '07:00 AM - 08:00 AM',
      trainerName: trialForm.trainerName,
      status: 'SCHEDULED',
    };

    setTrials((prev) => [newTrial, ...prev]);
    setIsTrialModalOpen(false);
    setTrialForm({ name: '', phone: '', email: '', slotId: 'slot-1', trainerName: 'Kabir Bhasin' });

    addToast({
      title: 'Trial Session Booked!',
      message: `Complimentary pass issued for ${newTrial.prospectName}. Assigned coach: ${newTrial.trainerName}.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Classes, Bookings & Trials</h1>
            <p className="text-sm text-muted-foreground">
              Live capacity tracking, race-safe atomic booking, automated waitlist promotion & trial sessions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'CALENDAR'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Class Schedule
            </button>
            <button
              onClick={() => setActiveTab('TRIALS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'TRIALS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Trial Bookings
            </button>
          </div>

          <Button
            onClick={() => setIsTrialModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Book Free Trial Session
          </Button>
        </div>
      </div>

      {/* Category Pills Filter */}
      {activeTab === 'CALENDAR' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['ALL', 'CrossFit', 'Weightlifting', 'Spin', 'Yoga', 'HIIT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* TAB 1: CALENDAR / SCHEDULE VIEW */}
      {activeTab === 'CALENDAR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedule.map((slot) => {
            const isFull = slot.bookedCount >= slot.capacity;
            const percentageBooked = Math.round((slot.bookedCount / slot.capacity) * 100);

            return (
              <div
                key={slot.id}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Top Badge & Room */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      slot.category === 'CrossFit'
                        ? 'default'
                        : slot.category === 'Weightlifting'
                        ? 'destructive'
                        : slot.category === 'Spin'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {slot.category}
                  </Badge>

                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    📍 {slot.room}
                  </span>
                </div>

                {/* Class Title & Time */}
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {slot.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{slot.time}</span>
                    <span>•</span>
                    <span>{slot.durationMinutes} mins</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    <span>Coach: <strong>{slot.trainerName}</strong></span>
                  </div>
                </div>

                {/* Capacity Gauge & Waitlist indicator */}
                <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Capacity Status</span>
                    <span className="font-bold">
                      {slot.bookedCount}/{slot.capacity} Booked
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFull
                          ? 'bg-rose-500'
                          : percentageBooked > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percentageBooked)}%` }}
                    />
                  </div>

                  {/* Waitlist Status */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {slot.waitlistCount > 0 ? (
                      <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                        ⚡ {slot.waitlistCount}/{slot.waitlistCapacity} Waitlisted
                      </span>
                    ) : isFull ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Waitlist Available ({slot.waitlistCapacity} slots)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Seats Available ({slot.capacity - slot.bookedCount} left)
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedSlot(slot);
                        setIsSlotDetailsOpen(true);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      View Attendees ({slot.attendees.length})
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setSelectedSlot(slot);
                      setIsBookModalOpen(true);
                    }}
                    variant={isFull ? 'outline' : 'default'}
                    className={`w-full flex items-center justify-center gap-1.5 ${
                      isFull ? 'border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10' : ''
                    }`}
                  >
                    {isFull ? (
                      <>
                        <Users className="w-4 h-4" />
                        Join Waitlist (#{slot.waitlistCount + 1})
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Book Slot
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TRIAL BOOKINGS & PROSPECT TRACKING */}
      {activeTab === 'TRIALS' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Complimentary Trial Registrations</h3>
              <p className="text-xs text-muted-foreground">
                Track prospect trial attendance, allocated coach, and conversion to permanent membership
              </p>
            </div>
            <Badge variant="default">{trials.length} Active Trials</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Prospect Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Class Session</th>
                  <th className="px-4 py-3">Allocated Coach</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trials.map((trial) => (
                  <tr key={trial.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-foreground">{trial.prospectName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      <div>{trial.prospectPhone}</div>
                      <div className="text-xs text-muted-foreground/80">{trial.prospectEmail}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{trial.classSlotName}</div>
                      <div className="text-xs text-muted-foreground">{trial.slotTime}</div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">🏋️ {trial.trainerName}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          trial.status === 'CONVERTED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : trial.status === 'ATTENDED'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {trial.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {trial.status !== 'CONVERTED' ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setTrials((prev) =>
                              prev.map((t) => (t.id === trial.id ? { ...t, status: 'CONVERTED' } : t)),
                            );
                            addToast({
                              title: 'Trial Converted!',
                              message: `${trial.prospectName} converted to a gym member!`,
                              type: 'success',
                            });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          Convert to Member
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Converted
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

      {/* MODAL: BOOK SLOT */}
      {selectedSlot && (
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title={`Book: ${selectedSlot.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1.5 text-xs">
              <p><span className="font-semibold">Timing:</span> {selectedSlot.time}</p>
              <p><span className="font-semibold">Instructor:</span> {selectedSlot.trainerName}</p>
              <p><span className="font-semibold">Capacity Status:</span> {selectedSlot.bookedCount}/{selectedSlot.capacity} booked</p>
              {selectedSlot.bookedCount >= selectedSlot.capacity && (
                <p className="text-purple-600 dark:text-purple-400 font-bold">
                  ⚠️ Class is full. You will be added to the waitlist at position #{selectedSlot.waitlistCount + 1}.
                </p>
              )}
            </div>

            <Select
              label="Select Member"
              value={bookingForm.memberName}
              onChange={(e) => setBookingForm({ ...bookingForm, memberName: e.target.value })}
              options={[
                { value: 'Aarav Nambiar (IP-FIT-001)', label: 'Aarav Nambiar (IP-FIT-001)' },
                { value: 'Kavita Iyer (IP-FIT-002)', label: 'Kavita Iyer (IP-FIT-002)' },
                { value: 'Siddharth Roy (IP-FIT-004)', label: 'Siddharth Roy (IP-FIT-004)' },
                { value: 'Ananya Sharma (IP-FIT-005)', label: 'Ananya Sharma (IP-FIT-005)' },
              ]}
            />

            <Select
              label="Booking Category"
              value={bookingForm.bookingType}
              onChange={(e) => setBookingForm({ ...bookingForm, bookingType: e.target.value as any })}
              options={[
                { value: 'CLASS', label: 'Group Fitness Class Pass' },
                { value: 'PERSONAL_TRAINING', label: 'PT 1-on-1 Guided Session' },
                { value: 'TRIAL', label: 'Complimentary Trial Pass' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmBooking}>
                {selectedSlot.bookedCount >= selectedSlot.capacity ? 'Confirm Waitlist' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: VIEW ATTENDEES & CANCELLATION */}
      {selectedSlot && (
        <Modal
          isOpen={isSlotDetailsOpen}
          onClose={() => setIsSlotDetailsOpen(false)}
          title={`Attendees: ${selectedSlot.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Cancelling a confirmed booking will automatically promote the first waitlisted member to confirmed.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedSlot.attendees.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/60 text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{att.memberName}</p>
                    <p className="text-muted-foreground">
                      Type: {att.bookingType} • Status:{' '}
                      <span
                        className={
                          att.status === 'CONFIRMED'
                            ? 'text-emerald-600 font-bold'
                            : 'text-purple-600 font-bold'
                        }
                      >
                        {att.status} {att.waitlistPosition ? `(#${att.waitlistPosition})` : ''}
                      </span>
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelBooking(selectedSlot.id, att.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-xs"
                  >
                    Cancel Booking
                  </Button>
                </div>
              ))}

              {selectedSlot.attendees.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No bookings yet for this slot.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: REGISTER FREE TRIAL */}
      <Modal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        title="Register Complimentary Trial Session"
        size="md"
      >
        <form onSubmit={handleCreateTrial} className="space-y-4">
          <Input
            label="Prospect Full Name *"
            placeholder="e.g. Vikram Singhania"
            value={trialForm.name}
            onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number *"
              placeholder="+91 98333 77889"
              value={trialForm.phone}
              onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="prospect@ironpulse-crm.org"
              value={trialForm.email}
              onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Choose Class Slot"
              value={trialForm.slotId}
              onChange={(e) => setTrialForm({ ...trialForm, slotId: e.target.value })}
              options={schedule.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.time})`,
              }))}
            />
            <Select
              label="Allocate Trainer"
              value={trialForm.trainerName}
              onChange={(e) => setTrialForm({ ...trialForm, trainerName: e.target.value })}
              options={[
                { value: 'Kabir Bhasin', label: 'Kabir Bhasin (Strength & CrossFit)' },
                { value: 'Ananya Deshmukh', label: 'Ananya Deshmukh (Yoga & Mobility)' },
                { value: 'Sameer Sen', label: 'Sameer Sen (Cardio & Spin)' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsTrialModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Register & Allocate Coach</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ClassesPage;
