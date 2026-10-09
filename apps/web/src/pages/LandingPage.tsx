import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { GYM_IMAGES } from '../config/images.js';
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
  Layers,
  Activity,
  CheckCircle2,
  ChevronRight,
  Tablet,
  LayoutDashboard,
  Kanban,
  Brain,
  QrCode,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'crm' | 'analytics' | 'pwa'>('dashboard');

  const stats = [
    { label: 'Active Gyms Across India', value: '450+' },
    { label: 'Monthly Check-ins Handled', value: '1.2M+' },
    { label: 'Automated Invoice Revenue', value: '₹42 Cr+' },
    { label: 'Average Churn Reduction', value: '38%' },
  ];

  const features = [
    {
      icon: ScanFace,
      title: 'Biometric & Facial IoT Turnstiles',
      desc: 'Seamless turnstile integration with biometric fingerprint, facial recognition, and rotating QR codes. Blocks delinquent memberships at the physical gate automatically.',
    },
    {
      icon: MessageSquare,
      title: 'Automated WhatsApp Bot Engine',
      desc: 'Instant welcome packs, dynamic check-in receipts, renewal notifications, and birthday wishes sent directly to member mobile devices via official Meta Cloud API.',
    },
    {
      icon: Receipt,
      title: 'Indian GST-Compliant Billing',
      desc: 'Automated CGST/SGST 9%+9% vs IGST 18% arithmetic, gapless financial-year invoice numbering, Razorpay instant checkout, and compliant PDF tax invoice generation.',
    },
    {
      icon: Zap,
      title: '7-Stage CRM & AI Lead Scoring',
      desc: 'Intuitive drag-and-drop Kanban pipeline with automated follow-ups, trial scheduling, and conversion likelihood prediction powered by AI.',
    },
    {
      icon: Smartphone,
      title: 'White-Label Member Digital PWA',
      desc: 'App-free digital membership pass with rotating HMAC-signed QR, class reservations, workout tracking, and macro diet charts accessible on mobile browsers.',
    },
    {
      icon: Lock,
      title: 'Zero-Leak Multi-Tenant Architecture',
      desc: 'Cryptographically isolated database queries, fine-grained RBAC access control across 9 distinct roles, and immutable tamper-evident audit logs.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] text-[#F5F5F5] selection:bg-[#2E7D1E] selection:text-white">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-[#2E7D1E]/10 blur-[140px] pointer-events-none rounded-full" />

      {/* ========================================================================= */}
      {/* HERO SECTION: DARK PREMIUM SAAS HERO */}
      {/* ========================================================================= */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Pill Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.12] bg-[#141414] text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#2E7D1E]" />
          <span>India’s Most Advanced Gym Operating System</span>
        </div>

        {/* Hero Headline: 56-72px desktop, 36-40px mobile, lightweight, tight line height */}
        <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-light tracking-tight text-[#F5F5F5] max-w-5xl mx-auto leading-[1.08]">
          Run Your Gym with <br className="hidden sm:inline" />
          <span className="font-semibold text-white">Zero Leakage</span> and Total Intelligence.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-[#A1A1A1] max-w-2xl mx-auto leading-relaxed font-normal">
          From biometric turnstiles and automated GST invoices to WhatsApp payment collections and AI-driven retention alerts. Engineered for single studios to multi-city franchises.
        </p>

        {/* Action Buttons: Pill-shaped */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base"
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Start 14-Day Free Trial
            </Button>
          </Link>
          <Link to="/gym" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              View Branded Gym Template
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-base text-[#A1A1A1] hover:text-white"
            >
              Staff Portal Login
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* PRODUCT SHOWCASE: REAL RUNNING APP IN SLEEK DEVICE FRAME */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto">
          {/* Feature Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`min-h-[44px] px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20'
                  : 'bg-[#141414] text-[#A1A1A1] hover:text-white hover:bg-white/5 border border-white/[0.06]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`min-h-[44px] px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'crm'
                  ? 'bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20'
                  : 'bg-[#141414] text-[#A1A1A1] hover:text-white hover:bg-white/5 border border-white/[0.06]'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>CRM Lead Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`min-h-[44px] px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20'
                  : 'bg-[#141414] text-[#A1A1A1] hover:text-white hover:bg-white/5 border border-white/[0.06]'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Churn & Retention</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`min-h-[44px] px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'pwa'
                  ? 'bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20'
                  : 'bg-[#141414] text-[#A1A1A1] hover:text-white hover:bg-white/5 border border-white/[0.06]'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Member PWA Pass</span>
            </button>
          </div>

          {/* Interactive Laptop/Tablet Device Frame */}
          <div className="relative rounded-3xl border border-white/[0.12] bg-[#111111] p-3 sm:p-5 shadow-2xl overflow-hidden text-left">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] px-2 text-xs text-[#A1A1A1]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-[11px] text-[#A1A1A1] hidden sm:inline">
                  https://gymos.techofay.com/{activeTab === 'pwa' ? 'member-portal' : activeTab}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#2E7D1E] animate-pulse" />
                <span className="text-[#2E7D1E] font-semibold">Live System Telemetry</span>
              </div>
            </div>

            {/* Frame Content */}
            <div className="pt-4 min-h-[360px] sm:min-h-[420px] rounded-2xl bg-[#0A0A0A] p-5 sm:p-7 border border-white/[0.04]">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">IronPulse Fitness Club — Executive Overview</h3>
                      <p className="text-xs text-[#A1A1A1]">Real-time turnstile counts, MRR velocity, and expiring memberships</p>
                    </div>
                    <Link to="/dashboard">
                      <Button variant="secondary" size="sm">
                        Open Full Dashboard
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06]">
                      <div className="text-xs text-[#A1A1A1]">Active Members</div>
                      <div className="text-2xl font-bold text-white mt-1">1,400</div>
                      <div className="text-[11px] text-[#2E7D1E] mt-0.5">↑ 8.4% this month</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06]">
                      <div className="text-xs text-[#A1A1A1]">Live On Floor</div>
                      <div className="text-2xl font-bold text-[#2E7D1E] mt-1">14 Members</div>
                      <div className="text-[11px] text-[#A1A1A1] mt-0.5">Turnstile verified</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06]">
                      <div className="text-xs text-[#A1A1A1]">Monthly Recurring Rev.</div>
                      <div className="text-2xl font-bold text-white mt-1">₹18,40,000</div>
                      <div className="text-[11px] text-[#2E7D1E] mt-0.5">100% GST Settled</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#141414] border border-white/[0.06]">
                      <div className="text-xs text-[#A1A1A1]">Expiring in 7 Days</div>
                      <div className="text-2xl font-bold text-amber-400 mt-1">28 Members</div>
                      <div className="text-[11px] text-[#A1A1A1] mt-0.5">WhatsApp queued</div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#2E7D1E]/10 text-[#2E7D1E]">
                        <ScanFace className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Biometric Turnstile Feed #AW01</div>
                        <div className="text-xs text-[#A1A1A1]">Last Punch: Rohan Sharma (MEM-2026-27-0142) • 2 sec ago • Granted</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#2E7D1E]/15 text-[#2E7D1E] text-xs font-semibold">
                      GATE UNLOCKED
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'crm' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">7-Stage Inbound Lead Kanban Pipeline</h3>
                      <p className="text-xs text-[#A1A1A1]">Drag-and-drop lead conversion with WhatsApp click-to-chat</p>
                    </div>
                    <Link to="/crm">
                      <Button variant="secondary" size="sm">
                        Open Live CRM
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2">
                      <div className="flex justify-between font-semibold text-white">
                        <span>New Enquiry</span>
                        <span className="text-[#2E7D1E]">4</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#181818] border border-white/[0.04]">
                        <div className="font-medium text-white">Aakash Verma</div>
                        <div className="text-[10px] text-[#A1A1A1] mt-0.5">Walk-in • Weight Loss</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2">
                      <div className="flex justify-between font-semibold text-white">
                        <span>Trial Scheduled</span>
                        <span className="text-[#2E7D1E]">3</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#181818] border border-white/[0.04]">
                        <div className="font-medium text-white">Simran Kaur</div>
                        <div className="text-[10px] text-[#A1A1A1] mt-0.5">Tomorrow 07:00 AM</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2">
                      <div className="flex justify-between font-semibold text-white">
                        <span>Trial Completed</span>
                        <span className="text-[#2E7D1E]">2</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#181818] border border-white/[0.04]">
                        <div className="font-medium text-white">Sameer Patel</div>
                        <div className="text-[10px] text-amber-400 mt-0.5">High Conversion Prob.</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2">
                      <div className="flex justify-between font-semibold text-white">
                        <span>Won (Converted)</span>
                        <span className="text-[#2E7D1E]">18</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#181818] border border-white/[0.04]">
                        <div className="font-medium text-white">Rhea Joshi</div>
                        <div className="text-[10px] text-[#2E7D1E] mt-0.5">Annual Pass ₹24,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Member Retention & Churn Intelligence</h3>
                      <p className="text-xs text-[#A1A1A1]">Predicts high-risk dropouts based on attendance velocity drops</p>
                    </div>
                    <Link to="/analytics">
                      <Button variant="secondary" size="sm">
                        Open AI Analytics
                      </Button>
                    </Link>
                  </div>

                  <div className="p-5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-semibold">AI Risk Category Breakdown</span>
                      <span className="text-[#2E7D1E]">Predicted Accuracy: 94.2%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-[#181818]">
                        <div className="text-xs text-[#A1A1A1]">Safe (Active 4+ days/wk)</div>
                        <div className="text-xl font-bold text-[#2E7D1E] mt-1">1,240 (88%)</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#181818]">
                        <div className="text-xs text-[#A1A1A1]">Moderate Dip (1-2 days)</div>
                        <div className="text-xl font-bold text-amber-400 mt-1">112 (8%)</div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#181818]">
                        <div className="text-xs text-[#A1A1A1]">High Risk (0 punches in 14d)</div>
                        <div className="text-xl font-bold text-red-400 mt-1">48 (4%)</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#2E7D1E]/10 text-xs text-[#F5F5F5] flex items-center justify-between">
                      <span>Automated WhatsApp re-engagement trigger queued for 48 high-risk members.</span>
                      <span className="text-[#2E7D1E] font-semibold">Auto-Trigger Enabled</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pwa' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">White-Label Progressive Web App (PWA)</h3>
                      <p className="text-xs text-[#A1A1A1]">Runs directly in mobile browsers with HMAC-signed rotating QR code</p>
                    </div>
                    <Link to="/member-portal">
                      <Button variant="secondary" size="sm">
                        Preview Member PWA
                      </Button>
                    </Link>
                  </div>

                  <div className="max-w-md mx-auto p-6 rounded-2xl bg-[#141414] border border-white/[0.08] text-center space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E7D1E]/15 text-[#2E7D1E] text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>HMAC ANTI-PASSBACK SECURED</span>
                    </div>
                    <div className="text-lg font-bold text-white">Arjun Kulkarni — Annual VIP Pass</div>
                    <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center">
                      <QrCode className="w-full h-full text-black" />
                    </div>
                    <div className="text-xs text-[#A1A1A1]">
                      Pass refreshes automatically every 30 seconds to prevent badge sharing.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real Gym Owner Manager Photo (Tablet shot) */}
        <div className="mt-20 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-white/[0.08] bg-[#111111] grid grid-cols-1 md:grid-cols-2 items-center">
          <div className="relative aspect-[4/3] bg-[#161616]">
            <picture>
              <source
                type="image/avif"
                srcSet={`${GYM_IMAGES.saasOwnerTablet.sources.avif[640]} 640w, ${GYM_IMAGES.saasOwnerTablet.sources.avif[1280]} 1280w`}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <source
                type="image/webp"
                srcSet={`${GYM_IMAGES.saasOwnerTablet.sources.webp[640]} 640w, ${GYM_IMAGES.saasOwnerTablet.sources.webp[1280]} 1280w`}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <img
                src={GYM_IMAGES.saasOwnerTablet.sources.webp[640]}
                alt={GYM_IMAGES.saasOwnerTablet.alt}
                className="w-full h-full object-cover filter contrast-[1.08] brightness-[0.88]"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </div>

          <div className="p-8 sm:p-12 text-left space-y-4">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              OPERATIONAL CLARITY
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Manage Multi-Branch Facilities From Any Tablet or Phone
            </h3>
            <p className="text-sm text-[#A1A1A1] leading-relaxed">
              Whether checking daily collection numbers from home or auditing equipment inventory on the floor,
              Techofay GymOS gives managers instantaneous visibility without tedious paperwork.
            </p>
            <div className="pt-2">
              <Link to="/features">
                <Button variant="secondary" size="md">
                  Explore Enterprise Features
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/[0.08] bg-[#111111] backdrop-blur-sm shadow-sm"
            >
              <div className="text-3xl sm:text-4xl font-light text-white">{stat.value}</div>
              <div className="mt-1 text-xs sm:text-sm text-[#A1A1A1]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURE SHOWCASE GRID */}
      {/* ========================================================================= */}
      <section className="py-24 bg-[#0E0E0E] border-y border-white/[0.08] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              COMPREHENSIVE CAPABILITIES
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">
              Built Specifically for Indian Fitness Enterprises
            </h2>
            <p className="text-[#A1A1A1] text-base leading-relaxed">
              Every detail engineered to eliminate operational revenue friction and automate member renewals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl border border-white/[0.08] bg-[#111111] transition-all hover:border-[#2E7D1E]/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E7D1E]/10 text-[#2E7D1E] mb-6">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-[#A1A1A1] leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BOTTOM CTA */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-white/[0.12] bg-[#141414] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#2E7D1E]/15 rounded-full blur-[90px] pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Ready to upgrade your gym management?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#A1A1A1] max-w-xl mx-auto">
            Get your tenant provisioned in 60 seconds. Import existing member records via CSV with one click.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Create Free Account
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg">
                Schedule Architecture Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
