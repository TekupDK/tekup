/**
 * LLM Provider Factory
 * 
 * Central helper for creating LLM providers based on configuration.
 * Used by both Friday AI and Email Auto-Response system.
 * 
 * Features:
 * - Provider instance caching (performance optimization)
 * - Mock provider support (testing)
 * - Graceful error handling
 */

import { appConfig } from "../config";
import { logger } from "../logger";
import { OpenAiProvider } from "./openAiProvider";
import { GeminiProvider } from "./geminiProvider";
import { OllamaProvider } from "./ollamaProvider";
import type { LLMProvider, LLMCompletionOptions } from "./llmProvider";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Provider instance cache
 * Prevents recreating providers on every call (performance optimization)
 */
const providerCache = new Map<string, LLMProvider>();

/**
 * Mock LLM Provider for testing
 * Returns predefined responses without calling external APIs
 */
export class MockLLMProvider implements LLMProvider {
    async completeChat(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): Promise<string> {
        logger.debug({ messageCount: messages.length, options }, "MockLLMProvider: completeChat called");

        // Return contextual mock response based on last message (prompt)
        const lastMessage = messages[messages.length - 1];
        const prompt = lastMessage && 'content' in lastMessage
            ? (typeof lastMessage.content === 'string' ? lastMessage.content : '')
            : '';

        // Extract simple fields from the prompt built by EmailResponseGenerator
        const nameMatch = prompt.match(/-\s*Navn:\s*(.+)/i);
        const emailMatch = prompt.match(/-\s*Email:\s*(.+)/i);
        const sizeMatch = prompt.match(/-\s*Størrelse:\s*(\d+)/i);
        const taskMatch = prompt.match(/-\s*Behov:\s*([^\n]+)/i);
        const typeMatch = prompt.match(/Generer en\s+(tilbud|bekræftelse|follow-up)\s+email/i);

        const name = (nameMatch?.[1] || emailMatch?.[1] || "kunde").trim();
        const sqm = sizeMatch?.[1]?.trim();
        const taskType = (taskMatch?.[1] || "rengøring").trim();
        const responseType = (typeMatch?.[1] || "tilbud").toLowerCase();

        const subject =
            responseType === "tilbud"
                ? `tilbud på ${taskType} - ${name}`
                : responseType === "bekræftelse"
                ? `bekræftelse af din henvendelse - ${name}`
                : `opfølgning på din henvendelse - ${name}`;

        const bodyLines: string[] = [];
        bodyLines.push(`Kære ${name},`);
        bodyLines.push("");
        if (responseType === "tilbud") {
            bodyLines.push("Tak for din henvendelse. Her er et uforpligtende tilbud.");
        } else if (responseType === "bekræftelse") {
            bodyLines.push("Vi har modtaget din henvendelse og vender hurtigst muligt tilbage.");
        } else {
            bodyLines.push("Vi følger op på din henvendelse.");
        }
        if (sqm) {
            bodyLines.push(`Registreret størrelse: ${sqm} m²`);
        }
        bodyLines.push("");
        bodyLines.push("Med venlig hilsen\nRendetalje.dk");

        const body = bodyLines.join("\n");

        // Return using SUBJECT/BODY format so parser extracts fields
        return `SUBJECT: ${subject}\n\nBODY:\n${body}`;
    }

    async *completeChatStream(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): AsyncGenerator<string, void, unknown> {
        logger.debug({ messageCount: messages.length, options }, "MockLLMProvider: completeChatStream called");

        const mockResponse = "Dette er et mock streaming svar fra test provider.";
        for (const char of mockResponse) {
            yield char;
            await new Promise(resolve => setTimeout(resolve, 10)); // Simulate streaming delay
        }
    }
}

/**
 * Clear provider cache (useful for testing or config changes)
 */
export function clearProviderCache(): void {
    providerCache.clear();
    logger.debug("Provider cache cleared");
}

/**
 * Get LLM provider based on LLM_PROVIDER config
 * 
 * @param providerOverride - Optional provider override (default: appConfig.llm.LLM_PROVIDER)
 * @returns LLMProvider instance or null if none available
 */
export function getLLMProvider(providerOverride?: string): LLMProvider | null {
    const llmProvider = providerOverride ?? appConfig.llm.LLM_PROVIDER;

    // Check cache first (performance optimization)
    const cached = providerCache.get(llmProvider);
    if (cached) {
        logger.debug({ llmProvider }, "Using cached LLM provider");
        return cached;
    }

    try {
        let provider: LLMProvider | null = null;

        // OpenAI provider
        if (llmProvider === "openai") {
            if (!appConfig.llm.OPENAI_API_KEY) {
                throw new Error("OPENAI_API_KEY required when LLM_PROVIDER=openai");
            }
            provider = new OpenAiProvider(appConfig.llm.OPENAI_API_KEY);
            logger.info({ model: appConfig.llm.OPENAI_MODEL }, "LLM Provider: OpenAI initialized");
        }

        // Gemini provider
        else if (llmProvider === "gemini") {
            if (!appConfig.llm.GEMINI_KEY) {
                throw new Error("GEMINI_KEY required when LLM_PROVIDER=gemini");
            }
            provider = new GeminiProvider(appConfig.llm.GEMINI_KEY);
            logger.info({ model: appConfig.llm.GEMINI_MODEL }, "LLM Provider: Gemini initialized");
        }

        // Ollama provider (local)
        else if (llmProvider === "ollama") {
            provider = new OllamaProvider(appConfig.llm.OLLAMA_BASE_URL);
            logger.info(
                { model: appConfig.llm.OLLAMA_MODEL, baseUrl: appConfig.llm.OLLAMA_BASE_URL },
                "LLM Provider: Ollama (local) initialized"
            );
        }

        // Mock provider (testing)
        else if (llmProvider === "mock") {
            provider = new MockLLMProvider();
            logger.info("LLM Provider: Mock (testing) initialized");
        }

        // Heuristic mode
        else if (llmProvider === "heuristic") {
            // In unit/integration tests, automatically provide a mock LLM
            // so tests don't require external API keys.
            const isTestEnv = !!(process.env.VITEST || process.env.NODE_ENV === "test");
            if (isTestEnv) {
                provider = new MockLLMProvider();
                logger.info("LLM Provider: Mock (test fallback for heuristic mode) initialized");
            } else {
                logger.info("LLM Provider: None (heuristic mode)");
                return null;
            }
        }

        // Unknown provider
        else {
            logger.warn({ llmProvider }, "Unknown LLM_PROVIDER, returning null");
            return null;
        }

        // Cache the provider instance for future use
        if (provider) {
            providerCache.set(llmProvider, provider);
            logger.debug({ llmProvider }, "Provider cached for future use");
        }

        return provider;

    } catch (error) {
        logger.error({ err: error, llmProvider }, "Failed to initialize LLM provider");
        return null;
    }
}

/**
 * Get LLM provider or throw error if not available
 * 
 * Use this when LLM is required (e.g., Email Auto-Response)
 */
export function requireLLMProvider(providerOverride?: string): LLMProvider {
    const provider = getLLMProvider(providerOverride);

    if (!provider) {
        const llmProvider = providerOverride ?? appConfig.llm.LLM_PROVIDER;
        throw new Error(
            `LLM provider required but not available. ` +
            `Current LLM_PROVIDER: ${llmProvider}. ` +
            `Please configure OPENAI_API_KEY, GEMINI_KEY, or OLLAMA_BASE_URL.`
        );
    }

    return provider;
}
