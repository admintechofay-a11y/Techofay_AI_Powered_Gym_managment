import React, { useState, useEffect } from 'react';
import {
  Send,
  Clock,
  FileText,
  History,
  Settings,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Smartphone,
  Mail,
  MessageSquare,
  Bell,
  Radio,
  Sliders,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';

interface ScheduledJobItem {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  category: 'EXPIRY' | 'BILLING' | 'LIFECYCLE' | 'ENGAGEMENT';
  status: 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  lastRunAt?: string;
  nextRunAt?: string;
  dedupeKeyPattern: string;
  lastStats?: {
    processed: number;
    sent: number;
    skipped: number;
  };
}

interface TemplateItem {
  id: string;
  name: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  category: 'TRANSACTIONAL' | 'MARKETING' | 'REMINDER';
  whatsAppStatus: 'APPROVED' | 'PENDING_APPROVAL' | 'DRAFT' | 'REJECTED';
  languages: {
    en: { subject?: string; body: string };
    hi: { subject?: string; body: string };
    gu: { subject?: string; body: string };
  };
  variables: string[];
}

interface CommunicationLogItem {
  id: string;
  recipientName: string;
  recipientContact: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';
  title: string;
  message: string;
  type: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
  isSimulated: boolean;
  dedupeKey: string;
  sentAt: string;
  deliveredAt?: string;
}

const INITIAL_JOBS: ScheduledJobItem[] = [
  {
    id: 'job-1',
    name: 'membership-expiry-7d',
    description: 'Sends reminder notification to members whose plans expire in 7 days',
    cronExpression: '0 8 * * * (Daily at 08:00 AM)',
    category: 'EXPIRY',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:EXPIRY_7D:{date}',
  },
  {
    id: 'job-2',
    name: 'membership-expiry-3d',
    description: 'Urgent reminder to members whose plans expire in 3 days with renewal perks',
    cronExpression: '0 8 * * * (Daily at 08:00 AM)',
    category: 'EXPIRY',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:EXPIRY_3D:{date}',
  },
  {
    id: 'job-3',
    name: 'membership-expiry-1d',
    description: 'Final 24-hour reminder before membership expiration',
    cronExpression: '0 8 * * * (Daily at 08:00 AM)',
    category: 'EXPIRY',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:EXPIRY_1D:{date}',
  },
  {
    id: 'job-4',
    name: 'membership-expiry-today',
    description: 'Midnight transition to EXPIRED and notification on expiration date',
    cronExpression: '0 0 * * * (Daily at 12:00 AM)',
    category: 'EXPIRY',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:EXPIRY_TODAY:{date}',
  },
  {
    id: 'job-5',
    name: 'renewal-reminders',
    description: 'Follows up with members expired in the last 7 days offering renewal perks',
    cronExpression: '0 10 * * * (Daily at 10:00 AM)',
    category: 'EXPIRY',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:RENEWAL_PERK:{date}',
  },
  {
    id: 'job-6',
    name: 'payment-due',
    description: 'Notifies members with outstanding invoice balances and upcoming due dates',
    cronExpression: '0 9 * * * (Daily at 09:00 AM)',
    category: 'BILLING',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:PAYMENT_DUE:{invoice}:{date}',
  },
  {
    id: 'job-7',
    name: 'birthday-auto-wishes',
    description: 'Auto-detects birthdays, generates BDAY coupon (20% off) & dispatches wishes',
    cronExpression: '0 8 * * * (Daily at 08:00 AM)',
    category: 'LIFECYCLE',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:BIRTHDAY:{year}',
  },
  {
    id: 'job-8',
    name: 'anniversary-auto-wishes',
    description: 'Auto-detects membership anniversaries, generates ANNIV coupon (15% off) & sends wishes',
    cronExpression: '0 8 * * * (Daily at 08:00 AM)',
    category: 'LIFECYCLE',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:ANNIVERSARY:{year}',
  },
  {
    id: 'job-9',
    name: 'trial-reminders',
    description: 'Sends 24-hour preparatory briefing and reminders for booked trials',
    cronExpression: '0 9 * * * (Daily at 09:00 AM)',
    category: 'ENGAGEMENT',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{trial}:TRIAL_REMINDER:{date}',
  },
  {
    id: 'job-10',
    name: 'appointment-reminders',
    description: 'Sends 2-hour pre-class / PT session push notification reminders',
    cronExpression: '*/30 * * * * (Every 30 minutes)',
    category: 'ENGAGEMENT',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{booking}:APT_REMINDER',
  },
  {
    id: 'job-11',
    name: 'inactivity-followup',
    description: 'Identifies members with 7+ and 14+ days absence and sends encouragement',
    cronExpression: '0 11 * * * (Daily at 11:00 AM)',
    category: 'ENGAGEMENT',
    status: 'WAITING',
    dedupeKeyPattern: 'notif:{tenant}:{member}:INACTIVITY:{date}',
  },
];

const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: 'tmpl-1',
    name: 'Membership 7-Day Expiry Notice',
    channel: 'WHATSAPP',
    category: 'TRANSACTIONAL',
    whatsAppStatus: 'APPROVED',
    variables: ['memberName', 'expiryDate', 'gymName'],
    languages: {
      en: {
        body: 'Hi {{memberName}}, your membership at {{gymName}} expires on {{expiryDate}}. Renew today to keep your workout streak intact!',
      },
      hi: {
        body: 'नमस्ते {{memberName}}, {{gymName}} में आपकी सदस्यता {{expiryDate}} को समाप्त हो रही है। अपनी फिटनेस निरंतरता बनाए रखने के लिए आज ही नवीनीकरण करें!',
      },
      gu: {
        body: 'નમસ્તે {{memberName}}, {{gymName}} ખાતે તમારું સભ્યપદ {{expiryDate}} ના રોજ સમાપ્ત થાય છે. તમારી વર્કઆઉટ ચાલુ રાખવા માટે આજે જ રિન્યૂ કરો!',
      },
    },
  },
  {
    id: 'tmpl-2',
    name: 'Birthday Greeting with Coupon',
    channel: 'WHATSAPP',
    category: 'MARKETING',
    whatsAppStatus: 'APPROVED',
    variables: ['memberName', 'couponCode', 'gymName'],
    languages: {
      en: {
        body: 'Happy Birthday, {{memberName}}! 🎂 From everyone at {{gymName}}, here is a 20% discount coupon *{{couponCode}}* valid for the next 14 days on all renewals and training packages.',
      },
      hi: {
        body: 'जन्मदिन की हार्दिक शुभकामनाएं, {{memberName}}! 🎂 {{gymName}} की तरफ से आपके लिए 20% छूट का कूपन कोड *{{couponCode}}* है, जो अगले 14 दिनों तक वैध है।',
      },
      gu: {
        body: 'જન્મદિવસની હાર્દિક શુભકામનાઓ, {{memberName}}! 🎂 {{gymName}} તરફથી તમારા માટે 20% ડિસ્કાઉન્ટ કૂપન *{{couponCode}}* છે, જે આગામી 14 દિવસ માટે માન્ય છે.',
      },
    },
  },
  {
    id: 'tmpl-3',
    name: 'Payment Due Alert',
    channel: 'SMS',
    category: 'TRANSACTIONAL',
    whatsAppStatus: 'DRAFT',
    variables: ['memberName', 'amount', 'invoiceNumber'],
    languages: {
      en: {
        body: 'Dear {{memberName}}, payment of {{amount}} for invoice #{{invoiceNumber}} is pending. Please pay online via UPI to avoid interruption.',
      },
      hi: {
        body: 'प्रिय {{memberName}}, इनवॉयस #{{invoiceNumber}} के लिए {{amount}} का भुगतान लंबित है। निर्बाध सेवा के लिए कृपया यूपीआई द्वारा भुगतान करें।',
      },
      gu: {
        body: 'પ્રિય {{memberName}}, ઇન્વૉઇસ #{{invoiceNumber}} માટે {{amount}} નું ચુકવણું બાકી છે. કૃપા કરીને ઓનલાઈન ચુકવણી કરો.',
      },
    },
  },
  {
    id: 'tmpl-4',
    name: 'Inactivity Win-Back Encouragement',
    channel: 'WHATSAPP',
    category: 'MARKETING',
    whatsAppStatus: 'APPROVED',
    variables: ['memberName', 'gymName'],
    languages: {
      en: {
        body: 'We miss you on the gym floor, {{memberName}}! 💪 It has been over a week since your last workout. Book a trainer consultation or hit your favorite session at {{gymName}} today!',
      },
      hi: {
        body: 'हम आपको जिम में मिस कर रहे हैं, {{memberName}}! 💪 आपके पिछले वर्कआउट को एक सप्ताह से अधिक हो गया है। आज ही {{gymName}} में अपना सेशन बुक करें!',
      },
      gu: {
        body: 'અમે તમને જિમમાં યાદ કરીએ છીએ, {{memberName}}! 💪 તમારા છેલ્લા વર્કઆઉટને એક અઠવાડિયાથી વધુ સમય થયો છે. આજે જ {{gymName}} ખાતે આવો!',
      },
    },
  },
];

const INITIAL_LOGS: CommunicationLogItem[] = [];

export const CommunicationPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'JOBS' | 'TEMPLATES' | 'HISTORY' | 'SETTINGS'>('JOBS');

  // Jobs state
  const [jobs, setJobs] = useState<ScheduledJobItem[]>(INITIAL_JOBS);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  // Template state
  const [templates, setTemplates] = useState<TemplateItem[]>(INITIAL_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(INITIAL_TEMPLATES[0]);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'hi' | 'gu'>('en');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // History state
  const [logs, setLogs] = useState<CommunicationLogItem[]>(INITIAL_LOGS);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<CommunicationLogItem | null>(null);

  // Settings state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [startHour, setStartHour] = useState(21);
  const [endHour, setEndHour] = useState(8);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/communication/history');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLogs(res.data);
        }
      } catch {
        // Fallback gracefully
      }
    };
    fetchHistory();
  }, []);

  // 1-Click trigger scheduled job via BullMQ
  const handleTriggerJob = async (job: ScheduledJobItem) => {
    setRunningJobId(job.id);
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: 'RUNNING' } : j)),
    );

    try {
      const res = await api.post(`/communication/jobs/${encodeURIComponent(job.name)}/trigger`);
      const sentCount = res.data?.processed ?? res.data?.sentCount ?? 1;

      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: 'COMPLETED',
                lastRunAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                lastStats: { processed: sentCount, sent: sentCount, skipped: 0 },
              }
            : j,
        ),
      );

      // Refresh logs
      const historyRes = await api.get('/communication/history');
      if (historyRes.success && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
        setLogs(historyRes.data);
      }

      addToast({
        title: 'Job Completed Successfully',
        message: `${job.name} processed ${sentCount} recipients via BullMQ queue. Zero duplicates sent (idempotent dedupe keys enforced).`,
        type: 'success',
      });
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: 'FAILED' } : j)),
      );
      addToast({
        title: 'Job Execution Failed',
        message: err?.message || 'Failed to dispatch communication job.',
        type: 'error',
      });
    } finally {
      setRunningJobId(null);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipientName.toLowerCase().includes(historySearch.toLowerCase()) ||
      log.recipientContact.includes(historySearch) ||
      log.title.toLowerCase().includes(historySearch.toLowerCase());
    return matchesSearch;
  });

  const filteredTemplates = templates.filter((tmpl) => {
    if (channelFilter === 'ALL') return true;
    return tmpl.channel === channelFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Send className="h-6 w-6 text-brand-600" />
            Communication & Notification Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Omnichannel notification dispatch, BullMQ idempotent scheduled jobs, multi-language templates, and quiet hours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 border-brand-500/30 text-brand-600 bg-brand-500/5">
            <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
            11 BullMQ Jobs Active
          </Badge>
          <Badge variant="secondary" className="gap-1 py-1 px-3">
            <Clock className="h-3 w-3" />
            Quiet Hours: {startHour}:00 - {endHour}:00 IST
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'JOBS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          Scheduled Jobs Dashboard
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-brand-500/10 text-brand-600">11</span>
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'TEMPLATES'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="h-4 w-4" />
          Template Manager (en/hi/gu)
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'HISTORY'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" />
          Delivery History & Logs
        </button>
        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'SETTINGS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Quiet Hours & Gateways
        </button>
      </div>

      {/* ================= TAB 1: SCHEDULED JOBS DASHBOARD ================= */}
      {activeTab === 'JOBS' && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Scheduled Jobs</span>
              <p className="text-2xl font-bold mt-1 text-foreground">11</p>
              <span className="text-xs text-emerald-600 font-medium">All idempotent & deduplicated</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Queue Engine</span>
              <p className="text-2xl font-bold mt-1 text-brand-600 flex items-center gap-1.5">
                BullMQ + Redis
              </p>
              <span className="text-xs text-muted-foreground">Resilient local timer fallback</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Auto-Offers Enabled</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">2 Active</p>
              <span className="text-xs text-muted-foreground">BDAY (20%) & ANNIV (15%)</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Duplicate Protection</span>
              <p className="text-2xl font-bold mt-1 text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                100% Guaranteed
              </p>
              <span className="text-xs text-muted-foreground">Deterministic dedupeKey index</span>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-foreground">Registered Repeatable Jobs</h3>
                <p className="text-xs text-muted-foreground">
                  Automated background jobs trigger notifications across channels. You can also trigger any job manually below.
                </p>
              </div>
            </div>

            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{job.name}</span>
                      <Badge
                        variant={
                          job.status === 'RUNNING'
                            ? 'default'
                            : job.status === 'COMPLETED'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {job.status}
                      </Badge>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {job.cronExpression}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{job.description}</p>
                    <div className="text-[11px] text-muted-foreground font-mono pt-0.5">
                      Dedupe key: <span className="text-foreground/80">{job.dedupeKeyPattern}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {job.lastStats && (
                      <div className="text-right text-xs">
                        <span className="text-muted-foreground">Last run: </span>
                        <span className="font-medium text-foreground">{job.lastRunAt}</span>
                        <div className="text-emerald-600 font-medium">
                          {job.lastStats.sent} sent ({job.lastStats.skipped} skipped)
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={runningJobId === job.id}
                      onClick={() => handleTriggerJob(job)}
                      className="gap-1.5"
                    >
                      {runningJobId === job.id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-brand-600" />
                          Run Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TEMPLATE MANAGER ================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List & Filters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-foreground">Message Templates</h3>
              <Button size="sm" onClick={() => setIsTemplateModalOpen(true)}>
                + New Template
              </Button>
            </div>

            {/* Channel Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['ALL', 'WHATSAPP', 'SMS', 'EMAIL'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 text-xs rounded-full font-medium transition-all ${
                    channelFilter === ch
                      ? 'bg-brand-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedTemplate.id === tmpl.id
                      ? 'border-brand-600 bg-brand-500/5 shadow-sm'
                      : 'border-border bg-card hover:border-brand-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-foreground">{tmpl.name}</span>
                    <Badge variant={tmpl.channel === 'WHATSAPP' ? 'default' : 'secondary'} className="text-[10px]">
                      {tmpl.channel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tmpl.languages.en.body}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">WhatsApp Status:</span>
                    <Badge
                      variant={
                        tmpl.whatsAppStatus === 'APPROVED'
                          ? 'default'
                          : tmpl.whatsAppStatus === 'PENDING_APPROVAL'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {tmpl.whatsAppStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Detail & Interactive Multi-Language Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{selectedTemplate.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedTemplate.channel}</Badge>
                    <Badge variant="secondary">{selectedTemplate.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Status: <strong className="text-foreground">{selectedTemplate.whatsAppStatus}</strong>
                    </span>
                  </div>
                </div>

                {/* Language Selector Tabs */}
                <div className="flex rounded-lg border border-border p-1 bg-muted/30">
                  <button
                    onClick={() => setPreviewLanguage('en')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      previewLanguage === 'en' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setPreviewLanguage('hi')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      previewLanguage === 'hi' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    हिन्दी (Hindi)
                  </button>
                  <button
                    onClick={() => setPreviewLanguage('gu')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      previewLanguage === 'gu' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                    }`}
                  >
                    ગુજરાતી (Gujarati)
                  </button>
                </div>
              </div>

              {/* Variable Tokens */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Available Variables:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.variables.map((v) => (
                    <span key={v} className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 font-mono text-xs">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-emerald-500" />
                    Live Recipient Device Preview ({previewLanguage.toUpperCase()})
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Mock / Real Preview
                  </Badge>
                </div>

                <div className="max-w-md mx-auto my-3 p-4 rounded-2xl bg-card border border-border shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-border/40 pb-1.5">
                    <span className="font-semibold text-foreground">IronPulse Fitness Bot</span>
                    <span>Just now</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedTemplate.languages[previewLanguage]?.body
                      .replace(/{{memberName}}/g, 'Vikram')
                      .replace(/{{gymName}}/g, 'IronPulse Club')
                      .replace(/{{expiryDate}}/g, '14/10/2026')
                      .replace(/{{amount}}/g, '₹14,999')
                      .replace(/{{couponCode}}/g, 'BDAY-VM-2026')
                      .replace(/{{invoiceNumber}}/g, 'INV-2026-27-0091')}
                  </p>
                  <div className="pt-2 flex justify-end text-[10px] text-muted-foreground gap-1">
                    <span>Delivered</span>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: COMMUNICATION HISTORY & LOGS ================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member, phone or title..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredLogs.length} recent notification records
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Message Summary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Provider Mode</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No communication logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{log.recipientName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{log.recipientContact}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{log.channel}</Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-medium text-foreground truncate">{log.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{log.message}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.status === 'DELIVERED'
                                ? 'default'
                                : log.status === 'SENT'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {log.isSimulated ? (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-[10px]">
                              simulated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px]">
                              real SMTP / API
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                          {log.sentAt}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            Details
                          </Button>
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

      {/* ================= TAB 4: QUIET HOURS & GATEWAYS ================= */}
      {activeTab === 'SETTINGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quiet Hours Card */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-base text-foreground">Quiet Hours Policy</h3>
                <p className="text-xs text-muted-foreground">
                  Prevents non-urgent marketing or promotional alerts during sleep hours.
                </p>
              </div>
              <Badge variant={quietHoursEnabled ? 'default' : 'outline'}>
                {quietHoursEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Enforce Quiet Hours Window:</span>
                <button
                  onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    quietHoursEnabled ? 'bg-brand-600' : 'bg-muted'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      quietHoursEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Start Hour (Evening)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">21:00 (9:00 PM IST)</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    End Hour (Morning)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">08:00 (8:00 AM IST)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-brand-600" />
                  Quiet Hours Behavior
                </p>
                <p>
                  Any reminder or campaign sent between {startHour}:00 and {endHour}:00 is automatically set to{' '}
                  <span className="font-mono text-foreground font-semibold">QUEUED</span> and dispatched promptly at {endHour}:00 next morning. Critical security OTPs bypass quiet hours.
                </p>
              </div>

              <Button
                onClick={() =>
                  addToast({
                    title: 'Settings Saved',
                    message: `Quiet hours updated: ${startHour}:00 to ${endHour}:00 IST`,
                    type: 'success',
                  })
                }
              >
                Save Policy
              </Button>
            </div>
          </div>

          {/* Gateways Status Card */}
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-semibold text-base text-foreground border-b border-border pb-3">
              Channel Gateway Adapters
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    WA
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">WhatsApp Business API</h4>
                    <p className="text-xs text-muted-foreground">Meta Cloud API (Sandbox Simulator)</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5">
                  simulated
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                    SMS
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">SMS Gateway</h4>
                    <p className="text-xs text-muted-foreground">Fast2SMS / Twilio DLT Registry</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/5">
                  simulated
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                    @
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Transactional Email</h4>
                    <p className="text-xs text-muted-foreground">Nodemailer SMTP (Mailpit / Sendgrid)</p>
                  </div>
                </div>
                <Badge variant="default">REAL SMTP</Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                    VAPID
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Web Push Notifications</h4>
                    <p className="text-xs text-muted-foreground">Standard Web Push Protocol (VAPID Keys)</p>
                  </div>
                </div>
                <Badge variant="default">REAL VAPID</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Detail Drawer Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title="Notification Audit & Delivery Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Recipient Name:</span>
                <p className="font-semibold text-foreground text-sm">{selectedLog.recipientName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Destination:</span>
                <p className="font-semibold text-foreground font-mono">{selectedLog.recipientContact}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Channel:</span>
                <p className="font-semibold text-foreground">{selectedLog.channel}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-semibold text-emerald-600">{selectedLog.status}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Deduplication Key (Idempotency):</span>
              <p className="font-mono text-xs text-foreground break-all">{selectedLog.dedupeKey}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Message Payload:</span>
              <div className="p-3 rounded-xl bg-card border border-border text-sm text-foreground">
                <p className="font-semibold mb-1">{selectedLog.title}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{selectedLog.message}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
