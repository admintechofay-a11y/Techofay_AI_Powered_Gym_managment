import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Activity,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  LogIn,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  FileText,
  ToggleLeft,
  ToggleRight,
  Send,
  Zap,
} from 'lucide-react';
import { api } from '../services/api.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton.js';

interface TenantItem {
  _id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
  contactEmail: string;
  contactPhone: string;
  trialEndsAt?: string;
  metrics: {
    memberCount: number;
    branchCount: number;
    planTier: string;
    subscriptionStatus: string;
  };
}

interface PlatformMetrics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    totalMembers: number;
    totalBranches: number;
  };
  revenue: {
    mrrFormatted: string;
    arrFormatted: string;
    activePaidSubscriptions: number;
  };
  tierBreakdown: {
    starter: number;
    professional: number;
    enterprise: number;
  };
}

const INITIAL_TENANTS: TenantItem[] = [];

const INITIAL_METRICS: PlatformMetrics = {
  overview: {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    totalMembers: 0,
    totalBranches: 0,
  },
  revenue: {
    mrrFormatted: '₹0',
    arrFormatted: '₹0',
    activePaidSubscriptions: 0,
  },
  tierBreakdown: {
    starter: 0,
    professional: 0,
    enterprise: 0,
  },
};

export const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenants' | 'revenue' | 'limits' | 'tickets' | 'audit'>('tenants');
  const [tenants, setTenants] = useState<TenantItem[]>(INITIAL_TENANTS);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(INITIAL_METRICS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);
  const [impersonationMsg, setImpersonationMsg] = useState('');

  // Onboarding Form State
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    subdomain: '',
    tier: 'PROFESSIONAL',
    billingCycle: 'MONTHLY',
    contactEmail: '',
    contactPhone: '',
    trialDays: 14,
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    branchName: '',
    branchCode: '',
    branchAddress: '',
    branchCity: 'Mumbai',
    branchState: 'Maharashtra',
    branchPincode: '400001',
    branchPhone: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tenantsRes, metricsRes] = await Promise.all([
        api.get<any>('/super-admin/tenants'),
        api.get<any>('/super-admin/metrics'),
      ]);

      if (tenantsRes.success && tenantsRes.data) {
        const list = Array.isArray(tenantsRes.data) ? tenantsRes.data : tenantsRes.data.tenants || [];
        setTenants(list);
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch {
      // Keep resilient fallback to INITIAL_TENANTS and INITIAL_METRICS
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/super-admin/onboard', onboardForm);
      if (res.success && res.data) {
        alert(`Tenant "${res.data.tenant.name}" onboarded successfully!`);
        setShowOnboardModal(false);
        fetchData();
      } else {
        alert(res.error?.message || 'Failed to onboard tenant');
      }
    } catch {
      alert('Network error while onboarding tenant');
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const res = await api.post(`/super-admin/tenants/${tenantId}/impersonate`);
      if (res.success && res.data) {
        localStorage.setItem('gymos_impersonation_token', res.data.accessToken);
        setImpersonationMsg(
          `Impersonating ${res.data.tenant.name} as ${res.data.user.name} (${res.data.user.role}). Redirecting...`,
        );
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        alert(res.error?.message || 'Impersonation session could not be established');
      }
    } catch {
      alert('Error initiating impersonation session');
    }
  };

  const handleStatusChange = async (tenantId: string, status: string) => {
    if (!confirm(`Are you sure you want to mark tenant as ${status}?`)) return;
    try {
      const res = await api.patch(`/super-admin/tenants/${tenantId}/status`, {
        status,
        reason: 'Super Admin manual status toggle',
      });
      if (res.success) {
        fetchData();
      } else {
        alert(res.error?.message || 'Failed to update tenant status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter ? t.tier === tierFilter : true;
    const matchStatus = statusFilter ? t.status === statusFilter : true;
    return matchSearch && matchTier && matchStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Techofay GymOS Platform Super Admin
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Multi-Tenant Core
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Tenant onboarding wizard, tier quotas, subscription billing, and platform revenue monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Onboard New Tenant
          </button>
        </div>
      </div>

      {impersonationMsg && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-3 animate-pulse">
          <Zap className="w-5 h-5 text-purple-400" />
          <span>{impersonationMsg}</span>
        </div>
      )}

      {loading && <LoadingSkeleton count={4} />}
      {error && !loading && <ErrorState message={error} onRetry={fetchData} />}
      {!loading && !error && !metrics && tenants.length === 0 && (
        <EmptyState
          title="No Platform Tenants Found"
          description="Onboard gym tenants to view network metrics, manage subscriptions, and configure quotas."
          actionLabel="Onboard First Tenant"
          onAction={() => setShowOnboardModal(true)}
        />
      )}

      {/* KPI Overview Cards */}
      {metrics && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
              <span>Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{metrics.revenue.mrrFormatted}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-medium">ARR: {metrics.revenue.arrFormatted}</span>
              <span>• {metrics.revenue.activePaidSubscriptions} paid gyms</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
              <span>Total Tenants</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{metrics.overview.totalTenants}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-400">{metrics.overview.activeTenants} active</span> •{' '}
              <span className="text-amber-400">{metrics.overview.trialTenants} in trial</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
              <span>Global Members</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.overview.totalMembers.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Across {metrics.overview.totalBranches} connected branches</div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
              <span>Tier Distribution</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-semibold flex items-center gap-2 mt-1">
              <span className="text-blue-400">{metrics.tierBreakdown.starter} Starter</span> •{' '}
              <span className="text-emerald-400">{metrics.tierBreakdown.professional} Pro</span> •{' '}
              <span className="text-purple-400">{metrics.tierBreakdown.enterprise} Ent</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Enforced quota limits</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Gym Tenants Directory
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'revenue'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subscription Billing & Plans
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'limits'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Usage Metering & Quotas
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Support Desk
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          Global Audit Trail
        </button>
      </div>

      {/* Tab 1: Tenants Directory */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search gym by name, subdomain, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              >
                <option value="">All Tiers</option>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Gym Tenant</th>
                  <th className="py-3 px-4">Subdomain</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Branches</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No gym tenants found. Click "+ Onboard Tenant" to provision a new tenant.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                  <tr key={t._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium">
                      <div>{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.contactEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={`/gym/${t.subdomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-xs"
                      >
                        {t.subdomain}.gymos
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          t.tier === 'ENTERPRISE'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : t.tier === 'PROFESSIONAL'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {t.tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{t.metrics.branchCount}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{t.metrics.memberCount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : t.status === 'TRIAL'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleImpersonate(t._id)}
                        className="px-2.5 py-1 text-xs rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors inline-flex items-center gap-1"
                        title="Impersonate Tenant with Audit Log"
                      >
                        <LogIn className="w-3 h-3" />
                        Impersonate
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTenant(t);
                          setShowSubscriptionModal(true);
                        }}
                        className="px-2.5 py-1 text-xs rounded-md bg-muted hover:bg-accent text-foreground transition-colors"
                      >
                        Subscription
                      </button>
                      {t.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleStatusChange(t._id, 'SUSPENDED')}
                          className="px-2 py-1 text-xs rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(t._id, 'ACTIVE')}
                          className="px-2 py-1 text-xs rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subscription Billing & Plans */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Starter Tier</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">₹4,999 / mo</span>
            </div>
            <p className="text-sm text-muted-foreground">Ideal for single-location standalone boutique gyms</p>
            <ul className="text-xs space-y-2 text-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Max 1 Branch</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Up to 500 Members</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 5 Staff Accounts</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100 AI queries/day (Basic Mode)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 1,000 SMS & WhatsApp msgs/mo</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-card border-2 border-emerald-500/50 space-y-4 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Professional Tier</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">₹14,999 / mo</span>
            </div>
            <p className="text-sm text-muted-foreground">Multi-branch fitness chains with AI marketing automation</p>
            <ul className="text-xs space-y-2 text-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Up to 3 Branches</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Up to 2,500 Members</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 20 Staff Accounts</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 500 Claude AI calls/day</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 10,000 WhatsApp & WebPush msgs</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Multi-Branch Consolidated Analytics</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Enterprise Tier</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">₹39,999 / mo</span>
            </div>
            <p className="text-sm text-muted-foreground">National gym franchises requiring unlimited scale and custom SLAs</p>
            <ul className="text-xs space-y-2 text-foreground">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Branches (999+)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Members (999k+)</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100 Staff Accounts</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 5,000 Claude AI calls/day</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 100,000 Messages/mo</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Custom Domain & White-Label App</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Usage Metering */}
      {activeTab === 'limits' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tenant Quota Monitoring & Rate Limits</h3>
            <p className="text-sm text-muted-foreground">
              Enforced dynamically in API middleware (`checkTenantLimit`). Resource creation is blocked upon reaching threshold.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border bg-background space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Pulse Fitness Hub (Pro Plan)</span>
                <span className="text-emerald-400 text-xs">57% Capacity</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '57%' }} />
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Members: 1,420 / 2,500</span>
                <span>Branches: 3 / 3 (100%)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background space-y-3">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>Zenith CrossFit (Starter Plan)</span>
                <span className="text-amber-400 text-xs">36% Capacity</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '36%' }} />
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Members: 180 / 500</span>
                <span>Branches: 1 / 1 (Max limit reached)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Support Desk */}
      {activeTab === 'tickets' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-foreground">Global Support Desk</h3>
              <p className="text-sm text-muted-foreground">Cross-tenant member and owner inquiries</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              3 Open Tickets
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'TCK-101',
                gym: 'Pulse Fitness Hub',
                subject: 'Biometric turnstile sync timeout',
                priority: 'HIGH',
                status: 'OPEN',
                time: '20m ago',
              },
              {
                id: 'TCK-102',
                gym: 'Iron Forge Athletics',
                subject: 'Request for custom domain SSL configuration',
                priority: 'MEDIUM',
                status: 'IN_PROGRESS',
                time: '2h ago',
              },
              {
                id: 'TCK-103',
                gym: 'Zenith CrossFit',
                subject: 'GST invoice format customization query',
                priority: 'LOW',
                status: 'RESOLVED',
                time: '1d ago',
              },
            ].map((ticket) => (
              <div key={ticket.id} className="p-4 rounded-xl border border-border bg-background flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                    <span className="font-medium text-foreground">{ticket.subject}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        ticket.priority === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400'
                          : ticket.priority === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Gym: <span className="text-foreground">{ticket.gym}</span> • Logged {ticket.time}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Global Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Global Platform Audit Trail</h3>
            <p className="text-sm text-muted-foreground">Immutable audit logs across all tenants for security and compliance</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-mono">
                <tr>
                  <td className="py-2.5 px-3 text-muted-foreground">Today 18:30</td>
                  <td className="py-2.5 px-3 text-emerald-400">ONBOARD_TENANT</td>
                  <td className="py-2.5 px-3">Tenant</td>
                  <td className="py-2.5 px-3 text-purple-400">SUPER_ADMIN</td>
                  <td className="py-2.5 px-3 text-muted-foreground">Onboarded "Iron Forge Gym" (Tier: PROFESSIONAL)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-muted-foreground">Today 17:15</td>
                  <td className="py-2.5 px-3 text-purple-400">IMPERSONATE_TENANT</td>
                  <td className="py-2.5 px-3">Tenant</td>
                  <td className="py-2.5 px-3 text-purple-400">SUPER_ADMIN</td>
                  <td className="py-2.5 px-3 text-muted-foreground">Session created for Pulse Fitness Hub</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-muted-foreground">Today 16:42</td>
                  <td className="py-2.5 px-3 text-blue-400">UPDATE_SUBSCRIPTION</td>
                  <td className="py-2.5 px-3">Subscription</td>
                  <td className="py-2.5 px-3 text-purple-400">SUPER_ADMIN</td>
                  <td className="py-2.5 px-3 text-muted-foreground">Upgraded tier to PROFESSIONAL (maxBranches: 3)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding Wizard Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Tenant Onboarding Wizard</h3>
                <p className="text-xs text-muted-foreground">Provision new gym organization, initial branch, and owner account</p>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Gym Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Performance Gym"
                    value={onboardForm.name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Subdomain</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex-gym"
                    value={onboardForm.subdomain}
                    onChange={(e) =>
                      setOnboardForm({
                        ...onboardForm,
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Subscription Plan</label>
                  <select
                    value={onboardForm.tier}
                    onChange={(e) => setOnboardForm({ ...onboardForm, tier: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="STARTER">Starter (₹4,999/mo)</option>
                    <option value="PROFESSIONAL">Professional (₹14,999/mo)</option>
                    <option value="ENTERPRISE">Enterprise (₹39,999/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Billing Cycle</label>
                  <select
                    value={onboardForm.billingCycle}
                    onChange={(e) => setOnboardForm({ ...onboardForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly (2 Months Free)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Owner Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Anand Verma"
                      value={onboardForm.ownerName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Owner Email</label>
                    <input
                      type="email"
                      required
                      placeholder="owner@apexgym.in"
                      value={onboardForm.ownerEmail}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      placeholder="ApexOwner@123"
                      value={onboardForm.ownerPassword}
                      onChange={(e) => setOnboardForm({ ...onboardForm, ownerPassword: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Primary Branch</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Apex Central"
                      value={onboardForm.branchName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, branchName: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Branch Code</label>
                    <input
                      type="text"
                      required
                      placeholder="AC01"
                      value={onboardForm.branchCode}
                      onChange={(e) => setOnboardForm({ ...onboardForm, branchCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Branch City</label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={onboardForm.branchCity}
                      onChange={(e) => setOnboardForm({ ...onboardForm, branchCity: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                    <input
                      type="text"
                      required
                      placeholder="45 100-Ft Road, Indiranagar"
                      value={onboardForm.branchAddress}
                      onChange={(e) => setOnboardForm({ ...onboardForm, branchAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+919876543210"
                      value={onboardForm.contactPhone}
                      onChange={(e) =>
                        setOnboardForm({
                          ...onboardForm,
                          contactPhone: e.target.value,
                          branchPhone: e.target.value,
                          contactEmail: onboardForm.ownerEmail,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition-colors"
                >
                  Confirm & Provision Gym
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Management Modal */}
      {showSubscriptionModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Update Subscription: {selectedTenant.name}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Plan Tier</label>
                <select
                  defaultValue={selectedTenant.tier}
                  id="modalPlanTier"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value="STARTER">Starter (1 Branch, 500 Members)</option>
                  <option value="PROFESSIONAL">Professional (3 Branches, 2.5k Members)</option>
                  <option value="ENTERPRISE">Enterprise (Unlimited Scale)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Billing Interval</label>
                <select
                  defaultValue="MONTHLY"
                  id="modalBillingCycle"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  <option value="MONTHLY">Monthly Billing</option>
                  <option value="YEARLY">Annual Billing</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-sm"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  const planTier = (document.getElementById('modalPlanTier') as HTMLSelectElement).value;
                  const billingCycle = (document.getElementById('modalBillingCycle') as HTMLSelectElement).value;
                  const res = await api.patch(`/super-admin/tenants/${selectedTenant._id}/subscription`, {
                    planTier,
                    billingCycle,
                  });
                  if (res.success) {
                    alert('Subscription updated');
                    setShowSubscriptionModal(false);
                    fetchData();
                  } else {
                    alert(res.error?.message || 'Failed to update subscription');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors"
              >
                Save Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SuperAdminPage;
