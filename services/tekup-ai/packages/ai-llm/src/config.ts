/**
 * Configuration for @tekup-ai/llm package
 * Falls back to environment variables
 */

export interface AppConfig {
  llm: {
    LLM_PROVIDER: 'openai' | 'gemini' | 'ollama';
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    GEMINI_KEY?: string;
    GEMINI_MODEL?: string;
    OLLAMA_BASE_URL?: string;
    OLLAMA_MODEL?: string;
  };
}

export const appConfig: AppConfig = {
  llm: {
    LLM_PROVIDER: (process.env.LLM_PROVIDER as any) || 'openai',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o',
    GEMINI_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3.1:8b'
  }
};
