import React from 'react';
import { Card, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { ShieldCheck, Lock, FileText, CheckCircle2, Mail, MapPin } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>DPDP Act, 2023 Compliant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Privacy Policy & Data Protection Charter
        </h1>
        <p className="text-xs text-muted-foreground">
          Last Updated: 01 October 2026 • Effective for all Techofay GymOS SaaS Tenants & Members
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Identity of Data Fiduciary</span>
            </h2>
            <p>
              Techofay Systems Private Limited ("Techofay", "we", "our", or "us") operates the GymOS enterprise software-as-a-service platform. In relation to the personal data of gym operators and fitness studio owners, Techofay acts as the Data Fiduciary under the Digital Personal Data Protection (DPDP) Act, 2023. In relation to member records uploaded by gym operators, Techofay operates as a Data Processor under rigorous multi-tenant cryptographic isolation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Categories of Data Processed</span>
            </h2>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <strong className="text-foreground block text-xs">A. Member Identification & Contact Data</strong>
                <span className="text-xs">Full legal name, mobile number, email address, date of birth, emergency contact, and gender.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <strong className="text-foreground block text-xs">B. Physical Access & Biometric Telemetry</strong>
                <span className="text-xs">Turnstile attendance check-in timestamps, rotating HMAC dynamic QR tokens, and encrypted facial/fingerprint hash templates stored on edge devices. Raw biometric images are never centralized on our cloud database.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <strong className="text-foreground block text-xs">C. Physical Assessments & Health Metrics</strong>
                <span className="text-xs">Body weight, height, BMI, skeletal muscle mass, body fat percentage, workout regimens, and nutritionist-assigned meal plans.</span>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <strong className="text-foreground block text-xs">D. Financial & Transaction Logs</strong>
                <span className="text-xs">Tax invoice numbers, GST identification numbers (GSTIN), Razorpay payment references, subscription plans, and refund adjustments.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Purpose of Data Processing</span>
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs">
              <li>Provisioning digital access cards and automated gym gate turnstile verification.</li>
              <li>Generating statutory tax invoices conforming to Section 31 of the CGST Act, 2017.</li>
              <li>Delivering transactional WhatsApp and SMS notifications for renewal reminders and class bookings.</li>
              <li>Providing personalized workout routines, streak badges, and trainer guidance.</li>
              <li>Maintaining immutable audit logs for enterprise security and anti-fraud monitoring.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Statutory Data Principal Rights</span>
            </h2>
            <p className="text-xs">
              Under Sections 11, 12, and 13 of the DPDP Act 2023, every member ("Data Principal") possesses enforceable rights accessible directly via the Member PWA:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border">
                <strong className="text-foreground block">Right to Information & Portability</strong>
                <span>One-click export of complete personal records in machine-readable JSON format.</span>
              </div>
              <div className="p-3 rounded-xl border border-border">
                <strong className="text-foreground block">Right to Correction & Erasure</strong>
                <span>Submit requests to purge personal records, fitness history, and biometric association.</span>
              </div>
              <div className="p-3 rounded-xl border border-border">
                <strong className="text-foreground block">Right to Grievance Redressal</strong>
                <span>Direct escalation to the designated Data Protection Officer with SLA response within 72 hours.</span>
              </div>
              <div className="p-3 rounded-xl border border-border">
                <strong className="text-foreground block">Right to Nominate</strong>
                <span>Appoint a nominee to exercise data rights in the event of incapacitation.</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                5
              </span>
              <span>Data Retention & Erasure Exceptions</span>
            </h2>
            <p className="text-xs">
              Upon receiving a verified account erasure request, Techofay purges marketing profiles, communication history, and fitness assessments within 72 hours. However, by virtue of statutory mandates under the Central Goods and Services Tax Act, 2017 and Income Tax Act, 1961, financial tax invoices and payment vouchers must be preserved for 6 consecutive financial years following the audit assessment period.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-600 flex items-center justify-center text-xs font-bold">
                6
              </span>
              <span>Data Protection Officer & Grievance Contact</span>
            </h2>
            <div className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
              <div className="font-bold text-foreground">Data Protection Officer (DPO)</div>
              <div>Techofay Systems Private Limited</div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>Level 8, Platina Tower, Bandra Kurla Complex (BKC), Mumbai 400051</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-brand-600" />
                <a href="mailto:grievance@techofay.com" className="hover:text-foreground hover:underline">
                  grievance@techofay.com
                </a>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
