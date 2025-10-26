/**
 * Configuration for Billy MCP Client
 * Validates environment variables following TekUp standards
 * 
 * Pattern: Zod validation (used across all TekUp projects)
 */

import { z } from 'zod';

// Environment variable schema (Billy pattern)
const envSchema = z.object({
  BILLY_MCP_URL: z.string().url().default('https://tekup-billy.onrender.com'),
  BILLY_MCP_API_KEY: z.string().optional(),
  BILLY_MCP_TIMEOUT: z.string().optional().transform(val => parseInt(val || '30000')),
  BILLY_MCP_DRY_RUN: z.string().optional().transform(val => val === 'true'),
});

/**
 * Billy MCP Client configuration interface
 */
export interface BillyConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  dryRun: boolean;
}

/**
 * Get Billy MCP client configuration from environment
 * @returns Validated configuration object
 * @throws Error if required variables are missing or invalid
 */
export function getBillyMCPConfig(): BillyConfig {
  try {
    const env = envSchema.parse(process.env);

    return {
      baseURL: env.BILLY_MCP_URL,
      apiKey: env.BILLY_MCP_API_KEY,
      timeout: env.BILLY_MCP_TIMEOUT,
      dryRun: env.BILLY_MCP_DRY_RUN || false,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Billy MCP config error: ${missing}`);
    }
    throw error;
  }
}

/**
 * Validate that Billy MCP client can be initialized
 */
export function validateBillyMCPConfig(): void {
  const config = getBillyMCPConfig();
  
  if (!config.baseURL) {
    throw new Error('BILLY_MCP_URL is required');
  }

  // Warn if no API key (server may be in development mode)
  if (!config.apiKey) {
    console.warn('[Billy MCP] No API key configured - server must be in development mode');
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  BASE_URL: 'https://tekup-billy.onrender.com',
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
} as const;

