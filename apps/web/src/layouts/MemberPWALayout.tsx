import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.js';
import {
  QrCode,
  Dumbbell,
  Apple,
  CalendarCheck,
  User,
  LayoutDashboard,
  Moon,
  Sun,
} from 'lucide-react';

export const MemberPWALayout: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Pass', path: '/member-portal', icon: QrCode },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'Nutrition', path: '/nutrition', icon: Apple },
    { label: 'Staff Console', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background w-full">
      {/* Top Header - Responsive for Mobile & Desktop */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/member-portal" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground leading-none tracking-tight">GymOS Member Pass</div>
              <p className="text-[11px] text-brand-600 font-semibold tracking-wide">Digital Access Card</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground">Aarav Nambiar</span>
              <span className="text-[10px] text-muted-foreground font-mono">IP-FIT-001</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile-Only Bottom Navigation Bar (Hidden on md and up) */}
      <nav className="md:hidden sticky bottom-0 z-40 w-full border-t border-border bg-card/95 backdrop-blur-md px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-primary font-bold scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
