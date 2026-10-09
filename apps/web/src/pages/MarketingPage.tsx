import React, { useState } from 'react';
import {
  Megaphone,
  Users,
  GitBranch,
  Gift,
  Plus,
  Play,
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart2,
  Calendar,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  Tag,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { useToast } from '../components/ui/Toast.js';

interface CampaignItem {
  id: string;
  name: string;
  type: 'WELCOME' | 'RENEWAL' | 'WIN_BACK' | 'FESTIVAL' | 'REFERRAL' | 'TRIAL' | 'BIRTHDAY';
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT';
  abTestingEnabled: boolean;
  variants: Array<{
    variantId: 'A' | 'B';
    subject?: string;
    body: string;
    percentage: number;
  }>;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  revenueInPaise: number;
  createdAt: string;
}

interface SegmentItem {
  id: string;
  name: string;
  description: string;
  estimatedCount: number;
  criteria: {
    membershipStatus?: string[];
    minAge?: number;
    maxAge?: number;
    inactivityDays?: number;
    fitnessGoals?: string[];
  };
}

interface AutomationRuleItem {
  id: string;
  name: string;
  trigger: string;
  conditionDescription: string;
  actionDescription: string;
  actionType: 'SEND_WHATSAPP' | 'SEND_SMS' | 'SEND_EMAIL' | 'CREATE_COUPON';
  isActive: boolean;
  executionCount: number;
  lastRunAt?: string;
}

interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  validUntil: string;
  usageCount: number;
  usageLimit: number;
  isActive: boolean;
  type: 'BIRTHDAY' | 'ANNIVERSARY' | 'FESTIVAL' | 'PROMO';
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'camp-1',
    name: 'Diwali Fitness Fest 2026',
    type: 'FESTIVAL',
    channel: 'WHATSAPP',
    status: 'SENT',
    abTestingEnabled: true,
    variants: [
      {
        variantId: 'A',
        subject: 'Diwali Flat 30% Off',
        body: 'Celebrate Diwali with flat 30% off on all annual pass renewals!',
        percentage: 50,
      },
      {
        variantId: 'B',
        subject: 'Festive 3 Free Months',
        body: 'Renew for 12 months and receive 3 bonus months completely free!',
        percentage: 50,
      },
    ],
    sentCount: 180,
    deliveredCount: 176,
    openedCount: 132,
    clickedCount: 68,
    convertedCount: 26,
    revenueInPaise: 39000000, // ₹3,90,000
    createdAt: '2026-10-02',
  },
  {
    id: 'camp-2',
    name: 'Churn Win-Back (Absent 14+ Days)',
    type: 'WIN_BACK',
    channel: 'WHATSAPP',
    status: 'SENT',
    abTestingEnabled: false,
    variants: [
      {
        variantId: 'A',
        body: 'We miss you, {{memberName}}! Drop in this week for a complimentary personal training session on us.',
        percentage: 100,
      },
    ],
    sentCount: 45,
    deliveredCount: 44,
    openedCount: 35,
    clickedCount: 19,
    convertedCount: 8,
    revenueInPaise: 12000000, // ₹1,20,000
    createdAt: '2026-10-04',
  },
  {
    id: 'camp-3',
    name: 'New Member Welcome & Nutrition Kickoff',
    type: 'WELCOME',
    channel: 'EMAIL',
    status: 'SENT',
    abTestingEnabled: false,
    variants: [
      {
        variantId: 'A',
        subject: 'Welcome to IronPulse - Your Transformation Starts Here',
        body: 'Access your complimentary diet consultation and claim your gym kit at reception.',
        percentage: 100,
      },
    ],
    sentCount: 60,
    deliveredCount: 59,
    openedCount: 48,
    clickedCount: 28,
    convertedCount: 14,
    revenueInPaise: 21000000,
    createdAt: '2026-10-06',
  },
];

const INITIAL_SEGMENTS: SegmentItem[] = [
  {
    id: 'seg-1',
    name: 'High-Value Annual Members',
    description: 'Active members on annual tier with frequent check-ins',
    estimatedCount: 84,
    criteria: { membershipStatus: ['ACTIVE'], fitnessGoals: ['Hypertrophy', 'Strength'] },
  },
  {
    id: 'seg-2',
    name: 'At-Risk Churn (Inactive > 14 Days)',
    description: 'Members with zero turnstile check-ins over the past 2 weeks',
    estimatedCount: 28,
    criteria: { membershipStatus: ['ACTIVE'], inactivityDays: 14 },
  },
  {
    id: 'seg-3',
    name: 'Young Athletes (18-25 Years)',
    description: 'Gen-Z members engaged in high-intensity CrossFit programs',
    estimatedCount: 62,
    criteria: { minAge: 18, maxAge: 25, fitnessGoals: ['CrossFit'] },
  },
  {
    id: 'seg-4',
    name: 'Expired Members (Past 30 Days)',
    description: 'Past members eligible for reactivation win-back discounts',
    estimatedCount: 35,
    criteria: { membershipStatus: ['EXPIRED'] },
  },
];

const INITIAL_RULES: AutomationRuleItem[] = [
  {
    id: 'rule-1',
    name: '7-Day Membership Expiry Followup',
    trigger: 'MEMBERSHIP_EXPIRING_7_DAYS',
    conditionDescription: 'Plan duration >= 90 days and remaining days == 7',
    actionDescription: 'Send WhatsApp template with renewal portal link',
    actionType: 'SEND_WHATSAPP',
    isActive: true,
    executionCount: 54,
    lastRunAt: '2026-10-07 08:00',
  },
  {
    id: 'rule-2',
    name: 'Birthday Auto-Offer with Coupon',
    trigger: 'BIRTHDAY_TODAY',
    conditionDescription: 'Member DOB matches today (Month & Day)',
    actionDescription: 'Auto-create coupon BDAY-XXX (20% off) & send WhatsApp',
    actionType: 'CREATE_COUPON',
    isActive: true,
    executionCount: 12,
    lastRunAt: '2026-10-07 08:00',
  },
  {
    id: 'rule-3',
    name: '1-Year Member Anniversary Milestone',
    trigger: 'ANNIVERSARY_TODAY',
    conditionDescription: 'Member Join Date matches today (1+ year)',
    actionDescription: 'Auto-create coupon ANNIV-XXX (15% off) & send congratulations',
    actionType: 'CREATE_COUPON',
    isActive: true,
    executionCount: 8,
    lastRunAt: '2026-10-07 08:00',
  },
  {
    id: 'rule-4',
    name: 'Inactivity Win-Back Notice (7 Days)',
    trigger: 'ATTENDANCE_INACTIVE_7_DAYS',
    conditionDescription: 'Active member with no check-in for 7 consecutive days',
    actionDescription: 'Send WhatsApp encouragement to book a class',
    actionType: 'SEND_WHATSAPP',
    isActive: true,
    executionCount: 38,
    lastRunAt: '2026-10-07 11:00',
  },
];

const INITIAL_COUPONS: CouponItem[] = [
  {
    id: 'coup-1',
    code: 'BDAY-MEM001-2026',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    validUntil: '2026-10-21',
    usageCount: 0,
    usageLimit: 1,
    isActive: true,
    type: 'BIRTHDAY',
  },
  {
    id: 'coup-2',
    code: 'ANNIV-MEM004-2026',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    validUntil: '2026-11-06',
    usageCount: 1,
    usageLimit: 1,
    isActive: false,
    type: 'ANNIVERSARY',
  },
  {
    id: 'coup-3',
    code: 'DIWALI30',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    validUntil: '2026-11-15',
    usageCount: 26,
    usageLimit: 100,
    isActive: true,
    type: 'FESTIVAL',
  },
];

export const MarketingPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'SEGMENTS' | 'RULES' | 'COUPONS'>('CAMPAIGNS');

  // Campaign State
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(INITIAL_CAMPAIGNS);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'FESTIVAL',
    channel: 'WHATSAPP',
    abTestingEnabled: false,
    variantA: '',
    variantB: '',
  });

  // Segmentation State
  const [segments, setSegments] = useState<SegmentItem[]>(INITIAL_SEGMENTS);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [segmentFilters, setSegmentFilters] = useState({
    status: 'ACTIVE',
    minAge: '',
    maxAge: '',
    inactivityDays: '',
    fitnessGoal: 'ALL',
  });

  // Rules State
  const [rules, setRules] = useState<AutomationRuleItem[]>(INITIAL_RULES);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);

  // Coupons State
  const [coupons, setCoupons] = useState<CouponItem[]>(INITIAL_COUPONS);

  // Live audience aggregation calculator
  const handleCalculateAudience = () => {
    setIsCalculating(true);
    setTimeout(() => {
      // Simulate indexed aggregation query on Member collection
      let baseCount = 200;
      if (segmentFilters.status === 'EXPIRED') baseCount = 45;
      if (segmentFilters.fitnessGoal !== 'ALL') baseCount = Math.round(baseCount * 0.45);
      if (segmentFilters.inactivityDays) baseCount = Math.round(baseCount * 0.25);
      if (segmentFilters.minAge) baseCount = Math.round(baseCount * 0.65);

      setLiveCount(Math.max(12, baseCount));
      setIsCalculating(false);
      addToast({
        title: 'Audience Aggregated',
        message: `Indexed query matched ${Math.max(12, baseCount)} active member records.`,
        type: 'info',
      });
    }, 450);
  };

  // Launch Campaign
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name || !campaignForm.variantA) {
      addToast({ title: 'Validation Error', message: 'Name and message are required', type: 'error' });
      return;
    }

    const newCamp: CampaignItem = {
      id: `camp-${Date.now()}`,
      name: campaignForm.name,
      type: campaignForm.type as any,
      channel: campaignForm.channel as any,
      status: 'SENT',
      abTestingEnabled: campaignForm.abTestingEnabled,
      variants: [
        { variantId: 'A', body: campaignForm.variantA, percentage: campaignForm.abTestingEnabled ? 50 : 100 },
        ...(campaignForm.abTestingEnabled
          ? [{ variantId: 'B' as const, body: campaignForm.variantB || campaignForm.variantA, percentage: 50 }]
          : []),
      ],
      sentCount: 110,
      deliveredCount: 108,
      openedCount: 78,
      clickedCount: 42,
      convertedCount: 16,
      revenueInPaise: 24000000,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsCampaignModalOpen(false);
    addToast({
      title: 'Campaign Launched!',
      message: `${newCamp.name} dispatched to 110 recipients. Tracking live conversions.`,
      type: 'success',
    });
  };

  // Test automation rule
  const handleTestRule = (ruleId: string) => {
    setTestingRuleId(ruleId);
    setTimeout(() => {
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? { ...r, executionCount: r.executionCount + 1, lastRunAt: new Date().toISOString().substring(0, 16) }
            : r,
        ),
      );
      setTestingRuleId(null);
      addToast({
        title: 'Rule Executed',
        message: 'Conditions evaluated successfully against active members. Action dispatched.',
        type: 'success',
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-brand-600" />
            Marketing, Campaigns & Automations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build high-converting A/B campaigns, live audience segment aggregation, event-driven rules, and coupon offers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCampaignModalOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'CAMPAIGNS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Campaigns & Reports
        </button>
        <button
          onClick={() => setActiveTab('SEGMENTS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'SEGMENTS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Live Audience Segmentation
        </button>
        <button
          onClick={() => setActiveTab('RULES')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'RULES'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />
          Automation Workflows
        </button>
        <button
          onClick={() => setActiveTab('COUPONS')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'COUPONS'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gift className="h-4 w-4" />
          Birthday & Anniversary Coupons
        </button>
      </div>

      {/* ================= TAB 1: CAMPAIGNS & PERFORMANCE REPORTS ================= */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-6">
          {/* Executive KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Campaigns</span>
              <p className="text-2xl font-bold mt-1 text-foreground">{campaigns.length}</p>
              <span className="text-xs text-emerald-600 font-medium">Multi-channel delivery</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Avg Open Rate</span>
              <p className="text-2xl font-bold mt-1 text-brand-600">76.4%</p>
              <span className="text-xs text-muted-foreground">WhatsApp & Email tracked</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Conversions</span>
              <p className="text-2xl font-bold mt-1 text-emerald-600">48 Members</p>
              <span className="text-xs text-muted-foreground">Direct campaign attribution</span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-card">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Revenue Attributed</span>
              <p className="text-2xl font-bold mt-1 text-foreground">₹7,20,000</p>
              <span className="text-xs text-emerald-600 font-medium">ROI 18.4x</span>
            </div>
          </div>

          {/* Campaign Cards List */}
          <div className="space-y-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-base text-foreground">{camp.name}</h3>
                    <Badge variant="outline">{camp.type}</Badge>
                    <Badge variant={camp.channel === 'WHATSAPP' ? 'default' : 'secondary'}>{camp.channel}</Badge>
                    {camp.abTestingEnabled && (
                      <Badge variant="outline" className="border-purple-500/40 text-purple-600 bg-purple-500/10">
                        A/B Split Test
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Launched: <span className="font-medium text-foreground">{camp.createdAt}</span>
                  </div>
                </div>

                {/* Conversion Funnel Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground block">Sent</span>
                    <strong className="text-base font-bold text-foreground">{camp.sentCount}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground block">Delivered</span>
                    <strong className="text-base font-bold text-foreground">{camp.deliveredCount}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground block">Opened</span>
                    <strong className="text-base font-bold text-brand-600">
                      {camp.openedCount} ({Math.round((camp.openedCount / camp.deliveredCount) * 100)}%)
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30">
                    <span className="text-xs text-muted-foreground block">Clicked</span>
                    <strong className="text-base font-bold text-foreground">
                      {camp.clickedCount} ({Math.round((camp.clickedCount / camp.openedCount) * 100)}%)
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-xs text-emerald-600 block font-medium">Converted</span>
                    <strong className="text-base font-bold text-emerald-600">{camp.convertedCount}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20">
                    <span className="text-xs text-brand-600 block font-medium">Revenue</span>
                    <strong className="text-base font-bold text-brand-600">
                      ₹{(camp.revenueInPaise / 100).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Variants preview if A/B testing */}
                {camp.abTestingEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {camp.variants.map((v) => (
                      <div key={v.variantId} className="p-3 rounded-xl border border-border/80 bg-muted/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>Variant {v.variantId} ({v.percentage}%)</span>
                          {v.subject && <span className="text-muted-foreground">{v.subject}</span>}
                        </div>
                        <p className="text-muted-foreground italic">"{v.body}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: LIVE AUDIENCE SEGMENTATION ================= */}
      {activeTab === 'SEGMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segment Builder & Aggregation Filter */}
          <div className="lg:col-span-1 p-5 rounded-2xl border border-border bg-card space-y-4">
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <Filter className="h-4 w-4 text-brand-600" />
              Live Segment Filter
            </h3>
            <p className="text-xs text-muted-foreground">
              Define criteria to query the member database using real-time indexed aggregation.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Membership Status
                </label>
                <select
                  value={segmentFilters.status}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, status: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="ACTIVE">Active Members</option>
                  <option value="EXPIRED">Expired Members</option>
                  <option value="FROZEN">Frozen Plans</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Min Age</label>
                  <Input
                    placeholder="18"
                    type="number"
                    value={segmentFilters.minAge}
                    onChange={(e) => setSegmentFilters({ ...segmentFilters, minAge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Max Age</label>
                  <Input
                    placeholder="45"
                    type="number"
                    value={segmentFilters.maxAge}
                    onChange={(e) => setSegmentFilters({ ...segmentFilters, maxAge: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Inactivity Cutoff (Days Absent)
                </label>
                <Input
                  placeholder="e.g. 14 days"
                  type="number"
                  value={segmentFilters.inactivityDays}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, inactivityDays: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Fitness Goal
                </label>
                <select
                  value={segmentFilters.fitnessGoal}
                  onChange={(e) => setSegmentFilters({ ...segmentFilters, fitnessGoal: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="ALL">All Goals</option>
                  <option value="Weight Loss">Weight Loss & Fat Burn</option>
                  <option value="Hypertrophy">Hypertrophy & Muscle Gain</option>
                  <option value="CrossFit">CrossFit & High Intensity</option>
                  <option value="Strength">Powerlifting & Strength</option>
                </select>
              </div>

              <Button
                onClick={handleCalculateAudience}
                disabled={isCalculating}
                className="w-full gap-2"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Querying MongoDB Indexes...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Calculate Live Audience Size
                  </>
                )}
              </Button>

              {liveCount !== null && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <span className="text-xs text-muted-foreground block">Estimated Reach:</span>
                  <p className="text-3xl font-extrabold text-emerald-600">{liveCount} Members</p>
                  <span className="text-[11px] text-muted-foreground">Ready for targeted campaign delivery</span>
                </div>
              )}
            </div>
          </div>

          {/* Saved Audience Segments */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-base text-foreground">Saved Segments Catalog</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {segments.map((seg) => (
                <div key={seg.id} className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-sm hover:border-brand-500/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">{seg.name}</h4>
                    <Badge variant="secondary">{seg.estimatedCount} Members</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addToast({
                          title: 'Segment Selected',
                          message: `Targeting ${seg.name} (${seg.estimatedCount} members)`,
                          type: 'info',
                        });
                      }}
                    >
                      Use in Campaign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AUTOMATION WORKFLOWS ================= */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-foreground">Event-Driven Automation Workflows</h3>
              <p className="text-xs text-muted-foreground">
                Rules continuously evaluate triggers against gym events to send messages or create coupons.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-600" />
                    <span className="font-bold text-sm text-foreground">{rule.name}</span>
                  </div>
                  <Badge variant={rule.isActive ? 'default' : 'outline'}>
                    {rule.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/30">
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">Trigger</span>
                    <span className="font-mono text-foreground">{rule.trigger}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/30">
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">Condition</span>
                    <span className="text-foreground">{rule.conditionDescription}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/30">
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">Action</span>
                    <span className="text-foreground">{rule.actionDescription}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Executed: <strong className="text-foreground">{rule.executionCount} times</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={testingRuleId === rule.id}
                    onClick={() => handleTestRule(rule.id)}
                    className="gap-1.5"
                  >
                    {testingRuleId === rule.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-brand-600" />
                    )}
                    Test Rule Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: COUPONS & AUTO-OFFERS ================= */}
      {activeTab === 'COUPONS' && (
        <div className="space-y-6">
          {/* Coupon Policy Banner */}
          <div className="p-5 rounded-2xl border border-brand-500/30 bg-brand-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-brand-600 flex items-center gap-2">
                <Gift className="h-5 w-5 text-brand-600" />
                Automated Milestone Coupons Engine
              </h3>
              <p className="text-xs text-muted-foreground max-w-xl">
                The notification scheduler automatically generates unique one-time coupon codes for members on their Birthday (20% off) and Gym Join Anniversary (15% off).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const testCode = `BDAY-TEST-${Date.now().toString().slice(-4)}`;
                setCoupons([
                  {
                    id: `coup-${Date.now()}`,
                    code: testCode,
                    discountType: 'PERCENTAGE',
                    discountValue: 20,
                    validUntil: '2026-10-21',
                    usageCount: 0,
                    usageLimit: 1,
                    isActive: true,
                    type: 'BIRTHDAY',
                  },
                  ...coupons,
                ]);
                addToast({
                  title: 'Coupon Issued',
                  message: `Generated test coupon: ${testCode}`,
                  type: 'success',
                });
              }}
            >
              + Generate Test Birthday Coupon
            </Button>
          </div>

          {/* Coupons Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Coupon Code</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Discount Value</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{c.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{c.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">
                      {c.discountValue}% OFF
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{c.validUntil}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.usageCount} / {c.usageLimit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.isActive ? 'default' : 'outline'}>
                        {c.isActive ? 'Active' : 'Redeemed / Expired'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {isCampaignModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCampaignModalOpen(false)}
          title="Build New Omnichannel Campaign"
        >
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Campaign Name
              </label>
              <Input
                placeholder="e.g. Diwali Super Renewal Blitz"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Campaign Type
                </label>
                <select
                  value={campaignForm.type}
                  onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="FESTIVAL">Festival Special</option>
                  <option value="RENEWAL">Renewal Offer</option>
                  <option value="WIN_BACK">Win-Back Churn</option>
                  <option value="WELCOME">New Member Welcome</option>
                  <option value="REFERRAL">Referral Blitz</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Channel Gateway
                </label>
                <select
                  value={campaignForm.channel}
                  onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="WHATSAPP">WhatsApp Business API</option>
                  <option value="SMS">SMS Gateway</option>
                  <option value="EMAIL">SMTP Email</option>
                  <option value="PUSH">Web Push (VAPID)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-xs font-semibold text-foreground">Enable A/B Message Testing:</span>
              <input
                type="checkbox"
                checked={campaignForm.abTestingEnabled}
                onChange={(e) => setCampaignForm({ ...campaignForm, abTestingEnabled: e.target.checked })}
                className="rounded text-brand-600 h-4 w-4"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {campaignForm.abTestingEnabled ? 'Variant A Message (50% Traffic)' : 'Message Content'}
              </label>
              <textarea
                rows={3}
                placeholder="Hi {{memberName}}, celebrate with exclusive membership perks..."
                value={campaignForm.variantA}
                onChange={(e) => setCampaignForm({ ...campaignForm, variantA: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                required
              />
            </div>

            {campaignForm.abTestingEnabled && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Variant B Message (50% Traffic)
                </label>
                <textarea
                  rows={3}
                  placeholder="Hi {{memberName}}, alternate hook or discount offer..."
                  value={campaignForm.variantB}
                  onChange={(e) => setCampaignForm({ ...campaignForm, variantB: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" type="button" onClick={() => setIsCampaignModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Launch Campaign</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
