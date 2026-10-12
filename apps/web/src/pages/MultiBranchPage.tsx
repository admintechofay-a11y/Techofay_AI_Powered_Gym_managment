import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRightLeft,
  CalendarCheck,
  CheckCircle,
  RefreshCw,
  Award,
  AlertCircle,
  Sliders,
} from 'lucide-react';

interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  branchCode: string;
  city?: string;
  totalMembers: number;
  activeMembers: number;
  staffCount: number;
  attendanceThisMonth: number;
  revenueInPaise: number;
  expensesInPaise: number;
  netProfitInPaise: number;
  profitMargin: number;
}

interface ConsolidatedData {
  totals: {
    totalMembers: number;
    totalActiveMembers: number;
    totalStaff: number;
    totalAttendance: number;
    totalRevenueInPaise: number;
    totalExpensesInPaise: number;
    totalNetProfitInPaise: number;
    revenueFormatted: string;
    expensesFormatted: string;
    netProfitFormatted: string;
    overallProfitMargin: number;
  };
  branchBreakdown: BranchComparisonItem[];
}

import { api } from '../services/api.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton.js';

const INITIAL_CONSOLIDATED_DATA: ConsolidatedData = {
  totals: {
    totalMembers: 0,
    totalActiveMembers: 0,
    totalStaff: 0,
    totalAttendance: 0,
    totalRevenueInPaise: 0,
    totalExpensesInPaise: 0,
    totalNetProfitInPaise: 0,
    revenueFormatted: '₹0',
    expensesFormatted: '₹0',
    netProfitFormatted: '₹0',
    overallProfitMargin: 0,
  },
  branchBreakdown: [],
};

export const MultiBranchPage: React.FC = () => {
  const [data, setData] = useState<ConsolidatedData | null>(INITIAL_CONSOLIDATED_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMemberId, setTransferMemberId] = useState('');
  const [destBranchId, setDestBranchId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferActiveSubs, setTransferActiveSubs] = useState(true);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchConsolidated();
  }, []);

  const fetchConsolidated = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ConsolidatedData>('/branches/consolidated');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      // Keep resilient fallback to INITIAL_CONSOLIDATED_DATA
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferMemberId || !destBranchId || !transferReason) {
      alert('Please fill all transfer fields');
      return;
    }

    try {
      const res = await api.post('/branches/transfer-member', {
        memberId: transferMemberId,
        destinationBranchId: destBranchId,
        reason: transferReason,
        transferActiveMemberships: transferActiveSubs,
      });

      if (res.success && res.data) {
        setTransferStatus(`Successfully transferred ${res.data.member?.fullName || 'member'} to destination branch`);
        setTimeout(() => {
          setShowTransferModal(false);
          setTransferStatus(null);
          setTransferMemberId('');
          setTransferReason('');
          fetchConsolidated();
        }, 1500);
      } else {
        alert(res.error?.message || 'Transfer request failed');
      }
    } catch {
      alert('Network error initiating member transfer');
    }
  };

  const currentData = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Multi-Branch Management Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Consolidated View
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Consolidated financials, cross-location performance comparisons, and member branch transfers
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConsolidated}
            className="p-2 rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Member
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <LoadingSkeleton count={4} />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Branch Analytics Unavailable"
          message={error}
          onRetry={fetchConsolidated}
        />
      )}

      {!loading && !error && (!currentData || currentData.branchBreakdown.length === 0) && (
        <EmptyState
          title="No Branches Found"
          description="Add branch locations to track network-wide revenue, profit margins, and attendance."
        />
      )}

      {!loading && !error && currentData && currentData.branchBreakdown.length > 0 && (
        <>
          {/* Network Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
                <span>Consolidated Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">{currentData.totals.revenueFormatted}</div>
              <div className="text-xs text-muted-foreground mt-1">This Month across all branches</div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
                <span>Operating Profit (EBITDA)</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">{currentData.totals.netProfitFormatted}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Overall Margin: <span className="font-semibold text-foreground">{currentData.totals.overallProfitMargin}%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
                <span>Network Active Members</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {currentData.totals.totalActiveMembers.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Total Enrolled: {currentData.totals.totalMembers.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground text-sm mb-2">
                <span>Monthly Check-Ins</span>
                <CalendarCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {currentData.totals.totalAttendance.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Managed by {currentData.totals.totalStaff} Staff Members
              </div>
            </div>
          </div>

          {/* Branch Cards */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Active Branches Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentData.branchBreakdown.map((b, idx) => (
            <div
              key={b.branchId}
              className={`p-6 rounded-2xl bg-card border transition-all ${
                idx === 0 ? 'border-emerald-500/50 shadow-md shadow-emerald-950/20' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-bold text-foreground">{b.branchName}</h4>
                  <div className="text-xs text-muted-foreground font-mono">
                    Code: {b.branchCode} • {b.city || 'Flagship'}
                  </div>
                </div>
                {idx === 0 && (
                  <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Top Revenue Performer">
                    <Award className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-border text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Monthly Revenue:</span>
                  <span className="font-semibold text-emerald-400">
                    ₹{(b.revenueInPaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Operating Expenses:</span>
                  <span className="text-foreground">
                    ₹{(b.expensesInPaise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Net Margin:</span>
                  <span className="font-bold text-foreground">{b.profitMargin}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Active Members:</span>
                  <span className="font-mono text-xs">{b.activeMembers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">Monthly Visits:</span>
                  <span className="font-mono text-xs">{b.attendanceThisMonth}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Branch Comparison Matrix Table */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Cross-Branch Performance Matrix
        </h3>
        <div className="overflow-x-auto rounded-xl border border-border bg-background">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Active Members</th>
                <th className="py-3 px-4">Monthly Visits</th>
                <th className="py-3 px-4">Staff Count</th>
                <th className="py-3 px-4">Revenue (₹)</th>
                <th className="py-3 px-4">Net Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentData.branchBreakdown.map((b) => (
                <tr key={b.branchId} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                    <span>{b.branchName}</span>
                    <span className="font-mono text-xs text-muted-foreground">({b.branchCode})</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">{b.city || 'India'}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{b.activeMembers}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{b.attendanceThisMonth}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{b.staffCount}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">
                    ₹{(b.revenueInPaise / 100).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold">{b.profitMargin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Member Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-foreground">Member Branch Transfer</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {transferStatus && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{transferStatus}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Member ID or Member Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Member ObjectId or Member Code (e.g. PF-001)"
                  value={transferMemberId}
                  onChange={(e) => setTransferMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Destination Branch
                </label>
                <select
                  required
                  value={destBranchId}
                  onChange={(e) => setDestBranchId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                >
                  <option value="">Select destination branch...</option>
                  {(currentData?.branchBreakdown || []).map((b) => (
                    <option key={b.branchId} value={b.branchId}>
                      {b.branchName} ({b.branchCode}) - {b.city || 'Branch'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Reason for Relocation / Transfer
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Member relocated residence closer to BKC Studio center"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="transferActiveSubs"
                  checked={transferActiveSubs}
                  onChange={(e) => setTransferActiveSubs(e.target.checked)}
                  className="rounded border-border text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="transferActiveSubs" className="text-xs text-foreground cursor-pointer">
                  Transfer active membership packages and validity to destination branch
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default MultiBranchPage;
