import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRealtimeNotifications, useRealtimeUpdates } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { Bell, Zap, Database, Users } from 'lucide-react';

interface RealtimeContextType {
  notifications: any[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribe: (endpoint: string, callback: (data: any) => void) => () => void;
  updates: any[];
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const {
    notifications,
    unreadCount,
    isConnected: notificationConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useRealtimeNotifications();

  const {
    updates,
    isConnected: updatesConnected,
    subscribe,
  } = useRealtimeUpdates();

  const isConnected = notificationConnected && updatesConnected;

  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('connecting');
    }
  }, [isAuthenticated, isConnected]);

  // Show connection status indicator
  useEffect(() => {
    if (isAuthenticated && connectionStatus === 'connected') {
      // Optional: Show brief success toast when connection is established
      console.log('Real-time connection established');
    }
  }, [connectionStatus, isAuthenticated]);

  const value: RealtimeContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    subscribe,
    updates,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      
      {/* Connection Status Indicator */}
      {isAuthenticated && (
        <ConnectionStatusIndicator 
          status={connectionStatus} 
          isVisible={connectionStatus !== 'connected'}
        />
      )}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

function ConnectionStatusIndicator({ 
  status, 
  isVisible 
}: { 
  status: 'connecting' | 'connected' | 'disconnected';
  isVisible: boolean;
}) {
  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: Zap,
          text: 'Connecting to real-time services...',
          className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
          iconClassName: 'text-yellow-500 animate-pulse',
        };
      case 'disconnected':
        return {
          icon: Database,
          text: 'Real-time connection lost. Retrying...',
          className: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
          iconClassName: 'text-red-500',
        };
      default:
        return {
          icon: Database,
          text: 'Connected',
          className: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
          iconClassName: 'text-green-500',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border glass backdrop-blur-sm ${config.className} transition-all duration-300`}
    >
      <Icon className={`w-4 h-4 ${config.iconClassName}`} />
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

// Hook for subscribing to specific data updates
export function useRealtimeData<T>(
  endpoint: string,
  initialData?: T
): {
  data: T | undefined;
  isStale: boolean;
  lastUpdate: Date | null;
} {
  const { subscribe } = useRealtime();
  const [data, setData] = useState<T | undefined>(initialData);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(endpoint, (newData: T) => {
      setData(newData);
      setLastUpdate(new Date());
      setIsStale(false);
    });

    return unsubscribe;
  }, [endpoint, subscribe]);

  // Mark data as stale after 5 minutes without updates
  useEffect(() => {
    if (!lastUpdate) return;

    const timeout = setTimeout(() => {
      setIsStale(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timeout);
  }, [lastUpdate]);

  return {
    data,
    isStale,
    lastUpdate,
  };
}

// Hook for real-time stats updates
export function useRealtimeStats() {
  const { data: stats, isStale } = useRealtimeData('/dashboard/stats');
  
  return {
    stats: stats || {
      totalLeads: 0,
      conversionRate: 0,
      activeDeals: 0,
      revenue: 0,
      customers: 0,
      aiAutomations: 0,
    },
    isStale,
  };
}

// Hook for real-time notifications with custom filtering
export function useNotifications(filter?: (notification: any) => boolean) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtime();
  
  const filteredNotifications = filter 
    ? notifications.filter(filter)
    : notifications;
    
  const filteredUnreadCount = filter
    ? notifications.filter(n => !n.read && filter(n)).length
    : unreadCount;

  return {
    notifications: filteredNotifications,
    unreadCount: filteredUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}