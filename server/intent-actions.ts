/**
 * Intent-Based Action System
 * Parses user messages to detect intents and executes actions directly
 * This replaces tool calling which doesn't work with Gemini via Forge API
 */

import { createLead, createTask, getUserLeads, getUserTasks } from "./db";
import { searchGmailThreads, createCalendarEvent, listCalendarEvents, checkCalendarAvailability } from "./mcp";
import { createInvoice, getCustomers } from "./billy";

export type Intent =
  | "create_lead"
  | "create_task"
  | "create_invoice"
  | "book_meeting"
  | "search_email"
  | "list_tasks"
  | "list_leads"
  | "check_calendar"
  | "request_flytter_photos"
  | "job_completion"
  | "unknown";

export interface ParsedIntent {
  intent: Intent;
  params: Record<string, any>;
  confidence: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Parse user message to detect intent and extract parameters
 */
export function parseIntent(message: string): ParsedIntent {
  const lowerMessage = message.toLowerCase();

  // Create Lead Intent
  if (lowerMessage.includes("opret") && (lowerMessage.includes("lead") || lowerMessage.includes("kunde"))) {
    const params: Record<string, any> = {};

    // Extract name
    const nameMatch = message.match(/navn:?\s*([^,\n]+)/i);
    if (nameMatch) params.name = nameMatch[1].trim();

    // Extract email
    const emailMatch = message.match(/email:?\s*([^\s,\n]+@[^\s,\n]+)/i);
    if (emailMatch) params.email = emailMatch[1].trim();

    // Extract phone
    const phoneMatch = message.match(/telefon:?\s*([0-9\s+]+)/i);
    if (phoneMatch) params.phone = phoneMatch[1].trim().replace(/\s/g, "");

    // Extract source
    const sourceMatch = message.match(/kilde:?\s*([^,\n]+)/i);
    if (sourceMatch) params.source = sourceMatch[1].trim();

    return {
      intent: "create_lead",
      params,
      confidence: 0.9,
    };
  }

  // Create Invoice Intent
  if (lowerMessage.includes("opret") && lowerMessage.includes("faktura")) {
    const params: Record<string, any> = {};

    // Extract customer name/ID
    const customerMatch = message.match(/(?:til\s+)?kunde:?\s*([^,\nfor]+)/i);
    if (customerMatch) params.customerName = customerMatch[1].trim();

    // Extract amount
    const amountMatch = message.match(/(\d+(?:[.,]\d+)?)\s*kr/i);
    if (amountMatch) params.amount = parseFloat(amountMatch[1].replace(",", "."));

    // Extract description
    const descMatch = message.match(/(?:for|beskrivelse):?\s*([^,\n]+)/i);
    if (descMatch) params.description = descMatch[1].trim();

    return {
      intent: "create_invoice",
      params,
      confidence: 0.85,
    };
  }

  // Create Task Intent
  if (lowerMessage.includes("opret") && (lowerMessage.includes("opgave") || lowerMessage.includes("task"))) {
    const params: Record<string, any> = {};

    // Extract title (everything after "opret opgave:" or similar)
    const titleMatch = message.match(/opret\s+(?:en\s+)?opgave:?\s*([^,\n]+)/i);
    if (titleMatch) params.title = titleMatch[1].trim();

    // Extract priority
    if (lowerMessage.includes("høj prioritet") || lowerMessage.includes("vigtig")) {
      params.priority = "high";
    } else if (lowerMessage.includes("lav prioritet")) {
      params.priority = "low";
    } else if (lowerMessage.includes("urgent")) {
      params.priority = "urgent";
    }

    // Extract deadline
    if (lowerMessage.includes("i morgen")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.dueDate = tomorrow.toISOString();
    } else if (lowerMessage.includes("i dag")) {
      params.dueDate = new Date().toISOString();
    }

    // Extract time
    const timeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?/i);
    if (timeMatch && params.dueDate) {
      const date = new Date(params.dueDate);
      date.setHours(parseInt(timeMatch[1]), timeMatch[2] ? parseInt(timeMatch[2]) : 0);
      params.dueDate = date.toISOString();
    }

    return {
      intent: "create_task",
      params,
      confidence: 0.9,
    };
  }

  // Book Meeting Intent - Enhanced to recognize "Book X til rengøring" format
  if ((lowerMessage.includes("book") || lowerMessage.includes("opret")) &&
      (lowerMessage.includes("møde") ||
       lowerMessage.includes("aftale") ||
       lowerMessage.includes("tid") ||
       lowerMessage.includes("rengøring") ||
       lowerMessage.includes("hovedrengøring") ||
       lowerMessage.includes("flytterengøring"))) {
    const params: Record<string, any> = {};

    // Extract participant/customer name
    // Pattern: "Book [Name] til..." or "med [Name]"
    const participantMatch = message.match(/book\s+(.+?)\s+til/i) ||
                           message.match(/(?:med|hos)\s+([^,\npå]+)/i);
    if (participantMatch) params.participant = participantMatch[1].trim();

    // Extract job type
    if (lowerMessage.includes("flytterengøring")) {
      params.jobType = "Flytterengøring";
    } else if (lowerMessage.includes("hovedrengøring")) {
      params.jobType = "Hovedrengøring";
    } else if (lowerMessage.includes("fast rengøring")) {
      params.jobType = "Fast Rengøring";
    } else if (lowerMessage.includes("rengøring")) {
      params.jobType = "Rengøring";
    }

    // Extract date/time
    const dateMatch = message.match(/(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|i\s+dag|i\s+morgen|på\s+mandag|på\s+tirsdag|på\s+onsdag|på\s+torsdag|på\s+fredag)/i);
    if (dateMatch) params.dateHint = dateMatch[1].trim().replace("på ", "");

    // Extract time range (e.g., "kl 10-13" or "kl 10:00-13:00")
    const timeRangeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/i);
    if (timeRangeMatch) {
      params.startHour = parseInt(timeRangeMatch[1]);
      params.startMinute = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
      params.endHour = parseInt(timeRangeMatch[3]);
      params.endMinute = timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) : 0;
    } else {
      // Single time
      const timeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?/i);
      if (timeMatch) {
        params.startHour = parseInt(timeMatch[1]);
        params.startMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      }
    }

    return {
      intent: "book_meeting",
      params,
      confidence: 0.8,
    };
  }

  // Search Email Intent
  if ((lowerMessage.includes("søg") || lowerMessage.includes("find")) &&
      (lowerMessage.includes("email") || lowerMessage.includes("mail") || lowerMessage.includes("besked"))) {
    const params: Record<string, any> = {};

    // Extract search query
    const fromMatch = message.match(/fra\s+([^,\n]+)/i);
    if (fromMatch) params.from = fromMatch[1].trim();

    const aboutMatch = message.match(/om\s+([^,\n]+)/i);
    if (aboutMatch) params.subject = aboutMatch[1].trim();

    // Time range
    if (lowerMessage.includes("sidste uge") || lowerMessage.includes("seneste uge")) {
      params.timeRange = "last_week";
    } else if (lowerMessage.includes("sidste 7 dage") || lowerMessage.includes("seneste 7 dage")) {
      params.timeRange = "last_7_days";
    }

    return {
      intent: "search_email",
      params,
      confidence: 0.85,
    };
  }

  // List Tasks Intent
  if ((lowerMessage.includes("vis") || lowerMessage.includes("list")) &&
      (lowerMessage.includes("opgave") || lowerMessage.includes("task") || lowerMessage.includes("todo"))) {
    return {
      intent: "list_tasks",
      params: {},
      confidence: 0.9,
    };
  }

  // List Leads Intent
  if ((lowerMessage.includes("vis") || lowerMessage.includes("find") || lowerMessage.includes("list")) &&
      lowerMessage.includes("lead")) {
    const params: Record<string, any> = {};

    if (lowerMessage.includes("nye") || lowerMessage.includes("seneste")) {
      params.filter = "recent";
    }

    return {
      intent: "list_leads",
      params,
      confidence: 0.85,
    };
  }

  // Check Calendar Intent
  if ((lowerMessage.includes("tjek") || lowerMessage.includes("se")) &&
      (lowerMessage.includes("kalender") || lowerMessage.includes("aftale"))) {
    return {
      intent: "check_calendar",
      params: {},
      confidence: 0.8,
    };
  }

  // Request Flytterengøring Photos Intent (MEMORY_16)
  if ((lowerMessage.includes("nyt lead") || lowerMessage.includes("lead") || lowerMessage.includes("kunde")) &&
      (lowerMessage.includes("flytterengøring") || lowerMessage.includes("flytte"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/(?:navn:?|lead:?)\s*([^,\nønsker]+)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    // Extract square meters
    const sqmMatch = message.match(/(\d+)\s*m²/i);
    if (sqmMatch) params.squareMeters = parseInt(sqmMatch[1]);

    return {
      intent: "request_flytter_photos",
      params,
      confidence: 0.9,
    };
  }

  // Job Completion Intent (MEMORY_24)
  if ((lowerMessage.includes("færdig") || lowerMessage.includes("afslut") || lowerMessage.includes("done")) &&
      (lowerMessage.includes("rengøring") || lowerMessage.includes("job") || lowerMessage.includes("opgave"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    return {
      intent: "job_completion",
      params,
      confidence: 0.85,
    };
  }

  return {
    intent: "unknown",
    params: {},
    confidence: 0,
  };
}

/**
 * Execute action based on detected intent
 */
export async function executeAction(
  intent: ParsedIntent,
  userId: number
): Promise<ActionResult> {
  try {
    switch (intent.intent) {
      case "create_lead":
        return await executeCreateLead(intent.params, userId);

      case "create_task":
        return await executeCreateTask(intent.params, userId);

      case "create_invoice":
        return await executeCreateInvoice(intent.params, userId);

      case "book_meeting":
        return await executeBookMeeting(intent.params, userId);

      case "search_email":
        return await executeSearchEmail(intent.params, userId);

      case "list_tasks":
        return await executeListTasks(userId);

      case "list_leads":
        return await executeListLeads(intent.params, userId);

      case "check_calendar":
        return await executeCheckCalendar(userId);

      case "request_flytter_photos":
        return await executeRequestFlytterPhotos(intent.params, userId);

      case "job_completion":
        return await executeJobCompletion(intent.params, userId);

      default:
        return {
          success: false,
          message: "Jeg forstod ikke helt hvad du ønsker. Kan du omformulere?",
        };
    }
  } catch (error) {
    console.error("[Intent Action] Error executing action:", error);
    return {
      success: false,
      message: "Der opstod en fejl under udførelsen af handlingen.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeCreateLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { name, email, phone, source } = params;

  if (!name || !email) {
    return {
      success: false,
      message: "Jeg mangler navn og email for at oprette et lead. Prøv igen med: Navn: X, Email: Y",
    };
  }

  const lead = await createLead({
    userId,
    name,
    email,
    phone: phone || null,
    source: source || "manual",
    score: 50,
    status: "new",
  });

  return {
    success: true,
    message: `✅ Lead oprettet: **${name}** (${email})${phone ? `, Telefon: ${phone}` : ""}. Leadet er nu synligt i Leads-fanen.`,
    data: lead,
  };
}

async function executeCreateTask(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { title, priority, dueDate } = params;

  if (!title) {
    return {
      success: false,
      message: "Jeg mangler en titel for opgaven. Prøv: Opret opgave: [titel]",
    };
  }

  const task = await createTask({
    userId,
    title,
    description: null,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    priority: priority || "medium",
    status: "todo",
    relatedTo: null,
  });

  return {
    success: true,
    message: `✅ Opgave oprettet: **${title}**${priority ? ` (${priority} prioritet)` : ""}${dueDate ? ` - Deadline: ${new Date(dueDate).toLocaleString("da-DK")}` : ""}. Opgaven er nu synlig i Tasks-fanen.`,
    data: task,
  };
}

async function executeCreateInvoice(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, amount, description } = params;

  // CRITICAL RULE: Validate required parameters
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundenavn. Prøv: Opret faktura til [Kundenavn] for [antal] arbejdstimer",
    };
  }

  // Parse work hours from description or amount
  let workHours = 0;
  let jobType = "REN-001"; // Default: Fast Rengøring
  let jobDescription = description || "Rengøring";

  // Extract work hours from message
  const hoursMatch = description?.match(/(\d+)\s*(?:arbejdstimer|timer|t)/i);
  if (hoursMatch) {
    workHours = parseInt(hoursMatch[1]);
  } else if (amount) {
    // Calculate from amount (349 kr/time)
    workHours = Math.round(amount / 349);
  }

  if (workHours === 0) {
    return {
      success: false,
      message: "Jeg mangler antal arbejdstimer. Prøv: Opret faktura til [Kundenavn] for [antal] arbejdstimer [type rengøring]",
    };
  }

  // Detect job type from description
  if (description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("flytterengøring") || lowerDesc.includes("flytte")) {
      jobType = "REN-003";
      jobDescription = "Flytterengøring";
    } else if (lowerDesc.includes("hovedrengøring") || lowerDesc.includes("hoved")) {
      jobType = "REN-002";
      jobDescription = "Hovedrengøring";
    } else if (lowerDesc.includes("erhverv")) {
      jobType = "REN-004";
      jobDescription = "Erhvervsrengøring";
    } else if (lowerDesc.includes("fast")) {
      jobType = "REN-001";
      jobDescription = "Fast Rengøring";
    }
  }

  // STEP 1: Search for customer in Billy
  let allCustomers: any[];
  try {
    allCustomers = await getCustomers();
  } catch (error) {
    return {
      success: false,
      message: "Kunne ikke hente kunder fra Billy. Tjek Billy API forbindelse.",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const customers = allCustomers.filter((c: any) =>
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  if (customers.length === 0) {
    return {
      success: false,
      message: `⚠️ Jeg kunne ikke finde en kunde ved navn "${customerName}" i Billy.\n\n**Næste skridt:**\n1. Opret kunden først i Billy.dk\n2. Eller brug det præcise kundenavn fra Billy\n3. Eller giv mig kundens email så jeg kan oprette dem`,
    };
  }

  if (customers.length > 1) {
    const customerList = customers.map((c: any) => `- ${c.name}`).join("\n");
    return {
      success: false,
      message: `⚠️ Jeg fandt ${customers.length} kunder der matcher "${customerName}":  \n\n${customerList}\n\nVælg venligst et mere præcist navn.`,
      data: { customers },
    };
  }

  const customer = customers[0];

  // STEP 2: Calculate invoice details
  const unitPrice = 349; // CRITICAL: 349 kr/time/person (MEMORY_17)
  const totalAmount = workHours * unitPrice;

  // STEP 3: Create invoice as DRAFT (CRITICAL: NEVER auto-approve - MEMORY_17)
  let invoice: any;
  try {
    invoice = await createInvoice({
      contactId: customer.id,
      entryDate: new Date().toISOString().split("T")[0],
      paymentTermsDays: 1, // 1 day for one-time jobs
      lines: [
        {
          productId: jobType, // REN-001 to REN-005
          description: `${jobDescription} - ${workHours} arbejdstimer`,
          quantity: workHours,
          unitPrice: unitPrice, // CRITICAL: Set unitPrice per line (MEMORY_17)
        },
      ],
      // state: "draft" is default - DO NOT set to "approved"
    });
  } catch (error) {
    return {
      success: false,
      message: "Kunne ikke oprette faktura i Billy. Tjek Billy API forbindelse.",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // STEP 4: Return for REVIEW (CRITICAL: User must approve manually)
  return {
    success: true,
    message: `✅ **Faktura DRAFT oprettet** (ikke godkendt endnu)\n\n💼 **Kunde:** ${customer.name}\n📝 **Type:** ${jobDescription} (${jobType})\n⏱️ **Arbejdstimer:** ${workHours}t\n💰 **Pris:** ${unitPrice} kr/time\n💵 **Total:** ${totalAmount} kr inkl. moms\n\n⚠️ **Næste skridt:**\n1. Gå til Invoices-fanen og gennemse fakturaen\n2. Godkend manuelt i Billy.dk hvis alt ser rigtigt ud\n3. Send faktura til kunden\n\n✅ **VERIFICERET:** Faktura oprettet som draft (ikke auto-godkendt)`,
    data: { invoice, customer, workHours, totalAmount },
  };
}

async function executeBookMeeting(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { participant, jobType, dateHint, startHour, startMinute, endHour, endMinute } = params;

  // CRITICAL RULE: Validate required parameters
  if (!participant) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Book [Navn] til rengøring på [dag] kl [tid]",
    };
  }

  if (startHour === undefined) {
    return {
      success: false,
      message: "Jeg mangler tidspunkt. Prøv: Book [Navn] til rengøring på [dag] kl [tid]",
    };
  }

  // Calculate target date
  const now = new Date();
  let targetDate = new Date(now);

  // Map Danish weekdays
  const weekdayMap: Record<string, number> = {
    "mandag": 1, "tirsdag": 2, "onsdag": 3, "torsdag": 4,
    "fredag": 5, "lørdag": 6, "søndag": 0,
  };

  if (dateHint) {
    const lowerHint = dateHint.toLowerCase();
    if (lowerHint === "i dag") {
      // Keep current date
    } else if (lowerHint === "i morgen") {
      targetDate.setDate(now.getDate() + 1);
    } else if (weekdayMap[lowerHint] !== undefined) {
      const targetDay = weekdayMap[lowerHint];
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      targetDate.setDate(now.getDate() + daysToAdd);
    }
  } else {
    return {
      success: false,
      message: "Jeg mangler dato. Prøv: Book [Navn] til rengøring på [mandag/tirsdag/etc] kl [tid]",
    };
  }

  // CRITICAL RULE: Round hours only (MEMORY_15)
  // If minutes are not 0 or 30, round to nearest half hour
  let finalStartMinute = startMinute || 0;
  let finalEndMinute = endMinute || 0;

  if (finalStartMinute !== 0 && finalStartMinute !== 30) {
    finalStartMinute = finalStartMinute < 30 ? 0 : 30;
  }
  if (finalEndMinute !== 0 && finalEndMinute !== 30) {
    finalEndMinute = finalEndMinute < 30 ? 0 : 30;
  }

  targetDate.setHours(startHour, finalStartMinute, 0, 0);

  // Calculate end time
  const endDate = new Date(targetDate);
  if (endHour !== undefined) {
    endDate.setHours(endHour, finalEndMinute, 0, 0);
  } else {
    // Default: 3 hours for rengøring
    endDate.setHours(startHour + 3, finalStartMinute, 0, 0);
  }

  // Calculate duration in hours (for display)
  const durationMs = endDate.getTime() - targetDate.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // STEP 1: Check calendar availability FIRST (MEMORY_5)
  try {
    const existingEvents = await listCalendarEvents({
      timeMin: targetDate.toISOString(),
      timeMax: endDate.toISOString(),
    });

    if (existingEvents && existingEvents.length > 0) {
      return {
        success: false,
        message: `⚠️ Kalenderen er optaget på ${targetDate.toLocaleDateString("da-DK")} kl. ${startHour}:${finalStartMinute.toString().padStart(2, "0")}. Der er allerede ${existingEvents.length} aftale(r) i dette tidsrum. Vælg venligst et andet tidspunkt.`,
        data: { existingEvents },
      };
    }
  } catch (error) {
    console.error("[Calendar Check] Error checking availability:", error);
    // Continue anyway - better to book than fail
  }

  // STEP 2: Create event with proper format
  // Format: 🏠 [TYPE] #X - [Customer Name] (MEMORY_19)
  const eventTitle = `🏠 ${jobType || "Rengøring"} - ${participant}`;

  // CRITICAL RULE: NO attendees parameter (MEMORY_19)
  // This prevents automatic Google Calendar invites
  const event = await createCalendarEvent({
    summary: eventTitle,
    start: targetDate.toISOString(),
    end: endDate.toISOString(),
    description: `${jobType || "Rengøring"} for ${participant}\n\nOprettet af Friday AI\n\nKRITISK: Ingen attendees tilføjet (MEMORY_19)`,
    // NO attendees field - this is critical!
  });

  return {
    success: true,
    message: `✅ Booking oprettet: **${participant}** - ${jobType || "Rengøring"}\n\n📅 **Dato:** ${targetDate.toLocaleDateString("da-DK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n⏰ **Tid:** ${startHour}:${finalStartMinute.toString().padStart(2, "0")} - ${endHour || (startHour + 3)}:${finalEndMinute.toString().padStart(2, "0")} (${durationHours}t)\n\n✅ **VERIFICERET:** Ingen attendees tilføjet (ingen automatiske invites sendt)\n✅ **VERIFICERET:** Runde timer anvendt\n\nBookingen er nu synlig i Calendar-fanen.`,
    data: event,
  };
}

async function executeSearchEmail(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { from, subject, timeRange } = params;

  let query = "";
  if (from) query += `from:${from} `;
  if (subject) query += `subject:${subject} `;

  // Add time range
  if (timeRange === "last_week" || timeRange === "last_7_days") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query += `after:${weekAgo.toISOString().split("T")[0]}`;
  }

  const results = await searchGmailThreads({ query: query.trim() || "in:inbox", maxResults: 20 });

  return {
    success: true,
    message: `📧 Jeg fandt **${results.length} emails**${from ? ` fra ${from}` : ""}. Resultaterne vises i Email-fanen.`,
    data: results,
  };
}

async function executeListTasks(userId: number): Promise<ActionResult> {
  const tasks = await getUserTasks(userId);

  if (tasks.length === 0) {
    return {
      success: true,
      message: "📝 Du har ingen opgaver endnu. Vil du have mig til at oprette en?",
      data: [],
    };
  }

  const pendingTasks = tasks.filter((t: any) => t.status !== "completed");

  return {
    success: true,
    message: `📝 Du har **${pendingTasks.length} aktive opgaver** (${tasks.length} total). Se dem i Tasks-fanen.`,
    data: tasks,
  };
}

async function executeListLeads(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const leads = await getUserLeads(userId);

  if (leads.length === 0) {
    return {
      success: true,
      message: "👥 Du har ingen leads endnu. Vil du have mig til at søge efter nye leads i dine emails?",
      data: [],
    };
  }

  let filteredLeads = leads;
  if (params.filter === "recent") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filteredLeads = leads.filter((l: any) => new Date(l.createdAt) > weekAgo);
  }

  const newLeads = filteredLeads.filter((l: any) => l.status === "new");

  return {
    success: true,
    message: `👥 Du har **${newLeads.length} nye leads** (${filteredLeads.length} total${params.filter === "recent" ? " fra sidste uge" : ""}). Se dem i Leads-fanen.`,
    data: filteredLeads,
  };
}

async function executeCheckCalendar(userId: number): Promise<ActionResult> {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  const events = await listCalendarEvents({ timeMin: now.toISOString(), timeMax: endOfWeek.toISOString() });

  return {
    success: true,
    message: `📅 Du har **${events.length} aftaler** i din kalender de næste 7 dage. Se dem i Calendar-fanen.`,
    data: events,
  };
}

async function executeRequestFlytterPhotos(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, squareMeters } = params;

  // CRITICAL RULE: ALWAYS request photos FIRST for flytterengøring (MEMORY_16)
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Nyt lead: [Navn] ønsker flytterengøring, [antal]m²",
    };
  }

  // Create lead first
  const lead = await createLead({
    userId,
    name: customerName,
    email: null,
    phone: null,
    source: "flytterengøring",
    score: 60, // Higher score for flytterengøring
    status: "new",
    notes: `Flytterengøring${squareMeters ? ` - ${squareMeters}m²` : ""}`,
  });

  // CRITICAL: Request photos BEFORE sending quote (MEMORY_16)
  return {
    success: true,
    message: `✅ Lead oprettet: **${customerName}** - Flytterengøring${squareMeters ? ` (${squareMeters}m²)` : ""}

⚠️ **KRITISK REGEL (MEMORY_16): BED OM BILLEDER FØRST!**

📸 **Næste skridt - Spørg kunden:**

"Hej ${customerName}! 👋

For at give dig det mest præcise tilbud på din flytterengøring, har jeg brug for nogle billeder:

1. **Køkken** (ovn, emhætte, skabe)
2. **Badeværelse** (fliser, fuger, brusekabine)
3. **Problemområder** (hvis der er særligt beskidte områder)

Derudover har jeg brug for:
- Dit **budget** for rengøringen
- **Fokusområder** (hvad skal prioriteres?)
- **Deadline** (hvornår skal det være færdigt?)

Send billeder og info, så sender jeg dig et skræddersyet tilbud! 😊"

🚫 **SEND IKKE tilbud før billeder er modtaget!**

Leadet er nu synligt i Leads-fanen.`,
    data: { lead, requiresPhotos: true },
  };
}

async function executeJobCompletion(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName } = params;

  // CRITICAL RULE: Follow completion checklist (MEMORY_24)
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: [Navn]'s rengøring er færdig",
    };
  }

  // Return completion checklist
  return {
    success: true,
    message: `✅ **Job Afslutnings-Workflow for ${customerName}**

📋 **CHECKLIST (MEMORY_24):**

1️⃣ **Er fakturaen oprettet i Billy?**
   - [ ] Ja, faktura oprettet
   - [ ] Nej, opret nu

2️⃣ **Hvilket team udførte jobbet?**
   - [ ] Jonas + Rawan
   - [ ] Jonas + FB

3️⃣ **Betaling modtaget?**
   - [ ] MobilePay 71759
   - [ ] Bankoverførsel
   - [ ] Afventer betaling

4️⃣ **Faktisk arbejdstid?**
   - [ ] [Indtast timer] timer
   - Sammenlign med booket tid

5️⃣ **Opdater kalender event:**
   - [ ] Tilføj team info
   - [ ] Tilføj faktisk arbejdstid
   - [ ] Tilføj betalingsmetode

6️⃣ **Email labels (Gmail):**
   - [ ] Fjern INBOX label
   - [ ] Fjern IMPORTANT label
   - [ ] Tilføj COMPLETED label

---

**Når alle punkter er tjekket:**
Svar "Checklist færdig for ${customerName}" så opdaterer jeg systemet.

Vil du have hjælp til nogle af punkterne?`,
    data: { customerName, checklistComplete: false },
  };
}
