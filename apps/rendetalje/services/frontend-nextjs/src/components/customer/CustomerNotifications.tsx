'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Calendar, 
  MessageCircle,
  Star,
  Clock,
  MapPin,
  Settings
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking_confirmed' | 'reminder' | 'team_arrived' | 'job_completed' | 'review_request' | 'payment' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  jobId?: string;
  priority: 'low' | 'medium' | 'high';
}

interface CustomerNotificationsProps {
  customerId: string;
}

export const CustomerNotifications: React.FC<CustomerNotificationsProps> = ({
  customerId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    push: true,
    reminders: true,
    marketing: false
  });

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notifications (in real app, use WebSocket)
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [customerId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'team_arrived',
          title: 'Teamet er ankommet',
          message: 'Maria og Peter er lige ankommet til din adresse og går i gang om få minutter.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          jobId: 'JOB-123',
          priority: 'high'
        },
        {
          id: '2',
          type: 'reminder',
          title: 'Påmindelse: Rengøring i morgen',
          message: 'Husk at din rengøring er planlagt til i morgen kl. 10:00. Sørg for at være hjemme eller efterlade adgangsinstruktioner.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          jobId: 'JOB-124',
          priority: 'medium',
          actionUrl: '/customer/bookings/JOB-124',
          actionLabel: 'Se booking'
        },
        {
          id: '3',
          type: 'job_completed',
          title: 'Rengøring fuldført',
          message: 'Din rengøring er nu fuldført. Tjek resultatet og del gerne din oplevelse med os.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: true,
          jobId: 'JOB-122',
          priority: 'medium',
          actionUrl: '/customer/review/JOB-122',
          actionLabel: 'Giv vurdering'
        },
        {
          id: '4',
          type: 'booking_confirmed',
          title: 'Booking bekræftet',
          message: 'Din booking for standard rengøring d. 15. januar kl. 14:00 er bekræftet.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          jobId: 'JOB-125',
          priority: 'low'
        },
        {
          id: '5',
          type: 'payment',
          title: 'Betaling modtaget',
          message: 'Vi har modtaget din betaling på 850 kr for job #JOB-122. Tak for din betaling!',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          jobId: 'JOB-122',
          priority: 'low'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'team_arrived':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'job_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'review_request':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'payment':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Lige nu';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} min siden`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)} timer siden`;
    } else {
      return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Notifikationer</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Marker alle som læst
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900">Ingen notifikationer</h3>
                <p className="text-sm text-gray-500">Du har ingen nye notifikationer</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                                title="Marker som læst"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-600 text-xs"
                              title="Slet"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {notification.actionUrl && notification.actionLabel && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                window.location.href = notification.actionUrl!;
                                markAsRead(notification.id);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.actionLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  // Open notification settings
                  console.log('Open notification settings');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <Settings className="w-4 h-4 mr-1" />
                Indstillinger
              </button>
              
              <button
                onClick={() => {
                  // View all notifications
                  window.location.href = '/customer/notifications';
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Se alle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal (simplified) */}
      {/* This would be a separate component in a real implementation */}
    </div>
  );
};