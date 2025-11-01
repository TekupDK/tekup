/**
 * Type definitions for Google MCP Server
 */

// Calendar types
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink?: string;
  created?: string;
  updated?: string;
  status?: string;
  organizer?: {
    email: string;
    displayName?: string;
  };
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: CalendarEvent[];
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  attendees?: string[];
  timeZone?: string;
}

// Gmail types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
      size: number;
    };
    parts?: any[];
  };
  internalDate?: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  isHtml?: boolean;
}

export interface SearchEmailParams {
  query: string;
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
}

// MCP protocol types
export interface MCPToolRequest {
  tool: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime?: number;
}

// Error types
export interface GoogleApiErrorDetails {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  endpoint?: string;
  method?: string;
  code?: string;
  errors?: any[];
}

/**
 * Enhanced error class for Google API errors
 */
export class GoogleApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: GoogleApiErrorDetails
  ) {
    super(message);
    this.name = 'GoogleApiError';
  }
}
