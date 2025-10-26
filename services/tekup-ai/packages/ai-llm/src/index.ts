/**
 * @tekup-ai/llm - Unified LLM Provider Abstraction
 * 
 * Supports OpenAI GPT-4o, Google Gemini 2.0 Flash, and Ollama (local)
 */

// Provider exports
export { OpenAiProvider } from './providers/openAiProvider';
export { GeminiProvider } from './providers/geminiProvider';
export { OllamaProvider } from './providers/ollamaProvider';
export { LLMProvider } from './providers/llmProvider';
export { getLLMProvider, requireLLMProvider } from './providers/providerFactory';

// Prompt templates
export { SYSTEM_PROMPT } from './providers/promptTemplates';

// Types
export type {
  LLMConfig,
  LLMResponse,
  LLMStreamResponse,
  ChatMessage,
  ChatCompletionOptions
} from './types';
