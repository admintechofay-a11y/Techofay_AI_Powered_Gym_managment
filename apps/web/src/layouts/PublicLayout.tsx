import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.js';
import { Button } from '../components/ui/Button.js';
import {
  Dumbbell,
  Menu,
  X,
  Moon,
  Sun,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('gymos_lang', lang);
  };

  // Launch checklist 3: Mobile drawer focus trap, Escape key closes, scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] text-[#F5F5F5]">
      {/* Header: Slim, translucent with backdrop blur per DESIGN RULES */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0A]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo Left - Link to Home */}
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#2E7D1E] rounded-full p-1"
            aria-label="Techofay GymOS Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2E7D1E] text-white shadow-md shadow-[#2E7D1E]/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#F5F5F5]">Techofay GymOS</span>
          </Link>

          {/* Desktop Nav - Centered links per DESIGN RULES */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A1A1A1]">
            <Link to="/features" className="hover:text-[#F5F5F5] transition-colors py-2">
              {t('nav.features')}
            </Link>
            <Link to="/pricing" className="hover:text-[#F5F5F5] transition-colors py-2">
              {t('nav.pricing')}
            </Link>
            <Link to="/gym" className="hover:text-[#F5F5F5] transition-colors py-2">
              Tenant Demo Site
            </Link>
            <Link to="/blog" className="hover:text-[#F5F5F5] transition-colors py-2">
              Blog
            </Link>
            <Link to="/contact" className="hover:text-[#F5F5F5] transition-colors py-2">
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Right actions: Language, Theme, Outlined Sign In pill, Solid Green Sign Up pill */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-full border border-white/[0.08] bg-[#111111] p-0.5 text-xs">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  i18n.language === 'en' ? 'bg-[#2E7D1E] text-white' : 'text-[#A1A1A1] hover:text-white'
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  i18n.language === 'hi' ? 'bg-[#2E7D1E] text-white' : 'text-[#A1A1A1] hover:text-white'
                }`}
                aria-label="Switch to Hindi"
              >
                हिं
              </button>
              <button
                onClick={() => handleLanguageChange('gu')}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  i18n.language === 'gu' ? 'bg-[#2E7D1E] text-white' : 'text-[#A1A1A1] hover:text-white'
                }`}
                aria-label="Switch to Gujarati"
              >
                ગુ
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-[#A1A1A1] hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#2E7D1E]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Outlined "Sign In" Pill per DESIGN RULES */}
            <Link to="/login">
              <Button variant="secondary" size="sm">
                {t('nav.login')}
              </Button>
            </Link>

            {/* Solid Green "Sign Up" Pill per DESIGN RULES */}
            <Link to="/register">
              <Button variant="primary" size="sm">
                {t('nav.register')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button - min 44px touch target */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#A1A1A1]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#A1A1A1] hover:text-white"
              aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu Drawer with Focus Trap */}
        {mobileMenuOpen && (
          <div
            ref={drawerRef}
            data-testid="mobile-drawer"
            className="md:hidden border-b border-white/[0.08] bg-[#111111]/95 backdrop-blur-xl px-5 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200"
          >
            <Link
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] flex items-center py-2 text-base font-medium text-[#F5F5F5] hover:text-[#2E7D1E] transition-colors"
            >
              {t('nav.features')}
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] flex items-center py-2 text-base font-medium text-[#F5F5F5] hover:text-[#2E7D1E] transition-colors"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              to="/gym"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] flex items-center py-2 text-base font-medium text-[#F5F5F5] hover:text-[#2E7D1E] transition-colors"
            >
              Tenant Demo Site
            </Link>
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] flex items-center py-2 text-base font-medium text-[#F5F5F5] hover:text-[#2E7D1E] transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block min-h-[44px] flex items-center py-2 text-base font-medium text-[#F5F5F5] hover:text-[#2E7D1E] transition-colors"
            >
              {t('nav.contact')}
            </Link>

            <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 text-xs text-[#A1A1A1]">
                <span>Language:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`px-3 py-1.5 rounded-full ${i18n.language === 'en' ? 'bg-[#2E7D1E] text-white' : 'bg-white/5'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('hi')}
                    className={`px-3 py-1.5 rounded-full ${i18n.language === 'hi' ? 'bg-[#2E7D1E] text-white' : 'bg-white/5'}`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  {t('nav.register')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0A0A0A] text-[#F5F5F5]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2E7D1E] text-white">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold tracking-tight">Techofay GymOS</span>
              </Link>
              <p className="text-sm text-[#A1A1A1] leading-relaxed">
                India’s leading multi-tenant cloud gym operating system with biometric IoT turnstiles, automated WhatsApp engagement, and GST tax invoicing.
              </p>
              <div className="flex items-center gap-2 text-xs text-[#A1A1A1]">
                <ShieldCheck className="w-4 h-4 text-[#2E7D1E]" />
                <span>GST Compliant & ISO 27001 Security Ready</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-[#A1A1A1]">
                <li>
                  <Link to="/features" className="hover:text-white transition-colors">
                    Core Capabilities
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link to="/gym" className="hover:text-white transition-colors">
                    Branded Gym Site Template
                  </Link>
                </li>
                <li>
                  <Link to="/member-portal" className="hover:text-white transition-colors">
                    Member PWA
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-white transition-colors">
                    Gym Management Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Enterprise & Staff */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Management</h4>
              <ul className="space-y-2.5 text-sm text-[#A1A1A1]">
                <li>
                  <Link to="/dashboard" className="hover:text-white transition-colors">
                    Owner Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/crm" className="hover:text-white transition-colors">
                    CRM Lead Pipeline
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="hover:text-white transition-colors">
                    AI Retention Reports
                  </Link>
                </li>
                <li>
                  <Link to="/settings/integrations" className="hover:text-white transition-colors">
                    Hardware Integrations
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Enterprise Sales
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: India Contact Information (Checklist items 18 & 19) */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">India Headquarters</h4>
              <div className="space-y-3 text-sm text-[#A1A1A1]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#2E7D1E] shrink-0 mt-0.5" />
                  <span>Techofay Systems Pvt Ltd, BKC Complex, Bandra East, Mumbai 400051</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#2E7D1E] shrink-0" />
                  <a href="tel:+919988776655" className="hover:text-white transition-colors">
                    +91 99887 76655
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#2E7D1E] shrink-0" />
                  <a href="mailto:contact@techofay.com" className="hover:text-white transition-colors">
                    contact@techofay.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright bar (Checklist item 9) */}
          <div className="mt-12 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A1A1A1] gap-4">
            <p>&copy; {currentYear} Techofay Systems Pvt Ltd. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/features" className="hover:text-white transition-colors">
                Security & Isolation
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy (DPDP 2023)
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
