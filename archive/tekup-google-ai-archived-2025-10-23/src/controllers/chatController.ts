import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { nanoid } from "nanoid";
import { IntentClassifier } from "../agents/intentClassifier";
import { TaskPlanner } from "../agents/taskPlanner";
import { PlanExecutor } from "../agents/planExecutor";
import { appConfig } from "../config";
import { logger } from "../logger";
import { appendHistory, getHistory } from "../services/memoryStore";
import { AppError } from "../errors";
import type { AssistantResponse, ChatMessage, ChatSessionContext, LeadInformation } from "../types";
import { OpenAiProvider } from "../llm/openAiProvider";
import type { LLMProvider } from "../llm/llmProvider";
import { getLLMProvider } from "../llm/providerFactory";
import { FridayAI } from "../ai/friday";
import { getHybridController, initializeMicrosoftAgentFramework } from "../agents/microsoft";

const ChatRequestSchema = z.object({
    message: z.string().min(1, "message is required"),
    sessionId: z.string().optional(),
    userId: z.string().optional(),
    channel: z.enum(["mobile", "tablet", "desktop", "web"]).optional(),
    locale: z.string().optional(),
    lead: z
        .object({
            source: z.string().optional(),
            name: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            squareMeters: z.number().optional(),
            rooms: z.number().optional(),
            taskType: z.string().optional(),
            preferredDates: z.array(z.string()).optional(),
        })
        .optional(),
    history: z
        .array(
            z.object({
                role: z.enum(["user", "assistant", "system"]),
                content: z.string(),
                timestamp: z.string().optional(),
            })
        )
        .optional(),
});

// Initialize Microsoft Agent Framework
let microsoftFrameworkInitialized = false;
const initializeMicrosoft = async () => {
    if (!microsoftFrameworkInitialized) {
        try {
            const result = await initializeMicrosoftAgentFramework({
                enableOrchestration: process.env.ENABLE_MICROSOFT_ORCHESTRATION === 'true',
                enableThreadManagement: process.env.ENABLE_MICROSOFT_THREADS === 'true',
                enableTelemetry: process.env.ENABLE_MICROSOFT_TELEMETRY === 'true',
                enablePluginSystem: process.env.ENABLE_MICROSOFT_PLUGINS === 'true',
                debugMode: process.env.NODE_ENV === 'development',
            });

            if (result.success) {
                logger.info("Microsoft Agent Framework initialized successfully");
            } else {
                logger.warn({ errors: result.errors }, "Microsoft Agent Framework initialization had issues");
            }
            microsoftFrameworkInitialized = true;
        } catch (error) {
            logger.error({ error }, "Failed to initialize Microsoft Agent Framework");
        }
    }
};

// Legacy components (fallback)
const planner = new TaskPlanner();
const executor = new PlanExecutor();
const classifier = (() => {
    try {
        if (!appConfig.llm.OPENAI_API_KEY) {
            return new IntentClassifier();
        }

        const provider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);
        return new IntentClassifier({ llm: provider, threshold: 0.7 });
    } catch (error) {
        logger.warn({ err: error }, "Falling back to heuristic classifier");
        return new IntentClassifier();
    }
})();

// Initialize Friday AI with LLM provider based on LLM_PROVIDER setting
const fridayAI = (() => {
    try {
        const provider = getLLMProvider();

        if (provider) {
            logger.info("Friday AI initialized with LLM provider");
            return new FridayAI(provider);
        }

        // Heuristic mode (no LLM)
        logger.info("Friday AI initialized in heuristic mode (no LLM provider)");
        return new FridayAI();
    } catch (error) {
        logger.warn({ err: error }, "Friday AI falling back to heuristic mode");
        return new FridayAI();
    }
})();

export async function handleChat(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        // Initialize Microsoft Agent Framework if not already done
        await initializeMicrosoft();

        const parsed = ChatRequestSchema.parse(req.body);
        const sessionId = parsed.sessionId ?? nanoid(12);
        const history = (parsed.history ?? getHistory(sessionId)) as ChatMessage[];

        const context: ChatSessionContext = {
            userId: parsed.userId,
            channel: parsed.channel,
            locale: parsed.locale,
            history,
        };

        // Add enriched context from Gmail/Calendar if available
        const enrichedContext = (req as unknown as { enrichedContext?: { contextSummary?: string } }).enrichedContext;
        if (enrichedContext?.contextSummary) {
            logger.debug({ sessionId }, "Using enriched context from Gmail/Calendar");
            // Add context summary as a system message at the start
            history.unshift({
                role: "system",
                content: `Context: ${enrichedContext.contextSummary}`,
                timestamp: new Date().toISOString(),
            });
        }

        const userMessage: ChatMessage = {
            role: "user",
            content: parsed.message,
            timestamp: new Date().toISOString(),
        };
        appendHistory(sessionId, userMessage);

        // Try Microsoft Agent Framework first, fallback to legacy
        let finalMessage: string;
        let intent: any;
        let plan: any;
        let execution: any;

        try {
            // Use hybrid controller for processing
            const hybridController = getHybridController();
            const hybridResult = await hybridController.processMessage(
                parsed.message,
                context,
                parsed.lead as LeadInformation | undefined,
                history
            );

            if (hybridResult.success) {
                finalMessage = hybridResult.response;

                // Create mock response structure for compatibility
                intent = { intent: "hybrid", confidence: 0.9, rationale: "Microsoft Agent Framework" };
                plan = [];
                execution = {
                    summary: hybridResult.response,
                    actions: [],
                };

                logger.info({
                    method: hybridResult.method,
                    executionTime: hybridResult.executionTime,
                    threadId: hybridResult.threadId,
                }, "Message processed with hybrid controller");
            } else {
                throw new Error(`Hybrid processing failed: ${hybridResult.errors.join(", ")}`);
            }
        } catch (error) {
            logger.warn({ error }, "Hybrid processing failed, falling back to legacy");

            // Fallback to legacy processing
            intent = await classifier.classify(parsed.message, history);

            // Use Friday AI for intelligent response with full context
            logger.debug({ intent: intent.intent }, "Generating Friday AI response");
            const fridayResponse = await fridayAI.respond({
                intent: intent.intent,
                confidence: intent.confidence,
                userMessage: parsed.message,
                history,
            });

            // Also execute tasks if needed (for actions like booking, email sending)
            plan = planner.plan({
                intent,
                message: parsed.message,
                context,
                lead: parsed.lead as LeadInformation | undefined,
            });
            execution = await executor.execute(plan);

            // Combine Friday AI response with execution summary
            finalMessage = fridayResponse.message;

            // If there were actions executed, append them
            if (execution.actions.length > 0) {
                const actionsSummary = execution.actions
                    .map(a => {
                        const emoji = a.status === 'success' ? '✅' : a.status === 'queued' ? '⏳' : '❌';
                        return `${emoji} ${a.detail}`;
                    })
                    .join('\n');

                finalMessage += `\n\n**Handlinger:**\n${actionsSummary}`;
            }
        }

        const assistantMessage: ChatMessage = {
            role: "assistant",
            content: finalMessage,
            timestamp: new Date().toISOString(),
        };
        appendHistory(sessionId, assistantMessage);

        const response: AssistantResponse = {
            intent,
            plan,
            execution: {
                ...execution,
                summary: finalMessage,
            },
        };

        res.json({ sessionId, response });
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            throw new AppError(
                "VALIDATION_ERROR",
                "Invalid request payload",
                400,
                err.issues
            );
        }

        if (err instanceof AppError) {
            throw err;
        }

        logger.error({ err }, "Chat handling failed");
        throw new AppError(
            "CHAT_PROCESSING_ERROR",
            "Failed to process chat message",
            500,
            err
        );
    }
}
