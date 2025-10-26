import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner@2.0.3';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface RealtimeUpdate {
  endpoint: string;
  data: any;
  action: 'create' | 'update' | 'delete';
}

export function useRealtimeNotifications() {
  const { isAuthenticated, currentTenant } = useAuth();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const wsUrl = 'ws://localhost:3001/ws/notifications'; // Default for development

  const { isConnected: wsConnected, sendMessage } = useWebSocket(
    wsUrl,
    {
      onMessage: (message: WebSocketMessage) => {
        if (message.type === 'notification') {
          const notification = message.data as NotificationMessage;
          
          // Add to notifications list
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50
          
          // Update unread count
          if (!notification.read) {
            setUnreadCount(prev => prev + 1);
          }
          
          // Show toast notification
          const toastOptions = {
            duration: 5000,
            action: notification.actionUrl ? {
              label: 'View',
              onClick: () => window.open(notification.actionUrl, '_blank'),
            } : undefined,
          };

          switch (notification.type) {
            case 'success':
              toast.success(notification.title, toastOptions);
              break;
            case 'warning':
              toast.warning(notification.title, toastOptions);
              break;
            case 'error':
              toast.error(notification.title, toastOptions);
              break;
            default:
              toast.info(notification.title, toastOptions);
          }
        }
      },
      onConnect: () => {
        setIsConnected(true);
        console.log('Notification WebSocket connected');
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('Notification WebSocket disconnected');
      },
    }
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Send to server
    sendMessage({
      type: 'mark_read',
      data: { notificationId },
    });
  }, [sendMessage]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    
    // Send to server
    sendMessage({
      type: 'mark_all_read',
      data: {},
    });
  }, [sendMessage]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected: wsConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

export function useRealtimeUpdates() {
  const { isAuthenticated, currentTenant } = useAuth();
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const updateCallbacks = useRef<Map<string, (data: any) => void>>(new Map());

  const wsUrl = 'ws://localhost:3001/ws/updates'; // Default for development

  const { isConnected, sendMessage } = useWebSocket(
    wsUrl,
    {
      onMessage: (message: WebSocketMessage) => {
        if (message.type === 'update') {
          const update = message.data as RealtimeUpdate;
          
          // Store update
          setUpdates(prev => [update, ...prev.slice(0, 99)]); // Keep max 100
          
          // Trigger callbacks for this endpoint
          const callback = updateCallbacks.current.get(update.endpoint);
          if (callback) {
            callback(update.data);
          }
          
          // Trigger callbacks for wildcard listeners
          const wildcardCallback = updateCallbacks.current.get('*');
          if (wildcardCallback) {
            wildcardCallback(update);
          }
        }
      },
      onConnect: () => {
        console.log('Updates WebSocket connected');
      },
      onDisconnect: () => {
        console.log('Updates WebSocket disconnected');
      },
    }
  );

  const subscribe = useCallback((endpoint: string, callback: (data: any) => void) => {
    updateCallbacks.current.set(endpoint, callback);
    
    // Send subscription message to server
    sendMessage({
      type: 'subscribe',
      data: { endpoint },
    });
    
    return () => {
      updateCallbacks.current.delete(endpoint);
      sendMessage({
        type: 'unsubscribe',
        data: { endpoint },
      });
    };
  }, [sendMessage]);

  const unsubscribe = useCallback((endpoint: string) => {
    updateCallbacks.current.delete(endpoint);
    sendMessage({
      type: 'unsubscribe',
      data: { endpoint },
    });
  }, [sendMessage]);

  return {
    updates,
    isConnected,
    subscribe,
    unsubscribe,
  };
}

export function useLiveChat() {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState(0);

  const wsUrl = 'ws://localhost:3001/ws/chat'; // Default for development

  const { isConnected, sendMessage } = useWebSocket(
    wsUrl,
    {
      onMessage: (message: WebSocketMessage) => {
        switch (message.type) {
          case 'message':
            setMessages(prev => [...prev, message.data]);
            break;
          case 'typing':
            setIsTyping(message.data.isTyping);
            break;
          case 'agents_online':
            setOnlineAgents(message.data.count);
            break;
        }
      },
      onConnect: () => {
        console.log('Chat WebSocket connected');
      },
      onDisconnect: () => {
        console.log('Chat WebSocket disconnected');
      },
    }
  );

  const sendChatMessage = useCallback((text: string) => {
    const message = {
      type: 'message',
      data: {
        text,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        userName: user?.name,
      },
    };
    
    sendMessage(message);
    setMessages(prev => [...prev, { ...message.data, isOwn: true }]);
  }, [sendMessage, user]);

  const sendTyping = useCallback((isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      data: { isTyping },
    });
  }, [sendMessage]);

  return {
    messages,
    isTyping,
    onlineAgents,
    isConnected,
    sendMessage: sendChatMessage,
    sendTyping,
  };
}

// Base WebSocket hook
export function useWebSocket(
  url: string,
  options?: {
    onMessage?: (data: WebSocketMessage) => void;
    onError?: (error: Event) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  }
) {
  const { isAuthenticated, user, currentTenant } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options || {};

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('tekup_token');
    const tenantId = currentTenant?.id;
    
    const wsUrl = new URL(url);
    wsUrl.searchParams.set('token', token || '');
    if (tenantId) {
      wsUrl.searchParams.set('tenantId', tenantId);
    }

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setReconnectAttempt(0);
      options?.onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        options?.onMessage?.(message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      options?.onError?.(error);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      wsRef.current = null;
      options?.onDisconnect?.();

      // Attempt to reconnect if not manually closed
      if (event.code !== 1000 && reconnectAttempt < maxReconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
          connect();
        }, reconnectInterval);
      }
    };
  }, [isAuthenticated, user, currentTenant, url, reconnectAttempt, maxReconnectAttempts, reconnectInterval, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000); // Normal closure
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, [isConnected]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    reconnectAttempt,
    connect,
    disconnect,
  };
}