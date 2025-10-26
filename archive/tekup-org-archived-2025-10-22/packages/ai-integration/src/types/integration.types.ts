import { PrismaClient } from '@prisma/client';
import { TekupEventBus } from '@tekup/event-bus';
import { AIServiceCategory, TenantContext } from '@tekup/sso';

// Base configuration for AI service adapters
export interface AIServiceConfig {
  serviceName: string;
  serviceCategory: AIServiceCategory;
  version: string;
  enabled: boolean;
  database: {
    connectionString?: string;
    poolSize?: number;
    timeout?: number;
  };
  cache: {
    enabled: boolean;
    ttl?: number;
    keyPrefix?: string;
  };
  events: {
    enabled: boolean;
    publishEvents: string[];
    subscribeEvents: string[];
  };
  ai: {
    provider: 'openai' | 'gemini' | 'claude' | 'custom';
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
  limits: {
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
    maxTokensPerRequest: number;
  };
}

// Integration status and health
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
  };
}

// Service capabilities
export interface ServiceCapabilities {
  endpoints: string[];
  features: string[];
  supportedFormats: string[];
  maxFileSize?: number;
  batchProcessing: boolean;
  realTimeProcessing: boolean;
  asyncProcessing: boolean;
}

// Integration context for requests
export interface IntegrationContext {
  tenantContext: TenantContext;
  requestId: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Standard API response format
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    tokensUsed?: number;
    cost?: number;
  };
}

// Database operation types
export interface DatabaseOperation {
  operation: 'create' | 'read' | 'update' | 'delete' | 'query';
  table: string;
  data?: any;
  conditions?: any;
  options?: any;
}

// Cache operation types
export interface CacheOperation {
  operation: 'get' | 'set' | 'delete' | 'clear';
  key: string;
  value?: any;
  ttl?: number;
}

// Event operation types
export interface EventOperation {
  operation: 'publish' | 'subscribe' | 'unsubscribe';
  eventType: string;
  data?: any;
  metadata?: any;
}

// AI operation types
export interface AIOperation {
  operation: 'generate' | 'analyze' | 'classify' | 'summarize' | 'translate';
  input: any;
  parameters?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  context?: any;
}

// Service metrics for monitoring
export interface ServiceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: number;
  };
  ai: {
    tokensUsed: number;
    tokensPerRequest: number;
    aiCost: number;
    modelAccuracy?: number;
  };
}

// Migration information for service integration
export interface MigrationInfo {
  serviceName: string;
  currentVersion: string;
  targetVersion: string;
  migrationSteps: MigrationStep[];
  rollbackSteps: MigrationStep[];
  estimatedTime: number;
  dependencies: string[];
}

export interface MigrationStep {
  step: number;
  description: string;
  type: 'database' | 'config' | 'code' | 'data' | 'verification';
  command?: string;
  validation?: string;
  rollback?: string;
}

// Service dependencies
export interface ServiceDependency {
  name: string;
  type: 'database' | 'cache' | 'event-bus' | 'ai-provider' | 'external-api';
  version?: string;
  required: boolean;
  healthCheck: string;
  fallback?: string;
}

// Adapter lifecycle hooks
export interface AdapterHooks {
  beforeStart?: () => Promise<void>;
  afterStart?: () => Promise<void>;
  beforeStop?: () => Promise<void>;
  afterStop?: () => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  onRequest?: (context: IntegrationContext) => Promise<void>;
  onResponse?: (context: IntegrationContext, response: APIResponse) => Promise<void>;
}

// Integration test configuration
export interface IntegrationTestConfig {
  enabled: boolean;
  testSuites: string[];
  mockData: Record<string, any>;
  expectedResponses: Record<string, any>;
  performanceThresholds: {
    maxResponseTime: number;
    minSuccessRate: number;
    maxErrorRate: number;
  };
}

// Common adapter interface
export interface IAIServiceAdapter {
  // Core properties
  readonly config: AIServiceConfig;
  readonly health: ServiceHealth;
  readonly capabilities: ServiceCapabilities;
  readonly metrics: ServiceMetrics;

  // Lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;

  // Health and monitoring
  checkHealth(): Promise<ServiceHealth>;
  getMetrics(): Promise<ServiceMetrics>;
  getCapabilities(): ServiceCapabilities;

  // Core operations
  processRequest(context: IntegrationContext, operation: AIOperation): Promise<APIResponse>;
  validateRequest(context: IntegrationContext, data: any): Promise<boolean>;
  
  // Database operations
  executeDatabase(operation: DatabaseOperation): Promise<any>;
  
  // Cache operations
  executeCache(operation: CacheOperation): Promise<any>;
  
  // Event operations
  executeEvent(operation: EventOperation): Promise<any>;

  // Integration utilities
  migrateData(migrationInfo: MigrationInfo): Promise<void>;
  runTests(testConfig: IntegrationTestConfig): Promise<boolean>;
}

// Factory pattern for creating adapters
export interface AdapterFactory {
  createAdapter(serviceCategory: AIServiceCategory, config: AIServiceConfig): IAIServiceAdapter;
  getAvailableAdapters(): AIServiceCategory[];
  validateConfig(config: AIServiceConfig): boolean;
}

// Registry for managing multiple adapters
export interface AdapterRegistry {
  register(adapter: IAIServiceAdapter): void;
  unregister(serviceCategory: AIServiceCategory): void;
  get(serviceCategory: AIServiceCategory): IAIServiceAdapter | undefined;
  getAll(): IAIServiceAdapter[];
  isHealthy(): boolean;
}

export { PrismaClient, TekupEventBus };

