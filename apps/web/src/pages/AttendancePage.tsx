import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import { useToast } from '../components/ui/Toast.js';
import { api } from '../services/api.js';
import {
  CalendarCheck,
  QrCode,
  Fingerprint,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  LogOut,
  RefreshCw,
  Clock,
  Send,
  ShieldCheck,
  Radio,
  Sparkles,
} from 'lucide-react';

interface AttendanceLog {
  _id: string;
  memberId?: {
    _id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
    email?: string;
  };
  checkInTime: string;
  checkOutTime?: string;
  method: string;
  deviceId?: string;
}

interface OccupancyData {
  currentInGym: number;
  maxSafeCapacity: number;
  occupancyPercentage: number;
  timestamp: string;
}

interface InactiveMember {
  memberId: string;
  name: string;
  phone: string;
  lastCheckIn: string;
}

export const AttendancePage: React.FC = () => {
  const { success, error: toastError } = useToast();

  // Terminal state
  const [identifier, setIdentifier] = useState('');
  const [checkInMethod, setCheckInMethod] = useState<'QR_SCAN' | 'MANUAL' | 'BIOMETRIC'>('QR_SCAN');
  const [allowOverride, setAllowOverride] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gateFeedback, setGateFeedback] = useState<{
    status: 'GRANTED' | 'DENIED' | 'CHECKOUT' | null;
    message: string;
    member?: any;
  }>({ status: null, message: '' });

  // Data state
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyData>({
    currentInGym: 0,
    maxSafeCapacity: 60,
    occupancyPercentage: 0,
    timestamp: new Date().toISOString(),
  });
  const [inactiveMembers, setInactiveMembers] = useState<InactiveMember[]>([]);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'INACTIVE'>('LOGS');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState<'ALL' | 'INSIDE' | 'COMPLETED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live stats & logs
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [occRes, logRes, inactRes] = await Promise.all([
        api.get('/attendance/live-occupancy'),
        api.get('/attendance'),
        api.get('/attendance/inactive-members?days=14'),
      ]);

      if (occRes.success && occRes.data) {
        setOccupancy(occRes.data);
      }
      if (logRes.success && Array.isArray(logRes.data)) {
        setLogs(logRes.data);
      }
      if (inactRes.success && Array.isArray(inactRes.data)) {
        setInactiveMembers(inactRes.data);
      }
    } catch {
      toastError('Error', 'Unable to fetch attendance records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      api.get('/attendance/live-occupancy').then((r) => {
        if (r.success && r.data) setOccupancy(r.data);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Check-In
  const handleCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      toastError('Missing Identifier', 'Enter Member Code, Phone Number or QR String');
      return;
    }

    try {
      setIsProcessing(true);
      setGateFeedback({ status: null, message: '' });

      const res = await api.post('/attendance/check-in', {
        identifier: identifier.trim(),
        method: checkInMethod,
        allowOverride,
      });

      if (res.success) {
        setGateFeedback({
          status: 'GRANTED',
          message: res.message || 'Gate Access Granted: Welcome to the Gym Floor',
          member: res.data?.member,
        });
        success('Gate Access Granted', `Welcome ${res.data?.member?.name || 'Member'}`);
        setIdentifier('');
        fetchAllData();
      } else {
        setGateFeedback({
          status: 'DENIED',
          message: res.error?.message || 'Access Denied: Verification failed',
          member: res.data?.member,
        });
        toastError('Access Denied', res.error?.message || 'Entry blocked');
      }
    } catch (err: any) {
      setGateFeedback({
        status: 'DENIED',
        message: err.message || 'Communication error with access control gate',
      });
      toastError('Access Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async (memberIdentifier: string) => {
    try {
      setIsProcessing(true);
      const res = await api.post('/attendance/check-out', { memberId: memberIdentifier });
      if (res.success) {
        success('Checked Out', 'Member departure registered successfully');
        setGateFeedback({
          status: 'CHECKOUT',
          message: 'Member successfully checked out.',
        });
        fetchAllData();
      } else {
        toastError('Check-Out Failed', res.error?.message || 'No active check-in session found.');
      }
    } catch (err: any) {
      toastError('Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate Biometric Punch
  const handleBiometricPunch = async () => {
    if (!identifier.trim()) {
      toastError('RFID / Card ID Required', 'Enter Member Code or Biometric ID in the box');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await api.post('/attendance/biometric-punch', {
        cardOrUserId: identifier.trim(),
        tenantId: 'current',
        deviceKey: 'TURNSTILE_MAIN_ENTRANCE',
      });

      const punchData = res.data || (res as any);
      if (res.success && punchData?.turnstileAction === 'UNLOCK_GATE') {
        success('Hardware Turnstile Unlocked', `Biometric match for ${punchData?.member?.name || 'Member'}`);
        setGateFeedback({
          status: 'GRANTED',
          message: 'Biometric Turnstile Unlocked: Green Light Active',
          member: punchData?.member,
        });
        setIdentifier('');
        fetchAllData();
      } else {
        const errorReason = res.error?.message || (res as any)?.reason || 'Biometric match rejected';
        toastError('Biometric Rejected', errorReason);
        setGateFeedback({
          status: 'DENIED',
          message: errorReason,
        });
      }
    } catch (err: any) {
      toastError('Device Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const memberName = `${log.memberId?.firstName || ''} ${log.memberId?.lastName || ''}`.toLowerCase();
    const code = (log.memberId?.memberCode || '').toLowerCase();
    const phone = (log.memberId?.phone || '').toLowerCase();
    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      code.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterSession === 'INSIDE') return !log.checkOutTime;
    if (filterSession === 'COMPLETED') return !!log.checkOutTime;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance & Gate Access</h1>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Live Terminal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time front desk check-in, RFID hardware turnstile control, and member retention alerts.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchAllData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Access Logs
        </Button>
      </div>

      {/* Top Occupancy & Quick Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Occupancy Gauge */}
        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Live Floor Occupancy
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Safe Zone
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{occupancy.currentInGym}</span>
            <span className="text-sm text-muted-foreground font-medium">/ {occupancy.maxSafeCapacity} capacity</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-secondary/60 rounded-full h-2.5 mt-3 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                occupancy.occupancyPercentage > 85
                  ? 'bg-red-500'
                  : occupancy.occupancyPercentage > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancy.occupancyPercentage)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-between">
            <span>{occupancy.occupancyPercentage}% utilized</span>
            <span>Updated live</span>
          </p>
        </Card>

        {/* Total Today */}
        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Today's Total Check-Ins
            </span>
            <CalendarCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{logs.length}</span>
            <span className="text-sm text-muted-foreground font-medium">sessions logged</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% verified gate records
          </p>
        </Card>

        {/* Churn Risk Inactive Watchlist */}
        <Card className="p-5 border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Inactive Members Alert
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{inactiveMembers.length}</span>
            <span className="text-sm text-muted-foreground font-medium">absent &gt; 14 days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Recommended: Trigger WhatsApp retention nudges
          </p>
        </Card>
      </div>

      {/* Front-Desk Gate Verification Terminal */}
      <Card className="p-6 border-border bg-card/80 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-border/60 gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Front-Desk Gate Terminal
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify member credentials, grant turnstile entry, or check out departing members.
            </p>
          </div>

          {/* Verification Method Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setCheckInMethod('QR_SCAN')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                checkInMethod === 'QR_SCAN'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Pass
            </button>
            <button
              type="button"
              onClick={() => setCheckInMethod('MANUAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                checkInMethod === 'MANUAL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Member ID / Phone
            </button>
            <button
              type="button"
              onClick={() => setCheckInMethod('BIOMETRIC')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                checkInMethod === 'BIOMETRIC'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              Biometric / RFID
            </button>
          </div>
        </div>

        {/* Input Bar & Actions */}
        <form onSubmit={handleCheckIn} className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                {checkInMethod === 'QR_SCAN' ? (
                  <QrCode className="w-5 h-5 text-primary" />
                ) : checkInMethod === 'BIOMETRIC' ? (
                  <Fingerprint className="w-5 h-5 text-primary" />
                ) : (
                  <Phone className="w-5 h-5 text-primary" />
                )}
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  checkInMethod === 'QR_SCAN'
                    ? 'Scan member QR pass or paste code (e.g. GYM-1001)...'
                    : checkInMethod === 'BIOMETRIC'
                    ? 'Enter RFID Card # or Biometric ID...'
                    : 'Enter Member Code (GYM-xxxx) or Mobile Number...'
                }
                className="w-full pl-11 pr-4 py-3 bg-secondary/40 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing ? 'Verifying...' : 'Check-In Entry'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleCheckOut(identifier)}
                disabled={isProcessing || !identifier.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 border-border hover:bg-secondary rounded-xl text-foreground font-semibold"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                Check-Out Exit
              </Button>

              {checkInMethod === 'BIOMETRIC' && (
                <Button
                  type="button"
                  onClick={handleBiometricPunch}
                  disabled={isProcessing || !identifier.trim()}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
                >
                  <Fingerprint className="w-4 h-4" />
                  Test RFID Hardware
                </Button>
              )}
            </div>
          </div>

          {/* Reception Staff Override Checkbox */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowOverride}
                onChange={(e) => setAllowOverride(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-secondary"
              />
              <span className="font-medium text-foreground">Reception Staff Override</span>
              <span>(Permit temporary entry for guest passes or pending renewal approvals)</span>
            </label>

            <span className="text-[11px] text-muted-foreground hidden md:inline">
              Press Enter to Check-In directly from physical scanner
            </span>
          </div>
        </form>

        {/* Live Feedback Alert Banner */}
        {gateFeedback.status && (
          <div
            className={`mt-4 p-4 rounded-xl border flex items-start gap-3 transition-all ${
              gateFeedback.status === 'GRANTED'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : gateFeedback.status === 'CHECKOUT'
                ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            {gateFeedback.status === 'GRANTED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : gateFeedback.status === 'CHECKOUT' ? (
              <LogOut className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <div className="font-bold flex items-center justify-between">
                <span>{gateFeedback.message}</span>
                {gateFeedback.member && (
                  <Badge variant="outline" className="text-xs bg-black/40 border-current">
                    {gateFeedback.member.memberId || gateFeedback.member.memberCode}
                  </Badge>
                )}
              </div>
              {gateFeedback.member && (
                <p className="text-xs opacity-90 mt-1">
                  Member: <strong className="text-foreground">{gateFeedback.member.name}</strong> • Gate Access: Active
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Main Tabs: Live Access Records vs Inactive Retention Watchlist */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('LOGS')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'LOGS'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recent Access Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('INACTIVE')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'INACTIVE'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Absentee Watchlist
              {inactiveMembers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-black font-bold">
                  {inactiveMembers.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'LOGS' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter logs by name/code..."
                  className="pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-64"
                />
              </div>

              <select
                value={filterSession}
                onChange={(e: any) => setFilterSession(e.target.value)}
                className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Sessions</option>
                <option value="INSIDE">Currently Inside</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Access Logs */}
        {activeTab === 'LOGS' && (
          <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-sm">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No Attendance Records Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No check-ins have been recorded today. Scan a member pass above or use the manual entry terminal.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/80">
                    <tr>
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Member ID</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Check-Out Time</th>
                      <th className="py-3 px-4">Verification Method</th>
                      <th className="py-3 px-4">Floor Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredLogs.map((log) => {
                      const isInside = !log.checkOutTime;
                      const memberName = log.memberId
                        ? `${log.memberId.firstName} ${log.memberId.lastName}`
                        : 'Unknown Member';
                      const code = log.memberId?.memberCode || 'N/A';
                      const phone = log.memberId?.phone || '';

                      return (
                        <tr key={log._id} className="hover:bg-secondary/30 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{memberName}</div>
                            {phone && <div className="text-xs text-muted-foreground">{phone}</div>}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                            {code}
                          </td>
                          <td className="py-3 px-4 text-xs text-foreground font-medium">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              {new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.checkInTime).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {log.checkOutTime ? (
                              <div className="flex items-center gap-1.5 text-foreground">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                {new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                On Floor
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {log.method}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {isInside ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active Workout
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
                                Exited
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isInside && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCheckOut(code !== 'N/A' ? code : log.memberId?._id || '')}
                                className="text-xs h-7 px-2.5 hover:bg-amber-500/10 hover:text-amber-400 border-border"
                              >
                                Check Out
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

        {/* Tab 2: Absentee Watchlist */}
        {activeTab === 'INACTIVE' && (
          <Card className="p-6 border-border bg-card/60 backdrop-blur-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Members Absent for 14+ Days</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                These members have stopped attending. Engage them through retention calls or automated WhatsApp nudges before churn occurs.
              </p>
            </div>

            {inactiveMembers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">High Attendance Retention!</p>
                <p className="text-xs text-muted-foreground">No active members have been absent for over 14 consecutive days.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {inactiveMembers.map((inact, idx) => (
                  <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground text-sm">{inact.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{inact.memberId}</span>
                        <span>•</span>
                        <span>{inact.phone}</span>
                        <span>•</span>
                        <span>Last check-in: {inact.lastCheckIn === 'Never' ? 'Never' : new Date(inact.lastCheckIn).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${inact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hey ${inact.name}! We noticed you missed your workouts recently at the gym. Everything alright? We look forward to seeing you back on the floor this week!`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send WhatsApp Nudge
                      </a>
                      <a
                        href={`tel:${inact.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-semibold text-foreground transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
