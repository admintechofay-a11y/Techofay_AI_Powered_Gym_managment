import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardContent } from '../components/ui/Card.js';
import {
  Users,
  CreditCard,
  QrCode,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileSpreadsheet,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  const sections = [
    {
      category: 'Member Lifecycle Management',
      icon: Users,
      description: 'End-to-end member journey from walk-in lead to lifetime brand advocate.',
      highlights: [
        'Atomic sequential Member IDs (e.g. GYM-2026-0042) ensuring zero duplicate collision',
        'Built-in webcam photo capture and national ID document vault',
        'Digital membership agreements and health waivers e-signed on touchscreens',
        'High-speed bulk CSV import with cell-by-cell validation diagnostics',
        'Custom lifecycle stages: Prospect, Active, Frozen, Expired, Lapsed',
      ],
    },
    {
      category: 'Smart Membership & Date Architecture',
      icon: CreditCard,
      description: 'Flexible plan modeling with exact day-level precision and automated state transitions.',
      highlights: [
        'Support for Monthly, Quarterly, Half-Yearly, Annual, Couple, Family, and Corporate accounts',
        'Personal Training (PT) packages linked to certified fitness instructors',
        'Prorated upgrades, freeze periods with medical note tracking, and membership transfers',
        'Automated midnight expiry job with graceful renewal grace windows',
        'Custom discount codes and coupon rules with usage limits',
      ],
    },
    {
      category: 'Biometric & QR Attendance Engine',
      icon: QrCode,
      description: 'Zero-touch entry turnstiles backed by live floor capacity monitoring.',
      highlights: [
        'Sub-second QR scan validation via camera or handheld readers',
        'Biometric fingerprint and facial recognition network bridge',
        'Automatic check-in rejection with audio alerts for expired or suspended memberships',
        'Live gym occupancy meter showing exact heads inside the facility in real time',
        'Configurable auto-checkout thresholds after workout duration limits',
      ],
    },
    {
      category: 'Indian GST Billing & Transactions',
      icon: ShieldCheck,
      description: 'Built for compliance with Indian tax laws and instant digital receipts.',
      highlights: [
        'Automated split for Intra-state CGST+SGST (9%+9%) and Inter-state IGST (18%)',
        'Gapless financial year numbering format (INV/2026-27/0001)',
        'Support for Cash, UPI, Credit/Debit Cards, Net Banking, and Razorpay links',
        'All monetary mutations executed inside ACID MongoDB transactions with idempotency keys',
        'One-click PDF tax invoice downloads with gym GSTIN branding',
      ],
    },
  ];

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Badge variant="outline" className="mb-4">
          Platform Architecture
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Engineered for Gym Excellence
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover how Techofay GymOS unifies your staff, members, turnstiles, and accounting under one rock-solid system.
        </p>
      </div>

      <div className="space-y-12">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <Card key={idx} className="border-border/80 shadow-sm overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary flex-shrink-0">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{sec.category}</h2>
                      <p className="text-muted-foreground mt-1 text-sm">{sec.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {sec.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-sm text-foreground/90">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <Link to="/register">
          <Button variant="brand" size="lg">
            Provision Your Gym Account
          </Button>
        </Link>
      </div>
    </div>
  );
};
