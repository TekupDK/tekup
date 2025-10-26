import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { LLMCompletionOptions, LLMProvider } from "./llmProvider";

export class OpenAiProvider implements LLMProvider {
    private readonly client: OpenAI;

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is required to use the OpenAI provider");
        }

        this.client = new OpenAI({ apiKey });
    }

    async completeChat(
        messages: ChatCompletionMessageParam[],
        options?: LLMCompletionOptions
    ): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: options?.model ?? "gpt-4o-mini",
            temperature: options?.temperature ?? 0.2,
            max_tokens: options?.maxTokens ?? 800,
            messages,
        });

        const completion = response.choices[0]?.message?.content;
        if (!completion) {
            throw new Error("OpenAI response did not include any content");
        }

        return completion;
    }
}
