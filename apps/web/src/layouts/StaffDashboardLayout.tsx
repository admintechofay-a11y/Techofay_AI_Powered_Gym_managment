import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Badge } from '../components/ui/Badge.js';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Receipt,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Building2,
  Menu,
  X,
  Dumbbell,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export const StaffDashboardLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, activeBranchId, setActiveBranchId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Command Palette Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.members'), path: '/members', icon: Users },
    { name: t('nav.memberships'), path: '/memberships', icon: CreditCard },
    { name: t('nav.attendance'), path: '/attendance', icon: CalendarCheck },
    { name: t('nav.billing'), path: '/billing', icon: Receipt },
    { name: t('nav.integrations'), path: '/settings/integrations', icon: Settings },
  ];

  const branches = [
    { id: 'branch-andheri-01', name: 'Andheri West Flagship' },
    { id: 'branch-bkc-02', name: 'BKC Premium Studio' },
    { id: 'branch-koramangala-03', name: 'Koramangala Fitness Hub' },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('gymos_lang', lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: '1', title: 'Payment Received', desc: '₹4,500 via UPI from Aarav Patel', time: '10m ago' },
    { id: '2', title: 'Plan Expiring', desc: 'Sneha Rao annual plan expires in 3 days', time: '1h ago' },
    { id: '3', title: 'Live Capacity Warning', desc: 'Floor reached 85% maximum safe capacity', time: '2h ago' },
  ];

  const commandItems = [
    { title: 'Go to Dashboard', path: '/dashboard', category: 'Navigation' },
    { title: 'View All Members', path: '/members', category: 'Navigation' },
    { title: 'Check In Member by QR or ID', path: '/attendance', category: 'Action' },
    { title: 'Generate Tax Invoice', path: '/billing', category: 'Action' },
    { title: 'Integration Diagnostics', path: '/settings/integrations', category: 'Settings' },
  ].filter((item) => item.title.toLowerCase().includes(cmdSearch.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-none">
                Techofay GymOS
              </span>
              <span className="text-[10px] font-medium text-brand-600 uppercase tracking-widest mt-0.5">
                Enterprise AI
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom User summary in Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.name || 'Administrator'}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="success" size="sm">
                  {user?.role || 'GYM_OWNER'}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Branch Switcher */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground cursor-pointer hover:bg-muted/50">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <select
                  value={activeBranchId || branches[0].id}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer pr-4"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Command Palette Trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search or Jump to...</span>
              <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">Notifications</span>
                    <Badge variant="info" size="sm">
                      3 New
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/60 py-1">
                    {notifications.map((n) => (
                      <div key={n.id} className="py-2 px-1">
                        <p className="text-xs font-medium text-foreground">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                        <span className="text-[10px] text-muted-foreground/70">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Member Portal Shortcut */}
            <Link
              to="/member-portal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-medium hover:bg-brand-500/20"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Member PWA</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal */}
      <Modal isOpen={cmdOpen} onClose={() => setCmdOpen(false)} title="Command Palette" size="md">
        <div className="space-y-4">
          <Input
            value={cmdSearch}
            onChange={(e) => setCmdSearch(e.target.value)}
            placeholder="Type a command or search destination..."
            leftIcon={<Search className="w-4 h-4" />}
            autoFocus
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {commandItems.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No matching commands found.</p>
            ) : (
              commandItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setCmdOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <Badge variant="outline" size="sm">
                    {item.category}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
