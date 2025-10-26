import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Export SecretsLoader
export { SecretsLoader } from './secrets-loader';

// Load environment variables
loadEnv();

/**
 * Environment validation schema
 */
const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // LLM Provider
  LLM_PROVIDER: z.enum(['openai', 'gemini', 'ollama', 'heuristic']).default('heuristic'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-exp'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3.1:8b'),
  
  // Database
  DATABASE_URL: z.string(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Cache
  CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  REDIS_URL: z.string().optional(),
  
  // Google Workspace
  GOOGLE_PROJECT_ID: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_IMPERSONATED_USER: z.string().optional(),
  GOOGLE_CALENDAR_ID: z.string().optional(),
  
  // GitHub (TekupVault)
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  
  // External Services
  BILLY_ENABLED: z.string().transform(val => val === 'true').default('false'),
  BILLY_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  FIRECRAWL_API_KEY: z.string().optional(),
});

/**
 * Validated environment variables
 */
export const env = envSchema.parse(process.env);

/**
 * Type-safe config object
 */
export const config = {
  // Core
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  logLevel: env.LOG_LEVEL,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  
  // LLM
  llm: {
    provider: env.LLM_PROVIDER,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
    },
    gemini: {
      apiKey: env.GEMINI_KEY,
      model: env.GEMINI_MODEL,
    },
    ollama: {
      baseUrl: env.OLLAMA_BASE_URL,
      model: env.OLLAMA_MODEL,
    },
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceKey: env.SUPABASE_SERVICE_KEY,
    },
  },
  
  // Cache
  cache: {
    provider: env.CACHE_PROVIDER,
    redis: {
      enabled: env.REDIS_ENABLED,
      url: env.REDIS_URL,
    },
  },
  
  // Google
  google: {
    projectId: env.GOOGLE_PROJECT_ID,
    clientEmail: env.GOOGLE_CLIENT_EMAIL,
    privateKey: env.GOOGLE_PRIVATE_KEY,
    impersonatedUser: env.GOOGLE_IMPERSONATED_USER,
    calendarId: env.GOOGLE_CALENDAR_ID,
  },
  
  // External
  github: {
    token: env.GITHUB_TOKEN,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET,
  },
  billy: {
    enabled: env.BILLY_ENABLED,
    apiKey: env.BILLY_API_KEY,
  },
} as const;

export type Config = typeof config;
