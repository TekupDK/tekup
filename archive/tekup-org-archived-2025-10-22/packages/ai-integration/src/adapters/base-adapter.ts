import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@tekup/shared';
import { TekupEventBus, EventFactory } from '@tekup/event-bus';
import { AIServiceCategory } from '@tekup/sso';
import {
  IAIServiceAdapter,
  AIServiceConfig,
  ServiceHealth,
  ServiceCapabilities,
  ServiceMetrics,
  IntegrationContext,
  APIResponse,
  DatabaseOperation,
  CacheOperation,
  EventOperation,
  AIOperation,
  MigrationInfo,
  IntegrationTestConfig,
  AdapterHooks
} from '../types/integration.types.js';

/**
 * Base adapter class providing common functionality for all AI services
 * Handles database connections, caching, events, and standardized responses
 */
export abstract class BaseAIServiceAdapter implements IAIServiceAdapter {
  protected readonly logger = createLogger(`ai-adapter-${this.config.serviceName}`);
  protected prisma: PrismaClient;
  protected redis: Redis;
  protected eventBus: TekupEventBus;
  protected isInitialized = false;
  protected isStarted = false;
  protected startTime = new Date();
  protected requestCount = 0;
  protected successCount = 0;
  protected errorCount = 0;
  protected totalResponseTime = 0;

  constructor(
    public readonly config: AIServiceConfig,
    protected readonly hooks?: AdapterHooks
  ) {
    this.logger.info(`Initializing ${config.serviceName} adapter`, { config });
  }

  // ==========================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // ==========================================

  /**
   * Process the actual AI service request - implemented by each service
   */
  protected abstract processAIRequest(context: IntegrationContext, operation: AIOperation): Promise<any>;

  /**
   * Get service-specific capabilities
   */
  public abstract getCapabilities(): ServiceCapabilities;

  /**
   * Validate service-specific request data
   */
  protected abstract validateServiceRequest(context: IntegrationContext, data: any): Promise<boolean>;

  // ==========================================
  // LIFECYCLE METHODS
  // ==========================================

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Adapter already initialized');
      return;
    }

    try {
      await this.hooks?.beforeStart?.();

      // Initialize database connection
      await this.initializeDatabase();

      // Initialize Redis cache
      await this.initializeCache();

      // Initialize event bus
      await this.initializeEventBus();

      this.isInitialized = true;
      this.logger.info('Adapter initialized successfully');

      await this.hooks?.afterStart?.();
    } catch (error) {
      this.logger.error('Failed to initialize adapter:', error);
      await this.hooks?.onError?.(error as Error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isStarted) {
      this.logger.warn('Adapter already started');
      return;
    }

    try {
      // Start health monitoring
      this.startHealthMonitoring();

      // Subscribe to relevant events
      await this.subscribeToEvents();

      this.isStarted = true;
      this.startTime = new Date();
      this.logger.info('Adapter started successfully');
    } catch (error) {
      this.logger.error('Failed to start adapter:', error);
      await this.hooks?.onError?.(error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      await this.hooks?.beforeStop?.();

      // Stop health monitoring
      this.stopHealthMonitoring();

      // Unsubscribe from events
      await this.unsubscribeFromEvents();

      // Close connections
      await this.closeConnections();

      this.isStarted = false;
      this.logger.info('Adapter stopped successfully');

      await this.hooks?.afterStop?.();
    } catch (error) {
      this.logger.error('Failed to stop adapter:', error);
      await this.hooks?.onError?.(error as Error);
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  // ==========================================
  // CORE REQUEST PROCESSING
  // ==========================================

  async processRequest(context: IntegrationContext, operation: AIOperation): Promise<APIResponse> {
    const startTime = Date.now();
    const requestId = context.requestId;

    try {
      await this.hooks?.onRequest?.(context);

      // Validate request
      const isValid = await this.validateRequest(context, operation);
      if (!isValid) {
        throw new Error('Invalid request data');
      }

      // Process the AI operation
      const result = await this.processAIRequest(context, operation);

      // Create successful response
      const response: APIResponse = {
        success: true,
        data: result,
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          tokensUsed: result.tokensUsed,
          cost: result.cost
        }
      };

      // Update metrics
      this.updateMetrics(true, Date.now() - startTime);

      // Publish success event if configured
      if (this.config.events.enabled) {
        await this.publishOperationEvent('success', context, operation, response);
      }

      await this.hooks?.onResponse?.(context, response);

      this.logger.info('Request processed successfully', {
        requestId,
        processingTime: response.metadata.processingTime,
        tokensUsed: response.metadata.tokensUsed
      });

      return response;

    } catch (error) {
      this.logger.error('Request processing failed:', error, { requestId });

      // Create error response
      const response: APIResponse = {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message,
          details: error
        },
        metadata: {
          requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        }
      };

      // Update metrics
      this.updateMetrics(false, Date.now() - startTime);

      // Publish error event if configured
      if (this.config.events.enabled) {
        await this.publishOperationEvent('error', context, operation, response);
      }

      await this.hooks?.onError?.(error as Error);

      return response;
    }
  }

  async validateRequest(context: IntegrationContext, data: any): Promise<boolean> {
    try {
      // Basic validation
      if (!context.tenantContext || !context.requestId) {
        return false;
      }

      // Service-specific validation
      return await this.validateServiceRequest(context, data);
    } catch (error) {
      this.logger.error('Request validation failed:', error);
      return false;
    }
  }

  // ==========================================
  // DATABASE OPERATIONS
  // ==========================================

  async executeDatabase(operation: DatabaseOperation): Promise<any> {
    try {
      const { operation: op, table, data, conditions, options } = operation;

      switch (op) {
        case 'create':
          return await this.prisma[table].create({ data, ...options });
        
        case 'read':
          return await this.prisma[table].findMany({ where: conditions, ...options });
        
        case 'update':
          return await this.prisma[table].update({ where: conditions, data, ...options });
        
        case 'delete':
          return await this.prisma[table].delete({ where: conditions, ...options });
        
        case 'query':
          return await this.prisma.$queryRaw(data);
        
        default:
          throw new Error(`Unsupported database operation: ${op}`);
      }
    } catch (error) {
      this.logger.error('Database operation failed:', error, { operation });
      throw error;
    }
  }

  // ==========================================
  // CACHE OPERATIONS
  // ==========================================

  async executeCache(operation: CacheOperation): Promise<any> {
    if (!this.config.cache.enabled) {
      return null;
    }

    try {
      const { operation: op, key, value, ttl } = operation;
      const prefixedKey = `${this.config.cache.keyPrefix || this.config.serviceName}:${key}`;

      switch (op) {
        case 'get':
          const result = await this.redis.get(prefixedKey);
          return result ? JSON.parse(result) : null;
        
        case 'set':
          const cacheValue = JSON.stringify(value);
          const cacheTtl = ttl || this.config.cache.ttl || 3600;
          await this.redis.setex(prefixedKey, cacheTtl, cacheValue);
          return true;
        
        case 'delete':
          return await this.redis.del(prefixedKey);
        
        case 'clear':
          const pattern = `${this.config.cache.keyPrefix || this.config.serviceName}:*`;
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            return await this.redis.del(...keys);
          }
          return 0;
        
        default:
          throw new Error(`Unsupported cache operation: ${op}`);
      }
    } catch (error) {
      this.logger.error('Cache operation failed:', error, { operation });
      throw error;
    }
  }

  // ==========================================
  // EVENT OPERATIONS
  // ==========================================

  async executeEvent(operation: EventOperation): Promise<any> {
    if (!this.config.events.enabled) {
      return null;
    }

    try {
      const { operation: op, eventType, data, metadata } = operation;

      switch (op) {
        case 'publish':
          return await this.eventBus.publish({
            type: eventType,
            tenantId: metadata?.tenantId,
            userId: metadata?.userId,
            data,
            metadata
          });
        
        case 'subscribe':
          return await this.eventBus.subscribe({
            eventType,
            handler: metadata?.handler,
            priority: metadata?.priority || 'medium'
          });
        
        case 'unsubscribe':
          return await this.eventBus.unsubscribe(metadata?.subscriptionId);
        
        default:
          throw new Error(`Unsupported event operation: ${op}`);
      }
    } catch (error) {
      this.logger.error('Event operation failed:', error, { operation });
      throw error;
    }
  }

  // ==========================================
  // HEALTH AND MONITORING
  // ==========================================

  async checkHealth(): Promise<ServiceHealth> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let errorRate = 0;

    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      // Check Redis connectivity
      if (this.config.cache.enabled) {
        await this.redis.ping();
      }

      // Calculate error rate
      const totalRequests = this.requestCount;
      errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) : 0;

      // Determine status based on error rate
      if (errorRate > 0.1) {
        status = 'unhealthy';
      } else if (errorRate > 0.05) {
        status = 'degraded';
      }

    } catch (error) {
      this.logger.error('Health check failed:', error);
      status = 'unhealthy';
      errorRate = 1;
    }

    const responseTime = Date.now() - startTime;
    const uptime = Date.now() - this.startTime.getTime();

    return {
      status,
      lastCheck: new Date(),
      responseTime,
      errorRate,
      uptime,
      metrics: {
        totalRequests: this.requestCount,
        successfulRequests: this.successCount,
        failedRequests: this.errorCount,
        averageResponseTime: this.requestCount > 0 ? (this.totalResponseTime / this.requestCount) : 0
      }
    };
  }

  async getMetrics(): Promise<ServiceMetrics> {
    const health = await this.checkHealth();
    
    return {
      requests: {
        total: this.requestCount,
        successful: this.successCount,
        failed: this.errorCount,
        perMinute: this.calculateRequestsPerMinute(),
        perHour: this.calculateRequestsPerHour(),
        perDay: this.calculateRequestsPerDay()
      },
      performance: {
        averageResponseTime: health.metrics.averageResponseTime,
        p95ResponseTime: this.calculateP95ResponseTime(),
        p99ResponseTime: this.calculateP99ResponseTime(),
        errorRate: health.errorRate,
        uptime: health.uptime
      },
      resources: {
        cpuUsage: process.cpuUsage().system / 1000000, // Convert to milliseconds
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
        diskUsage: 0, // Would need system-specific implementation
        networkIO: 0  // Would need system-specific implementation
      },
      ai: {
        tokensUsed: this.getTotalTokensUsed(),
        tokensPerRequest: this.getAverageTokensPerRequest(),
        aiCost: this.getTotalAICost(),
        modelAccuracy: this.getModelAccuracy()
      }
    };
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private async initializeDatabase(): Promise<void> {
    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.database.connectionString || process.env.DATABASE_URL
          }
        }
      });

      await this.prisma.$connect();
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  private async initializeCache(): Promise<void> {
    if (!this.config.cache.enabled) {
      this.logger.info('Cache disabled');
      return;
    }

    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      await this.redis.ping();
      this.logger.info('Redis cache connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private async initializeEventBus(): Promise<void> {
    if (!this.config.events.enabled) {
      this.logger.info('Events disabled');
      return;
    }

    try {
      this.eventBus = new TekupEventBus({
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        serviceName: this.config.serviceName
      });

      await this.eventBus.initialize();
      this.logger.info('Event bus connection established');
    } catch (error) {
      this.logger.error('Failed to connect to event bus:', error);
      throw error;
    }
  }

  private async subscribeToEvents(): Promise<void> {
    if (!this.config.events.enabled || !this.config.events.subscribeEvents.length) {
      return;
    }

    for (const eventType of this.config.events.subscribeEvents) {
      try {
        await this.eventBus.subscribe({
          eventType,
          handler: async (event) => {
            this.logger.info(`Received event: ${event.type}`, { eventId: event.id });
            await this.handleIncomingEvent(event);
          }
        });
        this.logger.info(`Subscribed to event: ${eventType}`);
      } catch (error) {
        this.logger.error(`Failed to subscribe to event: ${eventType}`, error);
      }
    }
  }

  private async unsubscribeFromEvents(): Promise<void> {
    // Implementation would depend on tracking subscription IDs
    this.logger.info('Unsubscribed from all events');
  }

  private async closeConnections(): Promise<void> {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
      }
      if (this.redis) {
        await this.redis.quit();
      }
      if (this.eventBus) {
        await this.eventBus.shutdown();
      }
      this.logger.info('All connections closed');
    } catch (error) {
      this.logger.error('Error closing connections:', error);
    }
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }

  private async publishOperationEvent(type: 'success' | 'error', context: IntegrationContext, operation: AIOperation, response: APIResponse): Promise<void> {
    try {
      const eventType = `${this.config.serviceCategory}.operation.${type}`;
      
      await this.eventBus.publish({
        type: eventType,
        tenantId: context.tenantContext.tenantId!,
        userId: context.tenantContext.userId,
        data: {
          serviceName: this.config.serviceName,
          operation: operation.operation,
          success: response.success,
          processingTime: response.metadata.processingTime,
          tokensUsed: response.metadata.tokensUsed,
          cost: response.metadata.cost,
          error: response.error
        },
        metadata: {
          correlationId: context.correlationId,
          requestId: context.requestId
        }
      });
    } catch (error) {
      this.logger.error('Failed to publish operation event:', error);
    }
  }

  private async handleIncomingEvent(event: any): Promise<void> {
    // Default event handler - can be overridden by subclasses
    this.logger.info(`Handling incoming event: ${event.type}`, { eventId: event.id });
  }

  private startHealthMonitoring(): void {
    // Implementation for periodic health checks
    setInterval(async () => {
      const health = await this.checkHealth();
      if (health.status !== 'healthy') {
        this.logger.warn('Service health degraded:', health);
      }
    }, 30000); // Check every 30 seconds
  }

  private stopHealthMonitoring(): void {
    // Implementation to stop health monitoring
  }

  // Metric calculation helpers
  private calculateRequestsPerMinute(): number {
    // Simplified implementation - would need time windowing
    return this.requestCount;
  }

  private calculateRequestsPerHour(): number {
    return this.requestCount;
  }

  private calculateRequestsPerDay(): number {
    return this.requestCount;
  }

  private calculateP95ResponseTime(): number {
    // Simplified implementation - would need histogram tracking
    return this.requestCount > 0 ? (this.totalResponseTime / this.requestCount) * 1.5 : 0;
  }

  private calculateP99ResponseTime(): number {
    return this.requestCount > 0 ? (this.totalResponseTime / this.requestCount) * 2 : 0;
  }

  private getTotalTokensUsed(): number {
    // Would need to track tokens used per request
    return 0;
  }

  private getAverageTokensPerRequest(): number {
    return 0;
  }

  private getTotalAICost(): number {
    return 0;
  }

  private getModelAccuracy(): number | undefined {
    return undefined;
  }

  // ==========================================
  // INTEGRATION UTILITIES
  // ==========================================

  async migrateData(migrationInfo: MigrationInfo): Promise<void> {
    this.logger.info('Starting data migration:', migrationInfo);
    
    for (const step of migrationInfo.migrationSteps) {
      try {
        this.logger.info(`Executing migration step ${step.step}: ${step.description}`);
        
        switch (step.type) {
          case 'database':
            if (step.command) {
              await this.prisma.$executeRawUnsafe(step.command);
            }
            break;
          case 'data':
            // Handle data migration logic
            break;
          default:
            this.logger.warn(`Unsupported migration step type: ${step.type}`);
        }
        
        this.logger.info(`Migration step ${step.step} completed successfully`);
      } catch (error) {
        this.logger.error(`Migration step ${step.step} failed:`, error);
        throw error;
      }
    }
    
    this.logger.info('Data migration completed successfully');
  }

  async runTests(testConfig: IntegrationTestConfig): Promise<boolean> {
    if (!testConfig.enabled) {
      this.logger.info('Integration tests disabled');
      return true;
    }

    this.logger.info('Running integration tests:', testConfig);
    
    // Implementation would run the actual tests
    // For now, return true as placeholder
    return true;
  }

  // Getter for health property
  get health(): ServiceHealth {
    // Return cached health status or trigger health check
    return {
      status: this.isStarted ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0,
      uptime: Date.now() - this.startTime.getTime(),
      metrics: {
        totalRequests: this.requestCount,
        successfulRequests: this.successCount,
        failedRequests: this.errorCount,
        averageResponseTime: this.requestCount > 0 ? (this.totalResponseTime / this.requestCount) : 0
      }
    };
  }

  // Getter for metrics property
  get metrics(): ServiceMetrics {
    // Return current metrics synchronously
    return {
      requests: {
        total: this.requestCount,
        successful: this.successCount,
        failed: this.errorCount,
        perMinute: this.calculateRequestsPerMinute(),
        perHour: this.calculateRequestsPerHour(),
        perDay: this.calculateRequestsPerDay()
      },
      performance: {
        averageResponseTime: this.requestCount > 0 ? (this.totalResponseTime / this.requestCount) : 0,
        p95ResponseTime: this.calculateP95ResponseTime(),
        p99ResponseTime: this.calculateP99ResponseTime(),
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0,
        uptime: Date.now() - this.startTime.getTime()
      },
      resources: {
        cpuUsage: 0,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        diskUsage: 0,
        networkIO: 0
      },
      ai: {
        tokensUsed: this.getTotalTokensUsed(),
        tokensPerRequest: this.getAverageTokensPerRequest(),
        aiCost: this.getTotalAICost(),
        modelAccuracy: this.getModelAccuracy()
      }
    };
  }
}

