import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  attachments,
  customerInvoices,
  customerProfiles,
  emailPipelineState,
  emails,
  emailsInFridayAi,
  emailThreads,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { batchGenerateSummaries, getEmailSummary } from "../ai-email-summary";
import {
  applyLabelSuggestion,
  autoApplyHighConfidenceLabels,
  batchGenerateLabelSuggestions,
  getEmailLabelSuggestions,
  type LabelCategory,
} from "../ai-label-suggestions";
import type { BillyInvoice } from "../billy";
import {
  createInvoice as createBillyInvoice,
  getInvoices as getBillyInvoices,
  searchCustomerByEmail,
} from "../billy";
import {
  bulkDeleteTasks,
  bulkUpdateTaskOrder,
  bulkUpdateTaskPriority,
  bulkUpdateTaskStatus,
  createLead,
  createTask,
  deleteTask,
  getDb,
  getLeadCalendarEvents,
  getPipelineState,
  getPipelineTransitions,
  getUserLeads,
  getUserPipelineStates,
  getUserTasks,
  trackEvent,
  updateLeadScore,
  updateLeadStatus,
  updatePipelineStage,
  updateTask,
  updateTaskOrder,
  updateTaskStatus,
} from "../db";
import {
  addLabelToThread,
  archiveThread,
  getGmailLabels,
  removeLabelFromThread,
} from "../gmail-labels";
import {
  checkCalendarAvailability,
  createCalendarEvent,
  createGmailDraft,
  deleteCalendarEvent,
  getGmailThread,
  markGmailMessageAsRead as googleMarkAsRead,
  starGmailMessage as googleStarMessage,
  listCalendarEvents,
  modifyGmailThread,
  searchGmailThreads,
  sendGmailMessage,
  updateCalendarEvent,
} from "../google-api";
import { cacheInvoicesToDatabase } from "../invoice-cache";

export const inboxRouter = router({
  email: router({
    // Map Gmail thread IDs to internal email IDs for current user
    mapThreadsToEmailIds: protectedProcedure
      .input(
        z.object({
          threadIds: z.array(z.string()).min(1),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [] as number[];

        // Prefer direct mapping via emails.threadId (Gmail thread id)
        const rows = await db
          .select({ id: emails.id })
          .from(emails)
          .where(
            and(
              eq(emails.userId, ctx.user.id),
              inArray(emails.threadId, input.threadIds)
            )
          )
          .execute();

        // Return unique email IDs
        const unique = Array.from(
          new Set(rows.map(r => r.id as unknown as number))
        );
        return unique;
      }),
    list: protectedProcedure
      .input(
        z.object({
          maxResults: z.number().optional(),
          query: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // SKIP DATABASE CACHE when query includes Gmail-specific filters (in:inbox, label:, etc.)
        // Database doesn't store Gmail labels/folders, so we can't filter correctly
        const hasGmailQuery =
          input.query &&
          (input.query.includes("in:") ||
            input.query.includes("label:") ||
            input.query.includes("is:") ||
            input.query.includes("-in:"));

        // DATABASE-FIRST STRATEGY: Try database first, only fallback if empty
        // BUT: Skip database if query has Gmail-specific filters
        const db = await getDb();
        if (db && !hasGmailQuery) {
          try {
            // Query from database (simple implementation - can be enhanced with full search)
            const emailRecords = await db
              .select({
                id: emails.id,
                userId: emails.userId,
                gmailId: emails.gmailId,
                threadKey: emails.threadKey,
                subject: emails.subject,
                fromEmail: emails.fromEmail,
                toEmail: emails.toEmail,
                text: emails.text,
                html: emails.html,
                providerId: emails.providerId,
                emailThreadId: emails.emailThreadId,
                receivedAt: emails.receivedAt,
                hasAttachments: emails.hasAttachments,
                // AI fields for preloading
                aiSummary: emails.aiSummary,
                aiSummaryGeneratedAt: emails.aiSummaryGeneratedAt,
                aiLabelSuggestions: emails.aiLabelSuggestions,
                aiLabelsGeneratedAt: emails.aiLabelsGeneratedAt,
              })
              .from(emails)
              .where(eq(emails.userId, ctx.user.id))
              .orderBy(desc(emails.receivedAt))
              .limit(input.maxResults || 50)
              .execute();

            if (emailRecords.length > 0) {
              // Join emails -> emailThreads to get real Gmail thread IDs
              const emailThreadIds = Array.from(
                new Set(
                  emailRecords
                    .map((e: any) => e.emailThreadId)
                    .filter((id: any) => id != null)
                )
              );

              let threadIdMap: Record<number, string> = {};
              if (emailThreadIds.length > 0) {
                const threadRows = await db
                  .select({
                    id: emailThreads.id,
                    gmailThreadId: emailThreads.gmailThreadId,
                  })
                  .from(emailThreads)
                  .where(inArray(emailThreads.id, emailThreadIds))
                  .execute();
                threadIdMap = Object.fromEntries(
                  threadRows.map((r: any) => [r.id, r.gmailThreadId])
                );
              }

              // Map DB rows to GmailThread shape, using gmailThreadId when available
              return emailRecords.map((email: any) => {
                const gmailThreadId =
                  (email.emailThreadId != null
                    ? threadIdMap[email.emailThreadId]
                    : undefined) ||
                  email.threadKey ||
                  undefined;

                const threadId =
                  gmailThreadId ||
                  String(email.emailThreadId || email.providerId);

                return {
                  id: threadId, // Real Gmail thread ID if available
                  snippet: email.text?.substring(0, 200) || email.subject || "",
                  subject: email.subject,
                  from: email.fromEmail,
                  date:
                    typeof email.receivedAt === "string"
                      ? email.receivedAt
                      : new Date(email.receivedAt as any).toISOString(),
                  labels: [],
                  unread: true,
                  hasAttachments: !!email.hasAttachments,
                  // AI data preloaded from DB
                  aiSummary: email.aiSummary || undefined,
                  aiSummaryGeneratedAt: email.aiSummaryGeneratedAt || undefined,
                  aiLabelSuggestions: email.aiLabelSuggestions || undefined,
                  aiLabelsGeneratedAt: email.aiLabelsGeneratedAt || undefined,
                  messages: [
                    {
                      id: email.providerId, // message id
                      threadId, // ensure messages reference the correct Gmail thread id
                      from: email.fromEmail,
                      to: email.toEmail,
                      subject: email.subject || "",
                      body: email.text || email.html || "",
                      date:
                        typeof email.receivedAt === "string"
                          ? email.receivedAt
                          : new Date(email.receivedAt as any).toISOString(),
                    },
                  ],
                };
              });
            }

            // Database is empty - fetch from Gmail API and cache to database
            console.log(
              "[Email List] Database empty, fetching from Gmail API and caching..."
            );
          } catch (error) {
            console.warn(
              "[Email List] Database query failed, falling back to Gmail API:",
              error
            );
          }
        } else if (hasGmailQuery) {
          console.log(
            "[Email List] Query has Gmail filters (in:/label:/is:), skipping database cache and using Gmail API directly"
          );
        }

        // Fallback to Gmail API (direkte Google API, ikke MCP)
        const { searchGmailThreads } = await import("../google-api");
        let threads;
        try {
          threads = await searchGmailThreads({
            query: input.query || "in:inbox",
            maxResults: input.maxResults || 20,
          });
        } catch (error: any) {
          console.error("[Email List] Gmail API error:", error);
          // Provide helpful error message instead of raw error
          const isRateLimit =
            error?.message?.includes("429") ||
            error?.message?.includes("rate limit");
          const isAuthError =
            error?.message?.includes("401") ||
            error?.message?.includes("403") ||
            error?.message?.includes("authentication");

          if (isRateLimit) {
            throw new Error(
              "Gmail API rate limit nået. Prøv igen om et øjeblik."
            );
          } else if (isAuthError) {
            throw new Error(
              "Gmail authentication fejl. Prøv at genindlæse siden."
            );
          } else {
            throw new Error(
              `Kunne ikke hente emails: ${error?.message || "Ukendt fejl"}`
            );
          }
        }

        // Cache to database in background (don't await to speed up response)
        if (db && threads.length > 0) {
          const { cacheEmailsToDatabase } = await import("../email-cache");
          cacheEmailsToDatabase(threads, ctx.user.id, db).catch(error => {
            console.error("[Email List] Background cache failed:", error);
          });
        }

        return threads;
      }),
    get: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ input }) => getGmailThread(input.threadId)),
    getThread: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ input }) => getGmailThread(input.threadId)),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) =>
        searchGmailThreads({ query: input.query, maxResults: 50 })
      ),
    createDraft: protectedProcedure
      .input(
        z.object({
          to: z.string(),
          subject: z.string(),
          body: z.string(),
          cc: z.string().optional(),
          bcc: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => createGmailDraft(input)),
    send: protectedProcedure
      .input(
        z.object({
          to: z.string(),
          subject: z.string(),
          body: z.string(),
          cc: z.string().optional(),
          bcc: z.string().optional(),
          replyToMessageId: z.string().optional(),
          replyToThreadId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => sendGmailMessage(input)),
    reply: protectedProcedure
      .input(
        z.object({
          threadId: z.string(),
          messageId: z.string(),
          to: z.string(),
          subject: z.string(),
          body: z.string(),
          cc: z.string().optional(),
          bcc: z.string().optional(),
        })
      )
      .mutation(async ({ input }) =>
        sendGmailMessage({
          to: input.to,
          subject: input.subject.startsWith("Re:")
            ? input.subject
            : `Re: ${input.subject}`,
          body: input.body,
          cc: input.cc,
          bcc: input.bcc,
          replyToMessageId: input.messageId,
          replyToThreadId: input.threadId,
        })
      ),
    forward: protectedProcedure
      .input(
        z.object({
          to: z.string(),
          subject: z.string(),
          body: z.string(),
          cc: z.string().optional(),
          bcc: z.string().optional(),
        })
      )
      .mutation(async ({ input }) =>
        sendGmailMessage({
          to: input.to,
          subject: input.subject.startsWith("Fwd:")
            ? input.subject
            : `Fwd: ${input.subject}`,
          body: input.body,
          cc: input.cc,
          bcc: input.bcc,
        })
      ),
    archive: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .mutation(async ({ input }) => {
        await archiveThread(input.threadId);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .mutation(async ({ input }) => {
        // Safer default: move to TRASH instead of permanent delete
        // Some environments/scopes block permanent delete with 403
        await modifyGmailThread({
          threadId: input.threadId,
          addLabelIds: ["TRASH"],
        });
        return { success: true, trashed: true } as const;
      }),
    addLabel: protectedProcedure
      .input(z.object({ threadId: z.string(), labelName: z.string() }))
      .mutation(async ({ input }) => {
        await addLabelToThread(input.threadId, input.labelName);
        return { success: true };
      }),
    removeLabel: protectedProcedure
      .input(z.object({ threadId: z.string(), labelName: z.string() }))
      .mutation(async ({ input }) => {
        await removeLabelFromThread(input.threadId, input.labelName);
        return { success: true };
      }),
    star: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ input }) => {
        await googleStarMessage(input.messageId, true);
        return { success: true };
      }),
    unstar: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ input }) => {
        await googleStarMessage(input.messageId, false);
        return { success: true };
      }),
    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ input }) => {
        await googleMarkAsRead(input.messageId, true);
        return { success: true };
      }),
    markAsUnread: protectedProcedure
      .input(z.object({ messageId: z.string() }))
      .mutation(async ({ input }) => {
        await googleMarkAsRead(input.messageId, false);
        return { success: true };
      }),
    getLabels: protectedProcedure.query(async () => getGmailLabels()),
    getUnreadCounts: protectedProcedure.query(async () => {
      // Get unread counts for folders using Gmail API
      // We only need count, so maxResults=100 is sufficient for accurate counts
      const inboxUnread = await searchGmailThreads({
        query: "in:inbox is:unread",
        maxResults: 100,
      });
      const sentUnread = await searchGmailThreads({
        query: "in:sent is:unread",
        maxResults: 100,
      });
      const starredUnread = await searchGmailThreads({
        query: "is:starred is:unread",
        maxResults: 100,
      });

      // Get all labels with their unread counts
      const labels = await getGmailLabels();
      const labelCounts = await Promise.all(
        labels.map(async label => {
          const unreadThreads = await searchGmailThreads({
            query: `label:${label.name} is:unread`,
            maxResults: 100,
          });
          return {
            labelId: label.id,
            labelName: label.name,
            unreadCount: unreadThreads.length,
          };
        })
      );

      return {
        folders: {
          inbox: inboxUnread.length,
          sent: sentUnread.length,
          starred: starredUnread.length,
          archive: 0, // Archive doesn't have unread concept
        },
        labels: labelCounts,
      };
    }),
    listByLabel: protectedProcedure
      .input(
        z.object({
          labelName: z.string(),
          maxResults: z.number().optional(),
        })
      )
      .query(async ({ input }) =>
        searchGmailThreads({
          query: `label:${input.labelName}`,
          maxResults: input.maxResults || 20,
        })
      ),
    getRelatedLead: protectedProcedure
      .input(
        z.object({
          email: z.string(),
          createIfMissing: z.boolean().optional().default(false),
        })
      )
      .query(async ({ ctx, input }) => {
        const leads = await getUserLeads(ctx.user.id);
        const existingLead = leads.find(
          lead => lead.email?.toLowerCase() === input.email.toLowerCase()
        );

        if (existingLead) {
          return existingLead;
        }

        // Create lead and customer profile if requested
        if (input.createIfMissing) {
          // Extract name from email (everything before @)
          const emailParts = input.email.split("@");
          const defaultName = emailParts[0]
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");

          // Create lead
          const lead = await createLead({
            userId: ctx.user.id,
            source: "email",
            name: defaultName,
            email: input.email,
            status: "new",
          });

          // Create or update customer profile
          const { createOrUpdateCustomerProfile } = await import(
            "../customer-db"
          );
          await createOrUpdateCustomerProfile({
            userId: ctx.user.id,
            leadId: lead.id,
            email: input.email,
            name: defaultName,
          });

          await trackEvent({
            userId: ctx.user.id,
            eventType: "lead_created_from_email",
            eventData: { leadId: lead.id, email: input.email },
          });

          return lead;
        }

        return null;
      }),
    getRelatedInvoices: protectedProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ input }) => {
        // Use customer search to find invoices
        const customer = await searchCustomerByEmail(input.email);
        if (!customer) return [];
        // Get invoices for this customer - would need Billy API integration
        // For now, return empty array
        return [];
      }),
    getRelatedEvents: protectedProcedure
      .input(z.object({ email: z.string(), subject: z.string().optional() }))
      .query(async ({ input }) => {
        // Search calendar events - simplified: search by subject/keywords
        // In a full implementation, would search by participant email
        const events = await listCalendarEvents({
          maxResults: 50,
        });
        // Filter by subject keywords if provided
        if (input.subject) {
          const keywords = input.subject.toLowerCase().split(" ");
          return events.filter(event =>
            keywords.some(kw => event.summary?.toLowerCase().includes(kw))
          );
        }
        return events.slice(0, 10); // Return first 10
      }),
    // Resolve inline CID images to data URLs for rendering newsletters
    getAttachmentByCid: protectedProcedure
      .input(z.object({ messageId: z.string(), cid: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { getGmailAttachmentByCid } = await import("../google-api");
        const res = await getGmailAttachmentByCid(input);
        if (!res) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Attachment not found",
          });
        }
        return res;
      }),
    // New endpoints for SMTP-based email ingestion
    getInboundEmails: protectedProcedure
      .input(
        z.object({
          maxResults: z.number().optional().default(50),
          stage: z
            .enum([
              "needs_action",
              "venter_pa_svar",
              "i_kalender",
              "finance",
              "afsluttet",
            ])
            .optional(),
          source: z.string().optional(),
          customerId: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          // Fallback to Gmail API if database not available
          return searchGmailThreads({
            query: "in:inbox",
            maxResults: input.maxResults,
          });
        }

        // Query emails from database
        let query = db
          .select()
          .from(emails)
          .where(eq(emails.userId, ctx.user.id))
          .orderBy(desc(emails.receivedAt))
          .limit(input.maxResults);

        // Apply filters
        const conditions = [];
        if (input.customerId) {
          conditions.push(eq(emails.customerId, input.customerId));
        }

        if (conditions.length > 0) {
          query = db
            .select()
            .from(emails)
            .where(and(eq(emails.userId, ctx.user.id), ...conditions))
            .orderBy(desc(emails.receivedAt))
            .limit(input.maxResults);
        }

        const emailRecords = await query.execute();

        // Transform to GmailThread-like format for compatibility
        return emailRecords.map(email => ({
          id: email.emailThreadId
            ? String(email.emailThreadId)
            : email.threadKey || email.providerId,
          snippet: email.text?.substring(0, 200) || email.subject || "",
          subject: email.subject,
          from: email.fromEmail,
          date:
            typeof email.receivedAt === "string"
              ? email.receivedAt
              : new Date(email.receivedAt as any).toISOString(),
          labels: [],
          unread: true,
          messages: [
            {
              id: email.providerId,
              threadId: email.emailThreadId
                ? String(email.emailThreadId)
                : email.threadKey || email.providerId,
              from: email.fromEmail,
              to: email.toEmail,
              subject: email.subject || "",
              body: email.text || email.html || "",
              date:
                typeof email.receivedAt === "string"
                  ? email.receivedAt
                  : new Date(email.receivedAt as any).toISOString(),
            },
          ],
        }));
      }),
    getEmailById: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const [email] = await db
          .select()
          .from(emails)
          .where(
            and(eq(emails.id, input.emailId), eq(emails.userId, ctx.user.id))
          )
          .limit(1)
          .execute();

        if (!email) {
          throw new Error("Email not found");
        }

        // Get attachments
        const emailAttachments = await db
          .select()
          .from(attachments)
          .where(eq(attachments.emailId, input.emailId))
          .execute();

        return {
          ...email,
          attachments: emailAttachments,
        };
      }),
    getEmailThread: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          // Fallback to Gmail API
          return getGmailThread(input.threadId);
        }

        // Try to find thread by gmailThreadId or threadKey
        const [thread] = await db
          .select()
          .from(emailThreads)
          .where(
            and(
              or(
                eq(emailThreads.gmailThreadId, input.threadId),
                eq(emailThreads.id, parseInt(input.threadId) || 0)
              ),
              eq(emailThreads.userId, ctx.user.id)
            )
          )
          .limit(1)
          .execute();

        if (!thread) {
          // Fallback to Gmail API if not found in database
          return getGmailThread(input.threadId);
        }

        // Get all emails in this thread
        const threadEmails = await db
          .select()
          .from(emails)
          .where(eq(emails.emailThreadId, thread.id))
          .orderBy(asc(emails.receivedAt))
          .execute();

        // Get attachments for all emails
        const emailIds = threadEmails.map(e => e.id);
        const allAttachments =
          emailIds.length > 0
            ? await db
                .select()
                .from(attachments)
                .where(inArray(attachments.emailId, emailIds))
                .execute()
            : [];

        return {
          id: thread.gmailThreadId,
          subject: thread.subject,
          snippet: thread.snippet,
          messages: threadEmails.map(email => ({
            id: email.providerId,
            threadId: thread.gmailThreadId,
            from: email.fromEmail,
            to: email.toEmail,
            subject: email.subject || "",
            body: email.text || email.html || "",
            date:
              typeof email.receivedAt === "string"
                ? email.receivedAt
                : new Date(email.receivedAt as any).toISOString(),
            attachments: allAttachments.filter(a => a.emailId === email.id),
          })),
          labels: (thread.labels as string[]) || [],
          unread: !thread.isRead,
        };
      }),
    createLeadFromEmail: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          source: z.string().optional().default("email"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if lead already exists
        const leads = await getUserLeads(ctx.user.id);
        const existingLead = leads.find(
          lead => lead.email?.toLowerCase() === input.email.toLowerCase()
        );

        if (existingLead) {
          return { lead: existingLead, created: false };
        }

        // Extract name from email if not provided
        const name =
          input.name ||
          (() => {
            const emailParts = input.email.split("@");
            return emailParts[0]
              .split(/[._-]/)
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(" ");
          })();

        // Create lead
        const lead = await createLead({
          userId: ctx.user.id,
          source: input.source,
          name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          status: "new",
        });

        // Create or update customer profile
        const { createOrUpdateCustomerProfile } = await import(
          "../customer-db"
        );
        await createOrUpdateCustomerProfile({
          userId: ctx.user.id,
          leadId: lead.id,
          email: input.email,
          name,
          phone: input.phone,
        });

        await trackEvent({
          userId: ctx.user.id,
          eventType: "lead_created_from_email",
          eventData: {
            leadId: lead.id,
            email: input.email,
            source: input.source,
          },
        });

        return { lead, created: true };
      }),
    // Pipeline endpoints
    getPipelineState: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ ctx, input }) => {
        return getPipelineState(ctx.user.id, input.threadId);
      }),
    updatePipelineStage: protectedProcedure
      .input(
        z.object({
          threadId: z.string(),
          stage: z.enum([
            "needs_action",
            "venter_pa_svar",
            "i_kalender",
            "finance",
            "afsluttet",
          ]),
          triggeredBy: z.string().optional().default("user"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const state = await updatePipelineStage(
          ctx.user.id,
          input.threadId,
          input.stage,
          input.triggeredBy || `user:${ctx.user.id}`
        );
        await trackEvent({
          userId: ctx.user.id,
          eventType: "pipeline_stage_updated",
          eventData: {
            threadId: input.threadId,
            stage: input.stage,
          },
        });
        return state;
      }),
    getPipelineTransitions: protectedProcedure
      .input(z.object({ threadId: z.string() }))
      .query(async ({ ctx, input }) => {
        return getPipelineTransitions(ctx.user.id, input.threadId);
      }),
    getPipelineStates: protectedProcedure
      .input(
        z.object({
          stage: z
            .enum([
              "needs_action",
              "venter_pa_svar",
              "i_kalender",
              "finance",
              "afsluttet",
            ])
            .optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        return getUserPipelineStates(ctx.user.id, input.stage);
      }),
    // AI Features - Email Summaries
    getEmailSummary: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getEmailSummary(input.emailId, ctx.user.id);
      }),
    generateEmailSummary: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return getEmailSummary(input.emailId, ctx.user.id);
      }),
    batchGenerateSummaries: protectedProcedure
      .input(
        z.object({
          emailIds: z.array(z.number()),
          maxConcurrent: z.number().optional().default(5),
          skipCached: z.boolean().optional().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return batchGenerateSummaries(input.emailIds, ctx.user.id, {
          maxConcurrent: input.maxConcurrent,
          skipCached: input.skipCached,
        });
      }),
    // AI Features - Smart Label Suggestions
    getLabelSuggestions: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getEmailLabelSuggestions(input.emailId, ctx.user.id);
      }),
    generateLabelSuggestions: protectedProcedure
      .input(
        z.object({
          emailId: z.number(),
          autoApply: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await getEmailLabelSuggestions(
          input.emailId,
          ctx.user.id
        );

        // Auto-apply high-confidence labels if requested
        if (input.autoApply && result.suggestions.length > 0) {
          const appliedLabels = await autoApplyHighConfidenceLabels(
            input.emailId,
            ctx.user.id,
            result.suggestions
          );
          return {
            ...result,
            autoApplied: appliedLabels,
          };
        }

        return result;
      }),
    applyLabel: protectedProcedure
      .input(
        z.object({
          emailId: z.number(),
          label: z.enum([
            "Lead",
            "Booking",
            "Finance",
            "Support",
            "Newsletter",
          ]),
          confidence: z.number().min(0).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return applyLabelSuggestion(
          input.emailId,
          ctx.user.id,
          input.label as LabelCategory,
          input.confidence
        );
      }),
    batchGenerateLabelSuggestions: protectedProcedure
      .input(
        z.object({
          emailIds: z.array(z.number()),
          maxConcurrent: z.number().optional().default(5),
          skipCached: z.boolean().optional().default(true),
          autoApply: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return batchGenerateLabelSuggestions(input.emailIds, ctx.user.id, {
          maxConcurrent: input.maxConcurrent,
          skipCached: input.skipCached,
          autoApply: input.autoApply,
        });
      }),
    // Batch remove DB-stored labels (undo support for auto-apply)
    batchRemoveDbLabels: protectedProcedure
      .input(
        z.object({
          ops: z.array(
            z.object({
              emailId: z.number(),
              label: z.enum([
                "Lead",
                "Booking",
                "Finance",
                "Support",
                "Newsletter",
              ]),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        let removed = 0;
        const failures: Array<{
          emailId: number;
          label: string;
          error: string;
        }> = [];

        for (const op of input.ops) {
          try {
            const [email] = await db
              .select({
                id: emailsInFridayAi.id,
                labels: emailsInFridayAi.labels,
                userId: emailsInFridayAi.userId,
              })
              .from(emailsInFridayAi)
              .where(
                and(
                  eq(emailsInFridayAi.id, op.emailId),
                  eq(emailsInFridayAi.userId, ctx.user.id)
                )
              )
              .limit(1);

            if (!email) {
              failures.push({
                emailId: op.emailId,
                label: op.label,
                error: "Email not found",
              });
              continue;
            }

            const current = (email.labels || "")
              .split(",")
              .map(l => l.trim())
              .filter(Boolean);
            const next = current.filter(l => l !== op.label);

            // Only update if changed
            if (next.length !== current.length) {
              await db
                .update(emailsInFridayAi)
                .set({ labels: next.join(", ") })
                .where(eq(emailsInFridayAi.id, op.emailId));
              removed += 1;
            }
          } catch (e: any) {
            failures.push({
              emailId: op.emailId,
              label: op.label,
              error: e?.message || "Unknown error",
            });
          }
        }

        return {
          success: failures.length === 0,
          removed,
          failed: failures.length,
          failures,
        } as const;
      }),
  }),
  invoices: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      // DATABASE-FIRST STRATEGY: Try database first, only fallback if empty
      const db = await getDb();
      if (db) {
        try {
          // Query customer_invoices via customer_profiles for this user
          const invoiceRecords = await db
            .select({
              invoice: customerInvoices,
              customer: customerProfiles,
            })
            .from(customerInvoices)
            .innerJoin(
              customerProfiles,
              eq(customerInvoices.customerId, customerProfiles.id)
            )
            .where(eq(customerProfiles.userId, ctx.user.id))
            // entryDate does not exist on customer_invoices; use createdAt
            .orderBy(desc(customerInvoices.createdAt))
            .limit(100)
            .execute();

          if (invoiceRecords.length > 0) {
            // Transform to Billy invoice format for frontend compatibility
            // NOTE: Database cache has limited fields. Use Billy API for full data.
            return invoiceRecords.map(
              ({ invoice, customer }) =>
                ({
                  // Core identifiers
                  id: invoice.billyInvoiceId || "",
                  organizationId: customer.billyOrganizationId || "",
                  invoiceNo: invoice.invoiceNumber || null,

                  // Contact/Customer
                  contactId:
                    customer.billyCustomerId ||
                    invoice.customerId?.toString() ||
                    "",

                  // Dates
                  createdTime: invoice.createdAt || new Date().toISOString(),
                  entryDate:
                    invoice.createdAt?.split("T")[0] ||
                    new Date().toISOString().split("T")[0],
                  dueDate: invoice.dueDate?.split("T")[0] || null,

                  // Status
                  state: invoice.status as
                    | "draft"
                    | "approved"
                    | "sent"
                    | "paid"
                    | "overdue"
                    | "voided",
                  sentState: "unsent" as const, // Not stored in DB cache
                  isPaid: invoice.paidAt !== null,

                  // Amounts (using database cache fields where available)
                  amount: parseFloat(invoice.amount || "0"),
                  tax: 0, // Not stored in DB cache - use Billy API for accurate tax
                  grossAmount: parseFloat(invoice.amount || "0"),
                  balance: invoice.paidAt
                    ? 0
                    : parseFloat(invoice.amount || "0"),

                  // Currency
                  currencyId: invoice.currency || "DKK",
                  exchangeRate: 1,

                  // Payment terms (calculated from dates)
                  paymentTermsDays:
                    invoice.dueDate && invoice.createdAt
                      ? Math.round(
                          (new Date(invoice.dueDate).getTime() -
                            new Date(invoice.createdAt).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null,

                  // Lines not stored in customer_invoices table
                  lines: [],

                  // Backwards compatibility
                  totalAmount: parseFloat(invoice.amount || "0"),
                  createdAt: invoice.createdAt,
                }) as BillyInvoice
            );
          }

          console.log(
            "[Invoice List] Database empty, fetching from Billy API and caching..."
          );
        } catch (error) {
          console.warn(
            "[Invoice List] Database query failed, falling back to Billy API:",
            error
          );
        }
      }

      // Fallback to Billy API if database empty or unavailable
      const invoices = await getBillyInvoices();

      // Background cache to database
      if (db && invoices.length > 0) {
        cacheInvoicesToDatabase(invoices, ctx.user.id, db).catch(error => {
          console.error("[Invoice List] Background cache failed:", error);
        });
      }

      return invoices;
    }),
    create: protectedProcedure
      .input(
        z.object({
          contactId: z.string(),
          entryDate: z.string(),
          paymentTermsDays: z.number().optional(),
          lines: z.array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              productId: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => createBillyInvoice(input)),
  }),
  calendar: router({
    list: protectedProcedure
      .input(
        z.object({
          timeMin: z.string().optional(),
          timeMax: z.string().optional(),
          maxResults: z.number().optional(),
        })
      )
      .query(async ({ input }) => listCalendarEvents(input)),
    create: protectedProcedure
      .input(
        z.object({
          summary: z.string(),
          description: z.string().optional(),
          start: z.string(),
          end: z.string(),
          location: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => createCalendarEvent(input)),
    update: protectedProcedure
      .input(
        z.object({
          eventId: z.string(),
          summary: z.string().optional(),
          description: z.string().optional(),
          start: z.string().optional(),
          end: z.string().optional(),
          location: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await updateCalendarEvent(input);
          return result;
        } catch (error: any) {
          // Check if it's a rate limit error
          if (
            error.message?.includes("rate limit") ||
            error.message?.includes("429") ||
            error.message?.includes("too many requests")
          ) {
            const retryAfter = error.message.match(/retry after ([^,]+)/i)?.[1];
            throw new Error(
              `Rate limit exceeded. Retry after ${retryAfter || "later"}`
            );
          }
          // Re-throw other errors with better message
          throw new Error(
            `Failed to update calendar event: ${error.message || "Unknown error"}`
          );
        }
      }),
    delete: protectedProcedure
      .input(z.object({ eventId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await deleteCalendarEvent(input);
          return { success: true };
        } catch (error: any) {
          // Check if it's a rate limit error
          if (
            error.message?.includes("rate limit") ||
            error.message?.includes("429") ||
            error.message?.includes("too many requests")
          ) {
            const retryAfter = error.message.match(/retry after ([^,]+)/i)?.[1];
            throw new Error(
              `Rate limit exceeded. Retry after ${retryAfter || "later"}`
            );
          }
          // Re-throw other errors with better message
          throw new Error(
            `Failed to delete calendar event: ${error.message || "Unknown error"}`
          );
        }
      }),
    checkAvailability: protectedProcedure
      .input(z.object({ start: z.string(), end: z.string() }))
      .query(async ({ input }) => checkCalendarAvailability(input)),
    findFreeSlots: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
          durationHours: z.number(),
        })
      )
      .query(async ({ input }) => {
        const { findFreeSlots } = await import("../google-api");
        return findFreeSlots({
          startDate: input.startDate,
          endDate: input.endDate,
          durationHours: input.durationHours,
        });
      }),
  }),
  leads: router({
    list: protectedProcedure
      .input(
        z.object({
          status: z.string().optional(),
          source: z.string().optional(),
          searchQuery: z.string().optional(),
          hideBillyImport: z.boolean().optional(),
          sortBy: z.enum(["date", "score", "name"]).optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ ctx, input }) => getUserLeads(ctx.user.id, input)),
    create: protectedProcedure
      .input(
        z.object({
          source: z.string(),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          notes: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const lead = await createLead({
          userId: ctx.user.id,
          source: input.source,
          name: input.name || "",
          email: input.email,
          phone: input.phone,
          company: input.company,
          notes: input.notes,
          metadata: input.metadata,
        });
        await trackEvent({
          userId: ctx.user.id,
          eventType: "lead_created",
          eventData: { leadId: lead.id, source: input.source },
        });
        return lead;
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          leadId: z.number(),
          status: z.enum([
            "new",
            "contacted",
            "qualified",
            "proposal",
            "won",
            "lost",
          ]),
        })
      )
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.leadId, input.status);
        return { success: true };
      }),
    updateScore: protectedProcedure
      .input(z.object({ leadId: z.number(), score: z.number() }))
      .mutation(async ({ input }) => {
        await updateLeadScore(input.leadId, input.score);
        return { success: true };
      }),
    getCalendarEvents: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return getLeadCalendarEvents(input.leadId);
      }),
    importHistoricalData: protectedProcedure
      .input(
        z.object({
          fromDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { importHistoricalData } = await import(
          "../import-historical-data"
        );
        const fromDate = input.fromDate
          ? new Date(input.fromDate)
          : new Date("2025-07-01");
        return await importHistoricalData(ctx.user.id, fromDate);
      }),
  }),
  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      getUserTasks(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          relatedTo: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createTask({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate ? input.dueDate : undefined,
          priority: input.priority,
        });
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          status: z.enum(["todo", "in_progress", "done", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateTaskStatus(input.taskId, input.status);
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
          relatedTo: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { taskId, ...updates } = input;
        const updateData: any = {};

        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined)
          updateData.description = updates.description;
        if (updates.dueDate !== undefined) {
          updateData.dueDate = updates.dueDate
            ? new Date(updates.dueDate)
            : null;
        }
        if (updates.priority !== undefined)
          updateData.priority = updates.priority;
        if (updates.relatedTo !== undefined)
          updateData.relatedTo = updates.relatedTo;

        const updated = await updateTask(taskId, updateData);
        return updated;
      }),
    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.taskId);
        return { success: true };
      }),
    bulkDelete: protectedProcedure
      .input(z.object({ taskIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const userTasks = await getUserTasks(ctx.user.id);
        const validIds = input.taskIds.filter(id =>
          userTasks.some(t => t.id === id)
        );
        if (validIds.length === 0) {
          throw new Error("Ingen gyldige tasks valgt");
        }
        const count = await bulkDeleteTasks(validIds);
        return { success: true, deletedCount: count };
      }),
    bulkUpdateStatus: protectedProcedure
      .input(
        z.object({
          taskIds: z.array(z.number()),
          status: z.enum(["todo", "in_progress", "done", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userTasks = await getUserTasks(ctx.user.id);
        const validIds = input.taskIds.filter(id =>
          userTasks.some(t => t.id === id)
        );
        if (validIds.length === 0) {
          throw new Error("Ingen gyldige tasks valgt");
        }
        const count = await bulkUpdateTaskStatus(validIds, input.status);
        return { success: true, updatedCount: count };
      }),
    bulkUpdatePriority: protectedProcedure
      .input(
        z.object({
          taskIds: z.array(z.number()),
          priority: z.enum(["low", "medium", "high", "urgent"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userTasks = await getUserTasks(ctx.user.id);
        const validIds = input.taskIds.filter(id =>
          userTasks.some(t => t.id === id)
        );
        if (validIds.length === 0) {
          throw new Error("Ingen gyldige tasks valgt");
        }
        const count = await bulkUpdateTaskPriority(validIds, input.priority);
        return { success: true, updatedCount: count };
      }),
    updateOrder: protectedProcedure
      .input(
        z.object({
          taskId: z.number(),
          orderIndex: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userTasks = await getUserTasks(ctx.user.id);
        if (!userTasks.some(t => t.id === input.taskId)) {
          throw new Error("Task ikke fundet eller tilhører ikke brugeren");
        }
        await updateTaskOrder(input.taskId, input.orderIndex);
        return { success: true };
      }),
    bulkUpdateOrder: protectedProcedure
      .input(
        z.array(
          z.object({
            taskId: z.number(),
            orderIndex: z.number(),
          })
        )
      )
      .mutation(async ({ ctx, input }) => {
        const userTasks = await getUserTasks(ctx.user.id);
        const validUpdates = input.filter(update =>
          userTasks.some(t => t.id === update.taskId)
        );
        if (validUpdates.length === 0) {
          throw new Error("Ingen gyldige tasks fundet");
        }
        await bulkUpdateTaskOrder(validUpdates);
        return { success: true, updatedCount: validUpdates.length };
      }),
  }),
  pipeline: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const pipelineStates = await db
        .select({
          pipelineState: emailPipelineState,
          emailThread: emailThreads,
          email: emails,
        })
        .from(emailPipelineState)
        .leftJoin(
          emailThreads,
          and(
            eq(emailThreads.gmailThreadId, emailPipelineState.threadId),
            eq(emailThreads.userId, ctx.user.id)
          )
        )
        .leftJoin(
          emails,
          and(
            eq(emails.threadId, emailPipelineState.threadId),
            eq(emails.userId, ctx.user.id)
          )
        )
        .where(eq(emailPipelineState.userId, ctx.user.id))
        .execute();

      const stages = [
        "needs_action",
        "venter_pa_svar",
        "i_kalender",
        "finance",
        "afsluttet",
      ] as const;

      const result: Record<
        string,
        Array<{
          id: string;
          threadId: string;
          subject: string;
          from: string;
          snippet: string;
          date: string;
        }>
      > = {};

      stages.forEach(stage => {
        result[stage] = [];
      });

      pipelineStates.forEach(({ pipelineState, emailThread, email }) => {
        if (pipelineState && emailThread) {
          result[pipelineState.stage]?.push({
            id: pipelineState.threadId,
            threadId: pipelineState.threadId,
            subject: emailThread.subject || "(No subject)",
            from: email?.fromEmail || "(Unknown)",
            snippet: emailThread.snippet || "",
            date: emailThread.lastMessageAt || new Date().toISOString(),
          });
        }
      });

      return result;
    }),
    updateStage: protectedProcedure
      .input(
        z.object({
          threadId: z.string(),
          newStage: z.enum([
            "needs_action",
            "venter_pa_svar",
            "i_kalender",
            "finance",
            "afsluttet",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const state = await updatePipelineStage(
          ctx.user.id,
          input.threadId,
          input.newStage
        );

        await trackEvent({
          userId: ctx.user.id,
          eventType: "pipeline_stage_changed",
          eventData: {
            threadId: input.threadId,
            newStage: input.newStage,
          },
        });

        return state;
      }),
  }),
});
