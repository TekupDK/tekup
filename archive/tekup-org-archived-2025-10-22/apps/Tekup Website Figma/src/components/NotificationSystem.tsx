'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  Star, 
  AlertTriangle, 
  Users, 
  Brain,
  TrendingUp,
  MessageSquare,
  Calendar,
  DollarSign,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'ai' | 'lead' | 'meeting' | 'security';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
  avatar?: string;
  source?: string;
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: Notification) => void;
}

const notificationIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  ai: Brain,
  lead: Users,
  meeting: Calendar,
  security: Shield
};

const notificationColors = {
  success: 'emerald',
  warning: 'yellow',
  error: 'red',
  info: 'blue',
  ai: 'purple',
  lead: 'cyan',
  meeting: 'orange',
  security: 'red'
};

const priorityColors = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red'
};

// Mock notifications - I realtime app ville disse komme fra backend
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'ai',
    title: 'Jarvis AI Opdatering',
    message: 'AI har automatisk kvalificeret 5 nye leads og planlagt opfølgning',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    priority: 'medium',
    source: 'Jarvis AI',
    action: {
      label: 'Se leads',
      onClick: () => toast.success('Navigerer til leads...')
    }
  },
  {
    id: '2',
    type: 'lead',
    title: 'Nyt High-Value Lead',
    message: 'TechCorp A/S (€50k+ potentiale) har vist interesse',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    priority: 'high',
    source: 'Lead Platform',
    action: {
      label: 'Se profil',
      onClick: () => toast.success('Åbner lead profil...')
    }
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Meeting Reminder',
    message: 'Demo meeting med Danske Bank om 15 minutter',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    read: false,
    priority: 'urgent',
    source: 'Calendar',
    action: {
      label: 'Join meeting',
      onClick: () => toast.success('Starter meeting...')
    }
  },
  {
    id: '4',
    type: 'success',
    title: 'Lead Konverteret!',
    message: 'Novo Nordisk har underskrevet kontrakt på €85,000',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: true,
    priority: 'high',
    source: 'CRM System'
  },
  {
    id: '5',
    type: 'security',
    title: 'Sikkerhedsalarm',
    message: 'Unusual login attempt detected fra ukjent location',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    priority: 'urgent',
    source: 'Security System',
    action: {
      label: 'Review',
      onClick: () => toast.warning('Åbner sikkerhedslog...')
    }
  },
  {
    id: '6',
    type: 'info',
    title: 'System Opdatering',
    message: 'CRM systemet bliver opdateret i nat kl. 02:00-04:00',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    priority: 'low',
    source: 'System Admin'
  }
];

export function NotificationSystem({ onNotificationClick }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'priority'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Random chance to add new notification
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: ['ai', 'lead', 'success', 'info'][Math.floor(Math.random() * 4)] as Notification['type'],
          title: 'Ny Aktivitet',
          message: 'Der er sket noget nyt i systemet',
          timestamp: new Date(),
          read: false,
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Notification['priority'],
          source: 'Real-time System'
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for urgent notifications
        if (newNotification.priority === 'urgent') {
          toast.error(`⚠️ ${newNotification.title}: ${newNotification.message}`);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'priority':
        return notification.priority === 'high' || notification.priority === 'urgent';
      default:
        return true;
    }
  });

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Nu';
    if (minutes < 60) return `${minutes}m siden`;
    if (hours < 24) return `${hours}t siden`;
    return `${days}d siden`;
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                className={`w-5 h-5 p-0 flex items-center justify-center text-xs border-0 ${
                  urgentCount > 0 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-cyan-500'
                }`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-50"
            >
              <Card className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-white">Notifikationer</h3>
                      {unreadCount > 0 && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                          {unreadCount} nye
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center space-x-1 mt-3">
                    {[
                      { key: 'all', label: 'Alle' },
                      { key: 'unread', label: 'Ulæste' },
                      { key: 'priority', label: 'Prioritet' }
                    ].map((tab) => (
                      <Button
                        key={tab.key}
                        variant={filter === tab.key ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`text-xs ${
                          filter === tab.key
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>

                  {/* Actions */}
                  {unreadCount > 0 && (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Marker alle som læst
                      </Button>
                    </div>
                  )}
                </div>

                {/* Notification List */}
                <ScrollArea className="h-96">
                  <div className="p-2">
                    <AnimatePresence>
                      {filteredNotifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Ingen notifikationer</p>
                        </div>
                      ) : (
                        filteredNotifications.map((notification, index) => {
                          const Icon = notificationIcons[notification.type] || Info;
                          const color = notificationColors[notification.type] || 'gray';
                          const priorityColor = priorityColors[notification.priority];

                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ delay: index * 0.05 }}
                              className={`p-3 rounded-lg mb-2 cursor-pointer transition-all hover:bg-white/5 ${
                                !notification.read ? 'bg-white/5 border-l-4 border-l-cyan-400' : ''
                              }`}
                              onClick={() => {
                                markAsRead(notification.id);
                                onNotificationClick?.(notification);
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-4 h-4 text-${color}-400`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                                          {notification.title}
                                        </h4>
                                        <Badge 
                                          className={`px-1.5 py-0.5 text-xs bg-${priorityColor}-500/20 text-${priorityColor}-400 border border-${priorityColor}-400/30`}
                                        >
                                          {notification.priority}
                                        </Badge>
                                      </div>
                                      <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-300'}`}>
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                          <Clock className="w-3 h-3" />
                                          <span>{formatTimestamp(notification.timestamp)}</span>
                                          {notification.source && (
                                            <>
                                              <span>•</span>
                                              <span>{notification.source}</span>
                                            </>
                                          )}
                                        </div>
                                        {!notification.read && (
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                        )}
                                      </div>
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification.id);
                                      }}
                                      className="text-gray-500 hover:text-gray-300 ml-2"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  {notification.action && (
                                    <div className="mt-3">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          notification.action?.onClick();
                                        }}
                                        className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/30"
                                      >
                                        {notification.action.label}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}