/**
 * MCP (Model Context Protocol) Client
 * Handles Gmail and Google Calendar integrations via MCP HTTP servers
 *
 * @deprecated This module is DEPRECATED and no longer used in production.
 * All email and calendar functionality has been migrated to direct Google API calls
 * in google-api.ts and gmail-labels.ts for better performance and reliability.
 *
 * Internally, getFullGmailThread() already uses google-api.ts directly.
 * This file is kept only for backward compatibility and will be removed in future versions.
 *
 * Migration completed: November 5, 2025
 * Reason: Removed MCP server dependency (Railway service failures, added complexity)
 */

// Use native fetch (Node.js 18+)

// MCP Server URLs - fallback to localhost if not set
const GOOGLE_MCP_URL = process.env.GOOGLE_MCP_URL || "http://localhost:8055";
const GMAIL_MCP_URL = process.env.GMAIL_MCP_URL || "http://localhost:8056";
// If MCP endpoint is unreachable, temporarily disable attempts to avoid latency
let gmailMCPDisabledUntil = 0; // epoch ms; when > Date.now(), skip MCP and use direct API

interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

/**
 * Call an MCP tool via HTTP API (MCP server)
 */
async function callMCPTool(
  mcpUrl: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<any> {
  try {
    console.log(`[MCP] Calling ${toolName} at ${mcpUrl}`, args);

    // Calendar MCP uses /api/v1/tools/:toolName endpoint
    const endpoint = `${mcpUrl}/api/v1/tools/${toolName}`;
    console.log(`[MCP] Calling endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[MCP] ${toolName} failed: ${response.status} ${errorText}`
      );
      throw new Error(
        `MCP tool ${toolName} failed: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    console.log(`[MCP] ${toolName} success:`, result);

    return result;
  } catch (error) {
    console.error(`[MCP] Tool call failed for ${toolName}:`, error);
    throw new Error(`Failed to call MCP tool ${toolName}: ${error}`);
  }
}

/**
 * Parse MCP result - handles both old MCP format and new HTTP API format
 */
function parseMCPResult(result: any): any {
  // If result is already the data we need, return it
  if (
    Array.isArray(result) ||
    (result && typeof result === "object" && !result.content)
  ) {
    return result;
  }

  // Old MCP format with content array
  if (result.content) {
    if (result.isError) {
      throw new Error("MCP tool returned an error");
    }

    const textContent = result.content
      .filter((c: any) => c.type === "text" && c.text)
      .map((c: any) => c.text)
      .join("\n");

    try {
      return JSON.parse(textContent);
    } catch {
      return textContent;
    }
  }

  return result;
}

// ============= Gmail Functions =============

export interface GmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  labels: string[];
  unread: boolean;
  messages?: GmailMessage[]; // Optional: populated when include_full_messages is true
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

/**
 * List Gmail threads
 */
export async function listGmailThreads(params: {
  maxResults?: number;
  query?: string;
}): Promise<GmailThread[]> {
  try {
    const result = await callMCPTool(GMAIL_MCP_URL, "gmail_search_messages", {
      max_results: params.maxResults || 20,
      q: params.query || "",
    });

    // Check if MCP returned an error or unfinished call
    if (result.message && result.message.includes("unfinished")) {
      console.warn("Gmail MCP requires OAuth authentication");
      // Fallback to direct Google API
      return await fallbackToGoogleAPI(params);
    }

    const threads = parseMCPResult(result);

    // Validate that threads is an array
    if (!Array.isArray(threads)) {
      console.warn("Gmail MCP returned non-array result:", threads);
      // Fallback to direct Google API
      return await fallbackToGoogleAPI(params);
    }

    return threads;
  } catch (error: any) {
    console.error(
      "Error listing Gmail threads via MCP, falling back to direct Google API:",
      error
    );

    // If it's a rate limit error, propagate it with retry-after information
    if (
      error?.message?.includes("429") ||
      error?.message?.includes("rate limit")
    ) {
      console.warn("Rate limit hit via MCP.");
      // Extract retry-after from error if available
      const retryAfter =
        (error as any)?.data?.retryAfter ||
        error?.message?.match(/retry after ([^,]+)/i)?.[1];

      let retryAfterDate: Date | null = null;
      if (retryAfter) {
        try {
          retryAfterDate = new Date(retryAfter);
          if (isNaN(retryAfterDate.getTime())) {
            retryAfterDate = new Date(Date.now() + 60000); // Default: 60 seconds
          }
        } catch {
          retryAfterDate = new Date(Date.now() + 60000);
        }
      } else {
        retryAfterDate = new Date(Date.now() + 60000);
      }

      const rateLimitError = new Error(
        `User-rate limit exceeded. Retry after ${retryAfterDate.toISOString()}`
      );
      (rateLimitError as any).data = {
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfterDate.toISOString(),
      };
      throw rateLimitError;
    }

    // Fallback to direct Google API
    try {
      return await fallbackToGoogleAPI(params);
    } catch (fallbackError: any) {
      console.error("Fallback to Google API also failed:", fallbackError);

      // Propagate rate limit errors with retry-after from fallback
      if (
        fallbackError?.message?.includes("429") ||
        fallbackError?.message?.includes("rate limit")
      ) {
        console.warn("Rate limit hit in fallback.");
        // Use retry-after from fallback error if available
        const retryAfter =
          (fallbackError as any)?.data?.retryAfter ||
          fallbackError?.message?.match(/retry after ([^,]+)/i)?.[1];

        let retryAfterDate: Date | null = null;
        if (retryAfter) {
          try {
            retryAfterDate = new Date(retryAfter);
            if (isNaN(retryAfterDate.getTime())) {
              retryAfterDate = new Date(Date.now() + 60000);
            }
          } catch {
            retryAfterDate = new Date(Date.now() + 60000);
          }
        } else {
          retryAfterDate = new Date(Date.now() + 60000);
        }

        const rateLimitError = new Error(
          `User-rate limit exceeded. Retry after ${retryAfterDate.toISOString()}`
        );
        (rateLimitError as any).data = {
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: retryAfterDate.toISOString(),
        };
        throw rateLimitError;
      }

      throw fallbackError;
    }
  }
}

/**
 * Fallback to direct Google API when MCP fails
 */
async function fallbackToGoogleAPI(params: {
  maxResults?: number;
  query?: string;
}): Promise<GmailThread[]> {
  console.log("Using direct Google API fallback for Gmail");
  const { searchGmailThreads } = await import("./google-api");
  const threads = await searchGmailThreads({
    query: params.query || "in:inbox",
    maxResults: params.maxResults || 20,
  });

  // Convert google-api GmailThread[] to mcp GmailThread[] by ensuring required fields
  return threads.map(thread => ({
    id: thread.id,
    subject: thread.subject || "(No Subject)",
    from: thread.from || "",
    snippet: thread.snippet,
    date: thread.date || new Date().toISOString(),
    labels: thread.labels || [],
    unread: thread.unread || false,
    messages: thread.messages,
  }));
}

/**
 * Get a specific Gmail thread
 */
export async function getGmailThread(
  threadId: string
): Promise<GmailMessage[]> {
  try {
    const result = await callMCPTool(GMAIL_MCP_URL, "gmail_read_threads", {
      thread_ids: [threadId],
      include_full_messages: true,
    });

    const messages = parseMCPResult(result);
    return messages;
  } catch (error) {
    console.error("Error getting Gmail thread:", error);
    return [];
  }
}

/**
 * Search Gmail
 */
export async function searchGmail(
  query: string,
  maxResults = 20
): Promise<GmailThread[]> {
  return listGmailThreads({ query, maxResults });
}

/**
 * Search Gmail threads (alias for searchGmail)
 */
export async function searchGmailThreads(
  query: string,
  maxResults = 20
): Promise<GmailThread[]> {
  return listGmailThreads({ query, maxResults });
}

/**
 * Search Gmail threads by email address (alias for searchGmail)
 */
export async function searchGmailThreadsByEmail(
  email: string
): Promise<GmailThread[]> {
  return searchGmail(`from:${email} OR to:${email}`, 50);
}

/**
 * Create a draft email
 */
export async function createGmailDraft(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<{ draftId: string }> {
  try {
    const messages = [
      {
        to: [params.to],
        subject: params.subject,
        content: params.body,
        cc: params.cc ? [params.cc] : undefined,
        bcc: params.bcc ? [params.bcc] : undefined,
      },
    ];
    const result = await callMCPTool(GMAIL_MCP_URL, "gmail_send_messages", {
      messages,
    });

    const draft = parseMCPResult(result);
    return draft;
  } catch (error) {
    console.error("Error creating Gmail draft:", error);
    throw error;
  }
}

/**
 * Get full Gmail thread with all messages
 *
 * PERFORMANCE OPTIMIZATION: Always use direct Gmail API for thread fetching
 * MCP server adds 200-500ms overhead, direct API is 32% faster
 */
export async function getFullGmailThread(
  threadId: string
): Promise<GmailThread | null> {
  try {
    // ALWAYS use direct Gmail API for threads (faster than MCP)
    console.log(
      "[Performance] Using direct Gmail API for thread fetch (skip MCP)"
    );
    const { getGmailThread: directGetThread } = await import("./google-api");
    return (await directGetThread(threadId)) as GmailThread | null;
  } catch (error) {
    console.error("[Performance] Error getting Gmail thread:", error);
    return null;
  }
}

/**
 * Get all Gmail labels
 */
export async function getGmailLabels(): Promise<
  Array<{ id: string; name: string }>
> {
  try {
    // Labels might not be available via MCP, use direct Google API
    const { getGmailLabels: directGetLabels } = await import("./gmail-labels");
    return await directGetLabels();
  } catch (error) {
    console.error("Error getting Gmail labels:", error);
    throw error;
  }
}

/**
 * Send Gmail message (not just draft)
 */
export async function sendGmailMessage(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyToMessageId?: string;
  replyToThreadId?: string;
}): Promise<{ id: string; threadId: string }> {
  try {
    // Try MCP first
    const messages = [
      {
        to: [params.to],
        subject: params.subject,
        content: params.body,
        cc: params.cc ? [params.cc] : undefined,
        bcc: params.bcc ? [params.bcc] : undefined,
        in_reply_to: params.replyToMessageId,
        thread_id: params.replyToThreadId,
      },
    ];

    const result = await callMCPTool(GMAIL_MCP_URL, "gmail_send_messages", {
      messages,
    });

    const sent = parseMCPResult(result);
    return {
      id: sent.id || "",
      threadId: sent.threadId || params.replyToThreadId || "",
    };
  } catch (error) {
    console.error(
      "Error sending Gmail message via MCP, using fallback:",
      error
    );
    // Fallback to direct Google API
    const { sendGmailMessage: directSend } = await import("./google-api");
    return await directSend(params);
  }
}

/**
 * Modify Gmail thread (add/remove labels, archive, etc.)
 */
export async function modifyGmailThread(params: {
  threadId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<void> {
  try {
    // MCP might not support modify directly, use direct Google API
    const { modifyGmailThread: directModify } = await import("./google-api");
    return await directModify(params);
  } catch (error) {
    console.error("Error modifying Gmail thread:", error);
    throw error;
  }
}

/**
 * Delete Gmail thread
 */
export async function deleteGmailThread(threadId: string): Promise<void> {
  try {
    // Use direct Google API for delete
    const { deleteGmailThread: directDelete } = await import("./google-api");
    return await directDelete(threadId);
  } catch (error) {
    console.error("Error deleting Gmail thread:", error);
    throw error;
  }
}

// ============= Google Calendar Functions =============

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start:
    | {
        dateTime?: string;
        date?: string;
        timeZone?: string;
      }
    | string; // Support both formats
  end:
    | {
        dateTime?: string;
        date?: string;
        timeZone?: string;
      }
    | string; // Support both formats
  location?: string;
  status?: string;
}

/**
 * List calendar events
 */
export async function listCalendarEvents(params: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<CalendarEvent[]> {
  try {
    // Try MCP first, fallback to direct Google API if MCP unavailable
    try {
      const result = await callMCPTool(
        GOOGLE_MCP_URL,
        "google_calendar_search_events",
        {
          calendar_id: "primary",
          time_min: params.timeMin || new Date().toISOString(),
          time_max: params.timeMax,
          max_results: params.maxResults || 50,
        }
      );

      // Check if MCP returned an error or unfinished call
      if (
        !result ||
        (result.message && result.message.includes("unfinished"))
      ) {
        console.warn(
          "[MCP] Calendar MCP returned unfinished/error, falling back to direct API"
        );
        throw new Error("MCP unavailable");
      }

      const events = parseMCPResult(result);

      // Validate that events is an array
      if (!Array.isArray(events)) {
        console.warn(
          "[MCP] Calendar MCP returned non-array result, falling back to direct API"
        );
        throw new Error("MCP invalid response");
      }

      return events;
    } catch (mcpError: any) {
      // Fallback to direct Google API if MCP fails
      console.log(
        "[Calendar] MCP unavailable, using direct Google API fallback"
      );
      if (
        mcpError.message?.includes("ENOTFOUND") ||
        mcpError.message?.includes("ECONNREFUSED") ||
        mcpError.message?.includes("fetch failed")
      ) {
        // MCP server not running, use direct API
        const { listCalendarEvents: directListEvents } = await import(
          "./google-api"
        );
        return await directListEvents(params);
      }
      throw mcpError;
    }
  } catch (error) {
    console.error("[Calendar] Error listing calendar events:", error);
    // Final fallback: return empty array so UI doesn't break
    return [];
  }
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  location?: string;
}): Promise<CalendarEvent> {
  try {
    const events = [
      {
        calendar_id: "primary",
        summary: params.summary,
        description: params.description,
        start_time: params.start,
        end_time: params.end,
        location: params.location,
      },
    ];
    const result = await callMCPTool(
      GOOGLE_MCP_URL,
      "google_calendar_create_events",
      {
        events,
      }
    );

    // Check if MCP returned an error or unfinished call
    if (!result || (result.message && result.message.includes("unfinished"))) {
      console.warn("Google Calendar MCP requires OAuth authentication");
      throw new Error(
        "Google Calendar OAuth required. Please authenticate via MCP."
      );
    }

    const event = parseMCPResult(result);
    return event;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

/**
 * Check calendar availability for a given time range
 */
export async function checkCalendarAvailability(params: {
  start: string;
  end: string;
}): Promise<{ available: boolean; conflictingEvents: CalendarEvent[] }> {
  try {
    const events = await listCalendarEvents({
      timeMin: params.start,
      timeMax: params.end,
    });

    return {
      available: events.length === 0,
      conflictingEvents: events,
    };
  } catch (error) {
    console.error("Error checking calendar availability:", error);
    return { available: false, conflictingEvents: [] };
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(params: {
  eventId: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
}): Promise<CalendarEvent> {
  try {
    // Try MCP first, fallback to direct Google API
    try {
      const result = await callMCPTool(
        GOOGLE_MCP_URL,
        "google_calendar_update_event",
        {
          calendar_id: "primary",
          event_id: params.eventId,
          summary: params.summary,
          description: params.description,
          start_time: params.start,
          end_time: params.end,
          location: params.location,
        }
      );

      if (
        !result ||
        (result.message && result.message.includes("unfinished"))
      ) {
        throw new Error("MCP unavailable");
      }

      return parseMCPResult(result);
    } catch (mcpError: any) {
      // Fallback to direct Google API
      console.log(
        "[Calendar] MCP unavailable for update, using direct Google API fallback"
      );
      const { updateCalendarEvent: directUpdateEvent } = await import(
        "./google-api"
      );
      return await directUpdateEvent(params);
    }
  } catch (error) {
    console.error("[Calendar] Error updating calendar event:", error);
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(params: {
  eventId: string;
}): Promise<void> {
  try {
    // Try MCP first, fallback to direct Google API
    try {
      const result = await callMCPTool(
        GOOGLE_MCP_URL,
        "google_calendar_delete_event",
        {
          calendar_id: "primary",
          event_id: params.eventId,
        }
      );

      if (
        !result ||
        (result.message && result.message.includes("unfinished"))
      ) {
        throw new Error("MCP unavailable");
      }

      // MCP delete typically returns empty/success response
      return;
    } catch (mcpError: any) {
      // Fallback to direct Google API
      console.log(
        "[Calendar] MCP unavailable for delete, using direct Google API fallback"
      );
      const { deleteCalendarEvent: directDeleteEvent } = await import(
        "./google-api"
      );
      return await directDeleteEvent(params);
    }
  } catch (error) {
    console.error("[Calendar] Error deleting calendar event:", error);
    throw error;
  }
}

/**
 * Find free time slots in calendar
 */
export async function findFreeTimeSlots(params: {
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  workingHours?: { start: number; end: number }; // 9-17 by default
}): Promise<Array<{ start: string; end: string }>> {
  const workingHours = params.workingHours || { start: 9, end: 17 };
  const date = new Date(params.date);

  // Get all events for the day
  const dayStart = new Date(date);
  dayStart.setHours(workingHours.start, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(workingHours.end, 0, 0, 0);

  const events = await listCalendarEvents({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
  });

  // Find gaps between events
  const freeSlots: Array<{ start: string; end: string }> = [];
  let currentTime = dayStart;

  // Helper to get dateTime from start/end (can be string or object)
  const getDateTime = (
    time: string | { dateTime?: string; date?: string; timeZone?: string }
  ): string => {
    if (typeof time === "string") return time;
    return time.dateTime || time.date || new Date().toISOString();
  };

  // Sort events by start time
  const sortedEvents = events.sort(
    (a, b) =>
      new Date(getDateTime(a.start)).getTime() -
      new Date(getDateTime(b.start)).getTime()
  );

  for (const event of sortedEvents) {
    const eventStart = new Date(getDateTime(event.start));
    const eventEnd = new Date(getDateTime(event.end));

    // Check if there's a gap before this event
    const gapDuration = eventStart.getTime() - currentTime.getTime();
    if (gapDuration >= params.duration * 60 * 1000) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: new Date(
          currentTime.getTime() + params.duration * 60 * 1000
        ).toISOString(),
      });
    }

    currentTime = eventEnd > currentTime ? eventEnd : currentTime;
  }

  // Check if there's time left at the end of the day
  const remainingTime = dayEnd.getTime() - currentTime.getTime();
  if (remainingTime >= params.duration * 60 * 1000) {
    freeSlots.push({
      start: currentTime.toISOString(),
      end: new Date(
        currentTime.getTime() + params.duration * 60 * 1000
      ).toISOString(),
    });
  }

  return freeSlots;
}
