import React from 'react';
import { Card, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Scale, ShieldCheck, CheckCircle2, FileText, CreditCard } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5" />
          <span>SaaS Service Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Terms of Service & Subscription Agreement
        </h1>
        <p className="text-xs text-muted-foreground">
          Last Updated: 01 October 2026 • Effective upon Tenant Account Activation
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Subscription Scope & Tier Quotas</span>
            </h2>
            <p>
              By provisioning a tenant account on Techofay GymOS, you ("Tenant" or "Subscriber") subscribe to a cloud-hosted software service subject to the quotas defined in your selected plan (Starter, Professional, or Enterprise). Quota limits on active member capacity, authorized branch locations, staff seats, monthly messaging allocations, and AI model invocations are programmatically enforced at the API boundary. Exceeding tier thresholds requires a plan upgrade or purchasing supplementary usage packages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Billing, Invoicing & GST Compliance</span>
            </h2>
            <p>
              Subscription fees are billed in Indian Rupees (INR) via Razorpay recurring subscription mandates on a monthly or annual prepayment cycle. All charges are subject to applicable Goods and Services Tax (GST) at 18% under SAC Code 998313 (Information Technology Software Services). Computer-generated GST tax invoices specifying your registered GSTIN and SAC code are issued immediately upon successful transaction debit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Tenant Data Ownership & Cryptographic Isolation</span>
            </h2>
            <p>
              The Tenant retains exclusive proprietary ownership of all uploaded member records, attendance rosters, employee rosters, and revenue records. Techofay provides cryptographically partitioned multi-tenant database isolation. Under no circumstances does Techofay sell, lease, or aggregate identifiable tenant customer data for third-party advertising or competitive intelligence.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Service Level Agreement (SLA) & Uptime</span>
            </h2>
            <p>
              Techofay commits to a 99.95% monthly service availability SLA across production core API gateways and biometric check-in endpoints. Scheduled maintenance windows will be communicated via the Super Admin notification feed with at least 48 hours advance notice, scheduled during off-peak Indian Standard Time hours (01:00 AM - 04:00 AM IST).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>White-Labeling & Intellectual Property</span>
            </h2>
            <p>
              Subscribers on the Professional and Enterprise tiers receive the non-exclusive right to brand their member-facing digital PWA, public website subdomain, and email/SMS templates with their proprietary logos, trademarks, and corporate colors. The underlying GymOS software codebase, machine learning models, and system architecture remain the exclusive intellectual property of Techofay Systems Private Limited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                6
              </span>
              <span>Account Termination & Data Extraction Window</span>
            </h2>
            <p>
              A tenant may cancel their subscription at any time via the billing console. Following cancellation or non-payment suspension, the tenant retains access for 30 calendar days to export all member rosters, attendance history, and accounting statements in standard CSV or JSON format. After 30 days, all non-statutory tenant database records are securely purged in accordance with our data destruction protocols.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                7
              </span>
              <span>Governing Law & Dispute Resolution</span>
            </h2>
            <p>
              This Agreement is governed by and construed in accordance with the laws of the Republic of India. Any dispute or controversy arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra, India.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsPage;
