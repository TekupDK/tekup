'use client';

import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';

export interface FridayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: 'navigate' | 'create' | 'update' | 'search' | 'call_function';
    payload: any;
  }>;
}

interface UseFridayChatOptions {
  sessionId?: string;
}

export function useFridayChat(options: UseFridayChatOptions = {}) {
  const [messages, setMessages] = useState<FridayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(options.sessionId || null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || loading) return;

    const user = useAuthStore.getState().user;
    if (!user) {
      setError('Du skal være logget ind for at bruge Friday AI');
      return;
    }

    // Add user message immediately
    const userMessage: FridayMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await apiClient.sendFridayMessage({
        message,
        sessionId: sessionId || undefined,
        context: {
          userRole: user.role || 'employee',
          organizationId: user.organization_id || '',
          currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
          recentActions: [],
        },
      });

      // Update session ID if new
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Add assistant response
      const assistantMessage: FridayMessage = {
        role: 'assistant',
        content: response.response.message,
        timestamp: new Date(),
        actions: response.response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Process actions if any
      if (response.response.actions && response.response.actions.length > 0) {
        response.response.actions.forEach((action) => {
          if (action.type === 'navigate' && typeof window !== 'undefined') {
            // Handle navigation actions
            const route = action.payload?.route;
            if (route) {
              window.location.href = route;
            }
          }
          // Other action types can be handled here
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err?.message || 'Kunne ikke sende besked. Prøv igen senere.');
      
      // Add error message
      const errorMessage: FridayMessage = {
        role: 'assistant',
        content: 'Beklager, jeg havde problemer med at behandle din forespørgsel. Prøv igen senere.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [loading, sessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const sessionData = await apiClient.getFridaySession(id);
      setSessionId(id);
      
      // Convert messages to FridayMessage format
      const loadedMessages: FridayMessage[] = sessionData.messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        actions: msg.metadata?.actions,
      }));
      
      setMessages(loadedMessages);
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError('Kunne ikke indlæse samtale');
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sessionId,
    sendMessage,
    clearMessages,
    loadSession,
  };
}

