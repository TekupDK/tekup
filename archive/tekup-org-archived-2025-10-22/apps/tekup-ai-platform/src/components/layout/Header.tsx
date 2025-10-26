import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  Menu, 
  X, 
  Zap,
  ChevronDown,
  LogOut,
  Shield,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'

// Hooks
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAIServices } from '../../contexts/AIServiceContext'

// Components
import SearchModal from '../common/SearchModal'
import UserMenu from '../common/UserMenu'

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onToggleNotifications: () => void
  onToggleQuickActions: () => void
}

export default function Header({ 
  onToggleSidebar, 
  sidebarOpen, 
  onToggleNotifications,
  onToggleQuickActions 
}: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { overallHealth, healthyServices, totalServices } = useAIServices()
  const location = useLocation()
  
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Get current page title
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/proposal-engine')) return 'AI Proposal Engine'
    if (path.startsWith('/content-generator')) return 'Content Generator'
    if (path.startsWith('/customer-support')) return 'Customer Support'
    if (path.startsWith('/crm')) return 'CRM'
    if (path.startsWith('/marketing')) return 'Marketing'
    if (path.startsWith('/project-management')) return 'Project Management'
    if (path.startsWith('/analytics')) return 'Analytics'
    if (path.startsWith('/voice-ai')) return 'Voice AI'
    if (path.startsWith('/business-intelligence')) return 'Business Intelligence'
    if (path.startsWith('/settings')) return 'Indstillinger'
    if (path.startsWith('/admin')) return 'Administration'
    return 'TekUp AI Platform'
  }

  const getHealthColor = () => {
    switch (overallHealth) {
      case 'healthy': return 'text-success-400'
      case 'degraded': return 'text-warning-400'
      case 'unhealthy': return 'text-danger-400'
      default: return 'text-slate-400'
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark': return <Moon className="w-4 h-4" />
      case 'light': return <Sun className="w-4 h-4" />
      case 'system': return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 glass-dark border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Page Title & Breadcrumb */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-white">{getPageTitle()}</h1>
              <div className="flex items-center gap-2 mt-1">
                {/* Service Health Indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <div className={`flex items-center gap-1 ${getHealthColor()}`}>
                    <div className={`w-2 h-2 rounded-full ${
                      overallHealth === 'healthy' ? 'bg-success-400' :
                      overallHealth === 'degraded' ? 'bg-warning-400' : 'bg-danger-400'
                    }`} />
                    <span className="text-xs">
                      {healthyServices}/{totalServices} services aktive
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full glass rounded-lg px-4 py-2 text-left text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4" />
                <span className="text-sm">Søg AI services, kommandoer...</span>
                <div className="ml-auto flex gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-600/50 rounded">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-600/50 rounded">K</kbd>
                </div>
              </div>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search (Mobile) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 md:hidden"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              title={`Current theme: ${theme}`}
            >
              {getThemeIcon()}
            </button>

            {/* Quick Actions */}
            <button
              onClick={onToggleQuickActions}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Quick Actions"
            >
              <Zap className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full text-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full" />
              </span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-white">{user?.name}</div>
                  <div className="text-xs text-slate-400">{user?.tenant.name}</div>
                </div>
                <ChevronDown className="w-4 h-4 hidden lg:block" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-64 glass-dark rounded-xl border border-white/10 shadow-xl py-2 z-50"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        {user?.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user?.name}</div>
                        <div className="text-sm text-slate-400">{user?.email}</div>
                        <div className="text-xs text-accent-400">{user?.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      to="/settings/profile"
                      className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profil indstillinger</span>
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Indstillinger</span>
                    </Link>

                    {user?.role === 'SUPER_ADMIN' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Administration</span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-white/10 pt-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false)
                        logout()
                      }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left text-danger-300 hover:text-danger-200 hover:bg-danger-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log ud</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Page Title */}
        <div className="sm:hidden mt-3">
          <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
          <div className={`flex items-center gap-2 mt-1 text-xs ${getHealthColor()}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              overallHealth === 'healthy' ? 'bg-success-400' :
              overallHealth === 'degraded' ? 'bg-warning-400' : 'bg-danger-400'
            }`} />
            <span>{healthyServices}/{totalServices} services aktive</span>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)} 
        />
      )}
    </>
  )
}

