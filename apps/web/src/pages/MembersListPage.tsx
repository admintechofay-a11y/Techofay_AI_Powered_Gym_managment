import React, { useState } from 'react';
import { DataTable, Column } from '../components/ui/DataTable.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { useToast } from '../components/ui/Toast.js';
import { UserPlus, Download, Filter, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface MemberRecord {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  email: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN';
}

const INITIAL_MEMBERS: MemberRecord[] = [
  {
    id: 'm-1',
    memberId: 'GYM-2026-0042',
    name: 'Aarav Sharma',
    phone: '+91 98201 12345',
    email: 'aarav.sharma@gmail.com',
    plan: 'Annual Pro (12M)',
    startDate: '2026-01-15',
    endDate: '2027-01-14',
    status: 'ACTIVE',
  },
  {
    id: 'm-2',
    memberId: 'GYM-2026-0089',
    name: 'Priya Iyer',
    phone: '+91 98202 23456',
    email: 'priya.iyer@outlook.com',
    plan: 'Quarterly Fitness (3M)',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    status: 'ACTIVE',
  },
  {
    id: 'm-3',
    memberId: 'GYM-2026-0015',
    name: 'Rohan Mehra',
    phone: '+91 98203 34567',
    email: 'rohan.mehra@yahoo.com',
    plan: 'Monthly Standard (1M)',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'EXPIRED',
  },
  {
    id: 'm-4',
    memberId: 'GYM-2026-0104',
    name: 'Ananya Deshmukh',
    phone: '+91 98204 45678',
    email: 'ananya.d@gmail.com',
    plan: 'Half-Yearly Elite (6M)',
    startDate: '2026-06-15',
    endDate: '2026-12-14',
    status: 'ACTIVE',
  },
  {
    id: 'm-5',
    memberId: 'GYM-2026-0071',
    name: 'Kabir Kapoor',
    phone: '+91 98205 56789',
    email: 'kabir.k@gmail.com',
    plan: 'Annual Pro (12M)',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    status: 'FROZEN',
  },
  {
    id: 'm-6',
    memberId: 'GYM-2026-0112',
    name: 'Sunita Rao',
    phone: '+91 98206 67890',
    email: 'sunita.rao@hotmail.com',
    plan: 'PT 24 Sessions',
    startDate: '2026-09-10',
    endDate: '2026-11-09',
    status: 'ACTIVE',
  },
  {
    id: 'm-7',
    memberId: 'GYM-2026-0128',
    name: 'Vikram Joshi',
    phone: '+91 98207 78901',
    email: 'vikram.j@gmail.com',
    plan: 'Quarterly Fitness (3M)',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    status: 'EXPIRED',
  },
];

export const MembersListPage: React.FC = () => {
  const { success } = useToast();
  const [members, setMembers] = useState<MemberRecord[]>(INITIAL_MEMBERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'FROZEN'>('ALL');

  // Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('Annual Pro (12M)');
  const [waiverSigned, setWaiverSigned] = useState(false);

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
        <span className="font-mono text-xs font-semibold text-primary">{row.memberId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Full Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-foreground">{row.name}</div>
          <div className="text-[11px] text-muted-foreground">{row.email}</div>
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
      header: 'Active Membership',
      sortable: true,
      render: (row) => <span className="text-xs font-medium text-foreground">{row.plan}</span>,
    },
    {
      key: 'endDate',
      header: 'Valid Till',
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
  ];

  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newIdNum = members.length + 43;
    const newMember: MemberRecord = {
      id: `m-${Date.now()}`,
      memberId: `GYM-2026-0${newIdNum}`,
      name: newName,
      phone: newPhone,
      email: newEmail,
      plan: newPlan,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-10-06',
      status: 'ACTIVE',
    };

    setMembers([newMember, ...members]);
    setIsModalOpen(false);
    success('Member Registered Successfully', `${newName} has been enrolled with ID ${newMember.memberId}`);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setWaiverSigned(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Member Directory</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage profiles, atomic Member IDs, photo verification, and digital waivers
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs">
            {(['ALL', 'ACTIVE', 'EXPIRED', 'FROZEN'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === st ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <Button variant="brand" onClick={() => setIsModalOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
            New Member
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredMembers}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search by member name, ID, or phone..."
        pageSize={10}
      />

      {/* Member Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Gym Member"
        description="Creates an atomic Member ID and generates a digital QR card"
        size="md"
      >
        <form onSubmit={handleRegisterMember} className="space-y-4">
          <Input
            label="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Siddharth Verma"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <Select
            label="Select Initial Plan"
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            options={[
              { label: 'Annual Pro (12 Months) - ₹24,000', value: 'Annual Pro (12M)' },
              { label: 'Half-Yearly Elite (6 Months) - ₹14,000', value: 'Half-Yearly Elite (6M)' },
              { label: 'Quarterly Fitness (3 Months) - ₹8,000', value: 'Quarterly Fitness (3M)' },
              { label: 'Monthly Standard (1 Month) - ₹3,000', value: 'Monthly Standard (1M)' },
              { label: 'PT 24 Sessions - ₹18,000', value: 'PT 24 Sessions' },
            ]}
          />

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id="waiver"
              checked={waiverSigned}
              onChange={(e) => setWaiverSigned(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
              required
            />
            <label htmlFor="waiver" className="text-xs text-muted-foreground leading-relaxed">
              Member has signed the digital gym rules agreement, physical activity readiness questionnaire (PAR-Q), and medical health liability waiver.
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="brand" type="submit">
              Complete Enrolment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
