import { useState, useEffect, useCallback, useRef } from 'react';
import { InfrastructureMetric, APIPerformanceMetric, RealTimeMetric, SystemAlert } from '../types';

// WebSocket connection status
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseRealTimeMetricsOptions {
  enableInfrastructure: boolean;
  enableAPIPerformance: boolean;
  enableAlerts: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useRealTimeMetrics(options: UseRealTimeMetricsOptions) {
  const {
    enableInfrastructure,
    enableAPIPerformance,
    enableAlerts,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureMetric[]>([]);
  const [apiPerformanceData, setApiPerformanceData] = useState<APIPerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data generators for development
  const generateMockInfrastructureData = useCallback((): InfrastructureMetric => {
    const now = new Date().toISOString();
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: now,
      cpu_usage: Math.random() * 80 + 10, // 10-90%
      memory_usage: Math.random() * 70 + 20, // 20-90%
      disk_usage: Math.random() * 50 + 30, // 30-80%
      network_in: Math.random() * 1000 + 100, // 100-1100 KB/s
      network_out: Math.random() * 500 + 50, // 50-550 KB/s
      service_id: 'primary',
    };
  }, []);

  const generateMockAPIPerformanceData = useCallback((): APIPerformanceMetric => {
    const now = new Date().toISOString();
    const endpoints = ['/api/leads', '/api/auth', '/api/dashboard', '/api/analytics', '/api/invoices'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: now,
      endpoint,
      method,
      response_time: Math.random() * 500 + 50, // 50-550ms
      status_code: Math.random() > 0.9 ? Math.floor(Math.random() * 400) + 400 : 200,
      request_size: Math.random() * 10000 + 1000, // 1-11KB
      response_size: Math.random() * 50000 + 5000, // 5-55KB
      error_rate: Math.random() * 10, // 0-10%
    };
  }, []);

  const generateMockAlert = useCallback((): SystemAlert => {
    const severities: SystemAlert['severity'][] = ['low', 'medium', 'high', 'critical'];
    const services = ['API Gateway', 'Database', 'Cache Layer', 'Email Service', 'Auth Service'];
    const messages = [
      'High CPU usage detected',
      'Memory consumption above threshold',
      'Database connection pool exhausted',
      'API response time degradation',
      'Cache hit rate below normal',
      'Email delivery failure rate increased',
    ];

    return {
      id: Math.random().toString(36).substr(2, 9),
      severity: severities[Math.floor(Math.random() * severities.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      service_name: services[Math.floor(Math.random() * services.length)],
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
  }, []);

  // WebSocket connection
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      // In production, this would be your actual WebSocket URL
      // For now, we'll simulate with mock data
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com/metrics' 
        : 'ws://localhost:3001/metrics';

      if (process.env.NODE_ENV === 'development') {
        // Simulate WebSocket connection with mock data
        setConnectionStatus('connected');
        return;
      }

      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: RealTimeMetric = JSON.parse(event.data);
          handleRealTimeMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        attemptReconnect();
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        setError('WebSocket connection failed');
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to establish WebSocket connection');
      console.error('WebSocket connection error:', err);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleRealTimeMessage = useCallback((message: RealTimeMetric) => {
    switch (message.type) {
      case 'infrastructure':
        if (enableInfrastructure) {
          setInfrastructureData(prev => {
            const newData = [...prev, message.data as InfrastructureMetric];
            // Keep only last 100 data points
            return newData.slice(-100);
          });
        }
        break;
      case 'api_performance':
        if (enableAPIPerformance) {
          setApiPerformanceData(prev => {
            const newData = [...prev, message.data as APIPerformanceMetric];
            // Keep only last 200 data points
            return newData.slice(-200);
          });
        }
        break;
      case 'system_alert':
        if (enableAlerts) {
          setAlerts(prev => {
            const newAlert = message.data as SystemAlert;
            // Avoid duplicates
            if (prev.some(alert => alert.id === newAlert.id)) {
              return prev;
            }
            return [newAlert, ...prev.slice(0, 49)]; // Keep last 50 alerts
          });
        }
        break;
    }
  }, [enableInfrastructure, enableAPIPerformance, enableAlerts]);

  // Reconnection logic
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setError('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  // Mock data generation for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && connectionStatus === 'connected') {
      const infrastructureInterval = setInterval(() => {
        if (enableInfrastructure) {
          const mockData = generateMockInfrastructureData();
          setInfrastructureData(prev => {
            const newData = [...prev, mockData];
            return newData.slice(-100);
          });
        }
      }, 3000);

      const apiPerformanceInterval = setInterval(() => {
        if (enableAPIPerformance) {
          const mockData = generateMockAPIPerformanceData();
          setApiPerformanceData(prev => {
            const newData = [...prev, mockData];
            return newData.slice(-200);
          });
        }
      }, 2000);

      const alertInterval = setInterval(() => {
        if (enableAlerts && Math.random() > 0.95) { // 5% chance every 5 seconds
          const mockAlert = generateMockAlert();
          setAlerts(prev => [mockAlert, ...prev.slice(0, 49)]);
        }
      }, 5000);

      return () => {
        clearInterval(infrastructureInterval);
        clearInterval(apiPerformanceInterval);
        clearInterval(alertInterval);
      };
    }
  }, [
    connectionStatus, 
    enableInfrastructure, 
    enableAPIPerformance, 
    enableAlerts,
    generateMockInfrastructureData,
    generateMockAPIPerformanceData,
    generateMockAlert
  ]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  return {
    connectionStatus,
    infrastructureData,
    apiPerformanceData,
    alerts,
    error,
    reconnect,
    clearAlerts,
    acknowledgeAlert,
    isConnected: connectionStatus === 'connected',
    hasError: connectionStatus === 'error',
  };
}