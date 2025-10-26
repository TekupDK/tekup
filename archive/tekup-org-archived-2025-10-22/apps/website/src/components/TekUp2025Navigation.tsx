import { useState, useRef, useEffect } from "react";
import { onActivate } from "@/lib/a11y";
import {
  Home,
  BarChart3,
  Brain,
  Settings,
  User,
  Search,
  Menu,
  X,
  Zap
} from "lucide-react";

interface NavItemProps {
  icon: any;
  label: string;
  isActive?: boolean;
  hasDropdown?: boolean;
  delay?: number;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, isActive = false, hasDropdown = false, delay = 0, onClick }: NavItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className={`relative px-4 py-2 rounded-lg transition-all duration-500 group ${
        isActive ? 'neo-elevated' : 'hover:neo-sunken'
      }`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Active State Background */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[var(--ai-primary)] to-[var(--ai-accent)] opacity-20" />
      )}

      {/* Content */}
      <div className="relative flex items-center space-x-3">
        <div
          className={`p-2 rounded-md transition-all duration-300 ${
            isActive ? 'text-[var(--ai-accent)]' : 'text-white/70 group-hover:text-[var(--ai-accent)]'
          }`}
          style={{
            backgroundColor: isHovered ? 'var(--ai-accent)20' : 'transparent',
          }}
        >
          <Icon className="w-5 h-5" />
        </div>

        <span className={`font-medium transition-colors duration-300 ${
          isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
        }`}>
          {label}
        </span>
      </div>

      {/* AI Insight Indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-[var(--holo-1)] rounded-full animate-pulse" />
        </div>
      )}
    </button>
  );
};

interface TekUp2025NavigationProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const TekUp2025Navigation = ({ currentPage = 'home', onNavigate }: TekUp2025NavigationProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Oversigt', id: 'home' },
    { icon: BarChart3, label: 'Dashboard', id: 'dashboard' },
    { icon: Brain, label: 'AI-modeller', id: 'ai-models', hasDropdown: true },
    { icon: Settings, label: 'Indstillinger', id: 'settings' },
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface-base)]/80 backdrop-blur-xl border-b border-white/10">
        {/* Holographic Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--ai-accent)] to-transparent opacity-50" />

        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="holo-shimmer p-2 rounded-lg">
                <Zap className="w-8 h-8 text-[var(--ai-accent)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TekUp.dk</h1>
                <p className="text-xs text-white/50">AI-drevne løsninger</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPage === item.id}
                  hasDropdown={item.hasDropdown}
                  delay={index * 100}
                  onClick={() => onNavigate?.(item.id)}
                />
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">

              {/* Search */}
              <div className="relative hidden md:block">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg neo-sunken hover:neo-elevated transition-all duration-300">
                  <Search className="w-4 h-4 text-white/60" />
                  <span className="text-sm text-white/60">Søg...</span>
                </button>
              </div>

              {/* Profile */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg neo-sunken hover:neo-elevated transition-all duration-300 group">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--ai-primary)] to-[var(--ai-accent)] flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 rounded-lg neo-sunken hover:neo-elevated transition-all duration-300"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
              >
                {isMobileOpen ? (
                  <X className="w-5 h-5 text-white/70" />
                ) : (
                  <Menu className="w-5 h-5 text-white/70" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            role="button"
            tabIndex={0}
            aria-label="Luk mobilmenu"
            onKeyDown={onActivate(() => setIsMobileOpen(false))}
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-16 left-0 right-0 bg-[var(--surface-base)]/95 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="space-y-4">
              {navItems.map((item, index) => (
                <NavItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPage === item.id}
                  hasDropdown={item.hasDropdown}
                  delay={index * 50}
                  onClick={() => {
                    onNavigate?.(item.id);
                    setIsMobileOpen(false);
                  }}
                />
              ))}
            </div>

            {/* Mobile Search */}
            <div className="mt-6">
              <div className="neo-sunken p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Søg..."
                    className="bg-transparent text-white placeholder-white/50 outline-none flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed navigation */}
      <div className="h-16" />
    </>
  );
};

export default TekUp2025Navigation;