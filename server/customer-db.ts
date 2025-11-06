import { and, desc, eq } from "drizzle-orm";
import {
  CalendarEvent,
  customerConversations,
  customerEmails,
  customerInvoices,
  customerProfiles,
  InsertCustomerConversation,
  InsertCustomerEmail,
  InsertCustomerInvoice,
  InsertCustomerProfile,
} from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Customer Profile Database Helpers
 * Handles customer data aggregation from leads, invoices, and emails
 */

export async function getCustomerProfileByEmail(email: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.email, email),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerProfileByLeadId(
  leadId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.leadId, leadId),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerProfileById(
  customerId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.id, customerId),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateCustomerProfile(
  data: InsertCustomerProfile
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if profile exists
  const existing = await getCustomerProfileByEmail(data.email, data.userId);

  if (existing) {
    // Update existing profile
    await db
      .update(customerProfiles)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customerProfiles.id, existing.id));
    return existing.id;
  } else {
    // Create new profile
    const result = await db.insert(customerProfiles).values(data).returning();
    return result[0].id;
  }
}

export async function getCustomerInvoices(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return [];

  const result = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.customerId, customerId))
    // entryDate does not exist on customer_invoices; use createdAt as default sort
    .orderBy(desc(customerInvoices.createdAt));

  return result;
}

export async function addCustomerInvoice(data: InsertCustomerInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if invoice already exists
  const existing = await db
    .select()
    .from(customerInvoices)
    .where(
      and(
        eq(customerInvoices.customerId, data.customerId ?? -1),
        eq(customerInvoices.billyInvoiceId, data.billyInvoiceId ?? "")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing invoice
    await db
      .update(customerInvoices)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customerInvoices.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new invoice
    const result = await db.insert(customerInvoices).values(data).returning();
    return result[0].id;
  }
}

export async function getCustomerEmails(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return [];

  const result = await db
    .select()
    .from(customerEmails)
    .where(eq(customerEmails.customerId, customerId))
    .orderBy(desc(customerEmails.lastMessageDate));

  return result;
}

export async function addCustomerEmail(data: InsertCustomerEmail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if email thread already exists
  const existing = await db
    .select()
    .from(customerEmails)
    .where(
      and(
        eq(customerEmails.customerId, data.customerId),
        eq(customerEmails.gmailThreadId, data.gmailThreadId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing email thread
    await db
      .update(customerEmails)
      .set({
        subject: data.subject,
        snippet: data.snippet,
        lastMessageDate: data.lastMessageDate,
        isRead: data.isRead,
      })
      .where(eq(customerEmails.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new email thread
    const result = await db.insert(customerEmails).values(data).returning();
    return result[0].id;
  }
}

export async function getCustomerConversation(
  customerId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return undefined;

  const result = await db
    .select()
    .from(customerConversations)
    .where(eq(customerConversations.customerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomerConversation(
  data: InsertCustomerConversation
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(customerConversations)
    .values(data)
    .returning();
  return result[0].id;
}

export async function updateCustomerBalance(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate totals from invoices
  const invoices = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.customerId, customerId));

  // amount is numeric (string|null) in schema; store profile totals as integer (cents)
  const toCents = (v: string | null) => Math.round((Number(v ?? 0) || 0) * 100);
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + toCents(inv.amount as any),
    0
  );
  const totalPaid = invoices.reduce(
    (sum, inv) =>
      sum + (inv.status === "paid" ? toCents(inv.amount as any) : 0),
    0
  );
  const balance = totalInvoiced - totalPaid;
  const invoiceCount = invoices.length;

  // Update customer profile
  await db
    .update(customerProfiles)
    .set({
      totalInvoiced,
      totalPaid,
      balance,
      invoiceCount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customerProfiles.id, customerId));

  return { totalInvoiced, totalPaid, balance, invoiceCount };
}

export async function updateCustomerEmailCount(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count email threads
  const emails = await db
    .select()
    .from(customerEmails)
    .where(eq(customerEmails.customerId, customerId));

  const emailCount = emails.length;
  const lastContactDate =
    emails.length > 0 && emails[0].lastMessageDate
      ? emails[0].lastMessageDate
      : undefined;

  // Update customer profile
  await db
    .update(customerProfiles)
    .set({
      emailCount,
      lastContactDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customerProfiles.id, customerId));

  return { emailCount, lastContactDate };
}

export async function getAllCustomerProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .orderBy(desc(customerProfiles.lastContactDate));

  return result;
}

/**
 * Get calendar events for a customer
 * Matches events by customer name or email in event title/description
 */
export async function getCustomerCalendarEvents(
  customerId: number,
  userId: number
): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  // First get the customer
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer || !customer.name || !customer.email) return [];

  const customerName = customer.name.toLowerCase();
  const customerEmail = customer.email.toLowerCase();

  // Fetch from Google Calendar API for last 6 months (July-now)
  const { listCalendarEvents } = await import("./google-api");

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months back for history

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 month forward

  try {
    const googleEvents = await listCalendarEvents({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 500,
    });

    // Filter events that match customer name or email (improved precision)
    const matchedEvents = googleEvents.filter((event: any) => {
      const summary = (event.summary || "").toLowerCase();
      const description = (event.description || "").toLowerCase();
      const location = (event.location || "").toLowerCase();

      // Split summary to get customer name part (format: "Type - Customer - Details")
      const summaryParts = event.summary?.split("-") || [];
      const eventCustomerName =
        summaryParts.length > 1 ? summaryParts[1].trim().toLowerCase() : "";

      // Match by:
      // 1. Customer name appears in the summary customer section (most precise)
      // 2. Full customer name in description (word boundary aware)
      // 3. Email in description (exact match)
      // 4. Customer name in location
      return (
        (eventCustomerName && eventCustomerName.includes(customerName)) || // Name in customer section
        (customerName && description.includes(customerName)) || // Name in description
        (customerEmail && description.includes(customerEmail)) || // Email in description
        (customerName && location.includes(customerName)) // Name in location
      );
    });

    // Convert to CalendarEvent format
    return matchedEvents.map((event: any, index: number) => ({
      id: index + 1, // Temporary ID for display
      userId,
      googleEventId: event.id || null,
      calendarId: event.organizer?.email || null,
      title: event.summary || "(No Title)",
      description: event.description || null,
      startTime:
        event.start?.dateTime || event.start?.date || new Date().toISOString(),
      endTime:
        event.end?.dateTime || event.end?.date || new Date().toISOString(),
      location: event.location || null,
      isAllDay: !!event.start?.date, // All-day if only date (no dateTime)
      attendees: null,
      status:
        event.status === "confirmed" ||
        event.status === "tentative" ||
        event.status === "cancelled"
          ? (event.status as "confirmed" | "tentative" | "cancelled")
          : "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching customer calendar events:", error);
    return [];
  }
}
