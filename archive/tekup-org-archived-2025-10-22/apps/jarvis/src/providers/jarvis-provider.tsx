'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useJarvisStore } from '@/store/jarvis-store';

interface JarvisContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const JarvisContext = createContext<JarvisContextType | null>(null);

export function useJarvis() {
  const context = useContext(JarvisContext);
  if (!context) {
    throw new Error('useJarvis must be used within JarvisProvider');
  }
  return context;
}

interface JarvisProviderProps {
  children: React.ReactNode;
}

export function JarvisProvider({ children }: JarvisProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { setConsciousnessLevel, addSystemMessage, setApiStatus } = useJarvisStore();

  useEffect(() => {
    // Check if WebSocket should be disabled (for standalone mode)
    const disableWebSocket = process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true';
    
    if (disableWebSocket) {
      console.log('💡 WebSocket disabled - Jarvis running in standalone mode');
      setConnectionStatus('connected');
      setApiStatus('connected');
      setIsConnected(false); // WebSocket not connected, but API works
      return;
    }
    
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3003';
    const newSocket = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: false, // Disable aggressive reconnection
      reconnectionDelay: 5000,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    setConnectionStatus('connecting');
    
    // Set a timeout to stop trying after 3 seconds
    const connectionTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        console.log('⚠️ WebSocket connection timeout - continuing without real-time features');
        setConnectionStatus('disconnected');
        setApiStatus('connected'); // API still works
        newSocket.close();
      }
    }, 3000);
    
    newSocket.on('connect', () => {
      clearTimeout(connectionTimeout);
      console.log('🔗 Jarvis connected to Tekup ecosystem');
      setIsConnected(true);
      setConnectionStatus('connected');
      setApiStatus('connected');
      addSystemMessage('Jarvis er nu tilsluttet Tekup-systemet');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Jarvis disconnected from Tekup ecosystem');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setApiStatus('connected'); // API still works without WebSocket
    });

    newSocket.on('connect_error', (error) => {
      // Only log once, not repeatedly
      if (connectionStatus === 'connecting') {
        console.log('⚠️ WebSocket not available - continuing with REST API only');
        setConnectionStatus('disconnected');
        setApiStatus('connected'); // API still works
      }
    });

    // Listen for consciousness updates
    newSocket.on('consciousness_update', (data: { level: number; insights: string[] }) => {
      setConsciousnessLevel(data.level);
      addSystemMessage(`AI Consciousness niveau opdateret: ${data.level}/10`);
    });

    // Listen for system events
    newSocket.on('system_event', (event: { type: string; message: string; data?: any }) => {
      addSystemMessage(`System: ${event.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [setConsciousnessLevel, addSystemMessage, setApiStatus]);

  const value: JarvisContextType = {
    socket,
    isConnected,
    connectionStatus,
  };

  return (
    <JarvisContext.Provider value={value}>
      {children}
    </JarvisContext.Provider>
  );
}