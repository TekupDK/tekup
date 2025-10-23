'use client'

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { Notification } from '@/types'
import { formatDate } from '@/lib/utils'

interface NotificationCenterProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  loading?: boolean
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  loading = false,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notifikationer</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Marker alle som læst
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Ingen notifikationer</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="text-xs text-primary-600 hover:text-primary-700 ml-2"
                              >
                                Marker som læst
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDate(notification.created_at, 'long')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700">
                  Se alle notifikationer
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}