import React, { useEffect, useState } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

interface NotificationContainerProps {
  notifications: Notification[]
  mobile?: boolean
}

export function NotificationContainer({ notifications, mobile = false }: NotificationContainerProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])

  useEffect(() => {
    setVisibleNotifications(notifications)
  }, [notifications])

  const removeNotification = (id: string) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className={`fixed z-50 ${
      mobile 
        ? 'bottom-4 left-4 right-4'
        : 'top-4 right-4 w-80'
    }`}>
      <div className="space-y-2">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative p-4 border rounded-lg shadow-lg transition-all duration-300 ease-in-out transform ${
              getNotificationStyles(notification.type)
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium">
                  {notification.title}
                </h4>
                <p className="mt-1 text-sm opacity-90">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs opacity-75">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Auto-dismiss progress bar */}
            {notification.duration && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10 rounded-b-lg overflow-hidden">
                <div 
                  className="h-full bg-black bg-opacity-20 transition-all ease-linear"
                  style={{
                    animation: `shrink ${notification.duration}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Toast notification hook for easy use
export function useToast() {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-com');

  const showToast = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    // This would typically use a toast context or global state
    // For now, we'll rely on the app context notifications
    logger.info('Toast:', notification)
  }
  
  return { showToast }
}