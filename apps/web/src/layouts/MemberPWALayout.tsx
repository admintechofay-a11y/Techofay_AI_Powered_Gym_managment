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
    { label: 'Staff', path: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16 max-w-md mx-auto border-x border-border/40 shadow-2xl">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">GymOS Member Pass</h1>
            <p className="text-[10px] text-brand-600 font-medium">Digital Access Card</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <Outlet />
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto border-t border-border bg-card/95 backdrop-blur-md px-2 py-1.5">
        <div className="flex items-center justify-around">
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
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
