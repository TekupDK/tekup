import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  analyticsEvents,
  calendarEvents,
  conversations,
  emailPipelineState,
  emailPipelineTransitions,
  emailThreads,
  InsertUser,
  invoices,
  leads,
  messages,
  tasks,
  userPreferences,
  users,
  type CalendarEvent,
  type Conversation,
  type EmailPipelineState,
  type EmailPipelineTransition,
  type EmailThread,
  type InsertAnalyticsEvent,
  type InsertCalendarEvent,
  type InsertConversation,
  type InsertEmailThread,
  type InsertInvoice,
  type InsertLead,
  type InsertMessage,
  type InsertTask,
  type InsertUserPreferences,
  type Invoice,
  type Lead,
  type Message,
  type Task,
  type UserPreferences,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL to extract schema parameter (PostgreSQL doesn't accept schema in connection string)
      const dbUrl = new URL(process.env.DATABASE_URL);
      const schema = dbUrl.searchParams.get("schema");

      // Remove schema from URL as postgres.js doesn't support it as query parameter
      if (schema) {
        dbUrl.searchParams.delete("schema");
      }

      // Create client without schema in connection string
      const connectionString = dbUrl.toString();
      const client = postgres(connectionString);

      // If schema is specified, set search_path after connection
      if (schema) {
        await client`SET search_path TO ${client(schema)}`;
      }

      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Conversation Functions =============

export async function createConversation(
  data: InsertConversation
): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(data).returning();
  return result[0];
}

export async function getUserConversations(
  userId: number
): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(
  id: number
): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return result[0];
}

export async function updateConversationTitle(
  id: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(conversations).set({ title }).where(eq(conversations.id, id));
}

// ============= Message Functions =============

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data).returning();
  return result[0];
}

export async function getConversationMessages(
  conversationId: number
): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============= Email Thread Functions =============

export async function createEmailThread(
  data: InsertEmailThread
): Promise<EmailThread> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailThreads).values(data).returning();
  return result[0];
}

export async function getUserEmailThreads(
  userId: number,
  limit = 50
): Promise<EmailThread[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(emailThreads)
    .where(eq(emailThreads.userId, userId))
    .orderBy(desc(emailThreads.lastMessageAt))
    .limit(limit);
}

export async function markEmailThreadRead(
  id: number,
  isRead: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(emailThreads).set({ isRead }).where(eq(emailThreads.id, id));
}

// ============= Invoice Functions =============

export async function createInvoice(data: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(data).returning();
  return result[0];
}

export async function getUserInvoices(userId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}

export async function updateInvoiceStatus(
  id: number,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
}

// ============= Calendar Event Functions =============

export async function createCalendarEvent(
  data: InsertCalendarEvent
): Promise<CalendarEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(calendarEvents).values(data).returning();
  return result[0];
}

export async function getUserCalendarEvents(
  userId: number,
  startTime?: Date,
  endTime?: Date
): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(calendarEvents.userId, userId)];
  if (startTime && endTime) {
    conditions.push(
      and(
        gte(calendarEvents.startTime, startTime.toISOString()),
        lte(calendarEvents.endTime, endTime.toISOString())
      )!
    );
  }

  return db
    .select()
    .from(calendarEvents)
    .where(and(...conditions))
    .orderBy(calendarEvents.startTime);
}

// ============= Lead Functions =============

export async function createLead(data: InsertLead): Promise<Lead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(data).returning();
  return result[0];
}

export async function getUserLeads(
  userId: number,
  options?: {
    status?: string;
    source?: string;
    searchQuery?: string;
    hideBillyImport?: boolean;
    sortBy?: "date" | "score" | "name";
    limit?: number;
  }
): Promise<Array<Lead & { duplicateCount: number }>> {
  const db = await getDb();
  if (!db) return [];

  // Build where conditions
  const conditions = [eq(leads.userId, userId)];

  if (options?.status && options.status !== "all") {
    conditions.push(eq(leads.status, options.status as any));
  }

  if (options?.source && options.source !== "all") {
    conditions.push(eq(leads.source, options.source));
  }

  if (options?.hideBillyImport) {
    conditions.push(sql`${leads.source} != 'billy_import'`);
  }

  // Get all leads first (we need all to calculate duplicates)
  let allLeads = await db
    .select()
    .from(leads)
    .where(
      conditions.length > 0 ? and(...conditions) : eq(leads.userId, userId)
    )
    .execute();

  // Apply search filter (client-side for now, can be optimized with SQL LIKE later)
  if (options?.searchQuery) {
    const searchLower = options.searchQuery.toLowerCase();
    allLeads = allLeads.filter(
      lead =>
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.phone?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower)
    );
  }

  // Calculate duplicate counts using SQL (more efficient)
  // For now, do it in memory (can be optimized with SQL GROUP BY later)
  const keyMap = new Map<string, number[]>();
  const duplicateMap = new Map<number, number>();

  // Helper to normalize phone
  const normalizePhone = (phone: string | null | undefined): string | null => {
    if (!phone) return null;
    return phone.replace(/\s+/g, "").replace(/[^\d+]/g, "") || null;
  };

  // Helper to get deduplication key
  const getDeduplicationKey = (lead: Lead): string | null => {
    const emailKey = lead.email?.toLowerCase().trim();
    if (emailKey) return `email:${emailKey}`;

    const phoneKey = normalizePhone(lead.phone);
    if (phoneKey) return `phone:${phoneKey}`;

    const nameCompanyKey =
      lead.name && lead.company
        ? `name:${lead.name.toLowerCase().trim()}_${lead.company.toLowerCase().trim()}`
        : null;
    if (nameCompanyKey) return nameCompanyKey;

    return null;
  };

  // Build key map
  for (const lead of allLeads) {
    const key = getDeduplicationKey(lead);
    if (key) {
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(lead.id);
    }
  }

  // Calculate duplicate counts
  keyMap.forEach(leadIds => {
    const count = leadIds.length;
    if (count > 1) {
      leadIds.forEach(id => duplicateMap.set(id, count));
    }
  });

  // Add duplicateCount to all leads
  const leadsWithCounts = allLeads.map(lead => ({
    ...lead,
    duplicateCount: duplicateMap.get(lead.id) || 1,
  }));

  // Apply sorting
  if (options?.sortBy === "score") {
    leadsWithCounts.sort((a, b) => b.score - a.score);
  } else if (options?.sortBy === "name") {
    leadsWithCounts.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";
      return nameA.localeCompare(nameB);
    });
  } else {
    // Default: sort by date
    leadsWithCounts.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  // Apply limit if specified
  if (options?.limit) {
    return leadsWithCounts.slice(0, options.limit);
  }

  return leadsWithCounts;
}

/**
 * Check if user has any leads (used to determine if import is needed)
 */
export async function hasUserLeads(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(leads)
    .where(eq(leads.userId, userId))
    .limit(1);

  return result.length > 0;
}

export async function updateLeadStatus(
  id: number,
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function updateLeadScore(
  id: number,
  score: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ score }).where(eq(leads.id, id));
}

export async function getLeadCalendarEvents(
  leadId: number
): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  // First get the lead
  const lead = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  if (!lead.length || !lead[0].name || !lead[0].email) return [];

  const leadName = lead[0].name.toLowerCase();
  const leadEmail = lead[0].email.toLowerCase();

  // Get all calendar events for the user
  const allEvents = await db
    .select()
    .from(calendarEvents)
    .where(eq(calendarEvents.userId, lead[0].userId))
    .orderBy(desc(calendarEvents.startTime));

  // Match events by name or email in title/description
  return allEvents.filter(event => {
    const title = (event.title || "").toLowerCase();
    const description = (event.description || "").toLowerCase();

    // Check if lead name or email appears in event title/description
    return (
      title.includes(leadName) ||
      description.includes(leadName) ||
      title.includes(leadEmail) ||
      description.includes(leadEmail)
    );
  });
}

// ============= Import Functions (Historical Data) =============

/**
 * Get all invoices from Billy API (for historical import)
 * Filters by date range (default: from July 2025)
 */
export async function getHistoricalBillyInvoices(
  userId: number,
  fromDate: Date = new Date("2025-07-01")
): Promise<
  Array<{
    billyInvoiceId?: string | null;
    customerId?: number | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    amount: number;
    entryDate: Date | null;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  // Get all invoices from local database (synced from Billy)
  const localInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        gte(invoices.createdAt, fromDate.toISOString())
      )
    )
    .orderBy(desc(invoices.createdAt));

  // Transform to include customer info from invoices table
  return localInvoices.map(inv => ({
    billyInvoiceId: null,
    customerId: null,
    customerName: inv.customerName || null,
    customerEmail: null, // Email not stored in invoices table, will need to fetch from Billy
    customerPhone: null, // Phone not stored in invoices table
    amount: Number(inv.amount ?? 0),
    entryDate: inv.createdAt ? new Date(inv.createdAt) : null,
  }));
}

/**
 * Get all calendar events (for historical import)
 * Filters by date range (default: from July 2025)
 */
export async function getHistoricalCalendarEvents(
  userId: number,
  fromDate: Date = new Date("2025-07-01")
): Promise<
  Array<{
    googleEventId: string | null;
    title: string | null;
    description: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const events = await db
    .select({
      googleEventId: calendarEvents.googleEventId,
      title: calendarEvents.title,
      description: calendarEvents.description,
      startTime: calendarEvents.startTime,
      endTime: calendarEvents.endTime,
      location: calendarEvents.location,
    })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        gte(calendarEvents.startTime, fromDate.toISOString())
      )
    )
    .orderBy(desc(calendarEvents.startTime));

  return events;
}

// ============= Task Functions =============

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Determine next order index for this user if not provided
  let values = { ...data } as InsertTask & { orderIndex?: number };
  if (values.userId && (values as any).orderIndex == null) {
    const [last] = await db
      .select({ idx: tasks.orderIndex })
      .from(tasks)
      .where(eq(tasks.userId, values.userId as number))
      .orderBy(desc(tasks.orderIndex))
      .limit(1);
    const nextIndex = (last?.idx ?? -1) + 1;
    (values as any).orderIndex = nextIndex;
  }

  const result = await db.insert(tasks).values(values).returning();
  return result[0];
}

export async function getUserTasks(userId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.orderIndex), desc(tasks.createdAt));
}

export async function updateTaskStatus(
  id: number,
  status: "todo" | "in_progress" | "done" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tasks).set({ status }).where(eq(tasks.id, id));
}

export async function updateTask(
  id: number,
  updates: Partial<Omit<InsertTask, "userId" | "createdAt">>
): Promise<Task | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tasks)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, id));

  const updated = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);
  return updated[0] || null;
}

export async function deleteTask(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function bulkDeleteTasks(ids: number[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return 0;

  await db.delete(tasks).where(inArray(tasks.id, ids));
  return ids.length;
}

export async function bulkUpdateTaskStatus(
  ids: number[],
  status: "todo" | "in_progress" | "done" | "cancelled"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return 0;

  await db
    .update(tasks)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(inArray(tasks.id, ids));
  return ids.length;
}

export async function bulkUpdateTaskPriority(
  ids: number[],
  priority: "low" | "medium" | "high" | "urgent"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (ids.length === 0) return 0;

  await db
    .update(tasks)
    .set({ priority, updatedAt: new Date().toISOString() })
    .where(inArray(tasks.id, ids));
  return ids.length;
}

export async function updateTaskOrder(
  taskId: number,
  orderIndex: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tasks)
    .set({ orderIndex, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, taskId));
}

export async function bulkUpdateTaskOrder(
  updates: Array<{ taskId: number; orderIndex: number }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (updates.length === 0) return;

  // Update each task's order index
  for (const update of updates) {
    await db
      .update(tasks)
      .set({
        orderIndex: update.orderIndex,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tasks.id, update.taskId));
  }
}

// ============= Analytics Functions =============

export async function trackEvent(data: InsertAnalyticsEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsEvents(
  userId: number,
  eventType?: string,
  startDate?: Date,
  endDate?: Date
): Promise<(typeof analyticsEvents.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(analyticsEvents.userId, userId)];
  if (eventType) {
    conditions.push(eq(analyticsEvents.eventType, eventType));
  }
  if (startDate && endDate) {
    const startIso =
      startDate instanceof Date ? startDate.toISOString() : String(startDate);
    const endIso =
      endDate instanceof Date ? endDate.toISOString() : String(endDate);
    conditions.push(
      and(
        gte(analyticsEvents.createdAt, startIso),
        lte(analyticsEvents.createdAt, endIso)
      )!
    );
  }

  return db
    .select()
    .from(analyticsEvents)
    .where(and(...conditions))
    .orderBy(desc(analyticsEvents.createdAt));
}

/**
 * Get user preferences, creating default if not exists
 */
export async function getUserPreferences(
  userId: number
): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get user preferences: database not available"
    );
    return null;
  }

  try {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
      .execute();

    if (prefs) {
      return prefs;
    }

    // Create default preferences if not exists
    await db
      .insert(userPreferences)
      .values({
        userId,
        theme: "dark",
        emailNotifications: true,
        desktopNotifications: false,
      })
      .execute();

    // Fetch the newly created preferences
    const [newPrefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
      .execute();

    return newPrefs || null;
  } catch (error) {
    console.error("[Database] Failed to get user preferences:", error);
    return null;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: number,
  preferences: Partial<
    Omit<InsertUserPreferences, "userId" | "id" | "createdAt" | "updatedAt">
  >
): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot update user preferences: database not available"
    );
    return null;
  }

  try {
    // Check if preferences exist
    const existing = await getUserPreferences(userId);

    if (existing) {
      // Update existing
      await db
        .update(userPreferences)
        .set(preferences)
        .where(eq(userPreferences.userId, userId))
        .execute();

      // Fetch updated record
      const [result] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1)
        .execute();

      return result || null;
    } else {
      // Create new preferences
      await db
        .insert(userPreferences)
        .values({
          userId,
          theme: "dark",
          emailNotifications: true,
          desktopNotifications: false,
          ...preferences,
        })
        .execute();

      // Fetch the newly created preferences
      const [newPrefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1)
        .execute();

      return newPrefs || null;
    }
  } catch (error) {
    console.error("[Database] Failed to update user preferences:", error);
    return null;
  }
}

/**
 * Update user name
 */
export async function updateUserName(
  userId: number,
  name: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user name: database not available");
    return;
  }

  try {
    await db.update(users).set({ name }).where(eq(users.id, userId)).execute();
  } catch (error) {
    console.error("[Database] Failed to update user name:", error);
    throw error;
  }
}

/**
 * Get pipeline state for a thread
 */
export async function getPipelineState(
  userId: number,
  threadId: string
): Promise<EmailPipelineState | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get pipeline state: database not available"
    );
    return null;
  }

  try {
    const [state] = await db
      .select()
      .from(emailPipelineState)
      .where(
        and(
          eq(emailPipelineState.threadId, threadId),
          eq(emailPipelineState.userId, userId)
        )
      )
      .limit(1)
      .execute();

    return state || null;
  } catch (error) {
    console.error("[Database] Failed to get pipeline state:", error);
    return null;
  }
}

/**
 * Update pipeline stage for a thread
 */
export async function updatePipelineStage(
  userId: number,
  threadId: string,
  stage:
    | "needs_action"
    | "venter_pa_svar"
    | "i_kalender"
    | "finance"
    | "afsluttet",
  triggeredBy: string = "user"
): Promise<EmailPipelineState | null> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot update pipeline stage: database not available"
    );
    return null;
  }

  try {
    // Get current state to track transition
    const currentState = await getPipelineState(userId, threadId);
    const fromStage = currentState?.stage || null;

    // Update or create pipeline state
    if (currentState) {
      await db
        .update(emailPipelineState)
        .set({
          stage,
          transitionedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(emailPipelineState.threadId, threadId),
            eq(emailPipelineState.userId, userId)
          )
        )
        .execute();
    } else {
      await db
        .insert(emailPipelineState)
        .values({
          userId,
          threadId,
          stage,
          transitionedAt: new Date().toISOString(),
        })
        .execute();
    }

    // Log transition
    await db
      .insert(emailPipelineTransitions)
      .values({
        userId,
        threadId,
        fromStage,
        toStage: stage,
        transitionedBy: triggeredBy,
      })
      .execute();

    // Trigger workflow automation for stage transitions
    if (fromStage !== stage) {
      const { handlePipelineTransition } = await import("./pipeline-workflows");
      handlePipelineTransition(userId, threadId, stage).catch(error => {
        console.error(
          `[Database] Failed to trigger pipeline workflow for thread ${threadId}:`,
          error
        );
      });
    }

    return await getPipelineState(userId, threadId);
  } catch (error) {
    console.error("[Database] Failed to update pipeline stage:", error);
    return null;
  }
}

/**
 * Get pipeline transitions for a thread
 */
export async function getPipelineTransitions(
  userId: number,
  threadId: string
): Promise<EmailPipelineTransition[]> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get pipeline transitions: database not available"
    );
    return [];
  }

  try {
    return await db
      .select()
      .from(emailPipelineTransitions)
      .where(
        and(
          eq(emailPipelineTransitions.threadId, threadId),
          eq(emailPipelineTransitions.userId, userId)
        )
      )
      .orderBy(desc(emailPipelineTransitions.createdAt))
      .execute();
  } catch (error) {
    console.error("[Database] Failed to get pipeline transitions:", error);
    return [];
  }
}

/**
 * Get all pipeline states for a user (filtered by stage)
 */
export async function getUserPipelineStates(
  userId: number,
  stage?:
    | "needs_action"
    | "venter_pa_svar"
    | "i_kalender"
    | "finance"
    | "afsluttet"
): Promise<EmailPipelineState[]> {
  const db = await getDb();
  if (!db) {
    console.warn(
      "[Database] Cannot get user pipeline states: database not available"
    );
    return [];
  }

  try {
    if (stage) {
      return await db
        .select()
        .from(emailPipelineState)
        .where(
          and(
            eq(emailPipelineState.stage, stage),
            eq(emailPipelineState.userId, userId)
          )
        )
        .execute();
    }

    return await db
      .select()
      .from(emailPipelineState)
      .where(eq(emailPipelineState.userId, userId))
      .execute();
  } catch (error) {
    console.error("[Database] Failed to get user pipeline states:", error);
    return [];
  }
}
