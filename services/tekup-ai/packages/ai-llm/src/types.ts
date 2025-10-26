/**
 * Shared types for LLM providers
 */

export type LLMProviderType = 'openai' | 'gemini' | 'ollama' | 'heuristic';

export interface LLMConfig {
  provider: LLMProviderType;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string; // For Ollama
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface LLMStreamResponse {
  delta: string;
  done: boolean;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
