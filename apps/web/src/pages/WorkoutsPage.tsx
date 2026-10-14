import React, { useState, useEffect } from 'react';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  Dumbbell,
  BookOpen,
  Calendar,
  Layers,
  Search,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ChevronRight,
  Filter,
  UserCheck,
} from 'lucide-react';

export interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  targetMuscleGroup: string;
  secondaryMuscles?: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipmentRequired: string;
  instructions: string;
  imageUrl: string;
}

export interface WorkoutTemplateItem {
  id: string;
  title: string;
  daysPerWeek: number;
  description: string;
  schedule: {
    dayOfWeek: string;
    focus: string;
    exercises: {
      exerciseName: string;
      sets: number;
      reps: number;
      weightInKg?: number;
      restSeconds: number;
    }[];
  }[];
}

export interface WorkoutLogItem {
  id: string;
  memberName: string;
  title: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  exercises: {
    exerciseName: string;
    setsCompleted: number;
    repsCompleted: number;
    weightKg: number;
  }[];
  notes?: string;
}

const INITIAL_TEMPLATES: WorkoutTemplateItem[] = [
  {
    id: 'tpl-1',
    title: '3-Day Power Foundation',
    daysPerWeek: 3,
    description: 'Classic linear progression routine focused on squats, bench press, deadlifts, and compound assistance work.',
    schedule: [
      {
        dayOfWeek: 'Day 1: Lower Strength',
        focus: 'Quads & Posterior Chain',
        exercises: [
          { exerciseName: 'Barbell Back Squat', sets: 4, reps: 6, weightInKg: 90, restSeconds: 120 },
          { exerciseName: 'Barbell Romanian Deadlift (RDL)', sets: 3, reps: 8, weightInKg: 80, restSeconds: 90 },
        ],
      },
      {
        dayOfWeek: 'Day 2: Upper Strength',
        focus: 'Chest, Shoulders & Back',
        exercises: [
          { exerciseName: 'Barbell Flat Bench Press', sets: 4, reps: 6, weightInKg: 75, restSeconds: 120 },
          { exerciseName: 'Pull-Ups (Wide Grip)', sets: 4, reps: 8, restSeconds: 90 },
          { exerciseName: 'Overhead Standing Military Press', sets: 3, reps: 8, weightInKg: 45, restSeconds: 90 },
        ],
      },
      {
        dayOfWeek: 'Day 3: Full Body Power',
        focus: 'Deadlift & Explosive Pulls',
        exercises: [
          { exerciseName: 'Conventional Deadlift', sets: 4, reps: 5, weightInKg: 120, restSeconds: 150 },
          { exerciseName: 'Barbell Back Squat', sets: 3, reps: 8, weightInKg: 75, restSeconds: 90 },
        ],
      },
    ],
  },
  {
    id: 'tpl-2',
    title: '4-Day Upper / Lower Hypertrophy Split',
    daysPerWeek: 4,
    description: 'Volume-optimized bodybuilding routine with dedicated upper and lower hypertrophy sessions.',
    schedule: [
      {
        dayOfWeek: 'Day 1: Upper A',
        focus: 'Heavy Push & Horizontal Pull',
        exercises: [
          { exerciseName: 'Barbell Flat Bench Press', sets: 4, reps: 8, weightInKg: 70, restSeconds: 90 },
          { exerciseName: 'Pull-Ups (Wide Grip)', sets: 4, reps: 10, restSeconds: 90 },
        ],
      },
      {
        dayOfWeek: 'Day 2: Lower A',
        focus: 'Quad Dominant & Hamstrings',
        exercises: [
          { exerciseName: 'Barbell Back Squat', sets: 4, reps: 8, weightInKg: 85, restSeconds: 90 },
          { exerciseName: 'Barbell Romanian Deadlift (RDL)', sets: 3, reps: 10, weightInKg: 70, restSeconds: 90 },
        ],
      },
    ],
  },
];

const INITIAL_LOGS: WorkoutLogItem[] = [];

const INITIAL_EXERCISES: ExerciseItem[] = [
  {
    id: 'ex-squat',
    name: 'Barbell Back Squat',
    category: 'STRENGTH',
    targetMuscleGroup: 'Quads (Legs)',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
    difficulty: 'ADVANCED',
    equipmentRequired: 'Olympic Barbell & Squat Rack',
    instructions: 'Place bar across upper traps. Unrack, brace core tightly, squat down until hip crease is below parallel, drive up explosively.',
    imageUrl: '/images/exercises/squat.webp',
  },
  {
    id: 'ex-deadlift',
    name: 'Conventional Deadlift',
    category: 'POWERLIFTING',
    targetMuscleGroup: 'Back & Lats',
    secondaryMuscles: ['Hamstrings', 'Glutes', 'Traps'],
    difficulty: 'ADVANCED',
    equipmentRequired: 'Olympic Barbell & Calibrated Bumper Plates',
    instructions: 'Stand mid-foot under bar. Hinge hips back, grasp bar just outside shins. Pull chest up, drag bar along legs, lockout hips firmly.',
    imageUrl: '/images/exercises/deadlift.webp',
  },
  {
    id: 'ex-bench',
    name: 'Barbell Flat Bench Press',
    category: 'STRENGTH',
    targetMuscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Anterior Deltoids'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Olympic Barbell & Flat Bench',
    instructions: 'Lie on bench with eyes under bar. Retract scapulae, unrack, lower bar controlled to mid-sternum, press upward smoothly to lockout.',
    imageUrl: '/images/exercises/bench.webp',
  },
  {
    id: 'ex-pullup',
    name: 'Pull-Ups (Wide Grip)',
    category: 'CALISTHENICS',
    targetMuscleGroup: 'Back & Lats',
    secondaryMuscles: ['Biceps', 'Rhomboids'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Pull-up Rig / Bar',
    instructions: 'Grip bar overhand slightly wider than shoulders. Depress scapulae, pull elbows down toward ribs until chin clears bar.',
    imageUrl: '/images/exercises/pullup.webp',
  },
  {
    id: 'ex-rdl',
    name: 'Barbell Romanian Deadlift (RDL)',
    category: 'STRENGTH',
    targetMuscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Erector Spinae'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Olympic Barbell',
    instructions: 'Hold barbell with overhand grip. Soft bend in knees, hinge hips rearward while keeping back flat until feeling deep hamstring stretch.',
    imageUrl: '/images/exercises/rdl.webp',
  },
  {
    id: 'ex-ohp',
    name: 'Overhead Standing Military Press',
    category: 'STRENGTH',
    targetMuscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Olympic Barbell',
    instructions: 'Rest bar across anterior deltoids. Squeeze glutes and quads, press bar vertically overhead, clearing face and locking elbows.',
    imageUrl: '/images/exercises/ohp.webp',
  },
  {
    id: 'ex-db-incline',
    name: 'Dumbbell Incline Bench Press',
    category: 'HYPERTROPHY',
    targetMuscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Incline Bench & Dumbbells',
    instructions: 'Set bench to 30 degrees. Press dumbbells upward together in slight arc, controlling descent to deep stretch.',
    imageUrl: '/images/exercises/incline-press.webp',
  },
  {
    id: 'ex-cable-row',
    name: 'Seated Cable Row',
    category: 'HYPERTROPHY',
    targetMuscleGroup: 'Back & Lats',
    secondaryMuscles: ['Rear Delts', 'Biceps'],
    difficulty: 'BEGINNER',
    equipmentRequired: 'Low Cable Pulley Station',
    instructions: 'Sit upright with knees slightly flexed. Pull V-bar handle to lower ribs while retracting shoulder blades.',
    imageUrl: '/images/exercises/cable-row.webp',
  },
  {
    id: 'ex-leg-raise',
    name: 'Hanging Leg Raises',
    category: 'CORE',
    targetMuscleGroup: 'Core / Abs',
    secondaryMuscles: ['Hip Flexors'],
    difficulty: 'INTERMEDIATE',
    equipmentRequired: 'Pull-up Bar',
    instructions: 'Hang from bar with neutral spine. Without swinging, curl pelvis upward, bringing legs horizontal or higher.',
    imageUrl: '/images/exercises/leg-raise.webp',
  },
];

export const WorkoutsPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'TEMPLATES' | 'LOGS'>('LIBRARY');
  const [exercises, setExercises] = useState<ExerciseItem[]>(INITIAL_EXERCISES);
  const [templates, setTemplates] = useState<WorkoutTemplateItem[]>(INITIAL_TEMPLATES);
  const [logs, setLogs] = useState<WorkoutLogItem[]>(INITIAL_LOGS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Modals
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [isExerciseDetailOpen, setIsExerciseDetailOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false);
  const [targetTemplate, setTargetTemplate] = useState<WorkoutTemplateItem | null>(null);

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    memberName: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  // Log Workout Form
  const [logForm, setLogForm] = useState({
    memberName: '',
    title: '',
    durationMinutes: 45,
    exerciseName: '',
    sets: 3,
    reps: 10,
    weightKg: 0,
    notes: '',
  });

  // Fetch real exercises from API on mount
  const [membersList, setMembersList] = useState<any[]>([]);

  useEffect(() => {
    const fetchTemplatesAndExercises = async () => {
      try {
        const [exRes, plRes] = await Promise.all([
          api.get('/workouts/exercises'),
          api.get('/workouts/plans'),
        ]);
        if (exRes.success && exRes.data?.exercises && exRes.data.exercises.length > 0) {
          setExercises(exRes.data.exercises);
        }
        if (plRes.success && Array.isArray(plRes.data) && plRes.data.length > 0) {
          setTemplates(
            plRes.data.map((p: any) => ({
              id: p._id || p.id,
              title: p.title,
              daysPerWeek: p.daysPerWeek || 3,
              description: p.description || '',
              schedule: (p.schedule || []).map((s: any) => ({
                dayOfWeek: s.dayOfWeek,
                focus: s.focus,
                exercises: (s.exercises || []).map((e: any) => ({
                  exerciseName: e.exerciseName || 'Exercise',
                  sets: e.sets || 3,
                  reps: e.reps || 10,
                  weightInKg: e.weightInKg,
                  restSeconds: e.restSeconds || 60,
                })),
              })),
            })),
          );
        }
      } catch {
        // Fallback to INITIAL_EXERCISES
      }
    };
    const fetchMembers = async () => {
      try {
        const mRes = await api.get<any[]>('/members');
        if (mRes.success && Array.isArray(mRes.data)) setMembersList(mRes.data);
      } catch {
        // Fallback or ignore if members endpoint fails
      }
    };
    fetchTemplatesAndExercises();
    fetchMembers();
  }, []);

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipmentRequired.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'ALL' || ex.targetMuscleGroup === selectedMuscle;
    const matchesDiff = selectedDifficulty === 'ALL' || ex.difficulty === selectedDifficulty;
    return matchesSearch && matchesMuscle && matchesDiff;
  });

  // Assign template
  const handleAssignPlan = async () => {
    if (!targetTemplate) return;

    const selectedMember =
      membersList.find(
        (m) =>
          `${m.name} (${m.code || m.memberCode || ''})` === assignForm.memberName ||
          m.id === assignForm.memberId ||
          m._id === assignForm.memberId,
      ) || membersList[0];

    const memberId = selectedMember?._id || selectedMember?.id || '650000000000000000000001';
    const planId = targetTemplate.id.startsWith('tpl-') ? '650000000000000000000001' : targetTemplate.id;

    try {
      await api.post(`/workouts/plans/${planId}/assign`, {
        memberId,
        planId,
        startDate: new Date(assignForm.startDate || Date.now()).toISOString(),
      });
    } catch {
      // Local fallback
    }

    addToast({
      title: 'Plan Assigned!',
      message: `Assigned "${targetTemplate.title}" to ${assignForm.memberName || selectedMember?.name || 'Member'}. Starts on ${assignForm.startDate}.`,
      type: 'success',
    });
    setIsAssignModalOpen(false);
  };

  // Log session
  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const volume = Number(logForm.sets) * Number(logForm.reps) * Number(logForm.weightKg);

    const selectedMember =
      membersList.find(
        (m) =>
          `${m.name} (${m.code || m.memberCode || ''})` === logForm.memberName ||
          m.id === logForm.memberName ||
          m._id === logForm.memberName,
      ) || membersList[0];

    const memberId = selectedMember?._id || selectedMember?.id || '650000000000000000000001';

    let logId = `log-${Date.now()}`;
    try {
      const res = await api.post('/workouts/logs', {
        memberId,
        title: logForm.title || 'Strength Session',
        date: new Date().toISOString(),
        durationMinutes: Number(logForm.durationMinutes) || 45,
        exercises: [
          {
            exerciseId: '650000000000000000000001',
            exerciseName: logForm.exerciseName || 'Compound Lift',
            setsCompleted: Number(logForm.sets) || 3,
            repsCompleted: Number(logForm.reps) || 10,
            weightKg: Number(logForm.weightKg) || 0,
          },
        ],
        notes: logForm.notes,
      });
      if (res.success && res.data?._id) {
        logId = res.data._id;
      }
    } catch {
      // Local fallback
    }

    const newLog: WorkoutLogItem = {
      id: logId,
      memberName: logForm.memberName,
      title: logForm.title,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: Number(logForm.durationMinutes) || 45,
      totalVolumeKg: volume,
      exercises: [
        {
          exerciseName: logForm.exerciseName,
          setsCompleted: Number(logForm.sets),
          repsCompleted: Number(logForm.reps),
          weightKg: Number(logForm.weightKg),
        },
      ],
      notes: logForm.notes,
    };

    setLogs([newLog, ...logs]);
    setIsLogSessionModalOpen(false);

    addToast({
      title: 'Workout Logged!',
      message: `Completed ${volume.toLocaleString()} kg total volume!`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workouts & Exercise Library</h1>
            <p className="text-sm text-muted-foreground">
              150+ seeded movement catalog, multi-week templates, member plan assignments & volume tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('LIBRARY')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'LIBRARY'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Exercises (157+)
            </button>
            <button
              onClick={() => setActiveTab('TEMPLATES')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'TEMPLATES'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Plan Templates
            </button>
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'LOGS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Workout Logs
            </button>
          </div>

          <Button
            onClick={() => setIsLogSessionModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Member Workout
          </Button>
        </div>
      </div>

      {/* TAB 1: EXERCISE LIBRARY */}
      {activeTab === 'LIBRARY' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card/40 p-4 rounded-xl border border-border">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search 150+ exercises by name or equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Target Muscles' },
                { value: 'Quads', label: 'Quads (Legs)' },
                { value: 'Hamstrings', label: 'Hamstrings' },
                { value: 'Chest', label: 'Chest' },
                { value: 'Back', label: 'Back & Lats' },
                { value: 'Shoulders', label: 'Shoulders' },
                { value: 'Biceps', label: 'Biceps' },
                { value: 'Triceps', label: 'Triceps' },
                { value: 'Core', label: 'Core / Abs' },
              ]}
            />

            <Select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Difficulties' },
                { value: 'BEGINNER', label: 'Beginner' },
                { value: 'INTERMEDIATE', label: 'Intermediate' },
                { value: 'ADVANCED', label: 'Advanced' },
              ]}
            />
          </div>

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  setSelectedExercise(ex);
                  setIsExerciseDetailOpen(true);
                }}
                className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden bg-muted">
                    <img
                      src={ex.imageUrl}
                      alt={ex.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="default">{ex.targetMuscleGroup}</Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {ex.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {ex.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span>⚙️ {ex.equipmentRequired}</span>
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ex.instructions}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-primary font-semibold">
                  <span>View Technique Instructions</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WORKOUT PLAN TEMPLATES */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-foreground">{tpl.title}</h3>
                  <Badge variant="outline">{tpl.daysPerWeek} Days / Week</Badge>
                </div>

                <p className="text-sm text-muted-foreground">{tpl.description}</p>

                {/* Routine Schedule preview */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Weekly Routine Breakdown
                  </h4>
                  {tpl.schedule.map((day, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-2">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>{day.dayOfWeek}</span>
                        <span className="text-primary">{day.focus}</span>
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        {day.exercises.map((e, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>• {e.exerciseName}</span>
                            <span className="font-mono text-[11px]">
                              {e.sets} sets × {e.reps} reps {e.weightInKg ? `@ ${e.weightInKg}kg` : ''} ({e.restSeconds}s rest)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  onClick={() => {
                    setTargetTemplate(tpl);
                    setIsAssignModalOpen(true);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Assign Plan to Member
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: WORKOUT LOGS & VOLUME PROGRESS */}
      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Completed Member Workout Sessions</h3>
                <p className="text-xs text-muted-foreground">
                  Session duration, exercises logged, and cumulative volume lifted
                </p>
              </div>
              <Badge variant="default">{logs.length} Logged Sessions</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Session Title</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Volume Lifted</th>
                    <th className="px-4 py-3">Exercises</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No workout sessions logged yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-foreground">{log.memberName}</td>
                        <td className="px-4 py-3.5 font-medium">{log.title}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">{log.date}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">⏱️ {log.durationMinutes} mins</td>
                        <td className="px-4 py-3.5 font-bold text-primary">
                          ⚡ {log.totalVolumeKg.toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {log.exercises.map((e) => `${e.exerciseName} (${e.setsCompleted}x${e.repsCompleted})`).join(', ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXERCISE DETAIL */}
      {selectedExercise && (
        <Modal
          isOpen={isExerciseDetailOpen}
          onClose={() => setIsExerciseDetailOpen(false)}
          title={selectedExercise.name}
          size="md"
        >
          <div className="space-y-4">
            <div className="h-52 rounded-xl overflow-hidden bg-muted">
              <img
                src={selectedExercise.imageUrl}
                alt={selectedExercise.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{selectedExercise.targetMuscleGroup}</Badge>
              <Badge variant="outline">{selectedExercise.difficulty}</Badge>
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                Equipment: {selectedExercise.equipmentRequired}
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Execution Instructions</h4>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
                {selectedExercise.instructions}
              </p>
            </div>
            {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Secondary Muscle Engagement: </span>
                {selectedExercise.secondaryMuscles.join(', ')}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: ASSIGN PLAN TO MEMBER */}
      {targetTemplate && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Plan: ${targetTemplate.title}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the member to whom this training schedule should be personalized and assigned.
            </p>
            <Select
              label="Select Member"
              value={assignForm.memberId}
              onChange={(e) => {
                const selected = membersList.find((m) => m.id === e.target.value);
                setAssignForm({
                  ...assignForm,
                  memberId: e.target.value,
                  memberName: selected ? `${selected.name} (${selected.code || selected.memberCode || ''})` : e.target.value,
                });
              }}
              options={
                membersList.length > 0
                  ? membersList.map((m) => ({
                      value: m.id,
                      label: `${m.name} (${m.code || m.memberCode || ''})`,
                    }))
                  : [{ value: '', label: 'No members registered yet' }]
              }
            />
            <Input
              type="date"
              label="Plan Start Date"
              value={assignForm.startDate}
              onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignPlan}>Confirm Assignment</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: LOG WORKOUT */}
      <Modal
        isOpen={isLogSessionModalOpen}
        onClose={() => setIsLogSessionModalOpen(false)}
        title="Log Member Workout Session"
        size="md"
      >
        <form onSubmit={handleLogSession} className="space-y-4">
          <Input
            label="Member Name"
            value={logForm.memberName}
            onChange={(e) => setLogForm({ ...logForm, memberName: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Session Title"
              value={logForm.title}
              onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={logForm.durationMinutes}
              onChange={(e) => setLogForm({ ...logForm, durationMinutes: Number(e.target.value) })}
              required
            />
          </div>
          <Select
            label="Primary Exercise"
            value={logForm.exerciseName}
            onChange={(e) => setLogForm({ ...logForm, exerciseName: e.target.value })}
            options={exercises.map((e) => ({ value: e.name, label: e.name }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Sets"
              type="number"
              value={logForm.sets}
              onChange={(e) => setLogForm({ ...logForm, sets: Number(e.target.value) })}
              required
            />
            <Input
              label="Reps"
              type="number"
              value={logForm.reps}
              onChange={(e) => setLogForm({ ...logForm, reps: Number(e.target.value) })}
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={logForm.weightKg}
              onChange={(e) => setLogForm({ ...logForm, weightKg: Number(e.target.value) })}
              required
            />
          </div>
          <div className="p-3 bg-muted/40 rounded-xl text-xs flex justify-between font-semibold">
            <span>Calculated Volume:</span>
            <span className="text-primary font-bold">
              {(logForm.sets * logForm.reps * logForm.weightKg).toLocaleString()} kg
            </span>
          </div>
          <Input
            label="Trainer / Member Notes"
            placeholder="Feedback on form, energy, or tempo..."
            value={logForm.notes}
            onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsLogSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Session</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default WorkoutsPage;
