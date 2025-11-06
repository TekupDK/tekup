/**
 * Pipeline Workflow Automation
 *
 * Automatically triggers actions when pipeline stages change:
 * - Phase 2: Critical Rules, Auto-Calendar, Auto-Invoice
 */

import { and, eq } from "drizzle-orm";
import { emails, emailThreads } from "../drizzle/schema";
import { createInvoice } from "./billy";
import { getDb, getPipelineState } from "./db";
import { detectLeadSource } from "./lead-source-detector";
import { createCalendarEvent } from "./mcp";

/**
 * Handle pipeline stage transition
 * Called when pipeline stage is updated
 */
export async function handlePipelineTransition(
  userId: number,
  threadId: string,
  newStage:
    | "needs_action"
    | "venter_pa_svar"
    | "i_kalender"
    | "finance"
    | "afsluttet"
): Promise<void> {
  const pipelineState = await getPipelineState(userId, threadId);
  if (!pipelineState) {
    console.warn(
      `[PipelineWorkflow] No pipeline state found for thread ${threadId}`
    );
    return;
  }

  console.log(
    `[PipelineWorkflow] Handling transition to ${newStage} for thread ${threadId}`
  );

  switch (newStage) {
    case "i_kalender":
      await handleCalendarStage(userId, threadId, pipelineState);
      break;
    case "finance":
      await handleFinanceStage(userId, threadId, pipelineState);
      break;
  }
}

/**
 * Auto-Calendar: Create calendar event when "I kalender" stage is reached
 */
async function handleCalendarStage(
  userId: number,
  threadId: string,
  pipelineState: any
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn(
        "[PipelineWorkflow] Database not available for calendar creation"
      );
      return;
    }

    // Get email thread to extract information
    const [thread] = await db
      .select()
      .from(emailThreads)
      .where(
        and(
          eq(emailThreads.gmailThreadId, threadId),
          eq(emailThreads.userId, userId)
        )
      )
      .limit(1)
      .execute();

    if (!thread) {
      // Try to find by threadKey in emails table
      const [email] = await db
        .select()
        .from(emails)
        .where(and(eq(emails.threadKey, threadId), eq(emails.userId, userId)))
        .limit(1)
        .execute();

      if (!email) {
        console.warn(
          `[PipelineWorkflow] No email found for thread ${threadId}`
        );
        return;
      }

      // Extract date/time from email (simplified - could be enhanced with AI parsing)
      const subject = email.subject || "";
      const body = email.text || email.html || "";

      // Extract date patterns (dd/mm, dd-mm, etc.)
      const dateMatch = body.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      const timeMatch = body.match(/(\d{1,2}):(\d{2})/);

      // Default: next business day at 10:00
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      // Use extracted date/time if found
      if (dateMatch && timeMatch) {
        const [, day, month, year] = dateMatch;
        const [, hour, minute] = timeMatch;
        startDate.setDate(parseInt(day));
        startDate.setMonth(parseInt(month) - 1);
        startDate.setFullYear(
          year.length === 2 ? 2000 + parseInt(year) : parseInt(year)
        );
        startDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 2); // Default 2 hours

      // Determine task type from pipeline state or email content
      const taskType = pipelineState.taskType || "engangsopgaver";
      const taskTypeEmoji: Record<string, string> = {
        fast_rengoring: "🏠",
        flytterengoring: "📦",
        hovedrengoring: "✨",
        engangsopgaver: "🧹",
      };
      const emoji = taskTypeEmoji[taskType] || "🏠";

      // Extract customer name from email
      const customerName = email.fromEmail
        ? email.fromEmail
            .split("@")[0]
            .split(/[._-]/)
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : "Unknown";

      // Create calendar event
      const eventSummary = `${emoji} ${taskType.replace(/_/g, " ")} #${pipelineState.leadId || "?"} - ${customerName}`;
      const eventDescription = `Email: ${subject}\n\nThread ID: ${threadId}`;

      const event = await createCalendarEvent({
        summary: eventSummary,
        description: eventDescription,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });

      // Update pipeline state with calendar event ID
      await db
        .update(require("../drizzle/schema").emailPipelineState)
        .set({ calendarEventId: event.id })
        .where(
          eq(require("../drizzle/schema").emailPipelineState.threadId, threadId)
        )
        .execute();

      console.log(
        `[PipelineWorkflow] ✅ Calendar event created: ${event.id} for thread ${threadId}`
      );
    }
  } catch (error) {
    console.error(
      `[PipelineWorkflow] ❌ Failed to create calendar event for thread ${threadId}:`,
      error
    );
  }
}

/**
 * Auto-Invoice: Create Billy invoice when "Finance" stage is reached
 */
async function handleFinanceStage(
  userId: number,
  threadId: string,
  pipelineState: any
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn(
        "[PipelineWorkflow] Database not available for invoice creation"
      );
      return;
    }

    // Check if invoice already exists
    if (pipelineState.invoiceId) {
      console.log(
        `[PipelineWorkflow] Invoice already exists for thread ${threadId}: ${pipelineState.invoiceId}`
      );
      return;
    }

    // Get email thread to extract customer information
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.threadKey, threadId))
      .limit(1)
      .execute();

    if (!email) {
      console.warn(`[PipelineWorkflow] No email found for thread ${threadId}`);
      return;
    }

    // Get customer from Billy API
    const { searchCustomerByEmail } = await import("./billy");

    if (!email.fromEmail) {
      console.warn(`[PipelineWorkflow] No fromEmail for thread ${threadId}`);
      return;
    }

    const customer = await searchCustomerByEmail(email.fromEmail);

    if (!customer || !customer.id) {
      console.warn(
        `[PipelineWorkflow] Customer not found in Billy for ${email.fromEmail}`
      );
      return;
    }

    // Extract hours from email body or use default (simplified parsing)
    const body = email.text || email.html || "";
    const hourMatch = body.match(/(\d+(?:\.\d+)?)\s*(?:timer|hours?|t)/i);
    const hours = hourMatch ? parseFloat(hourMatch[1]) : 2; // Default 2 hours

    // Calculate price: hours * 349 kr/t (incl. moms)
    const unitPrice = 349; // DKK per hour
    const totalAmount = Math.round(hours * unitPrice);

    // Determine product based on task type
    const taskType = pipelineState.taskType || "engangsopgaver";
    const productMap: Record<string, string> = {
      fast_rengoring: "REN-001",
      flytterengoring: "REN-002",
      hovedrengoring: "REN-003",
      engangsopgaver: "REN-004",
    };
    const productId = productMap[taskType] || "REN-005";

    // Create invoice in Billy
    const invoice = await createInvoice({
      contactId: customer.id,
      entryDate: new Date().toISOString().split("T")[0],
      paymentTermsDays: 14,
      lines: [
        {
          description: `${taskType.replace(/_/g, " ")} - ${hours} timer`,
          quantity: hours,
          unitPrice: unitPrice,
          productId: productId,
        },
      ],
    });

    // Update pipeline state with invoice ID
    await db
      .update(require("../drizzle/schema").emailPipelineState)
      .set({ invoiceId: invoice.id })
      .where(
        eq(require("../drizzle/schema").emailPipelineState.threadId, threadId)
      )
      .execute();

    console.log(
      `[PipelineWorkflow] ✅ Invoice created: ${invoice.id} for thread ${threadId}, amount: ${totalAmount} DKK`
    );
  } catch (error) {
    console.error(
      `[PipelineWorkflow] ❌ Failed to create invoice for thread ${threadId}:`,
      error
    );
  }
}

/**
 * Critical Rules: Check if email is from Rengøring.nu or AdHelp
 * Returns customer email if special handling needed
 */
export async function checkCriticalRules(
  fromEmail: string,
  subject: string,
  body: string
): Promise<{
  needsSpecialHandling: boolean;
  customerEmail?: string;
  action: string;
}> {
  const source = detectLeadSource({
    from: fromEmail,
    to: "",
    subject,
    body,
  });

  // Rengøring.nu and AdHelp require special handling
  if (source === "rengoring_nu" || source === "adhelp") {
    // Extract customer email from body
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = body.match(emailRegex) || [];

    // Filter out leadmail.no and adhelp.dk emails
    const customerEmail = emails.find(
      (email: string) =>
        !email.includes("leadmail.no") &&
        !email.includes("nettbureau") &&
        !email.includes("adhelp.dk") &&
        !email.includes("mw@adhelp.dk") &&
        !email.includes("sp@adhelp.dk")
    );

    return {
      needsSpecialHandling: true,
      customerEmail,
      action:
        source === "rengoring_nu"
          ? "CREATE_NEW_EMAIL_TO_CUSTOMER"
          : "CREATE_NEW_EMAIL_TO_CUSTOMER",
    };
  }

  return { needsSpecialHandling: false, action: "REPLY_NORMALLY" };
}
