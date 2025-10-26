import { z } from 'zod';
// Declare process for environments where @types/node isn't globally included (will be merged if present)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;
// Note: relies on @types/node in the root tsconfig; if absent, add locally.

// Common schema for core service endpoints
const Url = z.string().url();

export const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Flow API (leads & compliance)
  FLOW_API_URL: Url.default('http://localhost:4000'),
  FLOW_API_KEY: z.string().min(10).optional(),

  // Secure Platform (incidents) – future
  SECURE_API_URL: Url.optional(),
  SECURE_API_KEY: z.string().optional(),

  // Inbox AI
  INBOX_API_URL: Url.optional(),
  INBOX_API_KEY: z.string().optional(),

  // Website (marketing -> ingest)
  WEBSITE_TENANT_KEY: z.string().optional(),

  // WebSocket endpoints
  FLOW_WS_URL: Url.optional(),

  // AI Providers
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  GEMINI_TEMPERATURE: z.string().optional(),
  GEMINI_MAX_TOKENS: z.string().optional(),

  // Internal service endpoints/keys
  LEAD_API_URL: Url.optional(),
  LEAD_API_KEY: z.string().optional(),
  CRM_API_URL: Url.optional(),
  CRM_API_KEY: z.string().optional(),
  VOICE_API_URL: Url.optional(),
  VOICE_API_KEY: z.string().optional(),
  AGENTROOMS_API_URL: Url.optional(),
  AGENTROOMS_API_KEY: z.string().optional(),

  // Feature flags
  FEATURE_INCIDENTS: z.string().transform((v: string) => v === 'true').optional(),
  FEATURE_LEADS: z.string().transform((v: string) => v === 'true').optional(),
  FEATURE_INBOX: z.string().transform((v: string) => v === 'true').optional(),

  // Analytics
  PLAUSIBLE_DOMAIN: z.string().optional(),
  PLAUSIBLE_API_HOST: Url.optional(),

  // Mobile specific
  MOBILE_API_BASE: Url.optional(),

  // Platform build / infra (added for centralization)
  PX_API_PORT: z.string().regex(/^\d+$/).optional(),
  PX_AUTO_SEED: z.string().transform((v: string) => v === 'true').optional(),
  // Canonical DB URL (preferred going forward)
  DATABASE_URL: z.string().optional(),
  // Legacy alias still referenced by Prisma schema (will be phased out)
  PX_DATABASE_URL: z.string().optional()
});

export type BaseConfig = z.infer<typeof baseSchema>;

export interface LoadOptions {
  source?: Record<string, string | undefined>;
  required?: (keyof BaseConfig)[];
  mask?: (keyof BaseConfig)[];
  allowProcessEnvFallback?: boolean;
  onError?: (errors: string[]) => void;
}

export function loadConfig(opts: LoadOptions = {}) {
  const { source, required = [], mask = ['FLOW_API_KEY', 'SECURE_API_KEY', 'WEBSITE_TENANT_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'CLAUDE_API_KEY', 'LEAD_API_KEY', 'CRM_API_KEY', 'VOICE_API_KEY', 'AGENTROOMS_API_KEY', 'INBOX_API_KEY'], allowProcessEnvFallback = true, onError } = opts;
  const raw: Record<string, string | undefined> = { ...(allowProcessEnvFallback ? (process as any).env : {}), ...(source || {}) };

  const missing = required.filter(k => !raw[String(k)]);
  if (missing.length) {
  const msg = missing.map(k => `Missing required env: ${String(k)}`).join(', ');
  onError?.(missing.map(m => `Missing required env: ${String(m)}`));
    throw new Error(msg);
  }

  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
  const issues = parsed.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
    onError?.(issues);
    throw new Error('Invalid configuration: ' + issues.join('; '));
  }

  const config = parsed.data as BaseConfig;

  // Bidirectional aliasing so either env var works; prefer DATABASE_URL.
  if (!(config as any).DATABASE_URL && (config as any).PX_DATABASE_URL) {
    (config as any).DATABASE_URL = (config as any).PX_DATABASE_URL;
  } else if (!(config as any).PX_DATABASE_URL && (config as any).DATABASE_URL) {
    (config as any).PX_DATABASE_URL = (config as any).DATABASE_URL;
  }

  const redacted = Object.fromEntries(Object.entries(config).map(([k, v]) => [k, mask.includes(k as keyof BaseConfig) && v ? '***REDACTED***' : v]));
  return { config, redacted };
}

export function requireConfig<K extends (keyof BaseConfig)[]>(...keys: K) {
  const { config } = loadConfig({ required: keys });
  return config;
}

// Utility to export only needed keys for client side (build time pick)
export function clientConfigPick<T extends (keyof BaseConfig)[]>(keys: T) {
  const { config } = loadConfig();
  const subset: Partial<BaseConfig> = {};
  keys.forEach(k => {
    const v = config[k];
    if (v !== undefined) (subset as any)[k] = v;
  });
  return subset as Pick<BaseConfig, T[number]>;
}

// Simple logger to avoid @tekup/shared dependency
const logger = {
  info: (label: string, data: any) => console.log(`[${label}]`, data)
};

// Logging helper
export function logConfig(label = 'config:init') {
  const { redacted } = loadConfig();
  // eslint-disable-next-line no-console
  logger.info(`[${label}]`, redacted);
}
