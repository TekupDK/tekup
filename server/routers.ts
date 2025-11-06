import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { routeAI } from "./ai-router";
import { getCustomers, searchCustomerByEmail } from "./billy";
import { customerRouter } from "./customer-router";
import {
  createConversation,
  createMessage,
  getConversation,
  getConversationMessages,
  getUserConversations,
  getUserPreferences,
  trackEvent,
  updateConversationTitle,
  updateUserName,
  updateUserPreferences,
} from "./db";
// Use MCP for Google services instead of direct API
import { executeAction } from "./intent-actions";
// Direct Gmail & Calendar API (replacing MCP for better performance and reliability)
import { searchGmailThreads } from "./google-api";
import { inboxRouter } from "./routers/inbox-router";
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
    summarizeEmail: protectedProcedure
      .input(
        z.object({
          threadId: z.string(),
          subject: z.string(),
          from: z.string(),
          body: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        console.log("[Chat] summarizeEmail called:", {
          threadId: input.threadId,
          subject: input.subject?.substring(0, 50),
        });

        const prompt = `Summarize this email in 2-3 bullet points in Danish:

  From: ${input.from}
  Subject: ${input.subject}

  ${input.body}

  Provide a concise summary highlighting:
  - Main topic/purpose
  - Key action items or requests
  - Important details or deadlines`;

        const { invokeLLM } = await import("./_core/llm");

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        // Support both OpenAI and Gemini response shapes
        let summaryText: unknown = undefined;
        // OpenAI shape
        if ((response as any)?.choices?.length) {
          summaryText = (response as any).choices[0]?.message?.content;
        }
        // Gemini shape
        else if ((response as any)?.candidates?.length) {
          const parts = (response as any).candidates[0]?.content?.parts;
          if (Array.isArray(parts)) {
            summaryText = parts
              .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
              .filter(Boolean)
              .join("\n")
              .trim();
          }
        }

        const finalSummary =
          typeof summaryText === "string" && summaryText.trim().length > 0
            ? summaryText
            : "Could not generate summary";

        console.log(
          "[Chat] Summary generated:",
          finalSummary.substring(0, 100)
        );

        return { summary: finalSummary };
      }),
    sendMessage: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          model: z.literal("gemma-3-27b-free").optional(),
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
          // attachments not in schema - stored separately if needed
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
          // model not in schema - could be stored in metadata if needed
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
          preferredModel: "gemma-3-27b-free",
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
          idempotencyKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { rateLimiter, RATE_LIMITS, createRateLimitKey } = await import(
          "./rate-limiter"
        );
        const { isActionAllowed, validateActionParams } = await import(
          "./action-catalog"
        );
        const {
          checkIdempotency,
          storeIdempotencyRecord,
          generateIdempotencyKey,
        } = await import("./idempotency");
        const { logActionExecuted, logActionFailed, generateCorrelationId } =
          await import("./action-audit");
        const { getUserRole, hasPermission, getRoleName } = await import(
          "./rbac"
        );
        const { isFeatureAvailable, logRolloutMetric } = await import(
          "./feature-rollout"
        );
        const { trackMetric } = await import("./metrics");

        // Store action start time for time-to-action metric
        const actionStartTime = Date.now();

        // Feature rollout check
        if (!isFeatureAvailable(ctx.user.id, "action_execution")) {
          logRolloutMetric(ctx.user.id, "action_execution", "check");
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Action execution is not available for your account yet. Stay tuned!",
          });
        }

        // Rate limiting check
        const rateLimitKey = createRateLimitKey(ctx.user.id, "executeAction");
        if (
          rateLimiter.isRateLimited(rateLimitKey, RATE_LIMITS.ACTION_EXECUTION)
        ) {
          const resetTime = rateLimiter.getResetTime(rateLimitKey);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many action executions. Try again in ${Math.ceil((resetTime || 0) / 1000)} seconds.`,
          });
        }

        // Validate action type
        if (!isActionAllowed(input.actionType)) {
          throw new Error(`Action type not allowed: ${input.actionType}`);
        }

        // Role-based access control
        const userRole = getUserRole(ctx.user.id);
        if (!hasPermission(userRole, input.actionType)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You don't have permission to execute '${input.actionType}'. Required role or higher is needed. Your role: ${getRoleName(userRole)}`,
          });
        }

        logRolloutMetric(ctx.user.id, "action_execution", "use");

        // Validate params
        const validation = validateActionParams(
          input.actionType,
          input.actionParams
        );
        if (!validation.success) {
          throw new Error(validation.error);
        }

        // Generate or use provided idempotency key
        const idempotencyKey =
          input.idempotencyKey ||
          generateIdempotencyKey(
            ctx.user.id,
            input.actionType,
            input.conversationId,
            input.actionId
          );

        // Check for duplicate execution
        const idempotencyCheck = checkIdempotency(idempotencyKey);
        if (idempotencyCheck.isDuplicate) {
          console.log(`[Chat] Duplicate action detected: ${idempotencyKey}`);
          return idempotencyCheck.result;
        }

        const correlationId = generateCorrelationId();

        try {
          // Execute the approved action
          const intent = {
            intent: input.actionType as any,
            params: validation.data,
            confidence: 1.0,
          };
          const actionResult = await executeAction(intent, ctx.user.id);

          // Store idempotency record
          storeIdempotencyRecord(
            idempotencyKey,
            input.actionType,
            ctx.user.id,
            actionResult
          );

          // Log execution
          await logActionExecuted(
            input.actionType,
            input.actionId,
            ctx.user.id,
            correlationId,
            actionResult,
            input.conversationId,
            idempotencyKey
          );

          // Track success metrics
          trackMetric(ctx.user.id, "action_executed", {
            actionType: input.actionType,
            suggestionId: input.actionId,
            conversationId: input.conversationId,
            timeToAction: Date.now() - actionStartTime,
          });
          trackMetric(ctx.user.id, "suggestion_accepted", {
            actionType: input.actionType,
            suggestionId: input.actionId,
            conversationId: input.conversationId,
            timeToAction: Date.now() - actionStartTime,
          });

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
            // model not in schema - could be stored in metadata if needed
          });

          return { actionResult, assistantMessage };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await logActionFailed(
            input.actionType,
            input.actionId,
            ctx.user.id,
            correlationId,
            errorMessage,
            input.conversationId,
            idempotencyKey
          );

          // Track failure metrics
          trackMetric(ctx.user.id, "action_failed", {
            actionType: input.actionType,
            suggestionId: input.actionId,
            conversationId: input.conversationId,
            errorMessage,
          });
          logRolloutMetric(ctx.user.id, "action_execution", "error");

          throw error;
        }
      }),

    // NEW: Dry-run endpoint for action preview
    dryRunAction: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          actionId: z.string(),
          actionType: z.string(),
          actionParams: z.record(z.string(), z.any()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { isActionAllowed, validateActionParams, getActionCatalogEntry } =
          await import("./action-catalog");
        const { logActionDryRun, generateCorrelationId } = await import(
          "./action-audit"
        );

        // Validate action type
        if (!isActionAllowed(input.actionType)) {
          return {
            success: false,
            message: `Action type not allowed: ${input.actionType}`,
          };
        }

        // Validate params
        const validation = validateActionParams(
          input.actionType,
          input.actionParams
        );
        if (!validation.success) {
          return {
            success: false,
            message: validation.error,
          };
        }

        const correlationId = generateCorrelationId();
        const entry = getActionCatalogEntry(input.actionType);

        try {
          // Dry run: just validate and preview, don't execute
          const preview = {
            actionType: input.actionType,
            label: entry?.label || input.actionType,
            riskLevel: entry?.riskLevel || "medium",
            params: validation.data,
            estimatedImpact: entry?.description || "Action will be executed",
            willExecute: true,
          };

          await logActionDryRun(
            input.actionType,
            input.actionId,
            ctx.user.id,
            correlationId,
            true,
            preview,
            undefined,
            input.conversationId
          );

          return {
            success: true,
            message: "Dry run successful - action can be executed safely",
            preview,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await logActionDryRun(
            input.actionType,
            input.actionId,
            ctx.user.id,
            correlationId,
            false,
            undefined,
            errorMessage,
            input.conversationId
          );

          return {
            success: false,
            message: `Dry run failed: ${errorMessage}`,
          };
        }
      }),

    // NEW: Get AI-powered action suggestions based on conversation context
    getSuggestions: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          maxSuggestions: z.number().min(1).max(5).default(3),
        })
      )
      .query(async ({ ctx, input }) => {
        const { rateLimiter, RATE_LIMITS, createRateLimitKey } = await import(
          "./rate-limiter"
        );
        const { getActionCatalogEntry } = await import("./action-catalog");
        const { logActionShown, generateCorrelationId } = await import(
          "./action-audit"
        );
        const { routeAI } = await import("./ai-router");
        const { isFeatureAvailable, logRolloutMetric } = await import(
          "./feature-rollout"
        );

        // Feature rollout check
        if (!isFeatureAvailable(ctx.user.id, "ai_suggestions")) {
          logRolloutMetric(ctx.user.id, "ai_suggestions", "check");
          return { suggestions: [] }; // Silently return empty for users not in rollout
        }

        // Rate limiting check
        const rateLimitKey = createRateLimitKey(ctx.user.id, "getSuggestions");
        if (
          rateLimiter.isRateLimited(rateLimitKey, RATE_LIMITS.AI_SUGGESTIONS)
        ) {
          const resetTime = rateLimiter.getResetTime(rateLimitKey);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded. Try again in ${Math.ceil((resetTime || 0) / 1000)} seconds.`,
          });
        }

        logRolloutMetric(ctx.user.id, "ai_suggestions", "use");

        try {
          // Get conversation messages for context
          const messages = await getConversationMessages(input.conversationId);
          if (messages.length === 0) {
            return { suggestions: [] };
          }

          // Build prompt for Gemini to analyze conversation and suggest actions
          const conversationContext = messages
            .slice(-5) // Last 5 messages for context
            .map(m => `${m.role}: ${m.content}`)
            .join("\n\n");

          const systemPrompt = `Du er en intelligent assistent der analyserer samtaler og foreslår relevante handlinger.

Tilgængelige handlinger:
- create_lead: Opret et nyt lead/kundeemne
- create_task: Opret en opgave
- book_meeting: Book et møde
- create_invoice: Opret en faktura
- search_gmail: Søg i Gmail
- request_flytter_photos: Anmod om flyttebilleder
- job_completion: Marker job som færdigt
- search_email: Søg i emails
- list_tasks: Vis opgaver
- list_leads: Vis leads
- check_calendar: Tjek kalender
 - ai_generate_summaries: Generér AI-resuméer for emails (params: emailIds?: number[], skipCached?: boolean)
 - ai_suggest_labels: Foreslå (og evt. auto-anvend) AI-labels (params: emailIds?: number[], skipCached?: boolean, autoApply?: boolean)

Analyser følgende samtale og foreslå 1-${input.maxSuggestions} relevante handlinger.

Samtale:
${conversationContext}

Besvar i JSON format:
{
  "suggestions": [
    {
      "actionType": "create_task",
      "priority": "high|medium|low",
      "reasoning": "kort forklaring",
      "params": { "title": "...", "dueInDays": 2 }
    }
  ]
}

Kun foreslå handlinger der giver mening baseret på samtalen. Hvis ingen handlinger er relevante, returner tom liste.`;

          // Call Gemini to generate suggestions
          const aiResponse = await routeAI({
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: "Analyser samtalen og foreslå handlinger.",
              },
            ],
            taskType: "chat",
            userId: ctx.user.id,
            requireApproval: false,
          });

          // Parse AI response
          let parsedSuggestions: any[] = [];
          try {
            const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              parsedSuggestions = parsed.suggestions || [];
            }
          } catch (parseError) {
            console.warn("[Chat] Failed to parse AI suggestions:", parseError);
            // Fallback to safe defaults if parsing fails
            parsedSuggestions = [];
          }

          // Transform to frontend format and validate
          const { trackMetric } = await import("./metrics");

          const suggestions = parsedSuggestions
            .slice(0, input.maxSuggestions)
            .map((s: any, idx: number) => {
              const entry = getActionCatalogEntry(s.actionType);
              if (!entry) return null;

              const suggestionId = `suggestion_${input.conversationId}_${Date.now()}_${idx}`;
              const correlationId = generateCorrelationId();

              // Log that suggestion was shown
              logActionShown(
                s.actionType,
                suggestionId,
                ctx.user.id,
                correlationId,
                input.conversationId,
                s.params || {}
              ).catch(err =>
                console.error("[Chat] Failed to log action shown:", err)
              );

              // Track metrics
              trackMetric(ctx.user.id, "suggestion_shown", {
                actionType: s.actionType,
                suggestionId,
                conversationId: input.conversationId,
                metadata: { priority: s.priority },
              });

              return {
                id: suggestionId,
                type: s.actionType,
                params: s.params || {},
                impact: s.reasoning || entry.description,
                preview: `${entry.label}\n${JSON.stringify(s.params, null, 2)}`,
                riskLevel: entry.riskLevel,
              };
            })
            .filter((s: any) => s !== null);

          return { suggestions };
        } catch (error) {
          console.error("[Chat] getSuggestions error:", error);
          // Return empty suggestions on error rather than failing
          return { suggestions: [] };
        }
      }),
  }),

  // Inbox modules (extracted to separate file for performance)
  inbox: inboxRouter,

  // Friday AI commands
  friday: router({
    findRecentLeads: protectedProcedure
      .input(z.object({ days: z.number().default(7) }))
      .query(async ({ input }) => {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - input.days);
        const query = `after:${daysAgo.toISOString().split("T")[0]}`;
        return searchGmailThreads({ query, maxResults: 100 });
      }),
    getCustomers: protectedProcedure.query(async () => getCustomers()),
    searchCustomer: protectedProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ input }) => searchCustomerByEmail(input.email)),
  }),

  // Metrics & Analytics (for admin/monitoring)
  metrics: router({
    getMetricsSummary: protectedProcedure.query(async () => {
      const { getMetricsSummary } = await import("./metrics");
      return getMetricsSummary();
    }),
    getUserAcceptanceRate: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const { getSuggestionAcceptanceRate } = await import("./metrics");
        return getSuggestionAcceptanceRate(input.userId || ctx.user.id);
      }),
    getRolloutStats: protectedProcedure.query(async () => {
      const { getRolloutStats } = await import("./feature-rollout");
      return getRolloutStats();
    }),
    getUserFeatures: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFeatures } = await import("./feature-rollout");
      return getUserFeatures(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
