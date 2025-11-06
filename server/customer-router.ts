import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { protectedProcedure, router } from "./_core/trpc";
import { analyzeCasePattern } from "./analysis/case-analyzer";
import { syncBillyInvoicesForCustomer } from "./billy-sync";
import {
  addCustomerEmail,
  addCustomerInvoice,
  createCustomerConversation,
  createOrUpdateCustomerProfile,
  getAllCustomerProfiles,
  getCustomerCalendarEvents,
  getCustomerConversation,
  getCustomerEmails,
  getCustomerInvoices,
  getCustomerProfileByEmail,
  getCustomerProfileById,
  getCustomerProfileByLeadId,
  updateCustomerBalance,
  updateCustomerEmailCount,
} from "./customer-db";
import { createConversation, getUserLeads } from "./db";
import { searchGmailThreadsByEmail } from "./mcp";
import type { CustomerCaseAnalysis } from "./types/case-analysis";

/**
 * Customer Profile Router
 * Handles customer profile operations, invoice sync, email history, AI resume
 */

export const customerRouter = router({
  /**
   * Get customer profile with case analysis (by email)
   * Returns DB customer, live email threads from MCP/Google, matched calendar events, and analyzed case
   */
  getProfileWithCase: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const profile = await getCustomerProfileByEmail(input.email, ctx.user.id);
      if (!profile) {
        throw new Error("Customer not found");
      }

      // Fetch recent Gmail threads for this email (via MCP/Google)
      const emailThreads = await searchGmailThreadsByEmail(input.email);

      // Fetch matched calendar events (DB-first, matched by name/email)
      const calendarEvents = await getCustomerCalendarEvents(
        profile.id,
        ctx.user.id
      );

      // Build a minimal customer shape for analyzer
      const minimalCustomer = {
        id: profile.id,
        name: profile.name || null,
        email: profile.email,
        phone: profile.phone || null,
        address: (profile as any).address || null,
        lead_source: (profile as any).source || null,
      };

      const caseAnalysis: CustomerCaseAnalysis = analyzeCasePattern(
        minimalCustomer,
        emailThreads.map(t => ({
          id: t.id,
          subject: (t as any).subject,
          snippet: t.snippet,
          date: (t as any).date,
        })),
        calendarEvents.map(e => ({
          id: e.id,
          title: (e as any).title,
          description: (e as any).description,
          startTime: (e as any).startTime,
        }))
      );

      return {
        customer: profile,
        emailThreads,
        calendarEvents,
        caseAnalysis,
      };
    }),
  /**
   * Get customer profile by lead ID
   */
  getProfileByLeadId: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ ctx, input }) => {
      const profile = await getCustomerProfileByLeadId(
        input.leadId,
        ctx.user.id
      );

      if (!profile) {
        // Create profile from lead if doesn't exist
        const leads = await getUserLeads(ctx.user.id);
        const lead = leads.find(l => l.id === input.leadId);
        if (!lead || !lead.email) {
          throw new Error("Lead not found or missing email");
        }

        const customerId = await createOrUpdateCustomerProfile({
          userId: ctx.user.id,
          leadId: lead.id,
          email: lead.email,
          name: lead.name || undefined,
          phone: lead.phone || undefined,
        });

        return await getCustomerProfileById(customerId, ctx.user.id);
      }

      return profile;
    }),

  /**
   * Get customer profile by email
   */
  getProfileByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      return await getCustomerProfileByEmail(input.email, ctx.user.id);
    }),

  /**
   * Get all customer profiles
   */
  listProfiles: protectedProcedure.query(async ({ ctx }) => {
    return await getAllCustomerProfiles(ctx.user.id);
  }),

  /**
   * Get customer invoices
   */
  getInvoices: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getCustomerInvoices(input.customerId, ctx.user.id);
    }),

  /**
   * Get customer emails
   */
  getEmails: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getCustomerEmails(input.customerId, ctx.user.id);
    }),

  /**
   * Get customer calendar events
   */
  getCalendarEvents: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getCustomerCalendarEvents(input.customerId, ctx.user.id);
    }),

  /**
   * Get or create customer conversation
   */
  getConversation: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const existing = await getCustomerConversation(
        input.customerId,
        ctx.user.id
      );

      if (existing) {
        return existing;
      }

      // Create new conversation for customer
      const customer = await getCustomerProfileById(
        input.customerId,
        ctx.user.id
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      const conversation = await createConversation({
        userId: ctx.user.id,
        title: `Chat with ${customer.name || customer.email}`,
      });
      const conversationId = conversation.id;

      const customerConvId = await createCustomerConversation({
        customerId: input.customerId,
        conversationId,
      });

      return await getCustomerConversation(input.customerId, ctx.user.id);
    }),

  /**
   * Sync Billy invoices for customer
   */
  syncBillyInvoices: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const customer = await getCustomerProfileById(
        input.customerId,
        ctx.user.id
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Sync invoices from Billy
      const invoices = await syncBillyInvoicesForCustomer(
        customer.email,
        customer.billyCustomerId
      );

      // Add/update invoices in database
      for (const invoice of invoices) {
        await addCustomerInvoice({
          userId: ctx.user.id,
          customerId: input.customerId,
          billyInvoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNo,
          amount: invoice.amount?.toString(),
          status: invoice.state as any,
          dueDate: invoice.dueDate
            ? new Date(invoice.dueDate).toISOString()
            : undefined,
          paidAt: invoice.paidDate
            ? new Date(invoice.paidDate).toISOString()
            : undefined,
        });
      }

      // Update customer balance
      const balance = await updateCustomerBalance(input.customerId);

      // Update last sync date
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { customerProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db
          .update(customerProfiles)
          .set({ lastSyncDate: new Date().toISOString() })
          .where(eq(customerProfiles.id, input.customerId));
      }

      return {
        success: true,
        invoiceCount: invoices.length,
        balance,
      };
    }),

  /**
   * Sync Gmail emails for customer
   */
  syncGmailEmails: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const customer = await getCustomerProfileById(
        input.customerId,
        ctx.user.id
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Search Gmail for threads with customer email
      const threads = await searchGmailThreadsByEmail(customer.email);

      // Add/update email threads in database
      for (const thread of threads) {
        await addCustomerEmail({
          customerId: input.customerId,
          gmailThreadId: thread.id,
          subject: (thread as any).subject || thread.snippet || "",
          snippet: thread.snippet || "",
          lastMessageDate: new Date().toISOString(),
          isRead: !(thread as any).unread,
        });
      }

      // Update customer email count
      const emailStats = await updateCustomerEmailCount(input.customerId);

      return {
        success: true,
        ...emailStats,
      };
    }),

  /**
   * Generate AI resume for customer
   */
  generateResume: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const customer = await getCustomerProfileById(
        input.customerId,
        ctx.user.id
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Get customer data
      const invoices = await getCustomerInvoices(input.customerId, ctx.user.id);
      const emails = await getCustomerEmails(input.customerId, ctx.user.id);

      // Build context for AI
      const invoiceSummary = invoices
        .map(
          inv =>
            `Invoice ${inv.invoiceNumber || "N/A"}: ${inv.amount ? (parseFloat(inv.amount) / 100).toFixed(2) : "0.00"} DKK, status: ${inv.status}, due: ${inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "N/A"}`
        )
        .join("\n");

      const emailSummary = emails
        .map(
          email =>
            `Email: ${email.subject} (${email.lastMessageDate ? new Date(email.lastMessageDate).toISOString().split("T")[0] : "N/A"})`
        )
        .join("\n");

      const prompt = `Generate a professional customer resume/summary for ${customer.name || customer.email}.

Customer Information:
- Name: ${customer.name || "Unknown"}
- Email: ${customer.email}
- Phone: ${customer.phone || "N/A"}
- Total Invoiced: ${customer.totalInvoiced / 100} DKK
- Total Paid: ${customer.totalPaid / 100} DKK
- Outstanding Balance: ${customer.balance / 100} DKK
- Number of Invoices: ${customer.invoiceCount}
- Number of Email Threads: ${customer.emailCount}
- Last Contact: ${customer.lastContactDate ? new Date(customer.lastContactDate).toISOString().split("T")[0] : "N/A"}

Recent Invoices:
${invoiceSummary || "No invoices"}

Recent Emails:
${emailSummary || "No emails"}

Please provide:
1. Customer Relationship Status (new, active, at-risk, etc.)
2. Service History Summary
3. Payment Behavior Analysis
4. Communication Preferences
5. Next Recommended Actions

Format as clear, concise bullet points in Danish.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a business analyst for Rendetalje.dk cleaning company. Generate professional customer summaries in Danish.",
          },
          { role: "user", content: prompt },
        ],
      });

      const messageContent = response.choices[0]?.message?.content;
      const aiResume =
        typeof messageContent === "string"
          ? messageContent
          : "Failed to generate resume";

      // Update customer profile with AI resume
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { customerProfiles } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db
          .update(customerProfiles)
          .set({ aiResume, updatedAt: new Date().toISOString() })
          .where(eq(customerProfiles.id, input.customerId));
      }

      return {
        success: true,
        resume: aiResume,
      };
    }),

  /**
   * Update customer profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        billyCustomerId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const customer = await getCustomerProfileById(
        input.customerId,
        ctx.user.id
      );
      if (!customer) {
        throw new Error("Customer not found");
      }

      await createOrUpdateCustomerProfile({
        ...customer,
        name: input.name || customer.name,
        phone: input.phone || customer.phone,
        billyCustomerId: input.billyCustomerId || customer.billyCustomerId,
      });

      return {
        success: true,
      };
    }),
});
