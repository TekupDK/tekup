import { z } from 'zod';

// Service types enum
export const ServiceType = z.enum([
  'ai-provider',
  'payment',
  'email',
  'sms',
  'analytics',
  'storage',
  'database',
  'auth',
  'webhook',
  'api'
]);

export type ServiceType = z.infer<typeof ServiceType>;

// Rate limit configuration
export const RateLimitSchema = z.object({
  requestsPerMinute: z.number().min(1).default(60),
  requestsPerHour: z.number().min(1).default(3600),
  requestsPerDay: z.number().min(1).default(86400),
  burstLimit: z.number().min(1).default(10),
  retryAfterSeconds: z.number().min(1).default(60)
});

export type RateLimit = z.infer<typeof RateLimitSchema>;

// Retry policy configuration
export const RetryPolicySchema = z.object({
  maxRetries: z.number().min(0).default(3),
  baseDelayMs: z.number().min(100).default(1000),
  maxDelayMs: z.number().min(1000).default(30000),
  backoffMultiplier: z.number().min(1).default(2),
  retryableStatusCodes: z.array(z.number()).default([429, 500, 502, 503, 504])
});

export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

// Health check configuration
export const HealthCheckSchema = z.object({
  enabled: z.boolean().default(true),
  intervalSeconds: z.number().min(30).default(300), // 5 minutes
  timeoutMs: z.number().min(1000).default(10000), // 10 seconds
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  expectedStatusCodes: z.array(z.number()).default([200, 201, 204]),
  alertThresholds: z.object({
    consecutiveFailures: z.number().min(1).default(3),
    responseTimeMs: z.number().min(1000).default(5000)
  }).default({})
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

// Service status enum
export const ServiceStatus = z.enum([
  'healthy',
  'degraded',
  'down',
  'unknown',
  'maintenance'
]);

export type ServiceStatus = z.infer<typeof ServiceStatus>;

// Service health metrics
export const ServiceHealthSchema = z.object({
  serviceId: z.string(),
  status: ServiceStatus,
  responseTimeMs: z.number().min(0),
  errorRate: z.number().min(0).max(1), // 0-1 percentage
  lastChecked: z.date(),
  consecutiveFailures: z.number().min(0).default(0),
  uptime: z.number().min(0).max(1).default(1), // 0-1 percentage
  issues: z.array(z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    timestamp: z.date()
  })).default([])
});

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

// External service configuration
export const ExternalServiceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: ServiceType,
  provider: z.string().min(1),
  description: z.string().optional(),
  
  // Connection details
  baseUrl: z.string().url(),
  version: z.string().default('v1'),
  
  // Authentication
  apiKey: z.string().min(1),
  apiKeyHeader: z.string().default('Authorization'),
  apiKeyPrefix: z.string().default('Bearer'),
  additionalHeaders: z.record(z.string()).default({}),
  
  // Configuration
  rateLimit: RateLimitSchema.default({}),
  retryPolicy: RetryPolicySchema.default({}),
  healthCheck: HealthCheckSchema.default({}),
  
  // Metadata
  documentation: z.object({
    quickStartUrl: z.string().url().optional(),
    apiDocsUrl: z.string().url().optional(),
    troubleshootingUrl: z.string().url().optional(),
    supportUrl: z.string().url().optional()
  }).default({}),
  
  tags: z.array(z.string()).default([]),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  enabled: z.boolean().default(true),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastRotated: z.date().optional()
});

export type ExternalService = z.infer<typeof ExternalServiceSchema>;

// Service registry configuration
export const ServiceRegistryConfigSchema = z.object({
  services: z.array(ExternalServiceSchema).default([]),
  globalDefaults: z.object({
    rateLimit: RateLimitSchema.partial().default({}),
    retryPolicy: RetryPolicySchema.partial().default({}),
    healthCheck: HealthCheckSchema.partial().default({})
  }).default({}),
  monitoring: z.object({
    enabled: z.boolean().default(true),
    alertWebhookUrl: z.string().url().optional(),
    dashboardEnabled: z.boolean().default(true),
    metricsRetentionDays: z.number().min(1).default(30)
  }).default({})
});

export type ServiceRegistryConfig = z.infer<typeof ServiceRegistryConfigSchema>;

// API key rotation result
export const APIKeyRotationResultSchema = z.object({
  serviceId: z.string(),
  success: z.boolean(),
  oldKeyHash: z.string().optional(),
  newKeyHash: z.string().optional(),
  rotatedAt: z.date(),
  nextRotationDue: z.date().optional(),
  error: z.string().optional()
});

export type APIKeyRotationResult = z.infer<typeof APIKeyRotationResultSchema>;

// Service operation result
export const ServiceOperationResultSchema = z.object({
  success: z.boolean(),
  serviceId: z.string(),
  operation: z.string(),
  timestamp: z.date(),
  duration: z.number().min(0),
  error: z.string().optional(),
  metadata: z.record(z.any()).default({})
});

export type ServiceOperationResult = z.infer<typeof ServiceOperationResultSchema>;