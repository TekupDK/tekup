/**
 * Configuration for Billy.dk API integration
 * Validates environment variables and provides typed configuration
 */

import { z } from 'zod';
import { BillyConfig } from './types.js';

// Environment variable schema
// Supports both BILLY_ORG_ID and BILLY_ORGANIZATION_ID for compatibility
const envSchema = z.object({
  BILLY_API_KEY: z.string().min(1, 'BILLY_API_KEY is required'),
  BILLY_ORGANIZATION_ID: z.string().optional(),
  BILLY_ORG_ID: z.string().optional(),
  BILLY_API_BASE: z.string().url('BILLY_API_BASE must be a valid URL').default('https://api.billysbilling.com/v2'),
  BILLY_TEST_MODE: z.string().optional().transform(val => val === 'true'),
  BILLY_DRY_RUN: z.string().optional().transform(val => val === 'true'),
  // Sentry configuration
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('production'),
  SENTRY_TRACES_SAMPLE_RATE: z.string().optional().transform(val => parseFloat(val || '0.1')),
  SENTRY_PROFILES_SAMPLE_RATE: z.string().optional().transform(val => parseFloat(val || '0.1')),
}).refine(
  (data) => data.BILLY_ORGANIZATION_ID || data.BILLY_ORG_ID,
  {
    message: 'Either BILLY_ORGANIZATION_ID or BILLY_ORG_ID is required',
  }
);

/**
 * Validates and returns the Billy configuration from environment variables
 */
export function getBillyConfig(): BillyConfig {
  try {
    const env = envSchema.parse(process.env);

    // Support both BILLY_ORG_ID and BILLY_ORGANIZATION_ID
    const organizationId = env.BILLY_ORGANIZATION_ID || env.BILLY_ORG_ID;

    if (!organizationId) {
      throw new Error('Either BILLY_ORGANIZATION_ID or BILLY_ORG_ID must be set');
    }

    return {
      apiKey: env.BILLY_API_KEY,
      organizationId,
      apiBase: env.BILLY_API_BASE,
      testMode: env.BILLY_TEST_MODE || false,
      dryRun: env.BILLY_DRY_RUN || false,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  API_BASE: 'https://api.billysbilling.com/v2',
  TIMEOUT: 30000, // 30 seconds
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60000, // 1 minute
  },
} as const;

/**
 * Get Sentry configuration from environment
 */
export function getSentryConfig() {
  const env = envSchema.parse(process.env);
  
  return {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    enabled: !!env.SENTRY_DSN,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: env.SENTRY_PROFILES_SAMPLE_RATE,
    release: process.env.npm_package_version || '1.1.0',
  };
}

/**
 * Validates that all required environment variables are present
 */
export function validateEnvironment(): void {
  const hasApiKey = !!process.env.BILLY_API_KEY;
  const hasOrgId = !!(process.env.BILLY_ORGANIZATION_ID || process.env.BILLY_ORG_ID);

  const missingVars: string[] = [];
  if (!hasApiKey) missingVars.push('BILLY_API_KEY');
  if (!hasOrgId) missingVars.push('BILLY_ORGANIZATION_ID or BILLY_ORG_ID');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please copy .env.example to .env and fill in your Billy.dk API credentials.'
    );
  }
}