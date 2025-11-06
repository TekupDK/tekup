/**
 * Google API Client with Service Account Authentication
 *
 * This module provides direct access to Gmail and Google Calendar APIs
 * using service account credentials with domain-wide delegation.
 */

import { JWT } from "google-auth-library";
import { google } from "googleapis";

// Service Account Configuration
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const IMPERSONATED_USER =
  process.env.GOOGLE_IMPERSONATED_USER || "info@rendetalje.dk";
const CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_ID ||
  "c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com";

// Debug: Log loaded environment variables
console.log(
  "[Google API Config] CALENDAR_ID from env:",
  process.env.GOOGLE_CALENDAR_ID
);
console.log("[Google API Config] Final CALENDAR_ID value:", CALENDAR_ID);

// FIX 3: Startup validation to prevent configuration drift
function validateCalendarConfiguration() {
  console.log("[Calendar] 🔍 Validating configuration...");

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check CALENDAR_ID
  if (!CALENDAR_ID) {
    errors.push("GOOGLE_CALENDAR_ID is not set");
  } else if (CALENDAR_ID === "your-calendar-id") {
    errors.push(
      "GOOGLE_CALENDAR_ID is still set to placeholder value 'your-calendar-id'"
    );
  } else if (!CALENDAR_ID.includes("@")) {
    warnings.push(
      "GOOGLE_CALENDAR_ID does not look like a valid calendar ID (missing '@')"
    );
  }

  // Check service account key
  if (!SERVICE_ACCOUNT_KEY) {
    errors.push("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  }

  // Check impersonated user
  if (!IMPERSONATED_USER) {
    errors.push("GOOGLE_IMPERSONATED_USER is not set");
  } else if (!IMPERSONATED_USER.includes("@")) {
    warnings.push(
      "GOOGLE_IMPERSONATED_USER does not look like an email address"
    );
  }

  // Report results
  if (errors.length > 0) {
    console.error("[Calendar] ❌ Configuration errors:");
    errors.forEach(err => console.error(`  - ${err}`));
    console.error(
      "[Calendar] Please check your .env.dev file and restart the server"
    );
    throw new Error("Invalid calendar configuration");
  }

  if (warnings.length > 0) {
    console.warn("[Calendar] ⚠️  Configuration warnings:");
    warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  console.log("[Calendar] ✅ Configuration valid");
  console.log(`[Calendar] 📧 Impersonating user: ${IMPERSONATED_USER}`);
  console.log(`[Calendar] 📅 Default calendar: ${CALENDAR_ID}`);
}

// Call validation at module initialization
try {
  validateCalendarConfiguration();
} catch (error) {
  console.error("[Calendar] ❌ FATAL: Configuration validation failed");
  // Don't throw - let server start but log the error prominently
}

// FIX 2: Response caching for calendar events
interface CachedCalendarResponse {
  events: any[];
  timestamp: number;
  calendarIds: string[];
}

const calendarCache = new Map<string, CachedCalendarResponse>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: any): string {
  return `${params.timeMin}_${params.timeMax}_${params.maxResults}`;
}

function getCachedEvents(params: any, calendarIds: string[]): any[] | null {
  const cacheKey = getCacheKey(params);
  const cached = calendarCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    calendarCache.delete(cacheKey);
    console.log(
      `[Calendar] 💾 Cache EXPIRED for ${cacheKey} (age: ${Math.round(age / 1000)}s)`
    );
    return null;
  }

  // Check if calendar list changed
  const cachedIds = [...cached.calendarIds].sort().join(",");
  const currentIds = [...calendarIds].sort().join(",");
  if (cachedIds !== currentIds) {
    calendarCache.delete(cacheKey);
    console.log(
      `[Calendar] 💾 Cache INVALIDATED for ${cacheKey} (calendar list changed)`
    );
    return null;
  }

  console.log(
    `[Calendar] 💾 Cache HIT for ${cacheKey} (age: ${Math.round(age / 1000)}s, ${cached.events.length} events)`
  );
  return cached.events;
}

function setCachedEvents(
  params: any,
  calendarIds: string[],
  events: any[]
): void {
  const cacheKey = getCacheKey(params);
  calendarCache.set(cacheKey, {
    events,
    timestamp: Date.now(),
    calendarIds: [...calendarIds],
  });
  console.log(
    `[Calendar] 💾 Cache SET for ${cacheKey} (${events.length} events, TTL: ${CACHE_TTL_MS / 1000}s)`
  );
}

// OAuth Scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify", // Required for archive/delete/mark-read (Bug #1 fix)
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

/**
 * Create authenticated JWT client with domain-wide delegation
 */
async function getAuthClient(): Promise<JWT> {
  // Try to load from JSON file first
  let credentials;

  try {
    const { readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const credentialsPath = join(process.cwd(), "google-service-account.json");

    if (existsSync(credentialsPath)) {
      credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
    } else if (SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error("Google Service Account credentials not found");
    }
  } catch (error) {
    console.error("Error loading Google Service Account credentials:", error);
    throw new Error("Invalid Google Service Account configuration");
  }

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
    subject: IMPERSONATED_USER, // Impersonate this user
  });

  return client;
}

// ============================================================================
// GMAIL API
// ============================================================================

export interface GmailThread {
  id: string;
  snippet: string;
  messages: GmailMessage[];
  subject?: string;
  from?: string;
  date?: string;
  labels?: string[];
  unread?: boolean;
  // True if any message in the thread contains one or more attachments
  hasAttachments?: boolean;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string; // Back-compat: plain-text preferred
  bodyText?: string; // Plain text (preferred for simple mails)
  bodyHtml?: string; // Sanitized HTML (for newsletters/templates)
  contentType?: string; // 'text/plain' | 'text/html' | 'multipart/*'
  date: string;
}

// ----------------------------------------------------------------------------
// Helpers: Gmail body decoding and extraction
// ----------------------------------------------------------------------------

function decodeBase64Url(data?: string): string {
  if (!data) return "";
  // Gmail uses base64url (RFC 4648 §5) – convert to standard base64
  let b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  try {
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function stripHtmlToText(html: string): string {
  if (!html) return "";
  // Remove comments
  let cleaned = html.replace(/<!--([\s\S]*?)-->/g, "");
  // Drop <style>, <script>, and <head> contents entirely
  cleaned = cleaned
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "");
  // Remove meta/link tags
  cleaned = cleaned.replace(/<\s*(meta|link)[^>]*>/gi, "");
  // Normalize common block elements to newlines for readability
  cleaned = cleaned
    .replace(/<(\s*br\s*\/? )>/gi, "\n")
    .replace(
      /<\/(p|div|li|tr|h[1-6]|table|thead|tbody|tfoot|section|article)>/gi,
      "\n"
    );
  // Remove all remaining tags
  const noTags = cleaned.replace(/<[^>]+>/g, "");
  // Decode HTML entities (basic)
  const decoded = noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  // Collapse excessive blank lines
  return decoded
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type GmailMessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
};

function extractBodiesFromPayload(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}): { text?: string; html?: string; contentType?: string } {
  if (!payload) return {};

  const tryPart = (part: GmailMessagePart) => {
    const raw = decodeBase64Url(part.body?.data);
    if (!raw) return {} as { text?: string; html?: string };
    if (part.mimeType === "text/plain") return { text: raw };
    if (part.mimeType === "text/html") return { html: raw };
    return {} as { text?: string; html?: string };
  };

  // Direct payload body
  const directRaw = decodeBase64Url(payload.body?.data);
  let result: { text?: string; html?: string } = {};
  if (directRaw) {
    const direct = tryPart({
      mimeType: payload.mimeType,
      body: { data: payload.body?.data },
    });
    result = { ...result, ...direct };
  }

  // Traverse nested parts
  const stack: GmailMessagePart[] = [...(payload.parts || [])];
  while (stack.length) {
    const part = stack.shift()!;
    if (part.parts && part.parts.length) stack.push(...part.parts);
    const found = tryPart(part);
    if (!result.text && found.text) result.text = found.text;
    if (!result.html && found.html) result.html = found.html;
    if (result.text && result.html) break;
  }

  return { ...result, contentType: payload.mimeType };
}

// Detect if a Gmail message payload contains any attachments by checking
// for parts with a non-empty filename and an attachmentId in the body.
function payloadHasAttachments(payload: any): boolean {
  if (!payload) return false;
  const stack: any[] = [payload];
  while (stack.length) {
    const part = stack.pop();
    if (!part) continue;
    if (
      part.filename &&
      typeof part.filename === "string" &&
      part.filename.trim().length > 0
    ) {
      return true;
    }
    if (part.body && part.body.attachmentId) {
      return true;
    }
    if (Array.isArray(part.parts)) {
      for (const p of part.parts) stack.push(p);
    }
  }
  return false;
}

/**
 * Search Gmail threads
 */
export async function searchGmailThreads(params: {
  query: string;
  maxResults?: number;
}): Promise<GmailThread[]> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.threads.list({
      userId: "me",
      q: params.query,
      maxResults: params.maxResults || 10,
    });

    if (!response.data.threads) {
      return [];
    }

    // Fetch full thread details
    const threads: GmailThread[] = [];
    for (const thread of response.data.threads) {
      if (!thread.id) continue;

      const threadDetail = await gmail.users.threads.get({
        userId: "me",
        id: thread.id,
      });

      const messages: GmailMessage[] = [];
      let threadHasAttachments = false;
      if (threadDetail.data.messages) {
        for (const msg of threadDetail.data.messages) {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(
            h => h.name?.toLowerCase() === "from"
          );
          const toHeader = headers.find(h => h.name?.toLowerCase() === "to");
          const subjectHeader = headers.find(
            h => h.name?.toLowerCase() === "subject"
          );
          const dateHeader = headers.find(
            h => h.name?.toLowerCase() === "date"
          );

          // Extract bodies (prefer text/plain; fallback to text/html)
          const bodies = extractBodiesFromPayload(msg.payload as any);
          // Track attachments presence at the thread level
          if (!threadHasAttachments && payloadHasAttachments(msg.payload)) {
            threadHasAttachments = true;
          }
          const bodyText =
            bodies.text || (bodies.html ? stripHtmlToText(bodies.html) : "");
          const bodyHtml = bodies.html;
          const body = (bodyText || "").substring(0, 500); // Limit body length for list view

          messages.push({
            id: msg.id || "",
            threadId: msg.threadId || "",
            from: fromHeader?.value || "",
            to: toHeader?.value || "",
            subject: subjectHeader?.value || "",
            body, // list view body snippet
            bodyText,
            bodyHtml,
            contentType: bodies.contentType,
            date: dateHeader?.value || "",
          });
        }
      }

      // Extract labels from the last message in the thread
      const lastMsg =
        threadDetail.data.messages?.[threadDetail.data.messages.length - 1];
      const labelIds =
        lastMsg && Array.isArray(lastMsg.labelIds)
          ? (lastMsg.labelIds as string[])
          : [];

      // Map label IDs to label names
      const { mapLabelIdsToNames } = await import("./gmail-labels");
      const labels = await mapLabelIdsToNames(labelIds);

      threads.push({
        id: thread.id,
        snippet: threadDetail.data.snippet || "",
        messages,
        labels: labels,
        unread: labelIds.includes("UNREAD"),
        subject:
          messages.length > 0 ? messages[messages.length - 1].subject : "",
        from: messages.length > 0 ? messages[messages.length - 1].from : "",
        date: messages.length > 0 ? messages[messages.length - 1].date : "",
        hasAttachments: threadHasAttachments,
      });
    }

    return threads;
  } catch (error: any) {
    console.error("Error searching Gmail:", error);

    // Handle rate limiting specifically
    if (error?.response?.status === 429) {
      const retryAfterHeader =
        error?.response?.headers?.["retry-after"] ||
        error?.response?.headers?.["Retry-After"];
      let retryAfter: Date | null = null;

      // Try to parse retry-after header (can be seconds or timestamp)
      if (retryAfterHeader) {
        const retryAfterSeconds = parseInt(retryAfterHeader, 10);
        if (!isNaN(retryAfterSeconds)) {
          retryAfter = new Date(Date.now() + retryAfterSeconds * 1000);
        } else {
          try {
            retryAfter = new Date(retryAfterHeader);
            if (isNaN(retryAfter.getTime())) {
              retryAfter = null;
            }
          } catch {
            retryAfter = null;
          }
        }
      }

      // Default: 60 seconds from now if no header
      if (!retryAfter) {
        retryAfter = new Date(Date.now() + 60000);
      }

      console.warn(
        "Gmail API rate limit exceeded. Retry after:",
        retryAfter.toISOString()
      );

      const errorMessage = retryAfter
        ? `Gmail API rate limit exceeded. Retry after ${retryAfter.toISOString()}`
        : "Gmail API rate limit exceeded. Please wait a moment and try again.";

      const rateLimitError = new Error(errorMessage);
      // Attach retry-after to error for TRPC
      (rateLimitError as any).data = {
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: retryAfter.toISOString(),
      };
      throw rateLimitError;
    }

    // Handle authentication errors
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      console.error("Gmail API authentication error");
      throw new Error(
        "Gmail API authentication failed. Please check service account configuration."
      );
    }

    throw error;
  }
}

/**
 * Search Gmail threads by email address
 */
export async function searchGmailThreadsByEmail(
  email: string
): Promise<GmailThread[]> {
  return await searchGmailThreads({
    query: `from:${email} OR to:${email}`,
    maxResults: 100,
  });
}

/**
 * Get a single Gmail thread by ID
 */
export async function getGmailThread(
  threadId: string
): Promise<GmailThread | null> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const threadDetail = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
    });

    const messages: GmailMessage[] = [];
    let threadHasAttachments = false;
    if (threadDetail.data.messages) {
      for (const msg of threadDetail.data.messages) {
        const headers = msg.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === "from");
        const toHeader = headers.find(h => h.name?.toLowerCase() === "to");
        const subjectHeader = headers.find(
          h => h.name?.toLowerCase() === "subject"
        );
        const dateHeader = headers.find(h => h.name?.toLowerCase() === "date");

        const bodies = extractBodiesFromPayload(msg.payload as any);
        if (!threadHasAttachments && payloadHasAttachments(msg.payload)) {
          threadHasAttachments = true;
        }
        const bodyText =
          bodies.text || (bodies.html ? stripHtmlToText(bodies.html) : "");
        const bodyHtml = bodies.html;
        const body = bodyText || "";

        messages.push({
          id: msg.id || "",
          threadId: msg.threadId || "",
          from: fromHeader?.value || "",
          to: toHeader?.value || "",
          subject: subjectHeader?.value || "",
          body,
          bodyText,
          bodyHtml,
          contentType: bodies.contentType,
          date: dateHeader?.value || "",
        });
      }
    }

    const lastMsg =
      threadDetail.data.messages?.[threadDetail.data.messages.length - 1];
    const labels =
      lastMsg && Array.isArray(lastMsg.labelIds)
        ? (lastMsg.labelIds as string[])
        : [];

    return {
      id: threadId,
      snippet: threadDetail.data.snippet || "",
      messages,
      labels: labels,
      unread: labels.includes("UNREAD"),
      subject: messages.length > 0 ? messages[messages.length - 1].subject : "",
      from: messages.length > 0 ? messages[messages.length - 1].from : "",
      date: messages.length > 0 ? messages[messages.length - 1].date : "",
      hasAttachments: threadHasAttachments,
    };
  } catch (error) {
    console.error("Error getting Gmail thread:", error);
    return null;
  }
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
}): Promise<{ id: string; message: string }> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    // Create email in RFC 2822 format
    const headers: string[] = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
    ];
    if (params.cc) headers.push(`Cc: ${params.cc}`);
    if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
    headers.push("Content-Type: text/plain; charset=utf-8", "");

    const email = [...headers, params.body].join("\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw: encodedEmail,
        },
      },
    });

    return {
      id: response.data.id || "",
      message: "Draft created successfully",
    };
  } catch (error) {
    console.error("Error creating Gmail draft:", error);
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
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    // Create email in RFC 2822 format
    const headers: string[] = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
    ];
    if (params.cc) headers.push(`Cc: ${params.cc}`);
    if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
    if (params.replyToMessageId) {
      headers.push(`In-Reply-To: ${params.replyToMessageId}`);
      headers.push(`References: ${params.replyToMessageId}`);
    }
    headers.push("Content-Type: text/plain; charset=utf-8", "");

    const email = [...headers, params.body].join("\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const requestBody: any = {
      raw: encodedEmail,
    };

    if (params.replyToThreadId) {
      requestBody.threadId = params.replyToThreadId;
    }

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody,
    });

    return {
      id: response.data.id || "",
      threadId: response.data.threadId || params.replyToThreadId || "",
    };
  } catch (error) {
    console.error("Error sending Gmail message:", error);
    throw error;
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
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const requestBody: any = {};
    if (params.addLabelIds && params.addLabelIds.length > 0) {
      requestBody.addLabelIds = params.addLabelIds;
    }
    if (params.removeLabelIds && params.removeLabelIds.length > 0) {
      requestBody.removeLabelIds = params.removeLabelIds;
    }

    await gmail.users.threads.modify({
      userId: "me",
      id: params.threadId,
      requestBody,
    });

    console.log(`Modified thread ${params.threadId}`);
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
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    await gmail.users.threads.delete({
      userId: "me",
      id: threadId,
    });

    console.log(`Deleted thread ${threadId}`);
  } catch (error) {
    console.error("Error deleting Gmail thread:", error);
    throw error;
  }
}

/**
 * Mark message as read or unread
 */
export async function markGmailMessageAsRead(
  messageId: string,
  read: boolean
): Promise<void> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const requestBody: any = {};
    if (read) {
      requestBody.removeLabelIds = ["UNREAD"];
    } else {
      requestBody.addLabelIds = ["UNREAD"];
    }

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody,
    });
  } catch (error) {
    console.error("Error marking message as read/unread:", error);
    throw error;
  }
}

// ----------------------------------------------------------------------------
// Gmail attachments by CID resolution
// ----------------------------------------------------------------------------

type GmailMessagePayload = {
  mimeType?: string;
  body?: { data?: string; attachmentId?: string };
  parts?: GmailMessagePayload[];
  headers?: Array<{ name?: string; value?: string }>;
};

function findPartByContentId(
  payload: GmailMessagePayload | undefined,
  cid: string
): { part: GmailMessagePayload; contentId: string } | null {
  if (!payload) return null;
  const target = cid.replace(/[<>]/g, "").trim();
  const stack: GmailMessagePayload[] = [payload];
  while (stack.length) {
    const p = stack.shift()!;
    const headers = p.headers || [];
    const cidHeader = headers.find(
      h => h.name?.toLowerCase() === "content-id" && h.value
    );
    if (cidHeader && typeof cidHeader.value === "string") {
      const value = cidHeader.value.replace(/[<>]/g, "").trim();
      if (value === target) {
        return { part: p, contentId: value };
      }
    }
    if (p.parts && p.parts.length) stack.push(...p.parts);
  }
  return null;
}

export async function getGmailAttachmentByCid(params: {
  messageId: string;
  cid: string;
}): Promise<{ mimeType: string; dataUrl: string } | null> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const msg = await gmail.users.messages.get({
      userId: "me",
      id: params.messageId,
      format: "full",
    });

    const payload = msg.data.payload as GmailMessagePayload | undefined;
    const found = findPartByContentId(payload, params.cid);
    if (!found) return null;

    const mimeType = found.part.mimeType || "application/octet-stream";

    // Data may be inline in part.body.data or require attachments.get via attachmentId
    let raw = decodeBase64Url(found.part.body?.data);
    if (!raw && found.part.body?.attachmentId) {
      const att = await gmail.users.messages.attachments.get({
        userId: "me",
        messageId: params.messageId,
        id: found.part.body.attachmentId,
      });
      const data = att.data.data as string | undefined;
      raw = decodeBase64Url(data);
    }

    if (!raw) return null;

    // Convert to base64 for data URL
    const b64 = Buffer.from(raw, "binary").toString("base64");
    const dataUrl = `data:${mimeType};base64,${b64}`;
    return { mimeType, dataUrl };
  } catch (error) {
    console.error("Error fetching Gmail attachment by CID:", error);
    return null;
  }
}

/**
 * Star or unstar Gmail message
 */
export async function starGmailMessage(
  messageId: string,
  starred: boolean
): Promise<void> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const requestBody: any = {};
    if (starred) {
      requestBody.addLabelIds = ["STARRED"];
    } else {
      requestBody.removeLabelIds = ["STARRED"];
    }

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody,
    });
  } catch (error) {
    console.error("Error starring/unstarring message:", error);
    throw error;
  }
}

// ============================================================================
// GOOGLE CALENDAR API
// ============================================================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

/**
 * List calendar events
 */
export async function listCalendarEvents(
  params: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    /** Optional override for calendars to query; if omitted, try configured calendar then 'primary' */
    calendarIds?: string[];
    /** Optional single calendar override (back-compat short-hand) */
    calendarId?: string;
  } = {}
): Promise<CalendarEvent[]> {
  console.log("[Calendar] listCalendarEvents called with params:", {
    timeMin: params.timeMin,
    timeMax: params.timeMax,
    maxResults: params.maxResults,
    hasCalendarIds: Array.isArray(params.calendarIds),
    hasCalendarId: !!params.calendarId,
  });
  try {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    // Determine calendars to query
    const calendarsToQuery: string[] = [];
    if (Array.isArray(params.calendarIds) && params.calendarIds.length > 0) {
      calendarsToQuery.push(...params.calendarIds);
    } else if (params.calendarId) {
      calendarsToQuery.push(params.calendarId);
    } else {
      // NEW: Fetch ALL accessible calendars and query them all
      try {
        console.log(
          "[Calendar] 🔍 Fetching list of all accessible calendars..."
        );
        const calendarList = await calendar.calendarList.list();
        const allCalendars = calendarList.data.items || [];
        console.log(
          "[Calendar] 📅 Found",
          allCalendars.length,
          "accessible calendars:"
        );
        allCalendars.forEach(cal => {
          console.log(`  - ${cal.id} (${cal.summary})`);
          if (cal.id) calendarsToQuery.push(cal.id);
        });
      } catch (err) {
        console.error(
          "[Calendar] ❌ Failed to fetch calendar list, using fallback:",
          err
        );
        // Fallback to configured calendar + primary
        calendarsToQuery.push(CALENDAR_ID);
        calendarsToQuery.push("primary");
      }
    }

    // FIX 2: Check cache before making API calls
    const cached = getCachedEvents(params, calendarsToQuery);
    if (cached) {
      console.log(
        `[Calendar] ⚡ Returning ${cached.length} cached events (skipping API calls)`
      );
      return cached;
    }

    const seenIds = new Set<string>();
    const aggregated: CalendarEvent[] = [];

    // FIX 1: Parallel calendar queries with per-calendar error handling
    console.log(
      `[Calendar] 🚀 Querying ${calendarsToQuery.length} calendars in parallel...`
    );

    const calendarPromises = calendarsToQuery.map(async calId => {
      try {
        console.log("[Calendar] Fetching events from calendar:", calId);
        console.log("[Calendar] 🔍 Query params:", {
          calendarId: calId,
          timeMin: params.timeMin || new Date().toISOString(),
          timeMax: params.timeMax,
          maxResults: params.maxResults || 50,
          singleEvents: true,
          orderBy: "startTime",
        });

        const response = await calendar.events.list({
          calendarId: calId,
          timeMin: params.timeMin || new Date().toISOString(),
          timeMax: params.timeMax,
          maxResults: params.maxResults || 50,
          singleEvents: true,
          orderBy: "startTime",
          showDeleted: false,
          showHiddenInvitations: false,
          privateExtendedProperty: undefined,
        });

        const items = response.data.items || [];
        console.log(
          "[Calendar] ✅ Successfully fetched",
          items.length,
          "events from",
          calId
        );

        // Log RAW response for debugging visibility issues
        console.log("[Calendar] 🔍 RAW API Response summary:", {
          status: response.status,
          statusText: response.statusText,
          itemCount: items.length,
          nextPageToken: response.data.nextPageToken,
          nextSyncToken: response.data.nextSyncToken,
        });

        // Log ALL events with full details for debugging missing events
        if (items.length > 0) {
          console.log(
            "[Calendar] 📅 ALL events from",
            calId,
            "(showing all",
            items.length,
            "events):"
          );
          items.forEach((evt, idx) => {
            const startDate =
              evt.start?.dateTime || evt.start?.date || "NO_START";
            const endDate = evt.end?.dateTime || evt.end?.date || "NO_END";
            console.log(`  [${idx + 1}/${items.length}] "${evt.summary}"`);
            console.log(`    Start: ${startDate} | End: ${endDate}`);
            console.log(`    ID: ${evt.id}`);
            console.log(
              `    Visibility: ${evt.visibility || "default"} | Status: ${evt.status || "confirmed"}`
            );
            console.log(
              `    Creator: ${evt.creator?.email || "unknown"} | Organizer: ${evt.organizer?.email || "unknown"}`
            );
            console.log(
              `    Recurring: ${evt.recurringEventId ? "YES" : "NO"} | Private: ${evt.privateCopy ? "YES" : "NO"}`
            );
          });
        } else {
          console.warn(
            `[Calendar] ⚠️ NO EVENTS returned from ${calId} for time range ${params.timeMin} to ${params.timeMax}`
          );
        }

        return { calendarId: calId, events: items, error: null };
      } catch (innerError: any) {
        console.error(
          `[Calendar] ❌ Failed fetching from ${calId}:`,
          innerError.message || innerError
        );
        return {
          calendarId: calId,
          events: [],
          error: innerError.message || String(innerError),
        };
      }
    });

    // Wait for all calendar queries to complete (success or failure)
    const results = await Promise.allSettled(calendarPromises);

    let successCount = 0;
    let failureCount = 0;

    // Process results from all calendars
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const { calendarId, events, error } = result.value;

        if (error) {
          failureCount++;
          console.error(
            `[Calendar] ❌ Calendar ${calendarId} failed: ${error}`
          );
        } else {
          successCount++;
          // Map and deduplicate events
          for (const event of events) {
            const mapped: CalendarEvent = {
              id: event.id || "",
              summary: event.summary || "",
              description: event.description || undefined,
              start: event.start?.dateTime || event.start?.date || "",
              end: event.end?.dateTime || event.end?.date || "",
              location: event.location || undefined,
            };
            if (mapped.id && !seenIds.has(mapped.id)) {
              seenIds.add(mapped.id);
              aggregated.push(mapped);
            }
          }
        }
      } else {
        failureCount++;
        console.error(
          `[Calendar] ❌ Promise rejected for calendar ${calendarsToQuery[index]}:`,
          result.reason
        );
      }
    });

    console.log(
      `[Calendar] 📊 Query summary: ${successCount} successful, ${failureCount} failed out of ${calendarsToQuery.length} calendars`
    );

    // Final log
    console.log("[Calendar] ✅ Aggregated events count:", aggregated.length);
    if (aggregated.length > 0) {
      console.log(
        "[Calendar] ✅ Aggregated event summaries:",
        aggregated.map(e => e.summary).join(", ")
      );
    } else {
      console.warn("[Calendar] ⚠️ NO EVENTS FOUND! Check:");
      console.warn("  - Calendar IDs:", calendarsToQuery);
      console.warn("  - Time range:", params.timeMin, "to", params.timeMax);
      console.warn("  - Service account has access to the calendars?");
    }

    // FIX 2: Cache the result before returning
    setCachedEvents(params, calendarsToQuery, aggregated);

    return aggregated;
  } catch (error) {
    console.error("Error listing calendar events:", error);
    return [];
  }
}

/**
 * Create a calendar event
 * CRITICAL: NEVER add attendees parameter (MEMORY_19)
 */
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}): Promise<CalendarEvent> {
  try {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    // CRITICAL: NO attendees parameter!
    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.start,
        timeZone: "Europe/Copenhagen",
      },
      end: {
        dateTime: params.end,
        timeZone: "Europe/Copenhagen",
      },
      // NO attendees field - this prevents automatic email invites
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return {
      id: response.data.id || "",
      summary: response.data.summary || "",
      description: response.data.description || undefined,
      start: response.data.start?.dateTime || response.data.start?.date || "",
      end: response.data.end?.dateTime || response.data.end?.date || "",
      location: response.data.location || undefined,
    };
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

/**
 * Check calendar availability
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
 * Find free time slots
 */
export async function findFreeSlots(params: {
  startDate: string;
  endDate: string;
  durationHours: number;
}): Promise<{ start: string; end: string }[]> {
  try {
    const events = await listCalendarEvents({
      timeMin: params.startDate,
      timeMax: params.endDate,
    });

    // Simple algorithm: find gaps between events
    const freeSlots: { start: string; end: string }[] = [];
    const duration = params.durationHours * 60 * 60 * 1000; // Convert to milliseconds

    // Sort events by start time
    events.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    let currentTime = new Date(params.startDate);
    const endTime = new Date(params.endDate);

    for (const event of events) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if there's a gap before this event
      if (eventStart.getTime() - currentTime.getTime() >= duration) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: new Date(currentTime.getTime() + duration).toISOString(),
        });
      }

      currentTime = eventEnd;
    }

    // Check if there's time after the last event
    if (endTime.getTime() - currentTime.getTime() >= duration) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: new Date(currentTime.getTime() + duration).toISOString(),
      });
    }

    return freeSlots;
  } catch (error) {
    console.error("Error finding free slots:", error);
    return [];
  }
}

/**
 * Update a calendar event
 * CRITICAL: NEVER add attendees parameter (MEMORY_19)
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
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    const event: any = {};

    if (params.summary !== undefined) event.summary = params.summary;
    if (params.description !== undefined)
      event.description = params.description;
    if (params.location !== undefined) event.location = params.location;

    if (params.start) {
      event.start = {
        dateTime: params.start,
        timeZone: "Europe/Copenhagen",
      };
    }

    if (params.end) {
      event.end = {
        dateTime: params.end,
        timeZone: "Europe/Copenhagen",
      };
    }

    const response = await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: params.eventId,
      requestBody: event,
    });

    return {
      id: response.data.id || "",
      summary: response.data.summary || "",
      description: response.data.description || undefined,
      start: response.data.start?.dateTime || response.data.start?.date || "",
      end: response.data.end?.dateTime || response.data.end?.date || "",
      location: response.data.location || undefined,
    };
  } catch (error) {
    console.error("Error updating calendar event:", error);
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
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: params.eventId,
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
}
