import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessageCircle,
  Users,
  Target,
  Calendar,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  Mail,
  CheckCircle
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import GlobalSearch from './GlobalSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'AI Chat', href: '/chat', icon: MessageCircle, current: location.pathname === '/chat' },
    { name: 'Kunder', href: '/customers', icon: Users, current: location.pathname === '/customers' },
    { name: 'Customer 360', href: '/customer360', icon: Mail, current: location.pathname === '/customer360' },
    { name: 'Leads', href: '/leads', icon: Target, current: location.pathname === '/leads' },
    { name: 'Email Godkendelse', href: '/email-approval', icon: CheckCircle, current: location.pathname === '/email-approval' },
    { name: 'Bookinger', href: '/bookings', icon: Calendar, current: location.pathname === '/bookings' },
    { name: 'Kalender', href: '/calendar', icon: CalendarDays, current: location.pathname === '/calendar' },
    { name: 'Tilbud', href: '/quotes', icon: FileText, current: location.pathname === '/quotes' },
    { name: 'Statistik', href: '/analytics', icon: BarChart3, current: location.pathname === '/analytics' },
    { name: 'Services', href: '/services', icon: Settings, current: location.pathname === '/services' },
    { name: 'Indstillinger', href: '/settings', icon: Settings, current: location.pathname === '/settings' },
  ];

  const handleNavClick = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      action: () => setSearchOpen(true),
      description: 'Åbn søgning'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => handleNavClick('/'),
      description: 'Gå til Dashboard'
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      action: () => handleNavClick('/chat'),
      description: 'Gå til Chat'
    }
  ]);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col" style={{ background: 'var(--color-bg-elevated)', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105" style={{ background: 'linear-gradient(135deg, var(--color-primary), #0091B3)' }}>
                <span style={{ color: '#0A0A0A', fontWeight: 800, fontSize: '1rem' }}>R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-info))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>RenOS</h1>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Operating System</p>
              </div>
            </div>
            <button
              className="lg:hidden p-2 rounded-md transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(255, 255, 255, 0.03)' }}
              onClick={() => setSidebarOpen(false)}
              aria-label="Luk navigation menu"
            >
              <X className="h-5 w-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" data-testid="sidebar-nav">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const getIconColor = (name: string, isCurrent: boolean) => {
                if (isCurrent) return 'var(--color-primary)';
                if (name === 'Kunder' || name === 'Customer 360') return '#00D4FF';
                if (name === 'Leads') return '#00E676';
                if (name === 'Bookinger' || name === 'Kalender') return '#8B5CF6';
                if (name === 'Tilbud') return '#FFB300';
                if (name === 'Email Godkendelse') return '#00E676';
                if (name === 'AI Chat') return '#8B5CF6';
                return 'rgba(255, 255, 255, 0.4)';
              };
              return (
                <button
                  key={item.name}
                  data-testid={`nav-${item.href}`}
                  onClick={() => handleNavClick(item.href)}
                  aria-current={item.current ? 'page' : undefined}
                  aria-label={`Naviger til ${item.name}`}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 group"
                  style={{
                    background: item.current ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                    border: item.current ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
                    animationDelay: `${index * 50}ms`,
                    color: item.current ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.6)'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.current) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = 'var(--color-text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.current) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    }
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-all duration-200" style={{ color: getIconColor(item.name, item.current) }} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.current && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--color-primary)', animation: 'glow-pulse 2s ease-in-out infinite' }}></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="glass-card p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-info))' }}>
                  <User className="h-5 w-5" style={{ color: '#0A0A0A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>Admin</p>
                  <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>admin@rendetalje.dk</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6" style={{ background: 'rgba(10, 10, 10, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-glass/50 transition-all duration-200 hover:scale-105"
              onClick={() => setSidebarOpen(true)}
              aria-label="Åbn navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <button
              data-testid="header-search"
              onClick={() => setSearchOpen(true)}
              className="relative hidden md:flex items-center justify-between gap-3 min-w-[260px] px-4 py-2.5 text-base rounded-xl transition-all duration-200 group"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 transition-colors" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <span className="transition-colors" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Søg...</span>
              </div>
              <kbd className="px-2 py-1 text-xs rounded font-mono" style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.6)' }}>⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-md transition-all duration-200 hover:scale-105 group" style={{ background: 'rgba(255, 255, 255, 0.03)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
            >
              <Bell className="h-5 w-5" style={{ color: 'var(--color-text-primary)' }} />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF3D71, #FF1744)', animation: 'glow-pulse 2s ease-in-out infinite' }}>
                <span className="text-[10px] font-bold" style={{ color: '#FFFFFF' }}>10</span>
              </span>
            </button>

            {/* User Menu */}
            <div className="hover:scale-105 transition-transform duration-200">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg-primary)' }}>
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavClick}
      />
    </div>
  );
};

export default Layout;
