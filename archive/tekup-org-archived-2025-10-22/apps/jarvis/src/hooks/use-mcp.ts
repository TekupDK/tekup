'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMCPService, MCPService } from '@/services/mcp.service';
import { useJarvisStore } from '@/store/jarvis-store';

interface MCPHook {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Gmail functions
  readEmails: (limit?: number, query?: string) => Promise<any>;
  sendEmail: (to: string, subject: string, body: string) => Promise<any>;
  searchEmails: (query: string) => Promise<any>;
  
  // Calendar functions
  createEvent: (title: string, start: string, end: string, description?: string) => Promise<any>;
  listEvents: (timeMin?: string, timeMax?: string) => Promise<any>;
  updateEvent: (eventId: string, updates: any) => Promise<any>;
  deleteEvent: (eventId: string) => Promise<any>;
  
  // Automation
  triggerAutomation: (zapId: string, data: any) => Promise<any>;
}

export function useMCP(): MCPHook {
  const [mcpService] = useState<MCPService>(() => getMCPService());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addMessage, addInsight } = useJarvisStore();

  // Initialize MCP connection
  useEffect(() => {
    const connectMCP = async () => {
      setIsLoading(true);
      try {
        const connected = await mcpService.connect();
        setIsConnected(connected);
        if (connected) {
          addInsight('MCP Tools connected: Gmail, Calendar, Zapier');
          console.log('✅ MCP connected successfully');
        }
      } catch (err) {
        setError('Failed to connect MCP tools');
        console.error('MCP connection error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    connectMCP();

    // Listen for MCP events
    mcpService.on('tool_executed', (event) => {
      console.log('🔧 MCP tool executed:', event);
      addInsight(`MCP tool ${event.tool} executed successfully`);
    });

    mcpService.on('error', (error) => {
      console.error('❌ MCP error:', error);
      setError(error.message || 'MCP error occurred');
    });

    return () => {
      mcpService.removeAllListeners();
    };
  }, [mcpService, addInsight]);

  // Gmail functions
  const readEmails = useCallback(async (limit = 10, query?: string) => {
    setIsLoading(true);
    try {
      const result = await mcpService.readEmails(limit, query);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Læste ${result.data?.emails?.length || 0} emails fra Gmail`,
          metadata: { tools: ['mcp_gmail_read'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to read emails');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  const sendEmail = useCallback(async (to: string, subject: string, body: string) => {
    setIsLoading(true);
    try {
      const result = await mcpService.sendEmail(to, subject, body);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Email sendt til ${to}`,
          metadata: { tools: ['mcp_gmail_send'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to send email');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  const searchEmails = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const result = await mcpService.searchEmails(query);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Fandt ${result.data?.results?.length || 0} emails matchende "${query}"`,
          metadata: { tools: ['mcp_gmail_search'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to search emails');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  // Calendar functions
  const createEvent = useCallback(async (
    title: string,
    start: string,
    end: string,
    description?: string
  ) => {
    setIsLoading(true);
    try {
      const result = await mcpService.createCalendarEvent(title, start, end, description);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Kalender event "${title}" oprettet`,
          metadata: { tools: ['mcp_calendar_create'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to create calendar event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  const listEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    setIsLoading(true);
    try {
      const result = await mcpService.listCalendarEvents(timeMin, timeMax);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Fandt ${result.data?.events?.length || 0} kalender events`,
          metadata: { tools: ['mcp_calendar_list'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to list calendar events');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  const updateEvent = useCallback(async (eventId: string, updates: any) => {
    setIsLoading(true);
    try {
      const result = await mcpService.updateCalendarEvent(eventId, updates);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Kalender event opdateret`,
          metadata: { tools: ['mcp_calendar_update'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to update calendar event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  const deleteEvent = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const result = await mcpService.deleteCalendarEvent(eventId);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Kalender event slettet`,
          metadata: { tools: ['mcp_calendar_delete'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to delete calendar event');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  // Automation
  const triggerAutomation = useCallback(async (zapId: string, data: any) => {
    setIsLoading(true);
    try {
      const result = await mcpService.triggerZap(zapId, data);
      if (result.success) {
        addMessage({
          type: 'assistant',
          content: `Zapier automation triggered`,
          metadata: { tools: ['mcp_zapier_trigger'] }
        });
      }
      return result.data;
    } catch (err) {
      setError('Failed to trigger automation');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mcpService, addMessage]);

  return {
    isConnected,
    isLoading,
    error,
    readEmails,
    sendEmail,
    searchEmails,
    createEvent,
    listEvents,
    updateEvent,
    deleteEvent,
    triggerAutomation
  };
}