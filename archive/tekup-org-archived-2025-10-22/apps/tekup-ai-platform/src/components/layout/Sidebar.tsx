import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  Zap, 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  FolderKanban, 
  BarChart3, 
  Mic, 
  PieChart,
  Settings,
  Shield,
  X,
  ChevronRight,
  Activity
} from 'lucide-react'

// Hooks
import { useAuth } from '../../contexts/AuthContext'
import { useAIServices } from '../../contexts/AIServiceContext'

interface SidebarProps {
  onClose: () => void
}

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  category: 'main' | 'ai-services' | 'tools'
  badge?: string
  description?: string
  permissions?: string[]
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <Home className="w-5 h-5" />,
    category: 'main',
    description: 'Oversigt over alle AI services'
  },
  {
    name: 'AI Proposal Engine',
    path: '/proposal-engine',
    icon: <Zap className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Generer forslag fra sales calls',
    permissions: ['proposal:read']
  },
  {
    name: 'Content Generator',
    path: '/content-generator',
    icon: <FileText className="w-5 h-5" />,
    category: 'ai-services',
    description: 'AI-drevet indholdsproduktion',
    permissions: ['content:read']
  },
  {
    name: 'Customer Support',
    path: '/customer-support',
    icon: <MessageCircle className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Intelligent kundesupport',
    permissions: ['support:read']
  },
  {
    name: 'Enhanced CRM',
    path: '/crm',
    icon: <Users className="w-5 h-5" />,
    category: 'ai-services',
    description: 'AI-forstærket CRM system',
    permissions: ['crm:read']
  },
  {
    name: 'Marketing Automation',
    path: '/marketing',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Automatiseret marketing',
    permissions: ['marketing:read']
  },
  {
    name: 'Project Management',
    path: '/project-management',
    icon: <FolderKanban className="w-5 h-5" />,
    category: 'ai-services',
    description: 'AI project assistance',
    permissions: ['project:read']
  },
  {
    name: 'Analytics Platform',
    path: '/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Predictive analytics',
    permissions: ['analytics:read']
  },
  {
    name: 'Voice AI & Vision',
    path: '/voice-ai',
    icon: <Mic className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Stemme og computer vision',
    permissions: ['voice:read']
  },
  {
    name: 'Business Intelligence',
    path: '/business-intelligence',
    icon: <PieChart className="w-5 h-5" />,
    category: 'ai-services',
    description: 'Avanceret BI og rapportering',
    permissions: ['bi:read']
  },
  {
    name: 'Indstillinger',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    category: 'tools',
    description: 'Platform konfiguration'
  }
]

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, hasPermission } = useAuth()
  const { getServiceStatus, isServiceHealthy } = useAIServices()
  const location = useLocation()

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => {
    if (!item.permissions) return true
    return item.permissions.some(permission => hasPermission(permission))
  })

  // Group items by category
  const groupedItems = filteredNavItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const getServiceHealthIndicator = (path: string) => {
    // Map paths to service categories for health indicators
    const serviceMap: Record<string, any> = {
      '/proposal-engine': 'PROPOSAL',
      '/content-generator': 'CONTENT',
      '/customer-support': 'SUPPORT',
      '/crm': 'CRM',
      '/marketing': 'MARKETING',
      '/project-management': 'PROJECT',
      '/analytics': 'ANALYTICS',
      '/voice-ai': 'VOICE_AI',
      '/business-intelligence': 'BUSINESS_INTELLIGENCE'
    }

    const serviceCategory = serviceMap[path]
    if (!serviceCategory) return null

    const isHealthy = isServiceHealthy(serviceCategory)
    return (
      <div className={`w-2 h-2 rounded-full ${
        isHealthy ? 'bg-success-400' : 'bg-warning-400'
      }`} />
    )
  }

  return (
    <div className="h-full flex flex-col glass-dark border-r border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L21 9V18L12 24L3 18V9L12 3Z" fill="white" opacity="0.9"/>
                <circle cx="12" cy="12" r="4" fill="currentColor" className="text-primary-600"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">TekUp AI</h2>
              <p className="text-xs text-slate-400">{user?.tenant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-8">
          {/* Main Navigation */}
          {groupedItems.main && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Hovedmenu
              </h3>
              <div className="space-y-1">
                {groupedItems.main.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="ml-auto w-1 h-6 bg-primary-500 rounded-full"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI Services */}
          {groupedItems['ai-services'] && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  AI Services
                </h3>
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-success-400" />
                  <span className="text-xs text-success-400">Aktiv</span>
                </div>
              </div>
              <div className="space-y-1">
                {groupedItems['ai-services'].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''} group`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.icon}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getServiceHealthIndicator(item.path)}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {groupedItems.tools && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Værktøjer
              </h3>
              <div className="space-y-1">
                {groupedItems.tools.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="ml-auto w-1 h-6 bg-primary-500 rounded-full"
                      />
                    )}
                  </Link>
                ))}
                
                {/* Admin Link */}
                {user?.role === 'SUPER_ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Administration</span>
                    {isActive('/admin') && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="ml-auto w-1 h-6 bg-primary-500 rounded-full"
                      />
                    )}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-2">TekUp AI Platform</div>
          <div className="text-xs text-slate-500">v1.0.0</div>
        </div>
      </div>
    </div>
  )
}
