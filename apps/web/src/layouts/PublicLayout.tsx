import React, { useState } from 'react';
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
  CheckCircle2,
} from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('gymos_lang', lang);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Techofay GymOS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">
              {t('nav.features')}
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {t('nav.contact')}
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 rounded font-medium ${
                  i18n.language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2 py-1 rounded font-medium ${
                  i18n.language === 'hi' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                हिं
              </button>
              <button
                onClick={() => handleLanguageChange('gu')}
                className={`px-2 py-1 rounded font-medium ${
                  i18n.language === 'gu' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                ગુ
              </button>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="brand" size="sm">
                {t('nav.register')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-card px-4 pt-2 pb-6 space-y-3">
            <Link
              to="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-foreground"
            >
              {t('nav.features')}
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-foreground"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-foreground"
            >
              {t('nav.contact')}
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="brand" className="w-full">
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
      <footer className="border-t border-border bg-card text-card-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold">Techofay GymOS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Next-generation multi-tenant cloud gym management software with native biometric, WhatsApp automation, and GST billing.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>GST Compliant & ISO 27001 Security Ready</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/features" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link to="/member-portal" className="hover:text-foreground">
                    Member PWA
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">Enterprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/contact" className="hover:text-foreground">
                    Contact Sales
                  </Link>
                </li>
                <li>
                  <Link to="/settings/integrations" className="hover:text-foreground">
                    Integration Framework
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground">
                    Staff Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-3">India Offices</h4>
              <p className="text-sm text-muted-foreground">
                Techofay Systems Pvt Ltd<br />
                Bandra Kurla Complex, Mumbai 400051<br />
                Indiranagar 100ft Rd, Bengaluru 560038
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Support: contact@techofay.com
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
            <p>&copy; 2026 Techofay Systems Pvt Ltd. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/features" className="hover:text-foreground">
                Security & Isolation
              </Link>
              <Link to="/contact" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
