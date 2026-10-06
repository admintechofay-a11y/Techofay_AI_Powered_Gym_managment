import React, { useState } from 'react';
import { DataTable, Column } from '../components/ui/DataTable.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import {
  UserPlus,
  Upload,
  Download,
  QrCode,
  Snowflake,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Camera,
} from 'lucide-react';

export interface MemberRecord {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  plan: string;
  planPriceInInr: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN';
  emergencyContact: { name: string; phone: string; relation: string };
  attendanceCount: number;
  lastCheckIn?: string;
  invoicesCount: number;
  dueAmountInInr: number;
}

const INITIAL_MEMBERS: MemberRecord[] = [
  {
    id: 'm-1',
    memberId: 'IP-2026-0001',
    name: 'Aarav Sharma',
    phone: '+91 98201 12345',
    email: 'aarav.sharma@gmail.com',
    gender: 'MALE',
    plan: 'Annual VIP Club (12M)',
    planPriceInInr: 20000,
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    status: 'ACTIVE',
    emergencyContact: { name: 'Sunita Sharma', phone: '+91 98201 99999', relation: 'Spouse' },
    attendanceCount: 68,
    lastCheckIn: 'Today, 07:15 AM (Turnstile 01)',
    invoicesCount: 1,
    dueAmountInInr: 0,
  },
  {
    id: 'm-2',
    memberId: 'IP-2026-0002',
    name: 'Priya Iyer',
    phone: '+91 98202 23456',
    email: 'priya.iyer@outlook.com',
    gender: 'FEMALE',
    plan: 'Quarterly Pro (3M)',
    planPriceInInr: 6500,
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'ACTIVE',
    emergencyContact: { name: 'Raman Iyer', phone: '+91 98202 88888', relation: 'Father' },
    attendanceCount: 42,
    lastCheckIn: 'Yesterday, 06:40 PM (QR Scan)',
    invoicesCount: 2,
    dueAmountInInr: 0,
  },
  {
    id: 'm-3',
    memberId: 'IP-2026-0003',
    name: 'Rohan Mehra',
    phone: '+91 98203 34567',
    email: 'rohan.mehra@yahoo.com',
    gender: 'MALE',
    plan: 'Monthly Gold (1M)',
    planPriceInInr: 2500,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'EXPIRED',
    emergencyContact: { name: 'Kavita Mehra', phone: '+91 98203 77777', relation: 'Mother' },
    attendanceCount: 19,
    lastCheckIn: '2026-09-29, 08:10 AM (Turnstile 02)',
    invoicesCount: 1,
    dueAmountInInr: 2950,
  },
  {
    id: 'm-4',
    memberId: 'IP-2026-0004',
    name: 'Ananya Deshmukh',
    phone: '+91 98204 45678',
    email: 'ananya.d@gmail.com',
    gender: 'FEMALE',
    plan: 'Half-Yearly Elite (6M)',
    planPriceInInr: 11500,
    startDate: '2026-06-15',
    endDate: '2026-12-14',
    status: 'ACTIVE',
    emergencyContact: { name: 'Vikram Deshmukh', phone: '+91 98204 66666', relation: 'Brother' },
    attendanceCount: 51,
    lastCheckIn: 'Today, 08:30 AM (Turnstile 01)',
    invoicesCount: 1,
    dueAmountInInr: 0,
  },
  {
    id: 'm-5',
    memberId: 'IP-2026-0005',
    name: 'Kabir Kapoor',
    phone: '+91 98205 56789',
    email: 'kabir.k@gmail.com',
    gender: 'MALE',
    plan: 'Annual VIP Club (12M)',
    planPriceInInr: 20000,
    startDate: '2026-03-01',
    endDate: '2027-03-15',
    status: 'FROZEN',
    emergencyContact: { name: 'Alia Kapoor', phone: '+91 98205 55555', relation: 'Spouse' },
    attendanceCount: 34,
    lastCheckIn: '2026-09-12, 07:00 PM (Turnstile 01)',
    invoicesCount: 1,
    dueAmountInInr: 0,
  },
  {
    id: 'm-6',
    memberId: 'IP-2026-0006',
    name: 'Sunita Rao',
    phone: '+91 98206 67890',
    email: 'sunita.rao@hotmail.com',
    gender: 'FEMALE',
    plan: 'PT 24 Sessions',
    planPriceInInr: 18000,
    startDate: '2026-09-10',
    endDate: '2026-11-09',
    status: 'ACTIVE',
    emergencyContact: { name: 'Govind Rao', phone: '+91 98206 44444', relation: 'Spouse' },
    attendanceCount: 14,
    lastCheckIn: 'Yesterday, 05:15 PM (Trainer Punch)',
    invoicesCount: 1,
    dueAmountInInr: 0,
  },
];

export const MembersListPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [members, setMembers] = useState<MemberRecord[]>(INITIAL_MEMBERS);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'FROZEN'>('ALL');

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGender, setNewGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [newPlan, setNewPlan] = useState('Annual VIP Club (12M)');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Family');
  const [waiverSigned, setWaiverSigned] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(true);

  // History Drawer State
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [historyTab, setHistoryTab] = useState<'MEMBERSHIP' | 'ATTENDANCE' | 'INVOICES' | 'WAIVER'>('MEMBERSHIP');

  // Freeze Modal State
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('Medical treatment / recovery rest');
  const [freezeDays, setFreezeDays] = useState(14);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState('Annual VIP Club (12M)');

  // Digital QR Pass Modal
  const [isQrPassModalOpen, setIsQrPassModalOpen] = useState(false);

  // Bulk CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [parsedRows, setParsedRows] = useState<{ name: string; phone: string; email: string; plan: string; isValid: boolean; errorMsg?: string }[]>([]);

  const filteredMembers = members.filter((m) => {
    if (statusFilter === 'ALL') return true;
    return m.status === statusFilter;
  });

  const columns: Column<MemberRecord>[] = [
    {
      key: 'memberId',
      header: 'Member ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded">
          {row.memberId}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Member Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-foreground hover:text-brand-600 cursor-pointer" onClick={() => setSelectedMember(row)}>
              {row.name}
            </div>
            <div className="text-[11px] text-muted-foreground">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Mobile',
      render: (row) => <span className="text-xs text-muted-foreground">{row.phone}</span>,
    },
    {
      key: 'plan',
      header: 'Current Plan',
      sortable: true,
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-foreground">{row.plan}</span>
          <div className="text-[10px] text-muted-foreground">₹{row.planPriceInInr.toLocaleString('en-IN')}</div>
        </div>
      ),
    },
    {
      key: 'endDate',
      header: 'Expiry Date',
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.endDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const variants: Record<string, 'success' | 'destructive' | 'warning'> = {
          ACTIVE: 'success',
          EXPIRED: 'destructive',
          FROZEN: 'warning',
        };
        return <Badge variant={variants[row.status] || 'default'}>{row.status}</Badge>;
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={() => {
              setSelectedMember(row);
              setIsQrPassModalOpen(true);
            }}
          >
            <QrCode className="w-3.5 h-3.5 mr-1" /> Pass
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => setSelectedMember(row)}
          >
            History
          </Button>
        </div>
      ),
    },
  ];

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newSeq = members.length + 1;
    const newMemberId = `IP-2026-${String(newSeq).padStart(4, '0')}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    const newMember: MemberRecord = {
      id: `m-${Date.now()}`,
      memberId: newMemberId,
      name: fullName,
      phone: newPhone,
      email: newEmail,
      gender: newGender,
      plan: newPlan,
      planPriceInInr: newPlan.includes('Annual') ? 20000 : newPlan.includes('Half') ? 11500 : newPlan.includes('Quarterly') ? 6500 : 2500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-10-06',
      status: 'ACTIVE',
      emergencyContact: { name: emergencyName || 'Emergency Contact', phone: emergencyPhone || newPhone, relation: emergencyRelation },
      attendanceCount: 0,
      invoicesCount: 1,
      dueAmountInInr: 0,
    };

    setMembers([newMember, ...members]);
    setIsRegisterModalOpen(false);
    success('Member Registered with Atomic ID', `${fullName} enrolled under ${newMemberId}. Digital pass ready.`);

    // Reset form
    setFirstName('');
    setLastName('');
    setNewPhone('');
    setNewEmail('');
    setEmergencyName('');
    setEmergencyPhone('');
    setWaiverSigned(false);
  };

  const handleApplyFreeze = () => {
    if (!selectedMember) return;
    const updated = members.map((m) => {
      if (m.id === selectedMember.id) {
        return { ...m, status: 'FROZEN' as const };
      }
      return m;
    });
    setMembers(updated);
    setSelectedMember({ ...selectedMember, status: 'FROZEN' });
    setIsFreezeModalOpen(false);
    success('Membership Frozen', `${selectedMember.name}'s membership is paused for ${freezeDays} days. Reason: ${freezeReason}.`);
  };

  const handleApplyUpgrade = () => {
    if (!selectedMember) return;
    const updated = members.map((m) => {
      if (m.id === selectedMember.id) {
        return {
          ...m,
          plan: upgradeTargetPlan,
          endDate: '2027-10-06',
          status: 'ACTIVE' as const,
        };
      }
      return m;
    });
    setMembers(updated);
    setSelectedMember({ ...selectedMember, plan: upgradeTargetPlan, status: 'ACTIVE' });
    setIsUpgradeModalOpen(false);
    success('Membership Upgraded with Prorated Adjustment', `${selectedMember.name} has been upgraded to ${upgradeTargetPlan}. Prorated credit applied.`);
  };

  const handleParseCsv = (text: string) => {
    setCsvContent(text);
    const lines = text.trim().split('\n');
    const parsed = lines.map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0] || '';
      const phone = parts[1] || '';
      const email = parts[2] || '';
      const plan = parts[3] || 'Monthly Gold';

      const isValidPhone = /^[+]?[\d\s-]{10,14}$/.test(phone);
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      let isValid = true;
      let errorMsg = '';

      if (!name) {
        isValid = false;
        errorMsg = 'Name required';
      } else if (!isValidPhone) {
        isValid = false;
        errorMsg = 'Invalid Indian phone format';
      } else if (!isValidEmail) {
        isValid = false;
        errorMsg = 'Invalid email syntax';
      }

      return { name, phone, email, plan, isValid, errorMsg };
    });
    setParsedRows(parsed);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toastError('Import Failed', 'No valid rows found in CSV content.');
      return;
    }

    const newImportedMembers: MemberRecord[] = validRows.map((r, i) => ({
      id: `m-csv-${Date.now()}-${i}`,
      memberId: `IP-2026-${String(members.length + i + 1).padStart(4, '0')}`,
      name: r.name,
      phone: r.phone,
      email: r.email,
      gender: 'MALE',
      plan: r.plan,
      planPriceInInr: 2500,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-11-06',
      status: 'ACTIVE',
      emergencyContact: { name: 'Emergency', phone: r.phone, relation: 'Family' },
      attendanceCount: 0,
      invoicesCount: 1,
      dueAmountInInr: 0,
    }));

    setMembers([...newImportedMembers, ...members]);
    setIsCsvModalOpen(false);
    setCsvContent('');
    setParsedRows([]);
    success('Bulk Import Completed', `Successfully imported ${validRows.length} members with atomic ID assignment.`);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Member Directory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atomic Member IDs, webcam e-sign registration, digital QR passes, and proration lifecycle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs">
            {(['ALL', 'ACTIVE', 'EXPIRED', 'FROZEN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === st ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} leftIcon={<Upload className="w-4 h-4" />}>
            Import CSV
          </Button>

          <Button variant="brand" onClick={() => setIsRegisterModalOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
            New Member
          </Button>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={filteredMembers}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search by member name, ID, or phone..."
        pageSize={10}
      />

      {/* ========================================================================= */}
      {/* 1. Register Member Modal with PAR-Q & Waiver                               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New Gym Member"
        description="Creates atomic ID, PAR-Q agreement, and QR pass badge"
        size="lg"
      >
        <form onSubmit={handleRegisterMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Siddharth"
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Verma"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Mobile Number"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 98200 11223"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="siddharth@gmail.com"
              required
            />
            <Select
              label="Gender"
              value={newGender}
              onChange={(e) => setNewGender(e.target.value as any)}
              options={[
                { label: 'Male', value: 'MALE' },
                { label: 'Female', value: 'FEMALE' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Membership Plan"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              options={[
                { label: 'Annual VIP Club (12M) - ₹20,000 + 18% GST', value: 'Annual VIP Club (12M)' },
                { label: 'Half-Yearly Elite (6M) - ₹11,500 + 18% GST', value: 'Half-Yearly Elite (6M)' },
                { label: 'Quarterly Pro (3M) - ₹6,500 + 18% GST', value: 'Quarterly Pro (3M)' },
                { label: 'Monthly Gold (1M) - ₹2,500 + 18% GST', value: 'Monthly Gold (1M)' },
                { label: 'PT 24 Sessions - ₹18,000 + 18% GST', value: 'PT 24 Sessions' },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Webcam Photo Verification</label>
              <div className="border border-border rounded-lg p-2.5 bg-muted/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Front Portrait Captured</div>
                    <div className="text-[10px] text-muted-foreground">High-confidence biometric profile ready</div>
                  </div>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-3 bg-card space-y-3">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Emergency Contact & Medical Clearance
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Emergency Name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Next of Kin Name"
                required
              />
              <Input
                label="Emergency Phone"
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 98200 99887"
                required
              />
              <Input
                label="Relationship"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder="e.g. Spouse / Parent"
                required
              />
            </div>
          </div>

          <div className="border border-border rounded-lg p-3 bg-muted/20">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="waiver-check"
                checked={waiverSigned}
                onChange={(e) => setWaiverSigned(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input text-brand-600 focus:ring-brand-500"
                required
              />
              <label htmlFor="waiver-check" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                <strong>PAR-Q & Digital Health Waiver:</strong> I certify that the applicant has completed the health questionnaire, verified they have no contraindicated cardiovascular issues, and e-signed the gym liability waiver.
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" type="submit">
              Complete Enrolment & Issue Pass
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. Member Full History Drawer / Modal                                     */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember && !isQrPassModalOpen && !isFreezeModalOpen && !isUpgradeModalOpen}
          onClose={() => setSelectedMember(null)}
          title={`Member Profile: ${selectedMember.name}`}
          description={`ID: ${selectedMember.memberId} • Mobile: ${selectedMember.phone}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Header pill summary */}
            <div className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-border bg-card gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-base">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">{selectedMember.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedMember.email} • {selectedMember.gender}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={selectedMember.status === 'ACTIVE' ? 'success' : selectedMember.status === 'FROZEN' ? 'warning' : 'destructive'}>
                  {selectedMember.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setIsQrPassModalOpen(true)}>
                  <QrCode className="w-3.5 h-3.5 mr-1" /> View QR Pass
                </Button>
              </div>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-border text-xs gap-4 font-semibold text-muted-foreground">
              <button
                onClick={() => setHistoryTab('MEMBERSHIP')}
                className={`pb-2.5 transition-all border-b-2 ${historyTab === 'MEMBERSHIP' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-foreground'}`}
              >
                Membership & Lifecycle
              </button>
              <button
                onClick={() => setHistoryTab('ATTENDANCE')}
                className={`pb-2.5 transition-all border-b-2 ${historyTab === 'ATTENDANCE' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-foreground'}`}
              >
                Attendance Log ({selectedMember.attendanceCount})
              </button>
              <button
                onClick={() => setHistoryTab('INVOICES')}
                className={`pb-2.5 transition-all border-b-2 ${historyTab === 'INVOICES' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-foreground'}`}
              >
                Billing & Invoices
              </button>
              <button
                onClick={() => setHistoryTab('WAIVER')}
                className={`pb-2.5 transition-all border-b-2 ${historyTab === 'WAIVER' ? 'border-brand-500 text-brand-600' : 'border-transparent hover:text-foreground'}`}
              >
                Waiver & Emergency
              </button>
            </div>

            {/* Tab 1: Membership Lifecycle Actions */}
            {historyTab === 'MEMBERSHIP' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-border rounded-lg p-3.5 bg-muted/20">
                  <div>
                    <span className="text-muted-foreground">Subscribed Plan:</span>
                    <div className="font-semibold text-foreground text-sm mt-0.5">{selectedMember.plan}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Plan Value:</span>
                    <div className="font-semibold text-foreground text-sm mt-0.5">₹{selectedMember.planPriceInInr.toLocaleString('en-IN')} + 18% GST</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <div className="font-medium text-foreground mt-0.5">{selectedMember.startDate}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <div className="font-medium text-foreground mt-0.5">{selectedMember.endDate}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsFreezeModalOpen(true)}
                    disabled={selectedMember.status === 'FROZEN'}
                    leftIcon={<Snowflake className="w-3.5 h-3.5 text-sky-500" />}
                  >
                    Freeze Membership
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    leftIcon={<ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Upgrade Plan (Prorated)
                  </Button>
                  <Button
                    size="sm"
                    variant="brand"
                    onClick={() => success('Plan Renewed', `Renewal invoice generated for ${selectedMember.name}.`)}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Quick Renew
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 2: Attendance Log */}
            {historyTab === 'ATTENDANCE' && (
              <div className="space-y-2 pt-1 text-xs">
                <div className="border border-border rounded-lg divide-y divide-border">
                  <div className="p-2.5 flex items-center justify-between bg-card font-medium">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {selectedMember.lastCheckIn || 'Turnstile Access'}
                    </span>
                    <Badge variant="success">Turnstile 01</Badge>
                  </div>
                  <div className="p-2.5 flex items-center justify-between bg-card text-muted-foreground">
                    <span>2 days ago, 06:45 PM</span>
                    <span>QR Turnstile (48 min workout)</span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between bg-card text-muted-foreground">
                    <span>4 days ago, 07:10 AM</span>
                    <span>Biometric Face Recognition (62 min workout)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Invoices */}
            {historyTab === 'INVOICES' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="border border-border rounded-lg p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-foreground">INV-2026-27-0042</div>
                      <div className="text-[11px] text-muted-foreground">SAC Code 999723 • CGST 9% + SGST 9%</div>
                    </div>
                    <Badge variant="success">Paid in Full (UPI)</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Total: ₹{(selectedMember.planPriceInInr * 1.18).toLocaleString('en-IN')}</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => success('Invoice Preview', 'Printable PDF ready.')}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> Printable Tax Invoice
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Waiver & Emergency */}
            {historyTab === 'WAIVER' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Digital Agreement Verified
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Signed digitally by member on registration. PAR-Q medical assessment indicates no physical training restrictions.
                  </p>
                  <div className="pt-2 border-t border-border flex justify-between text-muted-foreground">
                    <span>Emergency Contact: {selectedMember.emergencyContact.name} ({selectedMember.emergencyContact.relation})</span>
                    <span className="font-mono">{selectedMember.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 3. Freeze Membership Modal                                                */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={isFreezeModalOpen}
          onClose={() => setIsFreezeModalOpen(false)}
          title={`Freeze Membership: ${selectedMember.name}`}
          description="Pushes out expiry end date by the exact duration frozen"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500">
              Freezing will immediately lock turnstile access until the resumption date and extend the plan end date without penalty.
            </div>

            <Select
              label="Freeze Duration"
              value={String(freezeDays)}
              onChange={(e) => setFreezeDays(Number(e.target.value))}
              options={[
                { label: '7 Days (1 Week)', value: '7' },
                { label: '14 Days (2 Weeks)', value: '14' },
                { label: '21 Days (3 Weeks)', value: '21' },
                { label: '30 Days (1 Month)', value: '30' },
              ]}
            />

            <Input
              label="Freeze Reason"
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              placeholder="e.g. Travel, Surgery, Medical recovery"
              required
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsFreezeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" onClick={handleApplyFreeze}>
                Confirm Freeze
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 4. Upgrade Membership Modal (Prorated Adjustment)                         */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          title={`Prorated Plan Upgrade: ${selectedMember.name}`}
          description="Unconsumed days of current plan credited towards new package"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <Select
              label="Select Target Upgrade Plan"
              value={upgradeTargetPlan}
              onChange={(e) => setUpgradeTargetPlan(e.target.value)}
              options={[
                { label: 'Annual VIP Club (12M) - ₹20,000 + GST', value: 'Annual VIP Club (12M)' },
                { label: 'Half-Yearly Elite (6M) - ₹11,500 + GST', value: 'Half-Yearly Elite (6M)' },
                { label: 'PT 24 Sessions - ₹18,000 + GST', value: 'PT 24 Sessions' },
              ]}
            />

            {/* Proration math box */}
            <div className="border border-border rounded-lg p-3 bg-muted/20 space-y-2">
              <div className="font-semibold text-foreground">Proration Ledger Calculation:</div>
              <div className="flex justify-between text-muted-foreground">
                <span>Current Plan:</span>
                <span className="font-medium text-foreground">{selectedMember.plan}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Unconsumed Days Credit:</span>
                <span className="font-medium text-emerald-500">- ₹4,250.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>New Plan Base:</span>
                <span className="font-medium text-foreground">₹20,000.00</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Net Taxable Difference:</span>
                <span className="font-medium text-foreground">₹15,750.00</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t border-border">
                <span>Total Payable (incl 18% GST):</span>
                <span className="text-brand-600">₹18,585.00</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" onClick={handleApplyUpgrade}>
                Process Upgrade & Settle Difference
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 5. Digital QR Pass Modal                                                  */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          isOpen={isQrPassModalOpen}
          onClose={() => setIsQrPassModalOpen(false)}
          title="Digital Gym Access Pass"
          description={`Official credentials for ${selectedMember.name}`}
          size="sm"
        >
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="w-56 p-4 rounded-xl border border-border bg-gradient-to-b from-card to-muted/40 shadow-xl flex flex-col items-center text-center space-y-3">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand-500">
                Techofay GymOS Pass
              </div>

              {/* QR Code SVG Visual */}
              <div className="p-3 bg-white rounded-lg border border-border shadow-inner">
                <svg className="w-28 h-28" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="15" y="15" width="20" height="20" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="black" />

                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="65" y="15" width="20" height="20" fill="white" />
                  <rect x="70" y="20" width="10" height="10" fill="black" />

                  <rect x="10" y="60" width="30" height="30" fill="black" />
                  <rect x="15" y="65" width="20" height="20" fill="white" />
                  <rect x="20" y="70" width="10" height="10" fill="black" />

                  <rect x="50" y="50" width="15" height="15" fill="black" />
                  <rect x="75" y="55" width="15" height="10" fill="black" />
                  <rect x="60" y="75" width="20" height="15" fill="black" />
                  <rect x="45" y="70" width="10" height="20" fill="black" />
                </svg>
              </div>

              <div>
                <div className="font-bold text-foreground text-sm">{selectedMember.name}</div>
                <div className="font-mono text-xs font-semibold text-brand-600 mt-0.5">{selectedMember.memberId}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Valid Till: {selectedMember.endDate}</div>
              </div>

              <Badge variant={selectedMember.status === 'ACTIVE' ? 'success' : 'destructive'}>
                {selectedMember.status}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => success('Pass Downloaded', 'Pass saved as digital wallet image.')}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Pass Card
            </Button>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. Bulk CSV Import Modal                                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Bulk Import Members from CSV"
        description="Row-by-row syntax validation, duplicate check, and atomic ID assignment"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Format: First and Last Name, 10-digit Phone, Email, Plan Name</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() =>
                handleParseCsv(`Dev Sharma, +919876543201, dev.sharma@gmail.com, Annual VIP Club
Meera Patel, +919876543202, meera.p@outlook.com, Monthly Gold
Kunal Trivedi, +919876543203, kunal.t@yahoo.com, Quarterly Pro
Invalid Row, 12345, bad-email, Monthly Gold`)
              }
            >
              Load Sample Data
            </Button>
          </div>

          <textarea
            value={csvContent}
            onChange={(e) => handleParseCsv(e.target.value)}
            rows={5}
            placeholder={`Aarav Mehta, +919820011223, aarav@gmail.com, Annual VIP Club\nPriya Sen, +919820011224, priya@gmail.com, Monthly Gold`}
            className="w-full text-xs font-mono p-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Validation Report ({parsedRows.filter((r) => r.isValid).length} Valid / {parsedRows.filter((r) => !r.isValid).length} Errors)</span>
              </div>
              <div className="max-h-44 overflow-y-auto border border-border rounded-lg divide-y divide-border text-xs">
                {parsedRows.map((row, i) => (
                  <div key={i} className={`p-2 flex items-center justify-between ${row.isValid ? 'bg-card' : 'bg-destructive/10'}`}>
                    <div>
                      <span className="font-semibold text-foreground">{row.name || 'Unnamed'}</span> • <span className="text-muted-foreground">{row.phone}</span> • <span className="text-muted-foreground">{row.email}</span>
                    </div>
                    {row.isValid ? (
                      <Badge variant="success">Ready to Import</Badge>
                    ) : (
                      <Badge variant="destructive">{row.errorMsg}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsCsvModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={handleConfirmImport} disabled={parsedRows.filter((r) => r.isValid).length === 0}>
              Import Valid Members ({parsedRows.filter((r) => r.isValid).length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
