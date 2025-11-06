/**
 * Friday AI Tool Handlers
 * Implements the actual execution logic for each tool
 */

import { createInvoice, getInvoices, searchCustomerByEmail } from "./billy";
import {
  createLead,
  createTask,
  getUserLeads,
  getUserTasks,
  updateLeadStatus,
} from "./db";
import { ToolName } from "./friday-tools";
import {
  createCalendarEvent,
  createGmailDraft,
  findFreeTimeSlots,
  getGmailThread,
  listCalendarEvents,
  searchGmail,
} from "./mcp";

export interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute a tool call with the given arguments
 */
export async function executeToolCall(
  toolName: ToolName,
  args: Record<string, any>,
  userId: number
): Promise<ToolCallResult> {
  try {
    switch (toolName) {
      // Gmail Tools
      case "search_gmail":
        return await handleSearchGmail(
          args as { query: string; maxResults?: number }
        );

      case "get_gmail_thread":
        return await handleGetGmailThread(args as { threadId: string });

      case "create_gmail_draft":
        return await handleCreateGmailDraft(
          args as {
            to: string;
            subject: string;
            body: string;
            cc?: string;
            bcc?: string;
          }
        );

      // Billy Tools
      case "list_billy_invoices":
        return await handleListBillyInvoices();

      case "search_billy_customer":
        return await handleSearchBillyCustomer(args as { email: string });

      case "create_billy_invoice":
        return await handleCreateBillyInvoice(
          args as {
            contactId: string;
            entryDate: string;
            paymentTermsDays?: number;
            lines: Array<{
              description: string;
              quantity: number;
              unitPrice: number;
              productId?: string;
            }>;
          }
        );

      // Calendar Tools
      case "list_calendar_events":
        return await handleListCalendarEvents(args);

      case "find_free_calendar_slots":
        return await handleFindFreeCalendarSlots(
          args as {
            date: string;
            duration: number;
            workingHours?: { start: number; end: number };
          }
        );

      case "create_calendar_event":
        return await handleCreateCalendarEvent(
          args as {
            summary: string;
            description?: string;
            start: string;
            end: string;
            location?: string;
          }
        );

      case "search_customer_calendar_history":
        return await handleSearchCustomerCalendarHistory(
          args as {
            customerName: string;
            customerEmail?: string;
            monthsBack?: number;
          }
        );

      case "update_calendar_event":
        return await handleUpdateCalendarEvent(
          args as {
            eventId: string;
            summary?: string;
            description?: string;
            start?: string;
            end?: string;
            location?: string;
          }
        );

      case "delete_calendar_event":
        return await handleDeleteCalendarEvent(
          args as {
            eventId: string;
            reason?: string;
          }
        );

      case "check_calendar_conflicts":
        return await handleCheckCalendarConflicts(
          args as {
            start: string;
            end: string;
            ignoreEventId?: string;
          }
        );

      // Lead Tools
      case "list_leads":
        return await handleListLeads(userId, args);

      case "create_lead":
        return await handleCreateLead(
          userId,
          args as {
            source: string;
            name: string;
            email?: string;
            phone?: string;
            notes?: string;
            score?: number;
          }
        );

      case "update_lead_status":
        return await handleUpdateLeadStatus(
          args as { leadId: number; status: string }
        );

      // Task Tools
      case "list_tasks":
        return await handleListTasks(userId, args);

      case "create_task":
        return await handleCreateTask(
          userId,
          args as {
            title: string;
            description?: string;
            dueDate?: string;
            priority?: string;
          }
        );

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Gmail Tool Handlers
async function handleSearchGmail(args: {
  query: string;
  maxResults?: number;
}): Promise<ToolCallResult> {
  const results = await searchGmail(args.query, args.maxResults);
  return {
    success: true,
    data: results,
  };
}

async function handleGetGmailThread(args: {
  threadId: string;
}): Promise<ToolCallResult> {
  const thread = await getGmailThread(args.threadId);
  return {
    success: true,
    data: thread,
  };
}

async function handleCreateGmailDraft(args: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<ToolCallResult> {
  const draft = await createGmailDraft(args);
  return {
    success: true,
    data: draft,
  };
}

// Billy Tool Handlers
async function handleListBillyInvoices(): Promise<ToolCallResult> {
  const invoices = await getInvoices();
  return {
    success: true,
    data: invoices,
  };
}

async function handleSearchBillyCustomer(args: {
  email: string;
}): Promise<ToolCallResult> {
  const customer = await searchCustomerByEmail(args.email);
  return {
    success: true,
    data: customer,
  };
}

async function handleCreateBillyInvoice(args: {
  contactId: string;
  entryDate: string;
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}): Promise<ToolCallResult> {
  const invoice = await createInvoice(args);
  return {
    success: true,
    data: invoice,
  };
}

// Calendar Tool Handlers
async function handleListCalendarEvents(args: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<ToolCallResult> {
  const events = await listCalendarEvents(args);
  return {
    success: true,
    data: events,
  };
}

async function handleFindFreeCalendarSlots(args: {
  date: string;
  duration: number;
  workingHours?: { start: number; end: number };
}): Promise<ToolCallResult> {
  const slots = await findFreeTimeSlots(args);
  return {
    success: true,
    data: slots,
  };
}

async function handleCreateCalendarEvent(args: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}): Promise<ToolCallResult> {
  const event = await createCalendarEvent(args);
  return {
    success: true,
    data: event,
  };
}

async function handleSearchCustomerCalendarHistory(args: {
  customerName: string;
  customerEmail?: string;
  monthsBack?: number;
}): Promise<ToolCallResult> {
  const { listCalendarEvents: listGoogleCalendarEvents } = await import(
    "./google-api"
  );

  const monthsBack = args.monthsBack || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - monthsBack);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // Include future events too

  try {
    const allEvents = await listGoogleCalendarEvents({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 500,
    });

    // Filter events matching customer
    const customerNameLower = args.customerName.toLowerCase();
    const customerEmailLower = args.customerEmail?.toLowerCase() || "";

    const matchedEvents = allEvents.filter((event: any) => {
      const summary = (event.summary || "").toLowerCase();
      const description = (event.description || "").toLowerCase();
      const location = (event.location || "").toLowerCase();

      // Get customer name from summary (format: "Type - Customer - Details")
      const summaryParts = event.summary?.split("-") || [];
      const eventCustomerName =
        summaryParts.length > 1 ? summaryParts[1].trim().toLowerCase() : "";

      return (
        (eventCustomerName && eventCustomerName.includes(customerNameLower)) ||
        (customerNameLower && description.includes(customerNameLower)) ||
        (customerEmailLower && description.includes(customerEmailLower)) ||
        (customerNameLower && location.includes(customerNameLower))
      );
    });

    // Sort by date (newest first)
    matchedEvents.sort((a: any, b: any) => {
      const aTime = a.start?.dateTime || a.start?.date || "";
      const bTime = b.start?.dateTime || b.start?.date || "";
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return {
      success: true,
      data: {
        customerName: args.customerName,
        totalEvents: matchedEvents.length,
        events: matchedEvents.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          status: event.status,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Kunne ikke hente historik: ${error instanceof Error ? error.message : "Ukendt fejl"}`,
    };
  }
}

async function handleUpdateCalendarEvent(args: {
  eventId: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
}): Promise<ToolCallResult> {
  try {
    const { updateCalendarEvent: updateGoogleEvent } = await import(
      "./google-api"
    );

    const updatedEvent = await updateGoogleEvent({
      eventId: args.eventId,
      summary: args.summary,
      description: args.description,
      start: args.start,
      end: args.end,
      location: args.location,
    });

    return {
      success: true,
      data: {
        message: "Event opdateret succesfuldt",
        event: updatedEvent,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Kunne ikke opdatere event: ${error instanceof Error ? error.message : "Ukendt fejl"}`,
    };
  }
}

async function handleDeleteCalendarEvent(args: {
  eventId: string;
  reason?: string;
}): Promise<ToolCallResult> {
  try {
    const { deleteCalendarEvent: deleteGoogleEvent } = await import(
      "./google-api"
    );

    await deleteGoogleEvent({
      eventId: args.eventId,
    });

    return {
      success: true,
      data: {
        message: `Event slettet succesfuldt${args.reason ? ` (grund: ${args.reason})` : ""}`,
        eventId: args.eventId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Kunne ikke slette event: ${error instanceof Error ? error.message : "Ukendt fejl"}`,
    };
  }
}

async function handleCheckCalendarConflicts(args: {
  start: string;
  end: string;
  ignoreEventId?: string;
}): Promise<ToolCallResult> {
  try {
    const { listCalendarEvents: listGoogleCalendarEvents } = await import(
      "./google-api"
    );

    // Fetch events in the time range
    const events = await listGoogleCalendarEvents({
      timeMin: args.start,
      timeMax: args.end,
      maxResults: 100,
    });

    // Filter for overlapping events
    const requestStart = new Date(args.start);
    const requestEnd = new Date(args.end);

    const conflicts = events.filter((event: any) => {
      // Skip if this is the event we're updating
      if (args.ignoreEventId && event.id === args.ignoreEventId) {
        return false;
      }

      const eventStart = new Date(event.start?.dateTime || event.start?.date);
      const eventEnd = new Date(event.end?.dateTime || event.end?.date);

      // Check for overlap: (StartA < EndB) AND (EndA > StartB)
      return requestStart < eventEnd && requestEnd > eventStart;
    });

    const hasConflicts = conflicts.length > 0;

    return {
      success: true,
      data: {
        hasConflicts,
        conflictCount: conflicts.length,
        conflicts: conflicts.map((event: any) => ({
          id: event.id,
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          location: event.location,
          description: event.description,
        })),
        message: hasConflicts
          ? `⚠️ ${conflicts.length} overlappende booking(s) fundet!`
          : "✅ Ingen konflikter - tiden er ledig",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Kunne ikke tjekke konflikter: ${error instanceof Error ? error.message : "Ukendt fejl"}`,
    };
  }
}

// Lead Tool Handlers
async function handleListLeads(
  userId: number,
  args: { status?: string; source?: string }
): Promise<ToolCallResult> {
  const leads = await getUserLeads(userId);

  // Filter by status if provided
  let filteredLeads = leads;
  if (args.status) {
    filteredLeads = filteredLeads.filter(lead => lead.status === args.status);
  }
  if (args.source) {
    filteredLeads = filteredLeads.filter(lead => lead.source === args.source);
  }

  return {
    success: true,
    data: filteredLeads,
  };
}

async function handleCreateLead(
  userId: number,
  args: {
    source: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    score?: number;
  }
): Promise<ToolCallResult> {
  const lead = await createLead({
    userId,
    source: args.source,
    name: args.name,
    email: args.email || null,
    phone: args.phone || null,
    score: args.score || 0,
    status: "new",
    notes: args.notes || null,
  });

  return {
    success: true,
    data: lead,
  };
}

async function handleUpdateLeadStatus(args: {
  leadId: number;
  status: string;
}): Promise<ToolCallResult> {
  await updateLeadStatus(
    args.leadId,
    args.status as
      | "new"
      | "contacted"
      | "qualified"
      | "proposal"
      | "won"
      | "lost"
  );
  return {
    success: true,
    data: { leadId: args.leadId, status: args.status },
  };
}

// Task Tool Handlers
async function handleListTasks(
  userId: number,
  args: { status?: string }
): Promise<ToolCallResult> {
  const tasks = await getUserTasks(userId);

  // Filter by status if provided
  let filteredTasks = tasks;
  if (args.status) {
    filteredTasks = filteredTasks.filter(task => task.status === args.status);
  }

  return {
    success: true,
    data: filteredTasks,
  };
}

async function handleCreateTask(
  userId: number,
  args: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
  }
): Promise<ToolCallResult> {
  const task = await createTask({
    userId,
    title: args.title,
    description: args.description || null,
    dueDate: args.dueDate ? new Date(args.dueDate).toISOString() : null,
    status: "todo",
    priority: (args.priority || "medium") as
      | "low"
      | "medium"
      | "high"
      | "urgent",
  });

  return {
    success: true,
    data: task,
  };
}
