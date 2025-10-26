import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Zap, 
  Clock,
  Filter,
  MoreVertical,
  Trash2,
  MarkAsUnread
} from 'lucide-react'

interface NotificationCenterProps {
  onClose: () => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info' | 'ai_insight'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    href: string
  }
  metadata?: Record<string, any>
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'AI Proposal Generated',
    message: 'Nyt forslag genereret for Acme Corp med 94% konfidenscore',
    type: 'ai_insight',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
    read: false,
    action: {
      label: 'Se forslag',
      href: '/proposal-engine/proposals/latest'
    }
  },
  {
    id: '2',
    title: 'Service Status Update',
    message: 'AI Customer Support service er nu fully operational',
    type: 'success',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    read: false
  },
  {
    id: '3',
    title: 'Quota Warning',
    message: 'Content Generator har brugt 85% af månedlig quota',
    type: 'warning',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    read: true,
    action: {
      label: 'Opgrader plan',
      href: '/settings/billing'
    }
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'Planlagt vedligeholdelse af Analytics Platform i nat kl. 02:00',
    type: 'info',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true
  },
  {
    id: '5',
    title: 'New AI Insights Available',
    message: 'Marketing Automation har identificeret 3 nye lead conversion patterns',
    type: 'ai_insight',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: true,
    action: {
      label: 'Se insights',
      href: '/marketing/insights'
    }
  }
]

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai_insights'>('all')

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'ai_insights') return notification.type === 'ai_insight'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-success-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning-400" />
      case 'error': return <AlertTriangle className="w-5 h-5 text-danger-400" />
      case 'ai_insight': return <Zap className="w-5 h-5 text-primary-400" />
      default: return <Info className="w-5 h-5 text-slate-400" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Lige nu'
    if (minutes < 60) return `${minutes}m siden`
    if (hours < 24) return `${hours}t siden`
    return `${days}d siden`
  }

  return (
    <div className="h-full flex flex-col glass-dark border-l border-white/10">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Notifikationer</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-400">
                  {unreadCount} ulæste meddelelser
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'all' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'unread' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ulæste
            </button>
            <button
              onClick={() => setFilter('ai_insights')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'ai_insights' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Insights
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Markér alle som læst
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-white/10">
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 hover:bg-white/5 transition-colors group ${
                  !notification.read ? 'bg-primary-500/5 border-l-2 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-white' : 'text-slate-300'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-400 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.action && (
                          <button className="text-xs text-primary-400 hover:text-primary-300 mt-2">
                            {notification.action.label} →
                          </button>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-slate-400 hover:text-white transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(notification.timestamp)}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                          >
                            Markér som læst
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-danger-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bell className="w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === 'unread' ? 'Ingen ulæste notifikationer' : 'Ingen notifikationer'}
            </h3>
            <p className="text-slate-400 text-sm">
              {filter === 'unread' 
                ? 'Du er opdateret! Der er ingen nye meddelelser.'
                : 'Notifikationer vil blive vist her når de ankommer.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-slate-400 text-center">
          Notifikationer opdateres i realtid
        </div>
      </div>
    </div>
  )
}
