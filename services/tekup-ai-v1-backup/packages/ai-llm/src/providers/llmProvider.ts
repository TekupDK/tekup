import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Function declaration for Gemini Function Calling
 * Google AI Agent best practice: Use native function calling for 99%+ accuracy
 */
export interface FunctionDeclaration {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, {
            type: string;
            description?: string;
            enum?: string[];
        }>;
        required?: string[];
    };
}

export interface LLMCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    // Google AI Agent best practices
    cachedSystemPrompt?: string; // Context caching - sparer 50-80% tokens
    responseSchema?: {
        type: "object";
        properties: Record<string, { type: string }>;
        required?: string[];
    }; // JSON mode - type-safe output
    functions?: FunctionDeclaration[]; // Function calling - 99%+ accuracy
}

export interface FunctionCall {
    name: string;
    args: Record<string, unknown>;
}

export interface LLMProvider {
    completeChat(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): Promise<string>;

    // Streaming support for real-time responses
    completeChatStream?(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): AsyncGenerator<string, void, unknown>;

    // Function calling support for type-safe structured output
    completeChatWithFunctions?<T = Record<string, unknown>>(
        messages: ChatCompletionMessageParam[],
        functions: FunctionDeclaration[],
        options?: LLMCompletionOptions
    ): Promise<FunctionCall & { parsedArgs: T }>;
}
