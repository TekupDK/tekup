import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Zap, 
  Plus, 
  FileText, 
  MessageSquare, 
  Users, 
  TrendingUp,
  BarChart3,
  Settings,
  Search,
  Command,
  Rocket,
  Brain,
  Lightbulb
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface QuickActionsProps {
  onClose: () => void
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
  category: 'create' | 'ai' | 'navigate' | 'tools'
  permissions?: string[]
  shortcut?: string
}

export default function QuickActions({ onClose }: QuickActionsProps) {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const quickActions: QuickAction[] = [
    // Create Actions
    {
      id: 'create-proposal',
      title: 'Generer AI Forslag',
      description: 'Opret nyt forslag fra sales call transcript',
      icon: <Zap className="w-5 h-5" />,
      category: 'create',
      permissions: ['proposal:write'],
      shortcut: '⌘ + N',
      action: () => {
        navigate('/proposal-engine/create')
        onClose()
      }
    },
    {
      id: 'create-content',
      title: 'Generer Indhold',
      description: 'Skab blog posts, sociale medier eller marketing indhold',
      icon: <FileText className="w-5 h-5" />,
      category: 'create',
      permissions: ['content:write'],
      action: () => {
        navigate('/content-generator/create')
        onClose()
      }
    },
    {
      id: 'create-campaign',
      title: 'Ny Marketing Kampagne',
      description: 'Start en AI-optimeret marketing kampagne',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'create',
      permissions: ['marketing:write'],
      action: () => {
        navigate('/marketing/campaigns/create')
        onClose()
      }
    },
    {
      id: 'add-contact',
      title: 'Tilføj Kontakt',
      description: 'Opret ny kontakt i CRM systemet',
      icon: <Users className="w-5 h-5" />,
      category: 'create',
      permissions: ['crm:write'],
      action: () => {
        navigate('/crm/contacts/create')
        onClose()
      }
    },

    // AI Actions
    {
      id: 'ai-insights',
      title: 'AI Insights Dashboard',
      description: 'Se de seneste AI-genererede indsigter',
      icon: <Brain className="w-5 h-5" />,
      category: 'ai',
      action: () => {
        navigate('/analytics/ai-insights')
        onClose()
      }
    },
    {
      id: 'ai-recommendations',
      title: 'AI Anbefalinger',
      description: 'Få personaliserede anbefalinger til din business',
      icon: <Lightbulb className="w-5 h-5" />,
      category: 'ai',
      action: () => {
        navigate('/analytics/recommendations')
        onClose()
      }
    },
    {
      id: 'chat-support',
      title: 'AI Chat Assistant',
      description: 'Start en samtale med AI support assistenten',
      icon: <MessageSquare className="w-5 h-5" />,
      category: 'ai',
      action: () => {
        navigate('/customer-support/chat')
        onClose()
      }
    },

    // Navigation
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Se performance metrics og business intelligence',
      icon: <BarChart3 className="w-5 h-5" />,
      category: 'navigate',
      permissions: ['analytics:read'],
      shortcut: '⌘ + A',
      action: () => {
        navigate('/analytics')
        onClose()
      }
    },
    {
      id: 'voice-ai',
      title: 'Voice AI Studio',
      description: 'Arbejd med stemme og computer vision AI',
      icon: <Rocket className="w-5 h-5" />,
      category: 'navigate',
      permissions: ['voice:read'],
      action: () => {
        navigate('/voice-ai')
        onClose()
      }
    },

    // Tools
    {
      id: 'settings',
      title: 'Platform Indstillinger',
      description: 'Konfigurer AI services og kontoindstillinger',
      icon: <Settings className="w-5 h-5" />,
      category: 'tools',
      shortcut: '⌘ + ,',
      action: () => {
        navigate('/settings')
        onClose()
      }
    },
    {
      id: 'global-search',
      title: 'Global Søgning',
      description: 'Søg på tværs af alle AI services og data',
      icon: <Search className="w-5 h-5" />,
      category: 'tools',
      shortcut: '⌘ + K',
      action: () => {
        // This would trigger the global search modal
        onClose()
      }
    }
  ]

  // Filter actions based on permissions and search
  const filteredActions = quickActions.filter(action => {
    // Check permissions
    if (action.permissions && !action.permissions.some(permission => hasPermission(permission))) {
      return false
    }
    
    // Check search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  // Group actions by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) acc[action.category] = []
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'create': return { title: 'Opret Ny', color: 'text-success-400' }
      case 'ai': return { title: 'AI Værktøjer', color: 'text-primary-400' }
      case 'navigate': return { title: 'Navigation', color: 'text-accent-400' }
      case 'tools': return { title: 'Værktøjer', color: 'text-warning-400' }
      default: return { title: 'Andre', color: 'text-slate-400' }
    }
  }

  return (
    <div className="h-full flex flex-col glass-dark border-l border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="text-sm text-slate-400">Hurtige genvejer til AI services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Søg handlinger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([category, actions]) => {
            const categoryInfo = getCategoryInfo(category)
            
            return (
              <div key={category}>
                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${categoryInfo.color}`}>
                  {categoryInfo.title}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {actions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={action.action}
                      className="p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 rounded-lg text-left transition-all duration-200 group hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${categoryInfo.color.replace('text-', 'bg-').replace('-400', '-500/20')} ${categoryInfo.color}`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white group-hover:text-primary-300 transition-colors">
                              {action.title}
                            </h4>
                            {action.shortcut && (
                              <span className="text-xs text-slate-400 font-mono bg-slate-700 px-2 py-1 rounded">
                                {action.shortcut}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )
          })}

          {filteredActions.length === 0 && (
            <div className="text-center py-12">
              <Command className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Ingen handlinger fundet</h3>
              <p className="text-slate-400">
                {searchQuery ? 'Prøv et andet søgeord' : 'Ingen tilgængelige handlinger'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-slate-400 text-center space-y-1">
          <div>Brug ⌘ + K for global søgning</div>
          <div>ESC for at lukke</div>
        </div>
      </div>
    </div>
  )
}
