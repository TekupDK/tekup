import { COOKIE_NAME } from "@shared/const";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  attachments,
  customerInvoices,
  customerProfiles,
  emails,
  emailThreads,
} from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { routeAI } from "./ai-router";
import {
  createInvoice as createBillyInvoice,
  getInvoices as getBillyInvoices,
  getCustomers,
  searchCustomerByEmail,
} from "./billy";
import { customerRouter } from "./customer-router";
import { cacheInvoicesToDatabase } from "./invoice-cache";
import {
  bulkDeleteTasks,
  bulkUpdateTaskOrder,
  bulkUpdateTaskPriority,
  bulkUpdateTaskStatus,
  createConversation,
  createLead,
  createMessage,
  createTask,
  deleteTask,
  getConversation,
  getConversationMessages,
  getDb,
  getLeadCalendarEvents,
  getPipelineState,
  getPipelineTransitions,
  getUserConversations,
  getUserLeads,
  getUserPipelineStates,
  getUserPreferences,
  getUserTasks,
  trackEvent,
  updateConversationTitle,
  updateLeadScore,
  updateLeadStatus,
  updatePipelineStage,
  updateTask,
  updateTaskOrder,
  updateTaskStatus,
  updateUserName,
  updateUserPreferences,
} from "./db";
// Use MCP for Google services instead of direct API
import {
  addLabelToThread,
  archiveThread,
  removeLabelFromThread,
} from "./gmail-labels";
import {
  markGmailMessageAsRead as googleMarkAsRead,
  starGmailMessage as googleStarMessage,
} from "./google-api";
import { executeAction } from "./intent-actions";
import {
  checkCalendarAvailability as mcpCheckCalendarAvailability,
  createCalendarEvent as mcpCreateCalendarEvent,
  createGmailDraft as mcpCreateGmailDraft,
  deleteCalendarEvent as mcpDeleteCalendarEvent,
  deleteGmailThread as mcpDeleteGmailThread,
  findFreeTimeSlots as mcpFindFreeSlots,
  getFullGmailThread as mcpGetFullGmailThread,
  getGmailLabels as mcpGetGmailLabels,
  getGmailThread as mcpGetGmailThread,
  listCalendarEvents as mcpListCalendarEvents,
  searchGmailThreads as mcpSearchGmailThreads,
  sendGmailMessage as mcpSendGmailMessage,
  updateCalendarEvent as mcpUpdateCalendarEvent,
} from "./mcp";
import { generateConversationTitle } from "./title-generator";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  customer: customerRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserName(ctx.user.id, input.name);
        return { success: true };
      }),
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const prefs = await getUserPreferences(ctx.user.id);
      return (
        prefs || {
          theme: "dark" as const,
          language: "da",
          emailNotifications: true,
          pushNotifications: false,
        }
      );
    }),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          theme: z.enum(["light", "dark"]).optional(),
          language: z.string().optional(),
          emailNotifications: z.boolean().optional(),
          pushNotifications: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const prefs = await updateUserPreferences(ctx.user.id, input);
        return (
          prefs || {
            theme: "dark" as const,
            language: "da",
            emailNotifications: true,
            pushNotifications: false,
          }
        );
      }),
  }),

  // Chat interface
  chat: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      getUserConversations(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) return null;
        const messages = await getConversationMessages(input.conversationId);
        return { conversation, messages };
      }),
    create: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return createConversation({
          userId: ctx.user.id,
          title: input.title || "New Conversation",
        });
      }),
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          model: z
            .enum([
              "gemini-2.5-flash",
              "claude-3-5-sonnet",
              "gpt-4o",
              "manus-ai",
            ])
            .optional(),
          attachments: z
            .array(
              z.object({ url: z.string(), name: z.string(), type: z.string() })
            )
            .optional(),
          // Shortwave-style context tracking
          context: z
            .object({
              page: z.string().optional(), // Current page/tab
              selectedThreads: z.array(z.string()).optional(), // Selected email thread IDs
              openThreadId: z.string().optional(), // Currently viewing thread
              folder: z.string().optional(), // inbox, sent, archive, starred
              viewMode: z.string().optional(), // list, pipeline, dashboard
              selectedLabels: z.array(z.string()).optional(),
              searchQuery: z.string().optional(),
              openDrafts: z.number().optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        console.log("[Chat] sendMessage called:", {
          conversationId: input.conversationId,
          content: input.content?.substring(0, 50) + "...",
          model: input.model,
          hasContext: !!input.context,
        });

        // Log context if present (Shortwave-style tracking)
        if (input.context) {
          console.log("[Chat] Context received:", {
            page: input.context.page,
            selectedThreads: input.context.selectedThreads?.length || 0,
            openThreadId: input.context.openThreadId,
            folder: input.context.folder,
            viewMode: input.context.viewMode,
          });
        }

        console.log("[Chat] Creating user message...");
        const userMessage = await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          attachments: input.attachments,
        });
        console.log("[Chat] User message created, ID:", userMessage.id);

        console.log("[Chat] Getting conversation messages...");
        const messages = await getConversationMessages(input.conversationId);
        console.log("[Chat] Found", messages.length, "messages");

        // Check if this is the first message and conversation has no title
        const conversation = await getConversation(input.conversationId);
        if (
          conversation &&
          messages.length === 1 &&
          (!conversation.title || conversation.title === "New Conversation")
        ) {
          // Generate title asynchronously (non-blocking)
          generateConversationTitle(input.content, input.model)
            .then(async title => {
              await updateConversationTitle(input.conversationId, title);
              console.log(
                `[Chat] Auto-generated title for conversation ${input.conversationId}: ${title}`
              );
            })
            .catch(error => {
              console.error(
                `[Chat] Title generation failed for conversation ${input.conversationId}:`,
                error
              );
            });
        }

        const aiMessages = messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        // Add context to system prompt if provided (Shortwave-style)
        const aiResponse = await routeAI({
          messages: aiMessages,
          taskType: "chat",
          userId: ctx.user.id,
          preferredModel: input.model,
          requireApproval: true,
          context: input.context, // Pass context to AI router
        });
        const assistantMessage = await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: aiResponse.content,
          model: aiResponse.model,
        });
        await trackEvent({
          userId: ctx.user.id,
          eventType: "message_sent",
          eventData: { conversationId: input.conversationId },
        });
        return {
          userMessage,
          assistantMessage,
          pendingAction: aiResponse.pendingAction,
        };
      }),
    updateTitle: protectedProcedure
      .input(z.object({ conversationId: z.number(), title: z.string() }))
      .mutation(async ({ input }) => {
        await updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),
    analyzeInvoice: protectedProcedure
      .input(z.object({ invoiceData: z.string() }))
      .mutation(async ({ input }) => {
        // Use AI to analyze the invoice
        const aiResponse = await routeAI({
          messages: [
            {
              role: "system",
              content:
                "You are a financial analyst expert. Analyze invoices and provide insights about payment status, completeness, anomalies, and recommendations.",
            },
            { role: "user", content: input.invoiceData },
          ],
          taskType: "data-analysis",
          preferredModel: "gemini-2.5-flash",
        });
        return { analysis: aiResponse.content };
      }),
    submitAnalysisFeedback: protectedProcedure
      .input(
        z.object({
          invoiceId: z.string(),
          rating: z.enum(["up", "down"]),
          analysis: z.string(),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Store feedback in database for analytics
        // For now, just log it (can be extended to save to DB later)
        console.log(
          `[Feedback] User ${ctx.user.id} rated invoice ${input.invoiceId} analysis as ${input.rating}${input.comment ? ` with comment: ${input.comment}` : ""}`
        );
        await trackEvent({
          userId: ctx.user.id,
          eventType: "analysis_feedback",
          eventData: {
            invoiceId: input.invoiceId,
            rating: input.rating,
            comment: input.comment,
          },
        });
        return { success: true };
      }),
    executeAction: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          actionId: z.string(),
          actionType: z.string(),
          actionParams: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Execute the approved action
        const intent = {
          intent: input.actionType as any,
          params: input.actionParams,
          confidence: 1.0,
        };
        const actionResult = await executeAction(intent, ctx.user.id);

        // Create system message with action result
        const resultMessage = await createMessage({
          conversationId: input.conversationId,
          role: "system",
          content: `[Action Executed] ${actionResult.success ? "Success" : "Failed"}: ${actionResult.message}${actionResult.data ? "\nData: " + JSON.stringify(actionResult.data, null, 2) : ""}${actionResult.error ? "\nError: " + actionResult.error : ""}`,
        });

        // Get AI response acknowledging the action
        const messages = await getConversationMessages(input.conversationId);
        const aiMessages = messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));
        const aiResponse = await routeAI({
          messages: aiMessages,
          taskType: "chat",
          userId: ctx.user.id,
          requireApproval: false,
        });

        const assistantMessage = await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: aiResponse.content,
          model: aiResponse.model,
        });

        return { actionResult, assistantMessage };
      }),
  }),

  // Inbox modules
  inbox: router({
    email: router({
      list: protectedProcedure
        .input(
          z.object({
            maxResults: z.number().optional(),
            query: z.string().optional(),
          })
        )
        .query(async ({ ctx, input }) => {
          // DATABASE-FIRST STRATEGY: Try database first, only fallback if empty
          const db = await getDb();
          if (db) {
            try {
              // Query from database (simple implementation - can be enhanced with full search)
              const emailRecords = await db
                .select()
                .from(emails)
                .where(eq(emails.userId, ctx.user.id))
                .orderBy(desc(emails.receivedAt))
                .limit(input.maxResults || 50)
                .execute();

              if (emailRecords.length > 0) {
                // Return from database - DATA IS HERE!
                return emailRecords.map(email => ({
                  id: email.threadKey || email.providerId,
                  snippet: email.text?.substring(0, 200) || email.subject || "",
                  subject: email.subject,
                  from: email.fromEmail,
                  date: email.receivedAt.toISOString(),
                  labels: [],
                  unread: true,
                  messages: [
                    {
                      id: email.providerId,
                      threadId: email.threadKey || email.providerId,
                      from: email.fromEmail,
                      to: email.toEmail,
                      subject: email.subject || "",
                      body: email.text || email.html || "",
                      date: email.receivedAt.toISOString(),
                    },
                  ],
                }));
              }

              // Database is empty - fetch from Gmail API and cache to database
              console.log("[Email List] Database empty, fetching from Gmail API and caching...");
            } catch (error) {
              console.warn(
                "[Email List] Database query failed, falling back to Gmail API:",
                error
              );
            }
          }

          // Fallback to Gmail API (direkte Google API, ikke MCP)
          const { searchGmailThreads } = await import("./google-api");
          const threads = await searchGmailThreads({
            query: input.query || "in:inbox",
            maxResults: input.maxResults || 20,
          });

          // Cache to database in background (don't await to speed up response)
          if (db && threads.length > 0) {
            const { cacheEmailsToDatabase } = await import("./email-cache");
            cacheEmailsToDatabase(threads, ctx.user.id, db).catch(error => {
              console.error("[Email List] Background cache failed:", error);
            });
          }

          return threads;
        }),
      get: protectedProcedure
        .input(z.object({ threadId: z.string() }))
        .query(async ({ input }) => mcpGetGmailThread(input.threadId)),
      getThread: protectedProcedure
        .input(z.object({ threadId: z.string() }))
        .query(async ({ input }) => mcpGetFullGmailThread(input.threadId)),
      search: protectedProcedure
        .input(z.object({ query: z.string() }))
        .query(async ({ input }) => mcpSearchGmailThreads(input.query, 50)),
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
        .mutation(async ({ input }) => mcpCreateGmailDraft(input)),
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
        .mutation(async ({ input }) => mcpSendGmailMessage(input)),
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
          mcpSendGmailMessage({
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
          mcpSendGmailMessage({
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
          await mcpDeleteGmailThread(input.threadId);
          return { success: true };
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
      getLabels: protectedProcedure.query(async () => mcpGetGmailLabels()),
      listByLabel: protectedProcedure
        .input(
          z.object({
            labelName: z.string(),
            maxResults: z.number().optional(),
          })
        )
        .query(async ({ input }) =>
          mcpSearchGmailThreads(
            `label:${input.labelName}`,
            input.maxResults || 20
          )
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
              "./customer-db"
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
          const events = await mcpListCalendarEvents({
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
            return mcpSearchGmailThreads("in:inbox", input.maxResults);
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
            id: email.threadKey || email.providerId,
            snippet: email.text?.substring(0, 200) || email.subject || "",
            subject: email.subject,
            from: email.fromEmail,
            date: email.receivedAt.toISOString(),
            labels: [],
            unread: true,
            messages: [
              {
                id: email.providerId,
                threadId: email.threadKey || email.providerId,
                from: email.fromEmail,
                to: email.toEmail,
                subject: email.subject || "",
                body: email.text || email.html || "",
                date: email.receivedAt.toISOString(),
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
            return mcpGetFullGmailThread(input.threadId);
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
            return mcpGetFullGmailThread(input.threadId);
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
              date: email.receivedAt.toISOString(),
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
            "./customer-db"
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
        .query(async ({ input }) => {
          return getPipelineState(input.threadId);
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
        .query(async ({ input }) => {
          return getPipelineTransitions(input.threadId);
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
              .orderBy(desc(customerInvoices.entryDate))
              .limit(100)
              .execute();

            if (invoiceRecords.length > 0) {
              // Transform to Billy invoice format for frontend compatibility
              return invoiceRecords.map(({ invoice, customer }) => ({
                id: invoice.billyInvoiceId,
                invoiceNo: invoice.invoiceNo || undefined,
                contactId: customer.billyCustomerId || invoice.customerId.toString(),
                entryDate: invoice.entryDate?.toISOString() || new Date().toISOString(),
                paymentTermsDays: invoice.dueDate && invoice.entryDate
                  ? Math.round(
                      (invoice.dueDate.getTime() - invoice.entryDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 14,
                state: invoice.status as "draft" | "approved" | "sent" | "paid" | "overdue",
                lines: [], // Lines not stored in customer_invoices table
                organizationId: customer.billyOrganizationId || "",
              }));
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
        .query(async ({ input }) => mcpListCalendarEvents(input)),
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
        .mutation(async ({ input }) => mcpCreateCalendarEvent(input)),
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
        .mutation(async ({ input }) => mcpUpdateCalendarEvent(input)),
      delete: protectedProcedure
        .input(z.object({ eventId: z.string() }))
        .mutation(async ({ input }) => {
          await mcpDeleteCalendarEvent(input);
          return { success: true };
        }),
      checkAvailability: protectedProcedure
        .input(z.object({ start: z.string(), end: z.string() }))
        .query(async ({ input }) => mcpCheckCalendarAvailability(input)),
      findFreeSlots: protectedProcedure
        .input(
          z.object({
            startDate: z.string(),
            endDate: z.string(),
            durationHours: z.number(),
          })
        )
        .query(async ({ input }) => {
          // Convert durationHours to minutes for MCP
          const durationMinutes = input.durationHours * 60;
          return mcpFindFreeSlots({
            date: input.startDate.split("T")[0],
            duration: durationMinutes,
          });
        }),
    }),
    leads: router({
      list: protectedProcedure.query(async ({ ctx }) =>
        getUserLeads(ctx.user.id)
      ),
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
            name: input.name,
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
      /**
       * Import historical data from Billy invoices and calendar events
       */
      importHistoricalData: protectedProcedure
        .input(
          z.object({
            fromDate: z.string().optional(), // ISO date string, default: "2025-07-01"
          })
        )
        .mutation(async ({ ctx, input }) => {
          const { importHistoricalData } = await import(
            "./import-historical-data"
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
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            priority: input.priority,
            relatedTo: input.relatedTo,
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
          // Verify all tasks belong to user
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
          // Verify all tasks belong to user
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
          // Verify all tasks belong to user
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
          // Verify task belongs to user
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
          // Verify all tasks belong to user
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
  }),

  // Friday AI commands
  friday: router({
    findRecentLeads: protectedProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ input }) => {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - input.days);
        const query = `after:${daysAgo.toISOString().split("T")[0]}`;
        return mcpSearchGmailThreads(query, 100);
      }),
    getCustomers: protectedProcedure.query(async () => getCustomers()),
    searchCustomer: protectedProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ input }) => searchCustomerByEmail(input.email)),
  }),
});

export type AppRouter = typeof appRouter;
