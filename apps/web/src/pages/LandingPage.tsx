import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardContent } from '../components/ui/Card.js';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Users,
  Smartphone,
  ScanFace,
  MessageSquare,
  Receipt,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const stats = [
    { label: 'Active Gyms Across India', value: '450+' },
    { label: 'Monthly Check-ins Handled', value: '1.2M+' },
    { label: 'Automated Invoice Revenue', value: '₹42 Cr+' },
    { label: 'Average Churn Reduction', value: '38%' },
  ];

  const features = [
    {
      icon: ScanFace,
      title: 'Biometric & Facial Access',
      desc: 'Seamless turnstile integration with biometric and QR readers. Blocks delinquent memberships at the gate automatically.',
    },
    {
      icon: MessageSquare,
      title: 'Automated WhatsApp Bot',
      desc: 'Instant welcome pack, renewal reminders, payment receipts, and birthday greetings sent directly to member mobile phones.',
    },
    {
      icon: Receipt,
      title: 'GST-Compliant Billing',
      desc: 'Automated CGST/SGST split, gapless financial-year invoice numbering, Razorpay checkout, and PDF invoice downloads.',
    },
    {
      icon: Zap,
      title: 'AI Lead Scoring & CRM',
      desc: 'Smart lead conversion scoring based on enquiry channels, follow-up cadence, and workout preference profiles.',
    },
    {
      icon: Smartphone,
      title: 'White-Label Member PWA',
      desc: 'App-free digital membership pass, class reservations, workout tracking, and diet charts accessible on mobile browsers.',
    },
    {
      icon: Lock,
      title: 'Zero-Leak Multi-Tenant Architecture',
      desc: 'Cryptographically scoped database queries, RBAC access control across 9 roles, and immutable audit logs.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-brand-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>India’s Most Advanced Gym Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.1]">
          Run Your Gym with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-500 to-teal-400">Zero Leakage</span> and Total Intelligence.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          From biometric turnstiles and automated GST invoices to WhatsApp payment collections and AI-driven retention alerts. Built for single gyms to multi-city franchises.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register">
            <Button variant="brand" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start 14-Day Free Trial
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Explore Live Demo
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-sm"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground">{stat.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-muted/30 border-y border-border px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-3">
              Comprehensive Platform
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Built Specifically for Indian Fitness Enterprises
            </h2>
            <p className="mt-3 text-muted-foreground">
              Every detail engineered to eliminate operational friction and accelerate member renewals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <Card key={idx} className="hover:border-primary/50 transition-all hover:shadow-md">
                  <CardContent className="p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-brand-500/30 bg-gradient-to-b from-brand-500/10 to-transparent p-10 md:p-16">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Ready to upgrade your gym management?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Get your tenant provisioned in 60 seconds. Import existing member records via CSV with one click.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/register">
              <Button variant="brand" size="lg">
                Create Gym Account Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
