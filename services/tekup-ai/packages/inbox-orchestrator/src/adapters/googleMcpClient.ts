import { withTimeout } from "../utils/timeout";

export class GoogleMcpClient implements GmailAdapter, CalendarAdapter {
  private baseUrl: string;
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl || process.env.GOOGLE_MCP_URL || "http://localhost:3010";
  }

  // Gmail
  async searchThreads(
    query: string,
    maxResults: number = 25,
    readMask?: string[]
  ) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/gmail/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, maxResults, readMask }),
        }),
        this.defaultTimeout,
        "Gmail search request timed out"
      );
      if (!res.ok) return { ok: false, error: `searchThreads ${res.status}` };
      const data = (await res.json()) as { threads?: unknown };
      return { ok: true, data: data.threads };
    } catch (error: any) {
      return { ok: false, error: error?.message || "searchThreads failed" };
    }
  }

  async getThread(threadId: string) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/gmail/getThread`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId }),
        }),
        this.defaultTimeout,
        "Gmail getThread request timed out"
      );
      if (!res.ok) return { ok: false, error: `getThread ${res.status}` };
      const data = await res.json();
      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error?.message || "getThread failed" };
    }
  }

  async getThreads(threadIds: string[]) {
    // Load multiple threads in parallel
    const promises = threadIds.map((id) => this.getThread(id));
    const results = await Promise.all(promises);

    const threads = results.filter((r) => r.ok).map((r) => r.data);

    return { ok: true, data: threads };
  }

  async sendReply(input: { threadId: string; body: string }) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/gmail/sendReply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        this.defaultTimeout,
        "Gmail sendReply request timed out"
      );
      if (!res.ok) return { ok: false, error: `sendReply ${res.status}` };
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || "sendReply failed" };
    }
  }

  async applyLabels(input: {
    threadId: string;
    add: string[];
    remove?: string[];
  }) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/gmail/applyLabels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        this.defaultTimeout,
        "Gmail applyLabels request timed out"
      );
      if (!res.ok) return { ok: false, error: `applyLabels ${res.status}` };
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error?.message || "applyLabels failed" };
    }
  }

  // Calendar
  async createEvent(input: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  }) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/calendar/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: input.summary,
            description: input.description,
            start: input.start,
            end: input.end,
            location: input.location,
          }),
        }),
        this.defaultTimeout,
        "Calendar createEvent request timed out"
      );
      if (!res.ok) return { ok: false, error: `createEvent ${res.status}` };
      const data = await res.json();
      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error?.message || "createEvent failed" };
    }
  }

  async checkConflicts(input: { start: string; end: string }) {
    try {
      const res = await withTimeout(
        fetch(`${this.baseUrl}/calendar/conflicts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
        this.defaultTimeout,
        "Calendar checkConflicts request timed out"
      );
      if (!res.ok) return { ok: false, error: `checkConflicts ${res.status}` };
      const data = await res.json();
      return { ok: true, data };
    } catch (error: any) {
      return { ok: false, error: error?.message || "checkConflicts failed" };
    }
  }
}

import type { CalendarAdapter, GmailAdapter, ToolResult } from "../index.js";

const GOOGLE_MCP_BASE = process.env.GOOGLE_MCP_URL || "http://localhost:3010";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

async function post(path: string, body: unknown): Promise<ToolResult> {
  try {
    const res = await fetch(`${GOOGLE_MCP_BASE}${path}`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${res.statusText}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export const GoogleGmailMcpAdapter: GmailAdapter = {
  searchThreads: (query: string, maxResults?: number) =>
    post("/gmail/search", { query, maxResults }),
  getThread: (threadId: string) => post("/gmail/getThread", { threadId }),
  sendReply: (input) => post("/gmail/sendReply", input),
  applyLabels: (input) => post("/gmail/applyLabels", input),
};

export const GoogleCalendarMcpAdapter: CalendarAdapter = {
  createEvent: (input) => post("/calendar/createEvent", input),
  checkConflicts: (input) => post("/calendar/checkConflicts", input),
};
