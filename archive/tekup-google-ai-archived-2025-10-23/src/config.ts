import { config as loadEnv } from "dotenv";
import { z } from "zod";
import type { ZodIssue } from "zod";

// Load .env file FIRST - before checking NODE_ENV
// This ensures environment variables are available for all subsequent checks
loadEnv();

// In production (Render), environment variables are set directly and will override .env values
// This is safe because process.env takes precedence over .env file

// Server Configuration
const ServerConfigSchema = z.object({
    PORT: z
        .preprocess((value: unknown) => {
            if (typeof value === "string" && value.trim().length > 0) {
                return Number.parseInt(value, 10);
            }
            if (typeof value === "number") {
                return value;
            }
            return undefined;
        }, z.number().int().min(0).max(65535))
        .default(3000),
    LOG_LEVEL: z.string().default("info"),
});

// AI & LLM Configuration
const LLMConfigSchema = z.object({
    LLM_PROVIDER: z.enum(["openai", "gemini", "ollama", "heuristic"]).default("heuristic"),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
    OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(800),
    GEMINI_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default("gemini-2.0-flash-exp"),
    OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
    OLLAMA_MODEL: z.string().default("llama3.1:8b"),
});

// Google Services Configuration
const GoogleConfigSchema = z.object({
    GOOGLE_PROJECT_ID: z.string().optional(),
    GOOGLE_CLIENT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    GOOGLE_IMPERSONATED_USER: z.string().email().optional(),
    GOOGLE_CALENDAR_ID: z.string().optional(),
    DEFAULT_EMAIL_FROM: z.string().email().optional(),
    ORGANISATION_NAME: z.string().default("Rendetalje.dk"),
    RUN_MODE: z.enum(["live", "dry-run"]).default("dry-run"), // Default to dry-run for safety
});

// Email Automation Safety Flags
const EmailAutomationSchema = z.object({
    AUTO_RESPONSE_ENABLED: z
        .preprocess((val) => val === "true", z.boolean())
        .default(false), // Default OFF for safety
    FOLLOW_UP_ENABLED: z
        .preprocess((val) => val === "true", z.boolean())
        .default(false), // Default OFF for safety
    ESCALATION_ENABLED: z
        .preprocess((val) => val === "true", z.boolean())
        .default(true), // Default ON - escalation is safe
});

// Billy.dk Integration Configuration
const BillyConfigSchema = z.object({
    BILLY_API_KEY: z.string().optional(),
    BILLY_ORGANIZATION_ID: z.string().optional(),
    BILLY_ENABLED: z
        .preprocess((val) => val === "true", z.boolean())
        .default(false),
});

// Gmail OAuth Configuration (for future use)
const GmailOAuthConfigSchema = z.object({
    GMAIL_CLIENT_ID: z.string().optional(),
    GMAIL_CLIENT_SECRET: z.string().optional(),
    GMAIL_REDIRECT_URI: z.string().optional(),
    GMAIL_PROJECT_ID: z.string().optional(),
    GMAIL_USER_EMAIL: z.string().email().optional(),
});

// Database Configuration
const DatabaseConfigSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"), // Changed from .url() to .min(1) for debugging
    DB_LOG_LEVEL: z.string().default("warn"),
});

// Test Configuration
const TestConfigSchema = z.object({
    SMOKETEST_EMAIL_TO: z.string().email().optional(),
    SMOKETEST_CALENDAR_ID: z.string().optional(),
    SMOKETEST_TIMEZONE: z.string().default("Europe/Copenhagen"),
});

// Combined Configuration Schema
const EnvSchema = z.object({
    server: ServerConfigSchema,
    llm: LLMConfigSchema,
    google: GoogleConfigSchema,
    gmailOAuth: GmailOAuthConfigSchema,
    database: DatabaseConfigSchema,
    test: TestConfigSchema,
    emailAutomation: EmailAutomationSchema,
    billy: BillyConfigSchema,
});

type ServerConfig = z.infer<typeof ServerConfigSchema>;
type LLMConfig = z.infer<typeof LLMConfigSchema>;
type GoogleConfig = z.infer<typeof GoogleConfigSchema>;
type GmailOAuthConfig = z.infer<typeof GmailOAuthConfigSchema>;
type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
type TestConfig = z.infer<typeof TestConfigSchema>;
type EmailAutomationConfig = z.infer<typeof EmailAutomationSchema>;
type BillyConfig = z.infer<typeof BillyConfigSchema>;
type AppConfig = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse({
    server: {
        PORT: process.env.PORT,
        LOG_LEVEL: process.env.LOG_LEVEL,
    },
    llm: {
        LLM_PROVIDER: process.env.LLM_PROVIDER,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_MODEL: process.env.OPENAI_MODEL,
        OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE,
        OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS,
        GEMINI_KEY: process.env.GEMINI_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL,
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
        OLLAMA_MODEL: process.env.OLLAMA_MODEL,
    },
    google: {
        GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
        GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
        GOOGLE_IMPERSONATED_USER: process.env.GOOGLE_IMPERSONATED_USER,
        GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
        DEFAULT_EMAIL_FROM: process.env.DEFAULT_EMAIL_FROM,
        ORGANISATION_NAME: process.env.ORGANISATION_NAME,
        RUN_MODE: process.env.RUN_MODE,
    },
    gmailOAuth: {
        GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI,
        GMAIL_PROJECT_ID: process.env.GMAIL_PROJECT_ID,
        GMAIL_USER_EMAIL: process.env.GMAIL_USER_EMAIL,
    },
    database: {
        DATABASE_URL: process.env.DATABASE_URL,
        DB_LOG_LEVEL: process.env.DB_LOG_LEVEL,
    },
    test: {
        SMOKETEST_EMAIL_TO: process.env.SMOKETEST_EMAIL_TO,
        SMOKETEST_CALENDAR_ID: process.env.SMOKETEST_CALENDAR_ID,
        SMOKETEST_TIMEZONE: process.env.SMOKETEST_TIMEZONE,
    },
    emailAutomation: {
        AUTO_RESPONSE_ENABLED: process.env.AUTO_RESPONSE_ENABLED,
        FOLLOW_UP_ENABLED: process.env.FOLLOW_UP_ENABLED,
        ESCALATION_ENABLED: process.env.ESCALATION_ENABLED,
    },
    billy: {
        BILLY_API_KEY: process.env.BILLY_API_KEY,
        BILLY_ORGANIZATION_ID: process.env.BILLY_ORGANIZATION_ID,
        BILLY_ENABLED: process.env.BILLY_ENABLED,
    },
});

if (!parsed.success) {
    const message = parsed.error.issues
        .map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
    throw new Error(`Invalid environment configuration: ${message}`);
}

export const appConfig = parsed.data;

// Backward compatibility exports
export const isLiveMode = appConfig.google.RUN_MODE === "live";

// Email automation safety helpers
export const isAutoResponseEnabled = () => appConfig.emailAutomation.AUTO_RESPONSE_ENABLED;
export const isFollowUpEnabled = () => appConfig.emailAutomation.FOLLOW_UP_ENABLED;
export const isEscalationEnabled = () => appConfig.emailAutomation.ESCALATION_ENABLED;

// Individual config sections for easier access
export const serverConfig = appConfig.server;
export const llmConfig = appConfig.llm;
export const googleConfig = appConfig.google;
export const gmailOAuthConfig = appConfig.gmailOAuth;
export const databaseConfig = appConfig.database;
export const testConfig = appConfig.test;
export const emailAutomationConfig = appConfig.emailAutomation;
export const billyConfig = appConfig.billy;

// Billy.dk helper
export const isBillyEnabled = () => appConfig.billy.BILLY_ENABLED;

// Type exports for use in other modules
export type { ServerConfig, LLMConfig, GoogleConfig, GmailOAuthConfig, DatabaseConfig, TestConfig, EmailAutomationConfig, BillyConfig, AppConfig };
