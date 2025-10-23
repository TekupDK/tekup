/**
 * RenOS Calendar Intelligence MCP - Configuration
 * Handles all environment variables and business rules
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  MCP_SERVER_NAME: z.string().default('renos-calendar-intelligence'),

  // ==================== PORT CONFIGURATION ====================
  MCP_PORT: z.string().default('3001'),
  DASHBOARD_PORT: z.string().default('3006'),
  CHATBOT_PORT: z.string().default('3005'),
  REDIS_PORT: z.string().default('6379'),
  NGINX_HTTP_PORT: z.string().default('80'),
  NGINX_HTTPS_PORT: z.string().default('443'),

  // Google Calendar (supports both OAuth2 and Service Account)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().optional(), // Service account
  GOOGLE_PRIVATE_KEY: z.string().optional(), // Service account
  GOOGLE_PROJECT_ID: z.string().optional(), // Service account
  GOOGLE_IMPERSONATED_USER: z.string().optional(), // Service account impersonation
  GOOGLE_CALENDAR_ID: z.string().default('primary'),

  // Supabase
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  JONAS_PHONE_NUMBER: z.string().optional(),

  // Billy.dk MCP
  BILLY_MCP_URL: z.string().default('https://tekup-billy.onrender.com'),
  BILLY_MCP_API_KEY: z.string().optional(),
  BILLY_API_KEY: z.string().optional(), // Added for fallback

  // Shortwave
  SHORTWAVE_API_KEY: z.string().optional(),

  // Redis
  REDIS_HOST: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // Security
  MCP_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_SALT: z.string().optional(),

  // Feature Flags
  ENABLE_VOICE_ALERTS: z.string().default('true'),
  ENABLE_AUTO_INVOICE: z.string().default('true'),
  ENABLE_FAIL_SAFE_MODE: z.string().default('true'),
  FAIL_SAFE_CONFIDENCE_THRESHOLD: z.string().default('80'),

  // Business Rules
  TEAM_JONAS_RAWAN_RATE: z.string().default('0'),
  TEAM_FREELANCE_RATE: z.string().default('90'),
  CUSTOMER_RATE: z.string().default('349'),
  WEEKEND_BOOKINGS_ENABLED: z.string().default('false'),
  OVERTIME_ALERT_THRESHOLD_MINUTES: z.string().default('60'),
});

type Env = z.infer<typeof envSchema>;

// Validate and parse environment
function parseEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

const env = parseEnv();

// Export configuration objects
export const config = {
  server: {
    name: env.MCP_SERVER_NAME,
    port: parseInt(env.PORT || env.MCP_PORT),
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
  },

  ports: {
    mcp: parseInt(env.MCP_PORT),
    dashboard: parseInt(env.DASHBOARD_PORT),
    chatbot: parseInt(env.CHATBOT_PORT),
    redis: parseInt(env.REDIS_PORT),
    nginxHttp: parseInt(env.NGINX_HTTP_PORT),
    nginxHttps: parseInt(env.NGINX_HTTPS_PORT),
  },

  google: {
    clientId: env.GOOGLE_CLIENT_EMAIL || env.GOOGLE_CLIENT_ID, // Service account email OR OAuth client ID
    clientSecret: env.GOOGLE_PRIVATE_KEY || env.GOOGLE_CLIENT_SECRET, // Private key OR OAuth secret
    refreshToken: env.GOOGLE_PROJECT_ID || env.GOOGLE_REFRESH_TOKEN, // Project ID OR refresh token
    calendarId: env.GOOGLE_CALENDAR_ID,
    impersonatedUser: env.GOOGLE_IMPERSONATED_USER,
    isConfigured: !!(
      (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY && env.GOOGLE_PROJECT_ID) || // Service account
      (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) // OAuth2
    ),
  },

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_KEY,
    isConfigured: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY),
  },

  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER,
    jonasPhone: env.JONAS_PHONE_NUMBER,
    isConfigured: !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN),
  },

  billy: {
    mcpUrl: env.BILLY_MCP_URL,
    apiKey: env.BILLY_MCP_API_KEY || env.BILLY_API_KEY, // fallback to legacy var
    isConfigured: !!(env.BILLY_MCP_API_KEY || env.BILLY_API_KEY),
  },

  shortwave: {
    apiKey: env.SHORTWAVE_API_KEY,
    isConfigured: !!env.SHORTWAVE_API_KEY,
  },

  redis: {
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379'),
    password: env.REDIS_PASSWORD,
    isConfigured: !!env.REDIS_HOST,
  },

  security: {
    apiKey: env.MCP_API_KEY,
    encryptionKey: env.ENCRYPTION_KEY,
    encryptionSalt: env.ENCRYPTION_SALT,
  },

  features: {
    voiceAlerts: false,
    autoInvoice: env.ENABLE_AUTO_INVOICE === 'true',
    failSafeMode: env.ENABLE_FAIL_SAFE_MODE === 'true',
    failSafeThreshold: parseInt(env.FAIL_SAFE_CONFIDENCE_THRESHOLD),
  },

  business: {
    // Team rates (kr/hour)
    teamJonasRawanRate: parseFloat(env.TEAM_JONAS_RAWAN_RATE),
    teamFreelanceRate: parseFloat(env.TEAM_FREELANCE_RATE),
    customerRate: parseFloat(env.CUSTOMER_RATE),
    
    // Business rules
    weekendBookingsEnabled: env.WEEKEND_BOOKINGS_ENABLED === 'true',
    overtimeAlertThresholdMinutes: parseInt(env.OVERTIME_ALERT_THRESHOLD_MINUTES),

    // Fixed customer patterns (learned from emails)
    fixedSchedules: {
      // These will be populated from database/learning
      // Example: 'Jes Vestergaard': { allowedDays: [1], preferredTime: '08:30' }
    },
  },
};

// Dry-run mode for development
export const isDryRun = !config.google.isConfigured || config.server.isDevelopment;

// Validate critical configuration
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check Google Calendar (required for MVP)
  if (!config.google.isConfigured) {
    errors.push('Google Calendar not configured - set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
  }

  // Check Supabase (required for customer memory)
  if (!config.supabase.isConfigured) {
    errors.push('Supabase not configured - set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  }

  // Twilio disabled for this version (no check)

  // Check Billy MCP (required for auto-invoice)
  if (config.features.autoInvoice && !config.billy.isConfigured) {
    errors.push('Billy MCP not configured but ENABLE_AUTO_INVOICE=true - set BILLY_MCP_API_KEY or disable feature');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default config;


