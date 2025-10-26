import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { nanoid } from "nanoid";
import { IntentClassifier } from "../agents/intentClassifier";
import { appConfig } from "../config";
import { logger } from "../logger";
import { appendHistory, getHistory } from "../services/memoryStore";
import { AppError } from "../errors";
import type { ChatMessage } from "../types";
import { OpenAiProvider } from "../llm/openAiProvider";
import { FridayAI } from "../ai/friday";
import { FRIDAY_SYSTEM_PROMPT } from "../ai/friday";

const ChatStreamRequestSchema = z.object({
    message: z.string().min(1, "message is required"),
    sessionId: z.string().optional(),
    userId: z.string().optional(),
    channel: z.enum(["mobile", "tablet", "desktop", "web"]).optional(),
    locale: z.string().optional(),
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

// Initialize classifier and Friday AI
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

const fridayAI = (() => {
    try {
        if (!appConfig.llm.OPENAI_API_KEY) {
            return new FridayAI();
        }

        const provider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);
        return new FridayAI(provider);
    } catch (error) {
        logger.warn({ err: error }, "Friday AI falling back to heuristic mode");
        return new FridayAI();
    }
})();

/**
 * Handle chat with streaming response using Server-Sent Events (SSE)
 */
export async function handleChatStream(
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const parsed = ChatStreamRequestSchema.parse(req.body);
        const sessionId = parsed.sessionId ?? nanoid(12);
        const history = (parsed.history ?? getHistory(sessionId)) as ChatMessage[];

        // Set up SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

        // Send session ID immediately
        res.write(`data: ${JSON.stringify({ type: "session", sessionId })}\n\n`);

        const userMessage: ChatMessage = {
            role: "user",
            content: parsed.message,
            timestamp: new Date().toISOString(),
        };
        appendHistory(sessionId, userMessage);

        // Classify intent and send it
        const intent = await classifier.classify(parsed.message, history);
        res.write(
            `data: ${JSON.stringify({
                type: "intent",
                intent: intent.intent,
                confidence: intent.confidence,
            })}\n\n`
        );

        // Check if LLM is available for streaming
        if (!appConfig.llm.OPENAI_API_KEY) {
            // No streaming available - send complete response
            const response = await fridayAI.respond({
                intent: intent.intent,
                confidence: intent.confidence,
                userMessage: parsed.message,
                history,
            });

            res.write(
                `data: ${JSON.stringify({
                    type: "content",
                    content: response.message,
                })}\n\n`
            );

            if (response.suggestions) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "suggestions",
                        suggestions: response.suggestions,
                    })}\n\n`
                );
            }

            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
            return;
        }

        // Stream response using OpenAI streaming
        const provider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);

        // Build enriched context
        const enrichedPrompt = FRIDAY_SYSTEM_PROMPT;

        // Add conversation history - use proper types
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: enrichedPrompt }
        ];

        const recentHistory = history.slice(-10);
        for (const msg of recentHistory) {
            if (msg.role === "user" || msg.role === "assistant") {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        messages.push({
            role: "user",
            content: parsed.message,
        });

        // Stream the response
        let fullResponse = "";

        try {
            // For now, use non-streaming and send in chunks
            // TODO: Implement proper streaming with OpenAI SDK
            const completion = await provider.completeChat(messages, {
                temperature: 0.7,
                maxTokens: 800,
            });

            // Simulate streaming by sending in chunks - improved chunking
            const sentences = completion.split(/(?<=[.!?])\s+/);
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i] + (i < sentences.length - 1 ? " " : "");
                fullResponse += sentence;

                res.write(
                    `data: ${JSON.stringify({
                        content: sentence,
                    })}\n\n`
                );

                // Realistic delay between sentences
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            }

            // Save to history
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: fullResponse,
                timestamp: new Date().toISOString(),
            };
            appendHistory(sessionId, assistantMessage);

            // Send suggestions
            const suggestions = generateSuggestions(intent.intent);
            if (suggestions.length > 0) {
                res.write(
                    `data: ${JSON.stringify({
                        type: "suggestions",
                        suggestions,
                    })}\n\n`
                );
            }

            // Send done signal
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        } catch (error) {
            logger.error({ error }, "Streaming error");
            res.write(
                `data: ${JSON.stringify({
                    type: "error",
                    error: "Der opstod en fejl. Prøv venligst igen.",
                })}\n\n`
            );
        }

        res.end();
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

        logger.error({ err }, "Unexpected error in chat stream handler");
        throw new AppError("INTERNAL_ERROR", "Internal server error", 500);
    }
}

/**
 * Generate suggestions based on intent
 */
function generateSuggestions(intent?: string): string[] {
    if (intent?.includes("lead") || intent?.includes("email")) {
        return ["Email til lead", "Se alle leads", "Vis statistik"];
    }

    if (intent?.includes("calendar") || intent?.includes("booking")) {
        return ["Find ledig tid", "Vis kommende bookinger", "Book møde"];
    }

    if (intent?.includes("help")) {
        return ["Vis leads", "Kalender hjælp", "Email hjælp"];
    }

    return ["Vis seneste leads", "Find ledig tid", "Hjælp"];
}
