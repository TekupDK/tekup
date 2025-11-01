/**
 * Google MCP Server Configuration
 * Manages Google Workspace credentials and settings
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Google Service Account Credentials
  GOOGLE_CLIENT_EMAIL: z.string().email().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().optional(),
  GOOGLE_CREDENTIALS: z.string().optional(), // JSON string with full credentials
  
  // User to impersonate (for domain-wide delegation)
  GOOGLE_IMPERSONATED_USER: z.string().email().default('info@rendetalje.dk'),
  
  // Calendar settings
  GOOGLE_CALENDAR_ID: z.string().default('primary'),
  
  // Server settings
  PORT: z.string().transform(val => parseInt(val || '3001')).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Security
  API_KEY: z.string().optional(),
  
  // Dry run mode (for testing without actual API calls)
  DRY_RUN: z.string().transform(val => val === 'true').default('false'),
});

export type GoogleMcpConfig = {
  google: {
    clientEmail?: string;
    privateKey?: string;
    projectId?: string;
    credentials?: any;
    impersonatedUser: string;
    calendarId: string;
    isConfigured: boolean;
  };
  server: {
    port: number;
    environment: 'development' | 'production' | 'test';
    apiKey?: string;
  };
  dryRun: boolean;
};

/**
 * Parse and validate configuration from environment
 */
export function getGoogleMcpConfig(): GoogleMcpConfig {
  try {
    const env = envSchema.parse(process.env);
    
    // Parse credentials JSON if provided
    let credentials: any = undefined;
    if (env.GOOGLE_CREDENTIALS) {
      try {
        credentials = JSON.parse(env.GOOGLE_CREDENTIALS);
      } catch (error) {
        console.warn('Failed to parse GOOGLE_CREDENTIALS JSON');
      }
    }
    
    // Determine if Google is properly configured
    const isConfigured = !!(
      credentials ||
      (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY)
    );
    
    return {
      google: {
        clientEmail: credentials?.client_email || env.GOOGLE_CLIENT_EMAIL,
        privateKey: credentials?.private_key || env.GOOGLE_PRIVATE_KEY,
        projectId: credentials?.project_id || env.GOOGLE_PROJECT_ID,
        credentials,
        impersonatedUser: env.GOOGLE_IMPERSONATED_USER,
        calendarId: env.GOOGLE_CALENDAR_ID,
        isConfigured,
      },
      server: {
        port: env.PORT,
        environment: env.NODE_ENV,
        apiKey: env.API_KEY,
      },
      dryRun: env.DRY_RUN,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Google MCP config error: ${missing}`);
    }
    throw error;
  }
}

/**
 * Validate that Google MCP can be initialized
 */
export function validateGoogleMcpConfig(): void {
  const config = getGoogleMcpConfig();
  
  if (!config.google.isConfigured) {
    console.warn('⚠️  Google credentials not configured - running in dry-run mode');
    console.warn('   Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables');
  }
  
  if (!config.server.apiKey && config.server.environment === 'production') {
    console.warn('⚠️  No API key configured for production environment');
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  SCOPES: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  TIMEOUT: 30000, // 30 seconds
} as const;
