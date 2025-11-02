import { z } from 'zod';

/**
 * Environment configuration schema
 */
const ConfigSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  
  // GitHub
  GITHUB_TOKEN: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1).optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  
  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // API Security
  // Optional here so non-API services (e.g., worker) don't fail to boot if not set
  API_KEY: z.string().min(1).optional(),

  // CORS
  // Comma-separated whitelist of allowed origins
  ALLOWED_ORIGINS: z.string().optional(),

  // Error Tracking
  SENTRY_DSN: z.string().url().optional()
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * GitHub sync configuration
 * Active Tekup Portfolio repositories (updated 2025-10-18)
 */
export const GITHUB_REPOS: Array<{ owner: string; repo: string }> = [
  // Unified TekupDK Monorepo (All projects migrated to TekupDK organization)
  { owner: 'TekupDK', repo: 'tekup' },          // Tekup Unified Monorepo
];

/**
 * File filtering configuration
 */
export const BINARY_FILE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg',
  'pdf', 'zip', 'tar', 'gz', 'rar', '7z',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'mp3', 'mp4', 'avi', 'mov', 'wmv',
  'exe', 'dll', 'so', 'dylib',
  'bin', 'dat', 'db', 'sqlite'
];

/**
 * OpenAI embedding configuration
 */
export const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  maxTokens: 8000,
  maxCharsBeforeTruncation: 8000
};

/**
 * Sync configuration
 */
export const SYNC_CONFIG = {
  intervalHours: 6,
  batchSize: 10,
  maxRetries: 3,
  retryDelayMs: 1000
};
