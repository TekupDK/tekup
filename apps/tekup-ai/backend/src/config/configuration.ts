import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appName: process.env.APP_NAME || 'TekupAI',
  appUrl: process.env.APP_URL || 'http://localhost:3001',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  // Anthropic (Claude)
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel:
      process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-5-sonnet-20241022',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
  },

  // OpenAI (Optional)
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4-turbo-preview',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // MCP
  mcp: {
    configPath:
      process.env.MCP_SERVERS_CONFIG_PATH || './config/mcp-servers.json',
    enableHttp: process.env.MCP_ENABLE_HTTP === 'true',
    enableStdio: process.env.MCP_ENABLE_STDIO === 'true',
    httpTimeout: parseInt(process.env.MCP_HTTP_TIMEOUT || '30000', 10),
    stdioTimeout: parseInt(process.env.MCP_STDIO_TIMEOUT || '30000', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
    ),
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT || '3002', 10),
    path: process.env.WS_PATH || '/ws',
    corsOrigin: process.env.WS_CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
  },

  // Feature Flags
  features: {
    swagger: process.env.ENABLE_SWAGGER === 'true',
    compression: process.env.ENABLE_COMPRESSION === 'true',
    helmet: process.env.ENABLE_HELMET === 'true',
    throttling: process.env.ENABLE_THROTTLING === 'true',
    memorySystem: process.env.ENABLE_MEMORY_SYSTEM === 'true',
    mcpIntegration: process.env.ENABLE_MCP_INTEGRATION === 'true',
  },

  // Memory System
  memory: {
    maxPerUser: parseInt(process.env.MAX_MEMORIES_PER_USER || '50', 10),
    retentionDays: parseInt(process.env.MEMORY_RETENTION_DAYS || '90', 10),
  },

  // Usage Tracking
  usage: {
    trackStats: process.env.TRACK_USAGE_STATS === 'true',
    costPerInputToken:
      parseFloat(process.env.COST_PER_1K_INPUT_TOKENS || '0.003') / 1000,
    costPerOutputToken:
      parseFloat(process.env.COST_PER_1K_OUTPUT_TOKENS || '0.015') / 1000,
  },

  // API Version
  apiVersion: process.env.API_VERSION || '1.0.0',
}));
