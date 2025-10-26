import { prisma as db } from "./databaseService";
import { searchThreads } from "./gmailService";
import { logger } from "../logger";

/**
 * Duplicate Customer Detection Service
 * Prevents double-sending quotes to the same customer (MEMORY_8 rule)
 * 
 * Business Logic:
 * - Last contact < 7 days: HARD STOP (definitely duplicate)
 * - Last contact 7-30 days: WARN (maybe follow-up, maybe duplicate)
 * - Last contact > 30 days: OK (customer may have forgotten us)
 */

export type DuplicateAction = "STOP" | "WARN" | "OK";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  action: DuplicateAction;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    lastContact?: Date;
    lastQuoteDate?: Date;
    lastBookingDate?: Date;
    totalBookings: number;
    totalQuotes: number;
    stage?: string;
  };
  gmailHistory?: {
    threadCount: number;
    lastThreadDate?: Date;
  };
  recommendation: string;
  daysSinceLastContact?: number;
  daysSinceLastQuote?: number;
}

/**
 * Check if customer already exists and determine appropriate action
 */
export async function checkDuplicateCustomer(
  email: string
): Promise<DuplicateCheckResult> {
  try {
    // Step 1: Check database first (fastest)
    const dbResult = await checkDatabaseForCustomer(email);

    if (dbResult.isDuplicate) {
      return dbResult;
    }

    // Step 2: Check Gmail for any communication history
    const gmailResult = await checkGmailForCustomer(email);

    if (gmailResult.isDuplicate) {
      return gmailResult;
    }

    // Step 3: No duplicate found - safe to proceed
    return {
      isDuplicate: false,
      action: "OK",
      recommendation: "No previous contact found. Safe to send quote.",
    };
  } catch (error) {
    logger.error({ email, error }, "Error checking duplicate customer");
    // On error, be cautious and suggest manual review
    return {
      isDuplicate: false,
      action: "WARN",
      recommendation:
        "Could not verify duplicate status. Please manually check before sending quote.",
    };
  }
}

/**
 * Check database for existing customer
 */
async function checkDatabaseForCustomer(
  email: string
): Promise<DuplicateCheckResult> {
  const customer = await db.customer.findUnique({
    where: { email },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          createdAt: true,
          status: true,
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          createdAt: true,
          status: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          leads: true,
        },
      },
    },
  });

  if (!customer) {
    return {
      isDuplicate: false,
      action: "OK",
      recommendation: "Customer not found in database.",
    };
  }

  // Customer exists - determine action based on last contact
  const lastLeadDate = customer.leads[0]?.createdAt;
  const lastBookingDate = customer.bookings[0]?.createdAt;

  // Also consider last sent quote (EmailResponse) for duplicate decision window
  const lastQuote = await db.emailResponse.findFirst({
    where: {
      lead: { customerId: customer.id },
      sentAt: { not: null },
    },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });

  const lastQuoteDate = lastQuote?.sentAt;

  const lastContact = determineLastContact(lastLeadDate, lastBookingDate);
  const actionSourceDate = lastQuoteDate ?? lastContact;
  const action = determineDuplicateAction(actionSourceDate);
  const daysSinceAction = actionSourceDate
    ? Math.floor((Date.now() - actionSourceDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  const daysSinceContact = lastContact
    ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  const daysSinceQuote = lastQuoteDate
    ? Math.floor((Date.now() - lastQuoteDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    isDuplicate: true,
    action,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || undefined,
      lastContact,
      lastQuoteDate,
      lastBookingDate,
      totalBookings: customer._count.bookings,
      totalQuotes: customer._count.leads,
      stage: customer.leads[0]?.status,
    },
    recommendation: generateRecommendation(action, daysSinceAction, customer._count.bookings),
    daysSinceLastContact: daysSinceContact,
    daysSinceLastQuote: daysSinceQuote,
  };
}

/**
 * Check Gmail for communication history
 */
async function checkGmailForCustomer(
  email: string
): Promise<DuplicateCheckResult> {
  try {
    // Search for any threads with this customer
    const threads = await searchThreads({
      query: `from:${email} OR to:${email}`,
      maxResults: 10,
    });

    if (!threads || threads.length === 0) {
      return {
        isDuplicate: false,
        action: "OK",
        recommendation: "No Gmail communication history found.",
      };
    }

    // Find most recent thread
    const sortedThreads = threads.sort((a, b) => {
      const dateA = Number(a.messages?.[a.messages.length - 1]?.internalDate || 0);
      const dateB = Number(b.messages?.[b.messages.length - 1]?.internalDate || 0);
      return dateB - dateA;
    });

    const lastThread = sortedThreads[0];
    const lastMessage = lastThread.messages?.[lastThread.messages.length - 1];
    const lastThreadDate = lastMessage?.internalDate
      ? new Date(parseInt(lastMessage.internalDate))
      : undefined;

    const action = determineDuplicateAction(lastThreadDate);
    const daysSince = lastThreadDate
      ? Math.floor((Date.now() - lastThreadDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      isDuplicate: true,
      action,
      gmailHistory: {
        threadCount: threads.length,
        lastThreadDate,
      },
      recommendation: generateGmailRecommendation(action, daysSince, threads.length),
      daysSinceLastContact: daysSince,
    };
  } catch (error) {
    logger.error({ email, error }, "Error checking Gmail for customer");
    return {
      isDuplicate: false,
      action: "WARN",
      recommendation: "Could not check Gmail history. Please verify manually.",
    };
  }
}

/**
 * Determine most recent contact date
 */
function determineLastContact(
  lastLeadDate?: Date,
  lastBookingDate?: Date
): Date | undefined {
  if (!lastLeadDate && !lastBookingDate) return undefined;
  if (!lastLeadDate) return lastBookingDate;
  if (!lastBookingDate) return lastLeadDate;
  return lastLeadDate > lastBookingDate ? lastLeadDate : lastBookingDate;
}

/**
 * Determine action based on time since last contact
 * 
 * Business Rules:
 * - < 7 days: STOP (definitely duplicate)
 * - 7-30 days: WARN (could be follow-up or duplicate)
 * - > 30 days: OK (customer may have forgotten)
 */
function determineDuplicateAction(lastContact?: Date): DuplicateAction {
  if (!lastContact) return "OK";

  const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince < 7) {
    return "STOP";
  } else if (daysSince < 30) {
    return "WARN";
  } else {
    return "OK";
  }
}

/**
 * Generate human-readable recommendation
 */
function generateRecommendation(
  action: DuplicateAction,
  daysSince?: number,
  totalBookings?: number
): string {
  if (action === "STOP") {
    return `🚫 STOP: You sent a quote to this customer ${daysSince} days ago. Do NOT send another quote - risk of duplicate!`;
  } else if (action === "WARN") {
    if (totalBookings && totalBookings > 0) {
      return `⚠️ WARNING: This is an existing customer with ${totalBookings} bookings. Last contact was ${daysSince} days ago. Consider if this is a follow-up or new request.`;
    }
    return `⚠️ WARNING: You contacted this customer ${daysSince} days ago. Review previous communication before sending new quote.`;
  } else {
    if (totalBookings && totalBookings > 0) {
      return `✅ OK: Existing customer (${totalBookings} bookings), but last contact was ${daysSince} days ago. New quote OK.`;
    }
    return daysSince
      ? `✅ OK: Last contact was ${daysSince} days ago. Sending new quote is appropriate.`
      : `✅ OK: No previous contact found. Safe to send quote.`;
  }
}

/**
 * Generate recommendation based on Gmail history
 */
function generateGmailRecommendation(
  action: DuplicateAction,
  daysSince?: number,
  threadCount?: number
): string {
  if (action === "STOP") {
    return `🚫 STOP: Gmail shows ${threadCount} threads with this customer. Last email was ${daysSince} days ago. Do NOT send duplicate quote!`;
  } else if (action === "WARN") {
    return `⚠️ WARNING: Gmail shows ${threadCount} threads with this customer. Last email was ${daysSince} days ago. Check if this is follow-up or new request.`;
  } else {
    return `✅ OK: Gmail shows ${threadCount} threads, but last email was ${daysSince} days ago. New quote OK.`;
  }
}

/**
 * Register new customer in database (after passing duplicate check)
 */
export async function registerCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  source?: string;
}): Promise<string> {
  const customer = await db.customer.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      // 'source' field might not exist in schema; store in notes or metadata if needed
    },
  });

  logger.info({ customerId: customer.id, email: customer.email }, "New customer registered");

  return customer.id;
}

/**
 * Update customer's last contact timestamp
 */
export async function updateCustomerLastContact(
  customerId: string
): Promise<void> {
  await db.customer.update({
    where: { id: customerId },
    data: {
      updatedAt: new Date(),
    },
  });
}

/**
 * Check specifically for existing quotes sent to customer
 * More strict than general duplicate check - looks for pricing/quote keywords
 * 
 * CRITICAL RULE (MEMORY_8):
 * "TJEK ALTID først om vi allerede har sendt tilbud til kunden 
 * før jeg skriver nye tilbud - undgå dobbelt-tilbud!"
 */

// The function is already exported above, no need to re-export

// Export the service
export interface QuoteCheckResult {
  hasQuote: boolean;
  action: DuplicateAction;
  lastQuoteDate?: Date;
  threadId?: string;
  snippet?: string;
  daysSinceQuote?: number;
  recommendation: string;
}

export async function checkExistingQuotes(
  customerEmail: string
): Promise<QuoteCheckResult> {
  try {
    logger.info({ customerEmail }, "🔍 Checking for existing quotes...");

    // Search Gmail for quotes sent to this customer
    const threads = await searchThreads({
      query: `to:${customerEmail} (tilbud OR pris OR "349 kr" OR "arbejdstimer" OR "inkl. moms")`,
      maxResults: 5,
    });

    if (!threads || threads.length === 0) {
      logger.info({ customerEmail }, "✅ No existing quotes found");
      return {
        hasQuote: false,
        action: "OK",
        recommendation: "No previous quotes found. Safe to send new quote.",
      };
    }

    // Find most recent quote
    const sortedThreads = threads.sort((a, b) => {
      const dateA = Number(a.messages?.[a.messages.length - 1]?.internalDate || 0);
      const dateB = Number(b.messages?.[b.messages.length - 1]?.internalDate || 0);
      return dateB - dateA;
    });

    const lastQuoteThread = sortedThreads[0];
    const lastMessage = lastQuoteThread.messages?.[lastQuoteThread.messages.length - 1];
    const lastQuoteDate = lastMessage?.internalDate
      ? new Date(parseInt(lastMessage.internalDate))
      : undefined;

    if (!lastQuoteDate) {
      return {
        hasQuote: false,
        action: "OK",
        recommendation: "Could not determine quote date. Please verify manually.",
      };
    }

    const daysSince = Math.floor((Date.now() - lastQuoteDate.getTime()) / (1000 * 60 * 60 * 24));
    const action = determineDuplicateAction(lastQuoteDate);

    // Extract snippet (first 100 chars)
    const snippet = lastMessage?.snippet?.substring(0, 100) || "No preview available";

    let recommendation: string;
    if (action === "STOP") {
      recommendation = `🚫 STOP: Quote already sent ${daysSince} days ago (d. ${lastQuoteDate.toLocaleDateString("da-DK")}). DO NOT send duplicate quote!`;
    } else if (action === "WARN") {
      recommendation = `⚠️ WARNING: Quote sent ${daysSince} days ago (d. ${lastQuoteDate.toLocaleDateString("da-DK")}). Check if this is follow-up or new request.`;
    } else {
      recommendation = `✅ OK: Previous quote was ${daysSince} days ago (d. ${lastQuoteDate.toLocaleDateString("da-DK")}). New quote is appropriate.`;
    }

    logger.info(
      {
        customerEmail,
        hasQuote: true,
        daysSince,
        action,
      },
      "Quote check result"
    );

    return {
      hasQuote: true,
      action,
      lastQuoteDate,
      threadId: lastQuoteThread.id,
      snippet,
      daysSinceQuote: daysSince,
      recommendation,
    };
  } catch (error) {
    logger.error({ customerEmail, error }, "Error checking existing quotes");
    return {
      hasQuote: false,
      action: "WARN",
      recommendation: "Could not verify quote history. Please check Gmail manually before sending.",
    };
  }
}
