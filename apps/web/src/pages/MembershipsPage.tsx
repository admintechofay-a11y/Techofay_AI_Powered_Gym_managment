import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Badge } from '../components/ui/Badge.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  CreditCard,
  Plus,
  Snowflake,
  Play,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Tag,
  Shield,
  Percent,
} from 'lucide-react';

interface PlanItem {
  _id: string;
  name: string;
  code: string;
  type: string;
  durationDays: number;
  priceInPaise: number;
  signupFeeInPaise: number;
  taxRatePercent: number;
  description?: string;
  maxFreezes: number;
  maxFreezeDays: number;
  isActive: boolean;
}

interface MembershipRecord {
  _id: string;
  memberId?: {
    _id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    email: string;
  };
  planId?: {
    _id: string;
    name: string;
    code: string;
    durationDays: number;
    priceInPaise: number;
  };
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED';
  totalAmountInPaise: number;
  balanceInPaise: number;
  freezeDaysUsed: number;
}

export const MembershipsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'MEMBERSHIPS' | 'PLANS'>('MEMBERSHIPS');
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN' | 'EXPIRED'>('ALL');

  // Modals
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [assignPlanModalOpen, setAssignPlanModalOpen] = useState(false);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipRecord | null>(null);

  // New Plan Form
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    type: 'MONTHLY',
    durationDays: 30,
    priceInInr: 2500,
    signupFeeInInr: 500,
    maxFreezes: 1,
    maxFreezeDays: 14,
    description: '',
  });

  // Assign Plan Form
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().split('T')[0],
    discountInInr: 0,
    notes: '',
  });

  // Freeze Form
  const [freezeForm, setFreezeForm] = useState({
    reason: 'Medical / Travel pause',
    startDate: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [memRes, planRes, mListRes] = await Promise.all([
        api.get('/memberships'),
        api.get('/memberships/plans'),
        api.get('/members?limit=100'),
      ]);

      if (memRes.success && Array.isArray(memRes.data)) {
        setMemberships(memRes.data);
      }
      if (planRes.success && Array.isArray(planRes.data)) {
        setPlans(planRes.data);
      }
      if (mListRes.success && Array.isArray(mListRes.data)) {
        setMembersList(mListRes.data);
      }
    } catch {
      toastError('Error', 'Unable to fetch memberships & plans.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/memberships/plans', planForm);
      if (res.success) {
        success('Plan Created', `Plan ${planForm.name} is now available`);
        setCreatePlanModalOpen(false);
        setPlanForm({
          name: '',
          code: '',
          type: 'MONTHLY',
          durationDays: 30,
          priceInInr: 2500,
          signupFeeInInr: 500,
          maxFreezes: 1,
          maxFreezeDays: 14,
          description: '',
        });
        fetchData();
      } else {
        toastError('Failed', res.error?.message || 'Unable to create plan');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Assign / Buy Plan
  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.memberId || !assignForm.planId) {
      toastError('Validation', 'Please select both a member and a plan');
      return;
    }

    try {
      const res = await api.post('/memberships/buy', {
        memberId: assignForm.memberId,
        planId: assignForm.planId,
        startDate: assignForm.startDate ? new Date(assignForm.startDate) : undefined,
        discountInPaise: Math.round(Number(assignForm.discountInInr || 0) * 100),
        notes: assignForm.notes,
      });

      if (res.success) {
        success('Plan Assigned', 'Membership plan successfully activated for member');
        setAssignPlanModalOpen(false);
        fetchData();
      } else {
        toastError('Activation Failed', res.error?.message || 'Could not assign plan');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Freeze Membership
  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMembership) return;

    try {
      const res = await api.post(`/memberships/${selectedMembership._id}/freeze`, freezeForm);
      if (res.success) {
        success('Membership Frozen', 'Plan tenure is now paused');
        setFreezeModalOpen(false);
        setSelectedMembership(null);
        fetchData();
      } else {
        toastError('Freeze Failed', res.error?.message || 'Could not freeze');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Unfreeze Membership
  const handleUnfreeze = async (membershipId: string) => {
    try {
      const res = await api.post(`/memberships/${membershipId}/unfreeze`, {});
      if (res.success) {
        success('Resumed', res.message || 'Membership unfreezed and expiry extended');
        fetchData();
      } else {
        toastError('Unfreeze Failed', res.error?.message || 'Could not unfreeze');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  // Run Expiry Sweep
  const handleRunExpirySweep = async () => {
    try {
      const res = await api.post('/memberships/run-expiry', {});
      if (res.success) {
        success('Sweep Complete', res.message || 'Automated expiry worker processed memberships');
        fetchData();
      } else {
        toastError('Error', res.error?.message || 'Expiry job failed');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const filteredMemberships = memberships.filter((m) => {
    const memberName = `${m.memberId?.firstName || ''} ${m.memberId?.lastName || ''}`.toLowerCase();
    const code = (m.memberId?.memberCode || '').toLowerCase();
    const planName = (m.planId?.name || '').toLowerCase();
    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      code.includes(searchTerm.toLowerCase()) ||
      planName.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Memberships & Plans</h1>
            <Badge variant="outline" className="text-primary border-primary/30">
              Contract Lifecycle
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage membership packages, plan enrollments, medical freeze requests, and automatic tenure extensions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRunExpirySweep}
            className="flex items-center gap-1.5 text-xs border-border"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Run Expiry Sweep
          </Button>

          <Button
            onClick={() => setAssignPlanModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4"
          >
            <CreditCard className="w-4 h-4" />
            Assign / Buy Plan
          </Button>

          <Button
            onClick={() => setCreatePlanModalOpen(true)}
            className="flex items-center gap-2 text-xs px-4"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('MEMBERSHIPS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'MEMBERSHIPS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Enrolled Memberships ({memberships.length})
          </button>
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'PLANS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Plan Catalog ({plans.length})
          </button>
        </div>

        {activeTab === 'MEMBERSHIPS' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by member/plan..."
                className="pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="FROZEN">Frozen</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Enrolled Memberships */}
      {activeTab === 'MEMBERSHIPS' && (
        <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-sm">
          {filteredMemberships.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Enrolled Memberships</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active membership contracts found. Click &quot;Assign / Buy Plan&quot; to enroll a gym member into an active package.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Contract Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMemberships.map((m) => {
                    const memberName = m.memberId
                      ? `${m.memberId.firstName} ${m.memberId.lastName}`
                      : 'Unknown Member';
                    const code = m.memberId?.memberCode || 'N/A';
                    const planName = m.planId?.name || 'Standard Plan';
                    const isFrozen = m.status === 'FROZEN';
                    const isActive = m.status === 'ACTIVE';

                    return (
                      <tr key={m._id} className="hover:bg-secondary/30 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{memberName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{code}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground">{planName}</span>
                          {m.planId?.durationDays && (
                            <div className="text-[11px] text-muted-foreground">
                              {m.planId.durationDays} Days Duration
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(m.startDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-foreground">
                            {new Date(m.endDate).toLocaleDateString()}
                          </div>
                          {isActive && (
                            <span className="text-[10px] text-emerald-400">
                              Expires in {Math.max(0, Math.ceil((new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm font-semibold text-foreground">
                          ₹{(m.totalAmountInPaise / 100).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          {isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          ) : isFrozen ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Frozen ({m.freezeDaysUsed}d)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              {m.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMembership(m);
                                setFreezeModalOpen(true);
                              }}
                              className="text-xs h-7 px-2 hover:bg-cyan-500/10 hover:text-cyan-400 border-border"
                            >
                              <Snowflake className="w-3 h-3 mr-1" />
                              Freeze
                            </Button>
                          )}
                          {isFrozen && (
                            <Button
                              size="sm"
                              onClick={() => handleUnfreeze(m._id)}
                              className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Unfreeze
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Plan Catalog */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <Card
              key={p._id}
              className="p-5 border-border bg-card/60 backdrop-blur-sm flex flex-col justify-between hover:border-primary/50 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                    {p.code}
                  </Badge>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Active
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mt-3 group-hover:text-primary transition">
                  {p.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                  {p.description || 'Full gym access, state-of-the-art equipment, locker facilities.'}
                </p>

                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">
                      ₹{(p.priceInPaise / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {p.durationDays} days</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Duration</span>
                    <strong className="text-foreground">{p.durationDays} Days</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST Tax Rate</span>
                    <strong className="text-foreground">{p.taxRatePercent}% Included</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Max Freezes Allowed</span>
                    <strong className="text-foreground">{p.maxFreezes} pause ({p.maxFreezeDays}d max)</strong>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAssignForm((prev) => ({ ...prev, planId: p._id }));
                    setAssignPlanModalOpen(true);
                  }}
                  className="w-full text-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                >
                  Enroll Member to this Plan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Create Plan */}
      <Modal
        isOpen={createPlanModalOpen}
        onClose={() => setCreatePlanModalOpen(false)}
        title="Create New Membership Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g. 3-Month Power Pro"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Plan Code"
              placeholder="e.g. PWR-3M"
              value={planForm.code}
              onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
              required
            />
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Contract Type</label>
              <select
                value={planForm.type}
                onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="MONTHLY">Monthly (1 Month)</option>
                <option value="QUARTERLY">Quarterly (3 Months)</option>
                <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                <option value="ANNUAL">Annual (12 Months)</option>
                <option value="CUSTOM">Custom Term</option>
                <option value="CORPORATE">Corporate Pass</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (Days)"
              type="number"
              value={planForm.durationDays}
              onChange={(e) => setPlanForm({ ...planForm, durationDays: Number(e.target.value) })}
              required
            />
            <Input
              label="Price (₹ INR)"
              type="number"
              value={planForm.priceInInr}
              onChange={(e) => setPlanForm({ ...planForm, priceInInr: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Freezes"
              type="number"
              value={planForm.maxFreezes}
              onChange={(e) => setPlanForm({ ...planForm, maxFreezes: Number(e.target.value) })}
            />
            <Input
              label="Max Freeze Days"
              type="number"
              value={planForm.maxFreezeDays}
              onChange={(e) => setPlanForm({ ...planForm, maxFreezeDays: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Plan Description"
            placeholder="Key perks, amenities, cardio access..."
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setCreatePlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Plan */}
      <Modal
        isOpen={assignPlanModalOpen}
        onClose={() => setAssignPlanModalOpen(false)}
        title="Assign & Enroll Member in Plan"
      >
        <form onSubmit={handleAssignPlan} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Select Member</label>
            <select
              value={assignForm.memberId}
              onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">-- Choose Member --</option>
              {membersList.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.firstName} {m.lastName} ({m.memberCode || m.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Select Membership Plan</label>
            <select
              value={assignForm.planId}
              onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">-- Choose Plan --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — ₹{(p.priceInPaise / 100).toLocaleString('en-IN')} ({p.durationDays}d)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={assignForm.startDate}
              onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
              required
            />
            <Input
              label="Discount (₹ INR)"
              type="number"
              value={assignForm.discountInInr}
              onChange={(e) => setAssignForm({ ...assignForm, discountInInr: Number(e.target.value) })}
            />
          </div>

          <Input
            label="Internal Notes"
            placeholder="Corporate partner, student discount..."
            value={assignForm.notes}
            onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setAssignPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
              Activate Membership
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Freeze Membership */}
      <Modal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        title="Freeze Active Membership"
      >
        <form onSubmit={handleFreeze} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Freezing pauses the membership validity period. The contract end date will be automatically extended upon unfreezing.
          </p>

          <Input
            label="Freeze Reason"
            value={freezeForm.reason}
            onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })}
            required
          />

          <Input
            label="Freeze Start Date"
            type="date"
            value={freezeForm.startDate}
            onChange={(e) => setFreezeForm({ ...freezeForm, startDate: e.target.value })}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setFreezeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white">
              Confirm Freeze
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MembershipsPage;
