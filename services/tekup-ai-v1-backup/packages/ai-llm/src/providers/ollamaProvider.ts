import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LLMCompletionOptions, LLMProvider } from "./llmProvider";
import { logger } from "../logger";

/**
 * Ollama API response format
 */
interface OllamaResponse {
    model: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

/**
 * Ollama provider for local open source LLMs
 * 
 * Supported models (must be pulled first with `ollama pull <model>`):
 * - llama3.1:8b - Meta's Llama 3.1 (8B params) - Best balance of quality/speed
 * - llama3.1:70b - Llama 3.1 (70B params) - Highest quality (requires powerful GPU)
 * - mistral:7b - Mistral 7B - Fast and efficient
 * - gemma2:9b - Google Gemma 2 (9B) - Good for multilingual
 * - qwen2.5:7b - Alibaba Qwen 2.5 - Excellent Danish support
 * - phi3:3.8b - Microsoft Phi-3 - Smallest but powerful
 * 
 * Installation:
 * ```bash
 * # Install Ollama: https://ollama.com/download
 * 
 * # Pull models (first time only)
 * ollama pull llama3.1:8b
 * ollama pull mistral:7b
 * 
 * # Start Ollama service (runs on http://localhost:11434)
 * ollama serve
 * ```
 * 
 * Environment Variables:
 * - OLLAMA_BASE_URL (optional): Default http://localhost:11434
 * - OLLAMA_MODEL (optional): Default llama3.1:8b
 * 
 * Usage:
 * ```typescript
 * const provider = new OllamaProvider();
 * const response = await provider.completeChat([
 *   { role: "system", content: "Du er Friday, en dansk AI assistent." },
 *   { role: "user", content: "Hvad kan du hjælpe med?" }
 * ]);
 * ```
 */
export class OllamaProvider implements LLMProvider {
    private readonly baseUrl: string;
    private readonly defaultModel: string = "llama3.1:8b";

    constructor(baseUrl: string = "http://localhost:11434") {
        this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
        logger.info({ baseUrl: this.baseUrl, defaultModel: this.defaultModel }, "OllamaProvider initialized");
    }

    async completeChat(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): Promise<string> {
        const model = options?.model ?? this.defaultModel;

        logger.debug({ model, messageCount: messages.length }, "Calling Ollama API");

        // Convert messages to Ollama format (same as OpenAI format)
        const ollamaMessages = messages.map((msg) => ({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : "",
        }));

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages: ollamaMessages,
                    stream: false, // For now, no streaming
                    options: {
                        temperature: options?.temperature ?? 0.7,
                        num_predict: options?.maxTokens ?? 800,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error (${response.status}): ${errorText}`);
            }

            const data = (await response.json()) as OllamaResponse;

            if (!data.message?.content) {
                throw new Error("Ollama response did not include any content");
            }

            logger.debug(
                {
                    model: data.model,
                    promptTokens: data.prompt_eval_count,
                    completionTokens: data.eval_count,
                    duration: data.total_duration ? `${(data.total_duration / 1e9).toFixed(2)}s` : undefined,
                },
                "Ollama completion successful"
            );

            return data.message.content;
        } catch (error) {
            logger.error({ error, model, baseUrl: this.baseUrl }, "Ollama API call failed");

            // Provide helpful error messages
            if (error instanceof Error) {
                if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
                    throw new Error(
                        `Kunne ikke forbinde til Ollama på ${this.baseUrl}. ` +
                        `Sørg for at Ollama kører (kør "ollama serve" i terminal).`
                    );
                }
                if (error.message.includes("model") && error.message.includes("not found")) {
                    throw new Error(
                        `Model "${model}" er ikke installeret. ` +
                        `Kør "ollama pull ${model}" for at downloade den.`
                    );
                }
            }

            throw error;
        }
    }

    /**
     * Test connection to Ollama service
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * List available models on local Ollama instance
     */
    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }

            const data = (await response.json()) as { models: Array<{ name: string }> };
            return data.models.map((m) => m.name);
        } catch (error) {
            logger.error({ error }, "Failed to list Ollama models");
            return [];
        }
    }
}
