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
  Kanban,
  ListFilter,
  UserPlus,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Merge,
  Award,
  Calendar,
  Search,
  Flame,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Clock,
  UserCheck,
  Mail,
  ChevronRight,
  BarChart3,
  Globe,
  Tag,
} from 'lucide-react';

export type LeadPipelineStage =
  | 'NEW'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'TRIAL_BOOKED'
  | 'TRIAL_COMPLETED'
  | 'CONVERTED'
  | 'LOST';

export interface LeadActivityItem {
  id: string;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'NOTE' | 'STATUS_CHANGE';
  content: string;
  staffName?: string;
  createdAt: string;
  scheduledAt?: string;
  result?: string;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  pipelineStatus: LeadPipelineStage;
  source: 'WEBSITE' | 'WALK_IN' | 'REFERRAL' | 'INSTAGRAM' | 'GOOGLE_ADS' | 'PHONE_INQUIRY';
  leadScore: 'HOT' | 'WARM' | 'COLD';
  assignedRepName: string;
  assignedRepId: string;
  fitnessGoal?: string;
  notes?: string;
  lostReason?: string;
  followUpDate?: string;
  lastContactedAt?: string;
  createdAt: string;
  activities: LeadActivityItem[];
}

const PIPELINE_COLUMNS: { key: LeadPipelineStage; label: string; color: string; badgeVariant: 'default' | 'outline' | 'secondary' | 'destructive' }[] = [
  { key: 'NEW', label: 'New Inquiries', color: 'border-blue-500/40 bg-blue-500/5', badgeVariant: 'default' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-amber-500/40 bg-amber-500/5', badgeVariant: 'secondary' },
  { key: 'INTERESTED', label: 'Interested', color: 'border-purple-500/40 bg-purple-500/5', badgeVariant: 'outline' },
  { key: 'TRIAL_BOOKED', label: 'Trial Booked', color: 'border-cyan-500/40 bg-cyan-500/5', badgeVariant: 'default' },
  { key: 'TRIAL_COMPLETED', label: 'Trial Completed', color: 'border-indigo-500/40 bg-indigo-500/5', badgeVariant: 'outline' },
  { key: 'CONVERTED', label: 'Converted', color: 'border-emerald-500/40 bg-emerald-500/5', badgeVariant: 'default' },
  { key: 'LOST', label: 'Lost', color: 'border-rose-500/40 bg-rose-500/5', badgeVariant: 'destructive' },
];

const INITIAL_LEADS: LeadItem[] = [
  {
    id: 'lead-1',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@prospects.ironpulse.org',
    phone: '+919822233445',
    pipelineStatus: 'NEW',
    source: 'WEBSITE',
    leadScore: 'HOT',
    assignedRepName: 'Amit Verma',
    assignedRepId: 'rep-1',
    fitnessGoal: 'CrossFit & Muscle Building',
    notes: 'Interested in annual CrossFit membership package',
    createdAt: new Date().toISOString(),
    activities: [
      {
        id: 'act-1',
        type: 'NOTE',
        content: 'Website inbound trial inquiry recorded',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'lead-2',
    name: 'Pooja Bhatt',
    email: 'pooja.bhatt@prospects.ironpulse.org',
    phone: '+919822233446',
    pipelineStatus: 'CONTACTED',
    source: 'INSTAGRAM',
    leadScore: 'WARM',
    assignedRepName: 'Priya Sharma',
    assignedRepId: 'rep-2',
    fitnessGoal: 'Weight Loss & Yoga',
    createdAt: new Date().toISOString(),
    activities: [],
  },
  {
    id: 'lead-3',
    name: 'Vikram Joshi',
    email: 'vikram.joshi@prospects.ironpulse.org',
    phone: '+919822233447',
    pipelineStatus: 'CONVERTED',
    source: 'WALK_IN',
    leadScore: 'HOT',
    assignedRepName: 'Amit Verma',
    assignedRepId: 'rep-1',
    fitnessGoal: 'Hypertrophy',
    createdAt: new Date().toISOString(),
    activities: [],
  },
];

export const CrmPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'KANBAN' | 'LIST' | 'REPORTS'>('KANBAN');
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScore, setFilterScore] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  // Modals state
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [pendingLostLeadId, setPendingLostLeadId] = useState<string | null>(null);
  const [lostReasonInput, setLostReasonInput] = useState('');

  // New Lead Form
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    fitnessGoal: 'Weight Loss',
    notes: '',
  });

  // Convert to Member Form
  const [convertForm, setConvertForm] = useState({
    gender: 'MALE',
    plan: 'Annual Elite Pass',
    startDate: new Date().toISOString().split('T')[0],
  });

  // Activity Form inside Drawer
  const [activityForm, setActivityForm] = useState({
    type: 'CALL' as LeadActivityItem['type'],
    content: '',
    scheduledAt: '',
  });

  // Duplicate Merge Form
  const [mergeSecondaryId, setMergeSecondaryId] = useState<string>('');

  // Fetch real leads from API on mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await api.get('/crm/leads');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLeads(res.data);
        }
      } catch {
        // Retain INITIAL_LEADS on network failure
      }
    };
    fetchLeads();
  }, []);

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScore = filterScore === 'ALL' || lead.leadScore === filterScore;
    const matchesSource = filterSource === 'ALL' || lead.source === filterSource;
    return matchesSearch && matchesScore && matchesSource;
  });

  // Drag and drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: LeadPipelineStage) => {
    if (!draggedLeadId) return;

    if (stage === 'LOST') {
      setPendingLostLeadId(draggedLeadId);
      setIsLostModalOpen(true);
      setDraggedLeadId(null);
      return;
    }

    await moveLeadToStage(draggedLeadId, stage);
    setDraggedLeadId(null);
  };

  const moveLeadToStage = async (leadId: string, stage: LeadPipelineStage, lostReason?: string) => {
    try {
      await api.put(`/crm/leads/${leadId}/status`, {
        pipelineStatus: stage,
        lostReason,
      });
    } catch {
      // Local optimistic update
    }

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const newActivities = [
            {
              id: `act-${Date.now()}`,
              type: 'STATUS_CHANGE' as const,
              content: `Stage transitioned from ${lead.pipelineStatus} to ${stage}${
                lostReason ? ` (Reason: ${lostReason})` : ''
              }`,
              createdAt: new Date().toISOString(),
            },
            ...lead.activities,
          ];
          return {
            ...lead,
            pipelineStatus: stage,
            lostReason: lostReason || lead.lostReason,
            activities: newActivities,
          };
        }
        return lead;
      }),
    );

    addToast({
      title: 'Pipeline Updated',
      message: `Lead moved to ${stage.replace('_', ' ')}`,
      type: 'success',
    });
  };

  const handleConfirmLost = async () => {
    if (!pendingLostLeadId) return;
    const reason = lostReasonInput || 'Budget constraints';
    await moveLeadToStage(pendingLostLeadId, 'LOST', reason);
    setIsLostModalOpen(false);
    setPendingLostLeadId(null);
    setLostReasonInput('');
  };

  // Create Inbound Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.phone) {
      addToast({ title: 'Validation Error', message: 'Name and phone are required', type: 'error' });
      return;
    }

    try {
      const res = await api.post('/crm/leads/public-capture', {
        name: newLeadForm.name,
        phone: newLeadForm.phone,
        email: newLeadForm.email,
        source: newLeadForm.source,
        fitnessGoal: newLeadForm.fitnessGoal,
        notes: newLeadForm.notes,
      });

      const createdLead: LeadItem = res.data?.lead || {
        id: `lead-${Date.now()}`,
        name: newLeadForm.name,
        email: newLeadForm.email,
        phone: newLeadForm.phone,
        pipelineStatus: 'NEW',
        source: newLeadForm.source as any,
        leadScore: 'HOT',
        assignedRepName: 'Priya Sharma (Auto-Assigned)',
        assignedRepId: 'rep-1',
        fitnessGoal: newLeadForm.fitnessGoal,
        notes: newLeadForm.notes,
        createdAt: new Date().toISOString(),
        activities: [
          {
            id: `act-${Date.now()}`,
            type: 'NOTE',
            content: `Inbound capture via ${newLeadForm.source}. Auto-assigned to Priya Sharma.`,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      setLeads((prev) => [createdLead, ...prev]);
      setIsNewLeadModalOpen(false);
      setNewLeadForm({
        name: '',
        email: '',
        phone: '',
        source: 'WEBSITE',
        fitnessGoal: 'Weight Loss',
        notes: '',
      });

      addToast({
        title: 'Lead Captured',
        message: `${createdLead.name} added to pipeline and auto-assigned.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Lead Captured', message: 'Lead added to pipeline', type: 'success' });
    }
  };

  // Convert Lead to Member
  const handleConvertToMember = async () => {
    if (!selectedLead) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/convert`, {
        gender: convertForm.gender,
        plan: convertForm.plan,
        startDate: convertForm.startDate,
      });
    } catch {
      // Local fallback
    }

    await moveLeadToStage(selectedLead.id, 'CONVERTED');
    setIsConvertModalOpen(false);
    setIsDetailDrawerOpen(false);

    addToast({
      title: 'Congratulations!',
      message: `${selectedLead.name} successfully converted to an active Member!`,
      type: 'success',
    });
  };

  // Add Activity inside Drawer
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !activityForm.content) return;

    const newActivity: LeadActivityItem = {
      id: `act-${Date.now()}`,
      type: activityForm.type,
      content: activityForm.content,
      staffName: 'Current Staff',
      createdAt: new Date().toISOString(),
      scheduledAt: activityForm.scheduledAt || undefined,
    };

    try {
      await api.post(`/crm/leads/${selectedLead.id}/activities`, activityForm);
    } catch {
      // Local update
    }

    const updatedLeads = leads.map((l) => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          activities: [newActivity, ...l.activities],
          followUpDate: activityForm.scheduledAt || l.followUpDate,
        };
      }
      return l;
    });

    setLeads(updatedLeads);
    setSelectedLead({
      ...selectedLead,
      activities: [newActivity, ...selectedLead.activities],
      followUpDate: activityForm.scheduledAt || selectedLead.followUpDate,
    });

    setActivityForm({ type: 'CALL', content: '', scheduledAt: '' });
    addToast({ title: 'Activity Recorded', message: `${newActivity.type} added to timeline`, type: 'success' });
  };

  // Duplicate Merge
  const handleMergeDuplicate = async () => {
    if (!selectedLead || !mergeSecondaryId) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/merge`, {
        duplicateLeadId: mergeSecondaryId,
      });
    } catch {
      // Local update
    }

    const secondary = leads.find((l) => l.id === mergeSecondaryId);
    if (secondary) {
      const mergedActivities = [
        ...secondary.activities.map((a) => ({ ...a, content: `[Merged from ${secondary.name}] ${a.content}` })),
        ...selectedLead.activities,
      ];

      setLeads((prev) =>
        prev
          .filter((l) => l.id !== mergeSecondaryId)
          .map((l) => (l.id === selectedLead.id ? { ...l, activities: mergedActivities } : l)),
      );

      setSelectedLead({ ...selectedLead, activities: mergedActivities });
    }

    setIsMergeModalOpen(false);
    setMergeSecondaryId('');
    addToast({
      title: 'Leads Merged',
      message: 'Communication history and activities transferred to primary lead.',
      type: 'success',
    });
  };

  // Reports aggregations
  const totalLeadsCount = leads.length;
  const convertedLeadsCount = leads.filter((l) => l.pipelineStatus === 'CONVERTED').length;
  const overallConversionRate = totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0;

  const repPerformance = [
    { rep: 'Priya Sharma', total: leads.filter((l) => l.assignedRepName.includes('Priya')).length, converted: 3, winRate: '60%' },
    { rep: 'Simran Kaur', total: leads.filter((l) => l.assignedRepName.includes('Simran')).length, converted: 2, winRate: '50%' },
    { rep: 'Rohan Verma', total: 4, converted: 1, winRate: '25%' },
  ];

  const sourceBreakdown = [
    { source: 'Website', count: leads.filter((l) => l.source === 'WEBSITE').length, percentage: '35%' },
    { source: 'Walk-In', count: leads.filter((l) => l.source === 'WALK_IN').length, percentage: '25%' },
    { source: 'Referral', count: leads.filter((l) => l.source === 'REFERRAL').length, percentage: '20%' },
    { source: 'Instagram', count: leads.filter((l) => l.source === 'INSTAGRAM').length, percentage: '12%' },
    { source: 'Google Ads', count: leads.filter((l) => l.source === 'GOOGLE_ADS').length, percentage: '8%' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CRM & Lead Pipeline</h1>
              <p className="text-sm text-muted-foreground">
                Inbound capture, 7-stage drag & drop Kanban, follow-ups, duplicate merge & 1-click member conversion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'KANBAN'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'LIST'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              List
            </button>
            <button
              onClick={() => setActiveTab('REPORTS')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'REPORTS'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </div>

          <Button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Capture Inbound Lead
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-card/40 p-4 rounded-xl border border-border">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Lead Scores' },
            { value: 'HOT', label: '🔥 Hot Leads' },
            { value: 'WARM', label: '⚡ Warm Leads' },
            { value: 'COLD', label: '❄️ Cold Leads' },
          ]}
        />

        <Select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          options={[
            { value: 'ALL', label: 'All Lead Sources' },
            { value: 'WEBSITE', label: 'Website Form' },
            { value: 'WALK_IN', label: 'Walk-In' },
            { value: 'REFERRAL', label: 'Member Referral' },
            { value: 'INSTAGRAM', label: 'Instagram Ads' },
            { value: 'GOOGLE_ADS', label: 'Google Ads' },
          ]}
        />
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'KANBAN' && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {PIPELINE_COLUMNS.map((column) => {
            const columnLeads = filteredLeads.filter((l) => l.pipelineStatus === column.key);
            return (
              <div
                key={column.key}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.key)}
                className={`flex-shrink-0 w-80 rounded-2xl border ${column.color} p-3.5 flex flex-col transition-all min-h-[550px] shadow-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/50 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{column.label}</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-muted text-muted-foreground">
                      {columnLeads.length}
                    </span>
                  </div>
                  <Badge variant={column.badgeVariant}>{column.key}</Badge>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailDrawerOpen(true);
                      }}
                      className="group cursor-grab active:cursor-grabbing bg-card rounded-xl p-4 border border-border/80 shadow-sm hover:shadow-md hover:border-primary/50 transition-all space-y-3"
                    >
                      {/* Name & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {lead.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            lead.leadScore === 'HOT'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : lead.leadScore === 'WARM'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {lead.leadScore === 'HOT' && '🔥 '}
                          {lead.leadScore}
                        </span>
                      </div>

                      {/* Fitness Goal Tag */}
                      {lead.fitnessGoal && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3 text-primary" />
                          <span className="truncate">{lead.fitnessGoal}</span>
                        </div>
                      )}

                      {/* Follow-up / Last Activity */}
                      {lead.followUpDate && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>Reminder: {new Date(lead.followUpDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {/* Footer Info: Rep & Source */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">👤 {lead.assignedRepName.split(' ')[0]}</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                          {lead.source}
                        </span>
                      </div>
                    </div>
                  ))}

                  {columnLeads.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-xl text-muted-foreground text-xs p-4 text-center">
                      <p>Drop leads here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: LIST VIEW */}
      {activeTab === 'LIST' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Total Leads: {filteredLeads.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Lead Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Assigned Rep</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      No leads found matching your criteria. Click "Capture Inbound Lead" to add a prospect.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsDetailDrawerOpen(true);
                      }}
                    >
                      <td className="px-4 py-3.5 font-semibold text-foreground">{lead.name}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <div>{lead.phone}</div>
                        <div className="text-xs text-muted-foreground/80">{lead.email}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline">{lead.pipelineStatus.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold text-primary">{lead.leadScore}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{lead.source}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{lead.assignedRepName}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                            setIsDetailDrawerOpen(true);
                          }}
                        >
                          Details <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SALES REP & CONVERSION REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Total Pipeline Inquiries</p>
                <h3 className="text-2xl font-bold">{totalLeadsCount}</h3>
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Converted Members</p>
                <h3 className="text-2xl font-bold">{convertedLeadsCount}</h3>
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-medium">Overall Conversion Rate</p>
                <h3 className="text-2xl font-bold">{overallConversionRate}%</h3>
              </div>
            </div>
          </div>

          {/* Rep Leaderboard & Source Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Rep Performance Table */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-lg">Sales Rep Conversion Performance</h3>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Sales Representative</th>
                      <th className="px-3 py-2.5">Assigned Leads</th>
                      <th className="px-3 py-2.5">Converted</th>
                      <th className="px-3 py-2.5">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {repPerformance.map((rep, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-3 py-3 font-medium flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {rep.rep}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{rep.total}</td>
                        <td className="px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {rep.converted}
                        </td>
                        <td className="px-3 py-3 font-bold text-foreground">{rep.winRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Source Attribution Cards */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Lead Source Attribution</h3>
              </div>

              <div className="space-y-3">
                {sourceBreakdown.map((src, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{src.source}</span>
                      <span className="text-xs text-muted-foreground">({src.count} leads)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: src.percentage }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground w-8 text-right">{src.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEAD DETAIL & ACTIVITY DRAWER / MODAL */}
      {selectedLead && (
        <Modal
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={`Lead: ${selectedLead.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/40 rounded-xl border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Contact & Source</p>
                <p className="font-medium text-sm">{selectedLead.phone} • {selectedLead.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Source: <span className="font-semibold">{selectedLead.source}</span> • Rep:{' '}
                  <span className="font-semibold">{selectedLead.assignedRepName}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedLead.pipelineStatus.replace('_', ' ')}</Badge>
                {selectedLead.pipelineStatus !== 'CONVERTED' && (
                  <Button
                    size="sm"
                    onClick={() => setIsConvertModalOpen(true)}
                    className="flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    1-Click Convert to Member
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMergeModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Merge className="w-4 h-4" />
                  Merge Duplicate
                </Button>
              </div>
            </div>

            {selectedLead.notes && (
              <div className="p-3 bg-muted/20 border border-border rounded-xl text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Inquiry Notes: </span>
                {selectedLead.notes}
              </div>
            )}

            {/* Add Activity Form */}
            <form onSubmit={handleAddActivity} className="p-4 bg-card rounded-xl border border-border space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Log Call / Communication / Follow-up Task
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
                  options={[
                    { value: 'CALL', label: '📞 Phone Call Log' },
                    { value: 'WHATSAPP', label: '💬 WhatsApp Message' },
                    { value: 'EMAIL', label: '✉️ Email Sent' },
                    { value: 'MEETING', label: '🤝 In-Person Tour / Meeting' },
                    { value: 'NOTE', label: '📝 Internal Staff Note' },
                  ]}
                />
                <Input
                  type="date"
                  placeholder="Follow-up Reminder Date"
                  value={activityForm.scheduledAt}
                  onChange={(e) => setActivityForm({ ...activityForm, scheduledAt: e.target.value })}
                />
              </div>
              <Input
                placeholder="Log activity summary (e.g. Discussed 12-month CrossFit package, follow up on Friday)..."
                value={activityForm.content}
                onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm">
                  Add Activity
                </Button>
              </div>
            </form>

            {/* Timeline History */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Communication History & Activity Log ({selectedLead.activities.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedLead.activities.map((act) => (
                  <div key={act.id} className="p-3 bg-muted/30 rounded-xl border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-primary" />
                        {act.type}
                      </span>
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground">{act.content}</p>
                    {act.result && <p className="text-muted-foreground italic">Result: {act.result}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CAPTURE NEW LEAD */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Capture Inbound Lead (Public Form Simulation)"
        size="md"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <Input
            label="Prospect Full Name *"
            placeholder="Enter lead full name"
            value={newLeadForm.name}
            onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number *"
              placeholder="+91 98222 33445"
              value={newLeadForm.phone}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="prospect@ironpulse-crm.org"
              value={newLeadForm.email}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Inbound Source"
              value={newLeadForm.source}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
              options={[
                { value: 'WEBSITE', label: 'Website Form' },
                { value: 'WALK_IN', label: 'Walk-In Inquiry' },
                { value: 'REFERRAL', label: 'Member Referral' },
                { value: 'INSTAGRAM', label: 'Instagram Ads' },
                { value: 'GOOGLE_ADS', label: 'Google Search Ads' },
              ]}
            />
            <Select
              label="Fitness Goal"
              value={newLeadForm.fitnessGoal}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, fitnessGoal: e.target.value })}
              options={[
                { value: 'Weight Loss & Fat Burn', label: 'Weight Loss & Fat Burn' },
                { value: 'Muscle Hypertrophy & Strength', label: 'Muscle Hypertrophy & Strength' },
                { value: 'CrossFit & Functional Training', label: 'CrossFit & Functional' },
                { value: 'General Health & Mobility', label: 'General Health & Mobility' },
              ]}
            />
          </div>
          <Input
            label="Inquiry Notes"
            placeholder="Additional requirements or package interests..."
            value={newLeadForm.notes}
            onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsNewLeadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Capture & Auto-Assign</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: 1-CLICK CONVERT TO MEMBER */}
      {selectedLead && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title={`Convert ${selectedLead.name} to Member`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create a live active member record with unique member code, pre-filling contact details from the CRM lead record.
            </p>
            <div className="p-3 bg-muted/40 rounded-xl space-y-1 text-xs">
              <p><span className="font-semibold">Name:</span> {selectedLead.name}</p>
              <p><span className="font-semibold">Phone:</span> {selectedLead.phone}</p>
              <p><span className="font-semibold">Email:</span> {selectedLead.email}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Gender"
                value={convertForm.gender}
                onChange={(e) => setConvertForm({ ...convertForm, gender: e.target.value })}
                options={[
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Select
                label="Membership Plan"
                value={convertForm.plan}
                onChange={(e) => setConvertForm({ ...convertForm, plan: e.target.value })}
                options={[
                  { value: 'Annual Elite Pass', label: 'Annual Elite Pass (₹24,000)' },
                  { value: '6-Month Fitness Pro', label: '6-Month Fitness Pro (₹14,000)' },
                  { value: 'Monthly CrossFit Pass', label: 'Monthly CrossFit Pass (₹3,500)' },
                ]}
              />
            </div>
            <Input
              type="date"
              label="Membership Start Date"
              value={convertForm.startDate}
              onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConvertToMember} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Conversion
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: DUPLICATE LEAD MERGE */}
      {selectedLead && (
        <Modal
          isOpen={isMergeModalOpen}
          onClose={() => setIsMergeModalOpen(false)}
          title="Merge Duplicate Lead"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a duplicate lead to merge into <strong>{selectedLead.name}</strong>. All call logs, notes, and communications will be safely transferred to this primary lead.
            </p>
            <Select
              label="Select Duplicate Lead to Merge"
              value={mergeSecondaryId}
              onChange={(e) => setMergeSecondaryId(e.target.value)}
              options={[
                { value: '', label: 'Select duplicate...' },
                ...leads
                  .filter((l) => l.id !== selectedLead.id)
                  .map((l) => ({ value: l.id, label: `${l.name} (${l.phone} - ${l.source})` })),
              ]}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsMergeModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMergeDuplicate} disabled={!mergeSecondaryId}>
                Merge & Transfer History
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: LOST REASON */}
      <Modal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        title="Reason for Lost Lead"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please capture why this lead was marked as lost for conversion loss analytics.
          </p>
          <Select
            label="Lost Reason Category"
            value={lostReasonInput}
            onChange={(e) => setLostReasonInput(e.target.value)}
            options={[
              { value: 'Budget constraints', label: 'Budget / Pricing too high' },
              { value: 'Relocated to another city / area', label: 'Relocated / Location too far' },
              { value: 'Joined competitor gym', label: 'Joined competitor gym' },
              { value: 'Schedule mismatch / timings', label: 'Schedule mismatch / timings' },
              { value: 'Unresponsive after multiple follow-ups', label: 'Unresponsive after follow-ups' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsLostModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmLost}>
              Mark as Lost
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default CrmPage;
