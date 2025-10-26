/**
 * Environment Configuration for RestaurantIQ Backend
 * Validates and provides typed environment variables
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Environment validation schema
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  APP_NAME: z.string().default('RestaurantIQ'),
  APP_VERSION: z.string().default('1.0.0'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_TEST_URL: z.string().url().optional(),
  DB_POOL_MIN: z.string().transform(Number).pipe(z.number().int().nonnegative()).default(2),
  DB_POOL_MAX: z.string().transform(Number).pipe(z.number().int().positive()).default(20),
  DB_POOL_ACQUIRE_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default(60000),
  DB_POOL_IDLE_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default(10000),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().int().nonnegative()).default(0),
  REDIS_SESSION_DB: z.string().transform(Number).pipe(z.number().int().nonnegative()).default(1),
  REDIS_CACHE_DB: z.string().transform(Number).pipe(z.number().int().nonnegative()).default(2),

  // Authentication & Security
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  JWT_ISSUER: z.string().default('restaurantiq'),
  JWT_AUDIENCE: z.string().default('restaurantiq-users'),

  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().int().min(10).max(15)).default(12),

  SESSION_SECRET: z.string().min(32),
  SESSION_MAX_AGE: z.string().transform(Number).pipe(z.number().int().positive()).default(86400000),
  SESSION_SECURE: z.string().transform(val => val === 'true').default('false'),
  SESSION_HTTP_ONLY: z.string().transform(val => val === 'true').default('true'),
  SESSION_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),

  // CORS & Security
  CORS_ORIGINS: z.string().transform(val => val.split(',')).default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),

  HELMET_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default(900000),
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().int().positive()).default(100),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  LOG_FORMAT: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('combined'),
  LOG_FILE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
  LOG_FILE_MAX_SIZE: z.string().default('10m'),
  LOG_FILE_MAX_FILES: z.string().transform(Number).pipe(z.number().int().positive()).default(5),

  LOG_QUERIES: z.string().transform(val => val === 'true').default('true'),
  LOG_SLOW_QUERIES: z.string().transform(val => val === 'true').default('true'),
  SLOW_QUERY_THRESHOLD: z.string().transform(Number).pipe(z.number().int().positive()).default(1000),

  // Danish Localization
  DEFAULT_LOCALE: z.literal('da-DK').default('da-DK'),
  DEFAULT_TIMEZONE: z.literal('Europe/Copenhagen').default('Europe/Copenhagen'),
  DEFAULT_CURRENCY: z.literal('DKK').default('DKK'),
  DATE_FORMAT: z.string().default('DD/MM/YYYY'),
  TIME_FORMAT: z.string().default('HH:mm'),

  // External Services (optional for development)
  OPENAI_API_KEY: z.string().optional(),
  WEATHER_API_KEY: z.string().optional(),
  WEATHER_API_URL: z.string().url().optional(),

  // Email (optional for development)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // File Upload
  UPLOAD_MAX_SIZE: z.string().transform(Number).pipe(z.number().int().positive()).default(10485760),
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf,text/csv'),
  UPLOAD_DEST: z.string().default('uploads'),
  UPLOAD_TEMP_DEST: z.string().default('tmp'),

  // Health Checks
  HEALTH_CHECK_ENABLED: z.string().transform(val => val === 'true').default('true'),
  HEALTH_CHECK_DB_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default(5000),
  HEALTH_CHECK_REDIS_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default(2000),

  // Development
  HOT_RELOAD: z.string().transform(val => val === 'true').default('true'),
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('true'),

  // Testing
  TEST_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default(30000),
  MOCK_POS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  MOCK_PAYMENT_ENABLED: z.string().transform(val => val === 'true').default('false'),
  MOCK_AI_ENABLED: z.string().transform(val => val === 'true').default('false'),

  // Cache
  CACHE_TTL_DEFAULT: z.string().transform(Number).pipe(z.number().int().positive()).default(300),
  CACHE_TTL_LONG: z.string().transform(Number).pipe(z.number().int().positive()).default(3600),
  CACHE_TTL_SHORT: z.string().transform(Number).pipe(z.number().int().positive()).default(60),
  CACHE_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RATE_LIMIT_REQUESTS_PER_WINDOW: z.string().transform(Number).pipe(z.number().int().positive()).default(100),
  RATE_LIMIT_WINDOW_SIZE_MINUTES: z.string().transform(Number).pipe(z.number().int().positive()).default(15),

  // WebSocket
  WS_ENABLED: z.string().transform(val => val === 'true').default('true'),
  WS_PORT: z.string().transform(Number).pipe(z.number().int().positive()).default(4001),
  WS_CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Export typed environment configuration
export const config = {
  // Application
  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    env: env.NODE_ENV,
    port: env.PORT,
    apiVersion: env.API_VERSION,
  },

  // Database
  database: {
    url: env.DATABASE_URL,
    testUrl: env.DATABASE_TEST_URL,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      acquireTimeoutMillis: env.DB_POOL_ACQUIRE_TIMEOUT,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT,
    },
    logging: {
      queries: env.LOG_QUERIES,
      slowQueries: env.LOG_SLOW_QUERIES,
      slowQueryThreshold: env.SLOW_QUERY_THRESHOLD,
    },
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    databases: {
      default: env.REDIS_DB,
      sessions: env.REDIS_SESSION_DB,
      cache: env.REDIS_CACHE_DB,
    },
  },

  // Authentication
  auth: {
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      expiration: env.JWT_EXPIRATION,
      refreshExpiration: env.JWT_REFRESH_EXPIRATION,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    bcrypt: {
      rounds: env.BCRYPT_ROUNDS,
    },
    session: {
      secret: env.SESSION_SECRET,
      maxAge: env.SESSION_MAX_AGE,
      secure: env.SESSION_SECURE,
      httpOnly: env.SESSION_HTTP_ONLY,
      sameSite: env.SESSION_SAME_SITE,
    },
  },

  // Security
  security: {
    cors: {
      origins: env.CORS_ORIGINS,
      credentials: env.CORS_CREDENTIALS,
    },
    helmet: {
      enabled: env.HELMET_ENABLED,
    },
    rateLimit: {
      enabled: env.RATE_LIMIT_ENABLED,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      requestsPerWindow: env.RATE_LIMIT_REQUESTS_PER_WINDOW,
      windowSizeMinutes: env.RATE_LIMIT_WINDOW_SIZE_MINUTES,
    },
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    file: {
      enabled: env.LOG_FILE_ENABLED,
      path: env.LOG_FILE_PATH,
      maxSize: env.LOG_FILE_MAX_SIZE,
      maxFiles: env.LOG_FILE_MAX_FILES,
    },
  },

  // Localization
  localization: {
    locale: env.DEFAULT_LOCALE,
    timezone: env.DEFAULT_TIMEZONE,
    currency: env.DEFAULT_CURRENCY,
    dateFormat: env.DATE_FORMAT,
    timeFormat: env.TIME_FORMAT,
  },

  // External Services
  external: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    weather: {
      apiKey: env.WEATHER_API_KEY,
      apiUrl: env.WEATHER_API_URL,
    },
    email: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASS,
      from: env.EMAIL_FROM,
    },
  },

  // File Upload
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(','),
    destination: env.UPLOAD_DEST,
    tempDestination: env.UPLOAD_TEMP_DEST,
  },

  // Health Checks
  health: {
    enabled: env.HEALTH_CHECK_ENABLED,
    dbTimeout: env.HEALTH_CHECK_DB_TIMEOUT,
    redisTimeout: env.HEALTH_CHECK_REDIS_TIMEOUT,
  },

  // Development
  development: {
    hotReload: env.HOT_RELOAD,
    enableSwagger: env.ENABLE_SWAGGER,
    mocking: {
      pos: env.MOCK_POS_ENABLED,
      payment: env.MOCK_PAYMENT_ENABLED,
      ai: env.MOCK_AI_ENABLED,
    },
  },

  // Testing
  testing: {
    timeout: env.TEST_TIMEOUT,
  },

  // Cache
  cache: {
    enabled: env.CACHE_ENABLED,
    ttl: {
      default: env.CACHE_TTL_DEFAULT,
      long: env.CACHE_TTL_LONG,
      short: env.CACHE_TTL_SHORT,
    },
  },

  // WebSocket
  websocket: {
    enabled: env.WS_ENABLED,
    port: env.WS_PORT,
    corsOrigins: env.WS_CORS_ORIGINS.split(','),
  },

  // Feature flags
  features: {
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },
} as const;

// Export individual configurations for convenience
export const {
  app,
  database,
  redis,
  auth,
  security,
  logging,
  localization,
  external,
  upload,
  health,
  development,
  testing,
  cache,
  websocket,
  features,
} = config;

export default config;
