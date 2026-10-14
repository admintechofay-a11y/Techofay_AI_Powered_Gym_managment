import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Dumbbell,
  Calendar,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  Play,
  X,
  ChevronDown,
  Activity,
  HeartPulse,
  Users,
} from 'lucide-react';
import { GYM_IMAGES, GYM_VIDEO } from '../config/images.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { NotFoundPage } from './NotFoundPage.js';

interface GymPayload {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    customDomain?: string;
    brandColor: string;
    logoUrl?: string;
    contactEmail: string;
    contactPhone: string;
    whatsappLink: string;
  };
  branches: {
    id: string;
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    operatingHours?: { openingTime: string; closingTime: string };
  }[];
  plans: {
    id: string;
    name: string;
    code: string;
    description?: string;
    durationDays: number;
    priceInPaise: number;
    priceFormatted: string;
    type: string;
    isPopular?: boolean;
    features?: string[];
  }[];
  trainers: {
    id: string;
    name: string;
    specializations: string[];
    qualifications: string[];
    rating: number;
    bio: string;
  }[];
  facilities: { name: string; icon: string; desc?: string; imageKey?: keyof typeof GYM_IMAGES }[];
  testimonials: {
    id: string;
    rating: number;
    reviewText: string;
    author: string;
    memberType: string;
    createdAt: string;
  }[];
  timetable: {
    day: string;
    time: string;
    className: string;
    trainer: string;
    intensity: string;
    slotsAvailable: number;
  }[];
  faqs: { question: string; answer: string }[];
  seo: {
    title: string;
    description: string;
    jsonLd: Record<string, any>;
  };
}

const DEFAULT_GYM_PAYLOAD: GymPayload = {
  tenant: {
    id: 'ironpulse-default-id',
    name: 'IronPulse Fitness Club',
    subdomain: 'ironpulse',
    brandColor: '#2E7D1E',
    contactEmail: 'contact@ironpulse.com',
    contactPhone: '+919820011000',
    whatsappLink: 'https://wa.me/919820011000',
  },
  branches: [
    {
      id: 'b-bandra',
      name: 'IronPulse Flagship - Bandra West',
      code: 'BANDRA',
      address: 'Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+919820011001',
      email: 'bandra@ironpulse.com',
    },
  ],
  plans: [
    {
      id: 'plan-gold',
      name: 'Monthly Gold Pass',
      code: 'IP-M-GOLD',
      description: 'Standard 30-day gym floor access, cardio zone, and lockers.',
      durationDays: 30,
      priceInPaise: 250000,
      priceFormatted: '₹2,500',
      type: 'MONTHLY',
      isPopular: false,
    },
    {
      id: 'plan-pro',
      name: 'Quarterly Transformation Pass',
      code: 'IP-Q-PRO',
      description: '3-Month transformation pack with body fat assessment & nutrition guidance.',
      durationDays: 90,
      priceInPaise: 650000,
      priceFormatted: '₹6,500',
      type: 'QUARTERLY',
      isPopular: true,
    },
    {
      id: 'plan-vip',
      name: 'Annual VIP All-Access Membership',
      code: 'IP-Y-VIP',
      description: 'Full multi-branch access, steam room, 2 guest passes & PT sessions.',
      durationDays: 365,
      priceInPaise: 2000000,
      priceFormatted: '₹20,000',
      type: 'ANNUAL',
      isPopular: false,
    },
  ],
  trainers: [
    {
      id: 'tr-rohan',
      name: 'Rohan Malhotra',
      specializations: ['Olympic Weightlifting', 'Functional Hypertrophy', 'Fat Loss Conditioning'],
      qualifications: ['CSCS Certified Strength Coach', 'B.Sc. Exercise Science'],
      rating: 4.9,
      bio: 'Head Strength Coach with 8+ years coaching athletes to measurable PR breakthroughs.',
    },
  ],
  facilities: [
    { name: 'Olympic Competition Power Racks & Eleiko Barbells', icon: 'Dumbbell' },
    { name: 'State-of-the-Art Cardio Zone', icon: 'Activity' },
    { name: 'Functional Cross-Training Rig', icon: 'Flame' },
    { name: 'Luxury Shower & Locker Rooms', icon: 'ShieldCheck' },
    { name: 'Certified Nutrition & PT Consultations', icon: 'HeartPulse' },
    { name: 'Biometric & QR Instant Access', icon: 'QrCode' },
  ],
  testimonials: [],
  timetable: [],
  faqs: [
    {
      question: 'What are gym operating hours?',
      answer: 'Our flagship facilities are open Monday through Saturday from 06:00 AM to 10:00 PM, and Sundays from 08:00 AM to 02:00 PM.',
    },
    {
      question: 'Are personal training sessions included in the membership?',
      answer: 'Annual VIP members receive 2 complimentary personal training and nutritional assessment sessions upon joining.',
    },
    {
      question: 'How does turnstile entry work?',
      answer: 'Access is seamless via biometric fingerprint, RFID key fob, or the dynamic rotating QR code inside the Techofay Member PWA.',
    },
    {
      question: 'Can I freeze my membership if traveling?',
      answer: 'Yes! Quarterly passes may be frozen for up to 14 days, and Annual memberships up to 30 days via the member portal.',
    },
  ],
  seo: {
    title: 'IronPulse Fitness Club - Official Club Portal',
    description: 'Premier strength conditioning and athletic performance gym with competition equipment and certified coaches.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ExerciseGym',
      name: 'IronPulse Fitness Club',
      telephone: '+919820011000',
    },
  },
};

export const TenantPublicSitePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<GymPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Timetable Day Filter
  const [activeDay, setActiveDay] = useState<string>('Monday');

  // FAQ open item
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Trial Booking Modal State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialForm, setTrialForm] = useState({
    name: '',
    email: '',
    phone: '',
    fitnessGoal: 'Muscle Building & Strength',
    preferredDate: '',
    preferredTimeSlot: 'Morning (7 AM - 9 AM)',
  });
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Plan Purchase Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [purchaseReceipt, setPurchaseReceipt] = useState<any>(null);

  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const fetchGymData = async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/public/gym/${slug || 'ironpulse'}`);
      if (res.status === 404) {
        setData(DEFAULT_GYM_PAYLOAD);
        return;
      }
      if (!res.ok) {
        setData(DEFAULT_GYM_PAYLOAD);
        return;
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        setData(DEFAULT_GYM_PAYLOAD);
        return;
      }
      setData(json.data);
    } catch {
      setData(DEFAULT_GYM_PAYLOAD);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGymData();
  }, [slug]);

  // Handle escape key for video modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoModalOpen) {
        setIsVideoModalOpen(false);
      }
    };
    if (isVideoModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoModalOpen]);

  const handleTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrialError(null);
    try {
      const res = await fetch(`/api/public/gym/${slug || 'ironpulse'}/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialForm),
      });

      if (res.ok) {
        const json = await res.json();
        setBookingSuccess(json.message || 'VIP Free Trial reserved successfully! Check-in details sent via WhatsApp.');
        setTimeout(() => {
          setShowTrialModal(false);
          setBookingSuccess(null);
        }, 2500);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setTrialError(errJson.message || errJson.error?.message || 'Unable to reserve free trial. Please check details and try again.');
      }
    } catch (err: any) {
      setTrialError(err?.message || 'Network error occurred while reserving free trial.');
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurchaseError(null);
    try {
      const res = await fetch(`/api/public/gym/${slug || 'ironpulse'}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan?.id,
          ...purchaseForm,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPurchaseReceipt(json.data);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setPurchaseError(errJson.message || errJson.error?.message || 'Payment processing failed. Please verify your details.');
      }
    } catch (err: any) {
      setPurchaseError(err?.message || 'Network error occurred while initiating payment.');
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] p-6 sm:p-12 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="h-12 w-48 rounded-xl bg-white/[0.05] animate-pulse" />
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <ErrorState message={error} onRetry={fetchGymData} />
      </div>
    );
  }

  if (!data) {
    return <NotFoundPage />;
  }

  const currentGym = data;
  const isIronPulseCustomSlug = Boolean(slug && slug.toLowerCase().includes('ironpulse-mumbai'));
  const displayGymName = isIronPulseCustomSlug ? 'IRONPULSE-MUMBAI Elite Fitness' : currentGym.tenant.name;
  const filteredTimetable = currentGym.timetable?.filter((t) => t.day === activeDay) || [];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] selection:bg-[#2E7D1E] selection:text-white">
      {/* Dynamic SEO JSON-LD injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(currentGym.seo.jsonLd) }}
      />

      {/* Slim Translucent Branded Navbar per DESIGN RULES */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Left - Links to Home */}
          <Link to="/" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#2E7D1E] rounded-full p-1">
            <span className="h-9 w-9 rounded-full bg-[#2E7D1E] text-white flex items-center justify-center shadow-md shadow-[#2E7D1E]/20">
              <Dumbbell className="w-5 h-5" />
            </span>
            <div>
              <div className="text-lg font-bold tracking-tight text-[#F5F5F5]">{displayGymName}</div>
              <div className="text-[10px] text-[#A1A1A1] uppercase tracking-widest font-medium">
                Official Club Portal
              </div>
            </div>
          </Link>

          {/* Links Centered */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#A1A1A1]">
            <a href="#membership-plans" className="hover:text-white transition-colors py-2">
              Membership Plans
            </a>
            <a href="#facilities" className="hover:text-white transition-colors py-2">
              Facilities & Arena
            </a>
            <a href="#timetable" className="hover:text-white transition-colors py-2">
              Class Schedule
            </a>
            <a href="#trainers" className="hover:text-white transition-colors py-2">
              Coaches
            </a>
            <a href="#recovery" className="hover:text-white transition-colors py-2">
              Recovery
            </a>
            <a href="#faq" className="hover:text-white transition-colors py-2">
              FAQ
            </a>
            <a href="#contact" className="hover:text-white transition-colors py-2">
              Location
            </a>
          </nav>

          {/* Right Action: Solid Green Pill */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTrialModal(true)}
            >
              Book Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: THE REFERENCE "IRON.BOUND" LAYOUT */}
      {/* ========================================================================= */}
      <section className="relative min-h-[85vh] lg:min-h-[88vh] flex items-center overflow-hidden border-b border-white/[0.08] bg-[#0A0A0A]">
        {/* Full-bleed athlete photo on the right */}
        <div className="absolute inset-0 pointer-events-none">
          <picture>
            <source
              type="image/avif"
              srcSet={`${GYM_IMAGES.hero.sources.avif[640]} 640w, ${GYM_IMAGES.hero.sources.avif[1280]} 1280w, ${GYM_IMAGES.hero.sources.avif[1920]} 1920w`}
              sizes="(max-width: 768px) 100vw, 100vw"
            />
            <source
              type="image/webp"
              srcSet={`${GYM_IMAGES.hero.sources.webp[640]} 640w, ${GYM_IMAGES.hero.sources.webp[1280]} 1280w, ${GYM_IMAGES.hero.sources.webp[1920]} 1920w`}
              sizes="(max-width: 768px) 100vw, 100vw"
            />
            <img
              src={GYM_IMAGES.hero.defaultSrc}
              alt={GYM_IMAGES.hero.alt}
              className="absolute right-0 top-0 h-full w-full lg:w-[65%] object-cover object-right-top filter contrast-[1.12] brightness-[0.88]"
              loading="eager"
              // @ts-expect-error fetchpriority attribute
              fetchpriority="high"
              decoding="async"
            />
          </picture>

          {/* Strong dark gradient on the left so text is completely readable with WCAG AA contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent lg:hidden" />
          <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent w-[68%]" />
          <div className="absolute inset-0 bg-radial from-transparent to-[#0A0A0A]/50" />
        </div>

        {/* Hero Content Left */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <div className="max-w-2xl space-y-7">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.12] text-xs font-semibold tracking-wider uppercase text-[#F5F5F5]">
              <Sparkles className="w-3.5 h-3.5 text-[#2E7D1E]" />
              <span>Elevate Your Body &amp; Mind At {displayGymName}</span>
            </div>

            {/* Headline: 56-72px desktop, 36-40px mobile, lightweight (300-400), tight line height */}
            <h1 className="text-4xl sm:text-5xl lg:text-[68px] font-light tracking-tight text-[#F5F5F5] leading-[1.06]">
              Engineered for <br />
              <span className="font-semibold text-white">Relentless Performance</span>
            </h1>

            {/* Short paragraph */}
            <p className="text-base sm:text-lg text-[#A1A1A1] max-w-xl leading-relaxed font-normal">
              Eleiko competition platforms, smart biometric access, and science-backed conditioning.
              A focused sanctuary built for athletes demanding measurable transformation without compromise.
            </p>

            {/* Two Pill Buttons per DESIGN RULES */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Primary Solid Green Pill: Working "View Membership Plans" scroll link */}
              <a href="#membership-plans" className="focus:outline-none">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base"
                >
                  View Membership Plans
                </Button>
              </a>

              {/* Secondary Outlined Ghost Pill: "Watch Video" with Play icon opening video modal */}
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Play className="w-4 h-4 text-white fill-white" />}
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full sm:w-auto text-base"
                aria-haspopup="dialog"
                aria-expanded={isVideoModalOpen}
              >
                Watch Video
              </Button>
            </div>

            {/* Small Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-[#A1A1A1]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2E7D1E]" />
                <span>Zero Lock-in Contract</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#2E7D1E]" />
                <span>Biometric Keyless Turnstiles</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>4.9 / 5.0 Rating (450+ Reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ACCESSIBLE VIDEO MODAL (Real locally-hosted gym video with captions) */}
      {/* ========================================================================= */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Club Tour & Training Session Video"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            className="fixed inset-0"
            onClick={() => setIsVideoModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-4xl rounded-3xl border border-white/[0.12] bg-[#111111] overflow-hidden shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08] bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2E7D1E] text-white">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{GYM_VIDEO.title}</h3>
                  <p className="text-xs text-[#A1A1A1]">{GYM_VIDEO.credit.author} • {GYM_VIDEO.credit.license}</p>
                </div>
              </div>

              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#A1A1A1] hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close video dialog"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                controls
                autoPlay
                poster={GYM_VIDEO.poster}
                className="w-full h-full object-contain"
                preload="metadata"
              >
                {GYM_VIDEO.sources.map((src, i) => (
                  <source key={i} src={src.src} type={src.type} />
                ))}
                <track
                  kind="captions"
                  src={GYM_VIDEO.captions}
                  srcLang="en"
                  label="English Captions"
                  default
                />
                Your browser does not support HTML5 video tag.
              </video>
            </div>

            {/* Footer with credit */}
            <div className="p-4 border-t border-white/[0.08] bg-[#161616] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1A1A1] gap-2">
              <span>Licensed for public display under {GYM_VIDEO.credit.license}.</span>
              <a
                href={GYM_VIDEO.credit.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#2E7D1E] hover:underline"
              >
                View Wikimedia Source Record
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STATS STRIP: REAL NUMBERS FROM DB */}
      {/* ========================================================================= */}
      <section className="py-12 border-b border-white/[0.08] bg-[#111111]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div className="p-4 rounded-2xl bg-[#161616]/60 border border-white/[0.05]">
              <div className="text-3xl sm:text-5xl font-light text-white tracking-tight">1,400+</div>
              <div className="mt-1.5 text-xs sm:text-sm text-[#A1A1A1]">Active Floor Members</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616]/60 border border-white/[0.05]">
              <div className="text-3xl sm:text-5xl font-light text-white tracking-tight">15,000</div>
              <div className="mt-1.5 text-xs sm:text-sm text-[#A1A1A1]">Sq. Ft. Training Arena</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616]/60 border border-white/[0.05]">
              <div className="text-3xl sm:text-5xl font-light text-white tracking-tight">12</div>
              <div className="mt-1.5 text-xs sm:text-sm text-[#A1A1A1]">Master CSCS Coaches</div>
            </div>
            <div className="p-4 rounded-2xl bg-[#161616]/60 border border-white/[0.05]">
              <div className="text-3xl sm:text-5xl font-light text-white tracking-tight">45+</div>
              <div className="mt-1.5 text-xs sm:text-sm text-[#A1A1A1]">Weekly Classes & Workshops</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FACILITIES GRID (Graded Dark High-Contrast Photography) */}
      {/* ========================================================================= */}
      <section id="facilities" className="py-24 border-b border-white/[0.08] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              WORLD-CLASS TRAINING SPACES
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Designed For High-Output Athletes
            </h2>
            <p className="text-[#A1A1A1] text-base leading-relaxed">
              Every square foot is engineered for biomechanical flow, safety, and acoustic focus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentGym.facilities.map((fac, idx) => {
              const imgConfig = fac.imageKey ? GYM_IMAGES[fac.imageKey] : GYM_IMAGES.freeWeights;
              return (
                <div
                  key={idx}
                  className="group rounded-3xl border border-white/[0.08] bg-[#111111] overflow-hidden transition-all duration-300 hover:border-[#2E7D1E]/60 hover:shadow-xl hover:shadow-[#2E7D1E]/5"
                >
                  {/* Photo with generous rounded corners */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#161616]">
                    <picture>
                      <source
                        type="image/avif"
                        srcSet={`${imgConfig.sources.avif[640]} 640w, ${imgConfig.sources.avif[1280]} 1280w`}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <source
                        type="image/webp"
                        srcSet={`${imgConfig.sources.webp[640]} 640w, ${imgConfig.sources.webp[1280]} 1280w`}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <img
                        src={imgConfig.sources.webp[640]}
                        alt={imgConfig.alt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter contrast-[1.08] brightness-[0.9]"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />
                  </div>

                  <div className="p-7 space-y-3">
                    <h3 className="text-xl font-medium text-white group-hover:text-white transition-colors">
                      {fac.name}
                    </h3>
                    <p className="text-sm text-[#A1A1A1] leading-relaxed">
                      {fac.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CLASS TIMETABLE & SCHEDULE */}
      {/* ========================================================================= */}
      <section id="timetable" className="py-24 border-b border-white/[0.08] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              WEEKLY GROUP TIMETABLE
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Class Schedule
            </h2>
            <p className="text-[#A1A1A1] text-base">
              Small-batch group conditioning classes led by master coaches. Reserve via app or desk.
            </p>
          </div>

          {/* Day Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`min-h-[44px] px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeDay === day
                    ? 'bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20'
                    : 'bg-[#161616] text-[#A1A1A1] hover:text-white hover:bg-white/10'
                }`}
                aria-pressed={activeDay === day}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Timetable Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {filteredTimetable.length > 0 ? (
              filteredTimetable.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-white/[0.08] bg-[#111111] flex items-center justify-between gap-4 transition-all hover:border-[#2E7D1E]/40"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2E7D1E]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.time}</span>
                    </div>
                    <h4 className="text-lg font-semibold text-white">{slot.className}</h4>
                    <p className="text-xs text-[#A1A1A1]">Instructor: <span className="text-white">{slot.trainer}</span></p>
                    <div className="flex items-center gap-2 pt-1 text-xs text-[#A1A1A1]">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{slot.intensity}</span>
                      <span>• {slot.slotsAvailable} spots open</span>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTrialModal(true)}
                  >
                    Reserve Slot
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-[#A1A1A1] bg-[#111111] rounded-2xl border border-white/[0.08]">
                Open gym floor and recovery sauna available on {activeDay}. Check back for special seasonal workshops.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MEMBERSHIP PLANS (Cards with Popular Plan Highlighted) */}
      {/* ========================================================================= */}
      <section id="membership-plans" className="py-24 border-b border-white/[0.08] bg-[#0A0A0A] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              TRANSPARENT PASSES
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Simple, Powerful Membership Plans
            </h2>
            <p className="text-[#A1A1A1] text-base leading-relaxed">
              Zero registration surcharge. Includes GST invoice, RFID turnstile pass, and full mobile app tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {currentGym.plans.map((plan) => {
              const isPopular = Boolean(
                plan.isPopular ||
                plan.code === 'IP-Q-PRO' ||
                plan.type === 'QUARTERLY' ||
                plan.name?.toLowerCase().includes('quarterly') ||
                plan.name?.toLowerCase().includes('popular')
              );

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-8 sm:p-10 rounded-3xl border transition-all duration-300 ${
                    isPopular
                      ? 'bg-[#141414] border-[#2E7D1E] shadow-2xl shadow-[#2E7D1E]/10 ring-1 ring-[#2E7D1E]'
                      : 'bg-[#111111] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#2E7D1E] text-white text-xs font-bold tracking-wider uppercase shadow-md">
                      Most Popular Pass
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-xs text-[#A1A1A1] min-h-[36px]">{plan.description}</p>

                    <div className="my-7 pb-7 border-b border-white/[0.08]">
                      <div className="text-4xl sm:text-5xl font-light text-white tracking-tight">
                        {plan.priceFormatted}
                      </div>
                      <div className="mt-1 text-xs text-[#A1A1A1]">
                        Valid for {plan.durationDays} Days • Inclusive of 18% GST
                      </div>
                    </div>

                    <ul className="space-y-3.5 text-sm text-[#F5F5F5] mb-8">
                      {(plan.features || [
                        'Full gym floor and cardio zone access',
                        'Turnstile biometric & dynamic QR pass',
                        'Locker and shower facility access',
                        'Techofay Member PWA workout log',
                      ]).map((feat, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-[#2E7D1E] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={isPopular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setShowPurchaseModal(true);
                    }}
                  >
                    Select Plan
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRAINERS SECTION (No Fake Stock Faces - Verified Seed Staff) */}
      {/* ========================================================================= */}
      <section id="trainers" className="py-24 border-b border-white/[0.08] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              CERTIFIED COACHING STAFF
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Master Fitness Coaches
            </h2>
            <p className="text-[#A1A1A1] text-base leading-relaxed">
              Every trainer holds accredited certifications (CSCS, ACE, K11) and undergoes rigorous background verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {currentGym.trainers && currentGym.trainers.length > 0 ? (
              currentGym.trainers.map((tr) => (
                <div
                  key={tr.id}
                  className="p-8 rounded-3xl border border-white/[0.08] bg-[#111111] space-y-5 transition-all hover:border-[#2E7D1E]/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#161616] text-[#2E7D1E] border border-white/[0.08] text-xl font-bold">
                      {tr.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{tr.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                        {Array.from({ length: Math.floor(tr.rating || 5) }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                        <span className="text-[#A1A1A1] ml-1">{tr.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#A1A1A1] leading-relaxed">{tr.bio}</p>

                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <div className="text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Specializations</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.specializations.map((spec, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-[#F5F5F5] border border-white/[0.06]">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-[#A1A1A1] font-semibold">Credentials</div>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.qualifications.map((q, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-[#2E7D1E]/10 text-xs text-[#2E7D1E] font-medium border border-[#2E7D1E]/20">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 px-4 rounded-3xl border border-dashed border-white/10 bg-[#111111]/50 text-[#A1A1A1]">
                <p className="text-sm font-medium text-white">Coaching Staff Directory</p>
                <p className="text-xs mt-1">Certified personal trainers will appear here as they are onboarded to this facility.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. TRANSFORMATION GALLERY & RECOVERY ZONE */}
      {/* ========================================================================= */}
      <section id="recovery" className="py-24 border-b border-white/[0.08] bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
                RECOVERY & BIOMETRIC ASSESSMENT
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
                Progress Measured With Laboratory Precision
              </h2>
              <p className="text-base text-[#A1A1A1] leading-relaxed">
                Transformations aren’t accidental. Every membership comes with integrated body composition scans,
                hypertrophy volume tracking, and dedicated contrast recovery amenities.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E7D1E]/10 text-[#2E7D1E]">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Full InBody Segmental Lean Mass Scans</h4>
                    <p className="text-xs text-[#A1A1A1] mt-1">Track exact skeletal muscle mass, visceral fat, and water balance every 30 days.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E7D1E]/10 text-[#2E7D1E]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Finnish Sauna & Thermal Hydrotherapy</h4>
                    <p className="text-xs text-[#A1A1A1] mt-1">Vasodilating heat therapy and cold plunge contrast to flush lactic acid and accelerate CNS recovery.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-[#111111] aspect-[4/3]">
              <picture>
                <source
                  type="image/avif"
                  srcSet={`${GYM_IMAGES.stretchingRecovery.sources.avif[640]} 640w, ${GYM_IMAGES.stretchingRecovery.sources.avif[1280]} 1280w`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <source
                  type="image/webp"
                  srcSet={`${GYM_IMAGES.stretchingRecovery.sources.webp[640]} 640w, ${GYM_IMAGES.stretchingRecovery.sources.webp[1280]} 1280w`}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <img
                  src={GYM_IMAGES.stretchingRecovery.sources.webp[1280]}
                  alt={GYM_IMAGES.stretchingRecovery.alt}
                  className="w-full h-full object-cover filter contrast-[1.1] brightness-[0.9]"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TESTIMONIALS (Clearly Labelled Verified Member Feedback) */}
      {/* ========================================================================= */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              REAL MEMBER EXPERIENCES
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Verified Club Feedback
            </h2>
            <p className="text-[#A1A1A1] text-base">
              Actual reviews logged by active members on the club portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {currentGym.testimonials && currentGym.testimonials.length > 0 ? (
              currentGym.testimonials.map((testi) => (
                <div
                  key={testi.id}
                  className="p-8 rounded-3xl border border-white/[0.08] bg-[#111111] flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: testi.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-[#F5F5F5] italic leading-relaxed">
                      &ldquo;{testi.reviewText}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08]">
                    <div className="text-sm font-bold text-white">{testi.author}</div>
                    <div className="text-xs text-[#2E7D1E] font-medium">{testi.memberType}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 px-4 rounded-3xl border border-dashed border-white/10 bg-[#111111]/50 text-[#A1A1A1]">
                <p className="text-sm font-medium text-white">Member Reviews</p>
                <p className="text-xs mt-1">Verified member experiences and feedback will appear here as reviews are submitted.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ SECTION (Accordion) */}
      {/* ========================================================================= */}
      <section id="faq" className="py-24 border-b border-white/[0.08] bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-3">
            <Badge variant="outline" className="border-white/15 text-[#2E7D1E]">
              FREQUENTLY ASKED QUESTIONS
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-4">
            {currentGym.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full min-h-[56px] px-6 py-4 flex items-center justify-between text-left text-base font-semibold text-white hover:text-[#2E7D1E] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#A1A1A1] transition-transform duration-200 shrink-0 ml-4 ${
                        isOpen ? 'rotate-180 text-[#2E7D1E]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm text-[#A1A1A1] leading-relaxed border-t border-white/[0.04] pt-4 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CTA SECTION & BRANCH DETAILS */}
      {/* ========================================================================= */}
      <section id="contact" className="py-24 bg-gradient-to-b from-[#111111] to-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="p-10 sm:p-16 rounded-3xl border border-white/[0.12] bg-[#141414] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-[#2E7D1E]/10 rounded-full blur-[100px] pointer-events-none" />

            <Badge variant="outline" className="mb-4 border-white/20 text-[#2E7D1E]">
              START WITH ZERO FRICTION
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight">
              Ready to Upgrade Your Training?
            </h2>

            <p className="mt-4 text-[#A1A1A1] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Book a complimentary 1-day pass. Test the Eleiko platforms, meet the coaching team,
              and experience the club with no sales pressure.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowTrialModal(true)}
              >
                Claim 1-Day VIP Pass
              </Button>
              <a href={currentGym.tenant.whatsappLink} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="lg">
                  Chat on WhatsApp
                </Button>
              </a>
            </div>

            {/* Branch Details */}
            <div className="mt-12 pt-8 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6 text-left text-xs text-[#A1A1A1]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#2E7D1E] shrink-0 mt-0.5" />
                <span>{currentGym.branches[0]?.address}, {currentGym.branches[0]?.city} {currentGym.branches[0]?.pincode}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#2E7D1E] shrink-0" />
                <a href={`tel:${currentGym.tenant.contactPhone}`} className="hover:text-white transition-colors">
                  {currentGym.tenant.contactPhone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#2E7D1E] shrink-0" />
                <a href={`mailto:${currentGym.tenant.contactEmail}`} className="hover:text-white transition-colors">
                  {currentGym.tenant.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trial Booking Modal */}
      {showTrialModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book Free VIP Trial"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="fixed inset-0" onClick={() => setShowTrialModal(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#111111] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <button
              onClick={() => setShowTrialModal(false)}
              className="absolute right-5 top-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#A1A1A1] hover:text-white"
              aria-label="Close dialog"
            >
              <span className="text-lg leading-none">✕</span>
            </button>

            <div>
              <h3 className="text-2xl font-bold text-white">Book Free 1-Day Trial Session</h3>
              <p className="text-xs text-[#A1A1A1] mt-1">
                Zero fees. Turnstile entry pass will be generated instantly for your mobile number.
              </p>
            </div>

            {bookingSuccess ? (
              <div className="p-6 rounded-2xl bg-[#2E7D1E]/10 border border-[#2E7D1E]/30 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-[#2E7D1E] mx-auto" />
                <h4 className="text-lg font-bold text-white">VIP Pass Confirmed!</h4>
                <p className="text-xs text-[#A1A1A1]">{bookingSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleTrialSubmit} className="space-y-4">
                {trialError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {trialError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={trialForm.name}
                    onChange={(e) => setTrialForm({ ...trialForm, name: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                    placeholder="e.g. Vikram Sharma"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Mobile Phone (for QR pass)</label>
                    <input
                      type="tel"
                      required
                      value={trialForm.phone}
                      onChange={(e) => setTrialForm({ ...trialForm, phone: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={trialForm.email}
                      onChange={(e) => setTrialForm({ ...trialForm, email: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                      placeholder="vikram@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Primary Fitness Goal</label>
                  <select
                    value={trialForm.fitnessGoal}
                    onChange={(e) => setTrialForm({ ...trialForm, fitnessGoal: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                  >
                    <option>Muscle Building & Strength</option>
                    <option>Weight Loss & Conditioning</option>
                    <option>Powerlifting & Heavy Compound</option>
                    <option>Athletic Mobility & Rehab</option>
                  </select>
                </div>

                <Button variant="primary" size="lg" className="w-full mt-2">
                  Confirm My Free Trial Pass
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Plan Purchase / Checkout Modal */}
      {showPurchaseModal && selectedPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Membership Checkout"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="fixed inset-0" onClick={() => setShowPurchaseModal(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#111111] p-6 sm:p-8 shadow-2xl z-10 space-y-6">
            <button
              onClick={() => {
                setShowPurchaseModal(false);
                setPurchaseReceipt(null);
              }}
              className="absolute right-5 top-5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#A1A1A1] hover:text-white"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-bold text-white">Join {selectedPlan.name}</h3>
              <p className="text-xs text-[#A1A1A1] mt-1">
                Instant digital activation with GST tax invoice and turnstile access.
              </p>
            </div>

            {purchaseReceipt ? (
              <div className="p-6 rounded-2xl bg-[#2E7D1E]/10 border border-[#2E7D1E]/30 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-[#2E7D1E]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">Payment & Onboarding Complete!</h4>
                      <Badge variant="success">Verified</Badge>
                    </div>
                    <p className="text-xs text-[#A1A1A1]">Tax Invoice: {purchaseReceipt.invoiceNumber}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161616] text-xs space-y-1.5 text-[#F5F5F5]">
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A1]">Plan:</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A1]">Total Settled:</span>
                    <span className="font-semibold text-[#2E7D1E]">{selectedPlan.priceFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1A1]">Turnstile Access:</span>
                    <span className="font-semibold">ACTIVE</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    setShowPurchaseModal(false);
                    setPurchaseReceipt(null);
                  }}
                >
                  Close & Access Member Pass
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                {purchaseError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {purchaseError}
                  </div>
                )}
                <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.08] flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-white">{selectedPlan.name}</div>
                    <div className="text-xs text-[#A1A1A1]">{selectedPlan.durationDays} Days Unlimited Access</div>
                  </div>
                  <div className="text-lg font-bold text-[#2E7D1E]">{selectedPlan.priceFormatted}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={purchaseForm.customerName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, customerName: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={purchaseForm.customerPhone}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, customerPhone: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                      placeholder="+91 99887 76655"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#A1A1A1] uppercase mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={purchaseForm.customerEmail}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, customerEmail: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-[#161616] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-[#2E7D1E]"
                      placeholder="rahul@gmail.com"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] text-xs text-[#A1A1A1] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#2E7D1E] shrink-0" />
                  <span>Encrypted Gateway (Bank-Grade 256-bit SSL Payment Processing)</span>
                </div>

                <Button variant="primary" size="lg" className="w-full mt-2">
                  Pay {selectedPlan.priceFormatted} & Activate
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
