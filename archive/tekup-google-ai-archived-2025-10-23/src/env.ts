import { z } from "zod";
import { config as loadEnv } from "dotenv";

// Load environment variables
loadEnv();

/**
 * Environment variable schema with Zod validation
 * Ensures all critical config is present and valid before app starts
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),

  // Authentication
  ENABLE_AUTH: z.string().transform(val => val === "true").default("false"),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Google Services
  GOOGLE_CALENDAR_ID: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().email().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_IMPERSONATED_USER: z.string().email().optional(),

  // AI/LLM
  LLM_PROVIDER: z.enum(["openai", "gemini", "ollama", "heuristic"]).default("heuristic"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(800),
  GEMINI_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash-exp"),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.1:8b"),

  // Frontend
  FRONTEND_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Email
  DEFAULT_EMAIL_FROM: z.string().email().optional(),
  ORGANISATION_NAME: z.string().default("Rendetalje.dk"),

  // Operational
  RUN_MODE: z.enum(["live", "dry-run"]).default("dry-run"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Email automation safety flags
  AUTO_RESPONSE_ENABLED: z.string().transform(val => val === "true").default("false"),
  FOLLOW_UP_ENABLED: z.string().transform(val => val === "true").default("false"),
  ESCALATION_ENABLED: z.string().transform(val => val === "true").default("true"),

  // Firecrawl Web Scraping
  FIRECRAWL_API_KEY: z.string().optional(),
});

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = envSchema.parse(process.env);

/**
 * Runtime validation helpers
 */
export function requireEnv(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return String(value);
}

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}

export function isAuthEnabled(): boolean {
  return env.ENABLE_AUTH === true;
}

/**
 * Validate critical production requirements
 * Call this in index.ts before starting the server
 */
export function validateProductionRequirements(): void {
  if (!isProduction()) return;

  const errors: string[] = [];

  // Auth should be enabled in production (warning only for pilot phase)
  if (!isAuthEnabled()) {
    console.warn("⚠️  ENABLE_AUTH is disabled in production - only use for testing/pilot phase!");
    // Uncomment below to enforce auth in production:
    // errors.push("ENABLE_AUTH must be 'true' in production");
  }

  // Database required in production
  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required in production");
  }

  // At least one LLM provider required (unless heuristic mode)
  if (env.LLM_PROVIDER !== "heuristic") {
    if (env.LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY) {
      errors.push("OPENAI_API_KEY is required when LLM_PROVIDER=openai");
    }
    if (env.LLM_PROVIDER === "gemini" && !env.GEMINI_KEY) {
      errors.push("GEMINI_KEY is required when LLM_PROVIDER=gemini");
    }
    if (env.LLM_PROVIDER === "ollama" && !env.OLLAMA_BASE_URL) {
      errors.push("OLLAMA_BASE_URL is required when LLM_PROVIDER=ollama");
    }
  }

  // Google Calendar for booking features
  if (!env.GOOGLE_CALENDAR_ID) {
    console.warn("⚠️  GOOGLE_CALENDAR_ID missing - booking features may not work");
  }

  if (errors.length > 0) {
    console.error("❌ Production validation failed:");
    errors.forEach(err => console.error(`   - ${err}`));
    throw new Error("Production environment validation failed. Check logs above.");
  }

  console.log("✅ Production environment validation passed");
}

// Log current config on import (non-sensitive only)
console.log("🔧 Environment loaded:", {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  ENABLE_AUTH: env.ENABLE_AUTH,
  RUN_MODE: env.RUN_MODE,
  LLM_PROVIDER: env.LLM_PROVIDER,
  HAS_DATABASE: !!env.DATABASE_URL,
  HAS_OPENAI: !!env.OPENAI_API_KEY,
  HAS_GEMINI: !!env.GEMINI_KEY,
  HAS_GOOGLE_CALENDAR: !!env.GOOGLE_CALENDAR_ID,
  HAS_FIRECRAWL: !!env.FIRECRAWL_API_KEY,
});
