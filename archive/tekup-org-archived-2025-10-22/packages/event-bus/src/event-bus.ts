import Redis from 'ioredis';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseEvent,
  EventBusConfig,
  EventHandler,
  SubscriptionConfig,
  EventContext,
  EventPriority,
  EventStatus,
  TekupEvent,
  BaseEventSchema
} from './types.js';

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export class TekupEventBus {
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private config: EventBusConfig;
  private subscriptions: Map<string, SubscriptionConfig> = new Map();
  private processingQueue: Map<string, Promise<void>> = new Map();
  private isShuttingDown = false;

  constructor(config: EventBusConfig) {
    this.config = {
      namespace: 'tekup',
      retryAttempts: 3,
      retryDelay: 1000,
      deadLetterTtl: 86400, // 24 hours
      batchSize: 10,
      concurrency: 5,
      ...config
    };

    // Initialize Redis connections
    this.redis = new Redis(this.config.redisUrl, {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      keyPrefix: `${this.config.namespace}:`,
    });

    this.subscriber = new Redis(this.config.redisUrl, {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      keyPrefix: `${this.config.namespace}:`,
    });

    this.publisher = new Redis(this.config.redisUrl, {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      keyPrefix: `${this.config.namespace}:`,
    });

    this.setupErrorHandlers();
    this.setupGracefulShutdown();
  }

  /**
   * Initialize the event bus and start processing
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.redis.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);

      // Setup subscriber for real-time events
      this.subscriber.on('message', this.handleIncomingEvent.bind(this));

      // Start background processing for queued events
      this.startEventProcessor();

      logger.info('TekupEventBus initialized successfully', {
        service: this.config.serviceName,
        namespace: this.config.namespace
      });
    } catch (error) {
      logger.error('Failed to initialize TekupEventBus', { error: error.message });
      throw error;
    }
  }

  /**
   * Publish an event to the bus
   */
  async publish<T extends TekupEvent>(event: Omit<T, 'id' | 'timestamp' | 'version'>): Promise<string> {
    const fullEvent: T = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
      version: '1.0.0'
    } as T;

    try {
      // Validate event schema
      BaseEventSchema.parse(fullEvent);

      // Determine routing strategy
      const routingKey = this.getRoutingKey(fullEvent);
      const priority = this.getEventPriority(fullEvent.type);

      // Store event for reliability
      await this.storeEvent(fullEvent);

      // Publish to appropriate queues
      await Promise.all([
        this.publishToQueue(routingKey, fullEvent, priority),
        this.publishToSubscribers(fullEvent)
      ]);

      // Track metrics
      await this.trackEventMetrics(fullEvent, 'published');

      logger.info('Event published successfully', {
        eventId: fullEvent.id,
        type: fullEvent.type,
        tenantId: fullEvent.tenantId,
        priority
      });

      return fullEvent.id;
    } catch (error) {
      logger.error('Failed to publish event', {
        eventType: event.type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Subscribe to events with a handler
   */
  async subscribe(config: SubscriptionConfig): Promise<string> {
    const subscriptionId = uuidv4();
    
    // Store subscription configuration
    this.subscriptions.set(subscriptionId, {
      ...config,
      priority: config.priority || EventPriority.MEDIUM,
      retryAttempts: config.retryAttempts || this.config.retryAttempts,
      retryDelay: config.retryDelay || this.config.retryDelay,
      timeout: config.timeout || 30000
    });

    // Subscribe to Redis channels
    const patterns = this.getSubscriptionPatterns(config.eventType);
    for (const pattern of patterns) {
      await this.subscriber.psubscribe(pattern);
    }

    logger.info('Subscription created', {
      subscriptionId,
      eventType: config.eventType,
      priority: config.priority,
      service: this.config.serviceName
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const config = this.subscriptions.get(subscriptionId);
    if (!config) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    // Remove subscription
    this.subscriptions.delete(subscriptionId);

    // Unsubscribe from Redis if no other subscriptions need this pattern
    const patterns = this.getSubscriptionPatterns(config.eventType);
    for (const pattern of patterns) {
      const hasOtherSubscriptions = Array.from(this.subscriptions.values())
        .some(sub => this.getSubscriptionPatterns(sub.eventType).includes(pattern));
      
      if (!hasOtherSubscriptions) {
        await this.subscriber.punsubscribe(pattern);
      }
    }

    logger.info('Subscription removed', { subscriptionId });
  }

  /**
   * Get event processing status
   */
  async getEventStatus(eventId: string): Promise<EventStatus | null> {
    try {
      const status = await this.redis.hget(`event:${eventId}`, 'status');
      return status as EventStatus || null;
    } catch (error) {
      logger.error('Failed to get event status', { eventId, error: error.message });
      return null;
    }
  }

  /**
   * Get event processing metrics
   */
  async getMetrics(tenantId?: string): Promise<Record<string, any>> {
    try {
      const metricsKey = tenantId ? `metrics:${tenantId}` : 'metrics:global';
      const metrics = await this.redis.hgetall(metricsKey);
      
      return {
        published: parseInt(metrics.published || '0'),
        processed: parseInt(metrics.processed || '0'),
        failed: parseInt(metrics.failed || '0'),
        retries: parseInt(metrics.retries || '0'),
        avgProcessingTime: parseFloat(metrics.avgProcessingTime || '0'),
        lastUpdated: metrics.lastUpdated ? new Date(metrics.lastUpdated) : null
      };
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    logger.info('Shutting down TekupEventBus...');

    // Wait for ongoing processing to complete
    await Promise.all(Array.from(this.processingQueue.values()));

    // Close Redis connections
    await Promise.all([
      this.redis.quit(),
      this.subscriber.quit(),
      this.publisher.quit()
    ]);

    logger.info('TekupEventBus shutdown complete');
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  private setupErrorHandlers(): void {
    this.redis.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error', { error: error.message });
    });

    this.publisher.on('error', (error) => {
      logger.error('Redis publisher error', { error: error.message });
    });
  }

  private setupGracefulShutdown(): void {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private getRoutingKey(event: BaseEvent): string {
    return `events:${event.type}:${event.tenantId}`;
  }

  private getEventPriority(eventType: string): EventPriority {
    // Define priority mapping based on event types
    const priorityMap: Record<string, EventPriority> = {
      'support.session.started': EventPriority.HIGH,
      'lead.converted': EventPriority.HIGH,
      'campaign.completed': EventPriority.MEDIUM,
      'content.generated': EventPriority.LOW,
      'dashboard.viewed': EventPriority.LOW
    };

    return priorityMap[eventType] || EventPriority.MEDIUM;
  }

  private async storeEvent(event: BaseEvent): Promise<void> {
    const eventKey = `event:${event.id}`;
    const pipeline = this.redis.pipeline();

    pipeline.hset(eventKey, {
      id: event.id,
      type: event.type,
      tenantId: event.tenantId,
      userId: event.userId || '',
      timestamp: event.timestamp.toISOString(),
      data: JSON.stringify((event as any).data || {}),
      metadata: JSON.stringify(event.metadata || {}),
      status: EventStatus.PENDING,
      version: event.version
    });

    pipeline.expire(eventKey, 604800); // 7 days TTL
    await pipeline.exec();
  }

  private async publishToQueue(routingKey: string, event: BaseEvent, priority: EventPriority): Promise<void> {
    const queueName = `queue:${priority}`;
    const eventData = {
      ...event,
      routingKey,
      publishedAt: new Date().toISOString()
    };

    await this.publisher.lpush(queueName, JSON.stringify(eventData));
  }

  private async publishToSubscribers(event: BaseEvent): Promise<void> {
    const channel = `channel:${event.type}`;
    await this.publisher.publish(channel, JSON.stringify(event));
  }

  private getSubscriptionPatterns(eventType: string): string[] {
    if (eventType.includes('*')) {
      return [`channel:${eventType}`];
    }
    return [`channel:${eventType}`];
  }

  private async handleIncomingEvent(channel: string, message: string): Promise<void> {
    try {
      const event: BaseEvent = JSON.parse(message);
      await this.processEventForSubscriptions(event);
    } catch (error) {
      logger.error('Failed to handle incoming event', {
        channel,
        error: error.message
      });
    }
  }

  private async processEventForSubscriptions(event: BaseEvent): Promise<void> {
    const relevantSubscriptions = Array.from(this.subscriptions.entries()).filter(
      ([_, config]) => this.matchesEventType(event.type, config.eventType)
    );

    const processingPromises = relevantSubscriptions.map(async ([subscriptionId, config]) => {
      if (config.filter && !config.filter(event)) {
        return;
      }

      const context: EventContext = {
        attempt: 1,
        maxAttempts: config.retryAttempts!,
        startTime: new Date(),
        correlationId: uuidv4()
      };

      await this.executeEventHandler(event, config, context);
    });

    await Promise.allSettled(processingPromises);
  }

  private matchesEventType(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (!pattern.includes('*')) return eventType === pattern;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(eventType);
  }

  private async executeEventHandler(
    event: BaseEvent,
    config: SubscriptionConfig,
    context: EventContext
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Set processing timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Handler timeout')), config.timeout);
      });

      const handlerPromise = config.handler(event, context);
      await Promise.race([handlerPromise, timeoutPromise]);

      // Track success metrics
      await this.trackEventMetrics(event, 'processed', Date.now() - startTime);

      logger.debug('Event processed successfully', {
        eventId: event.id,
        eventType: event.type,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      logger.error('Event handler failed', {
        eventId: event.id,
        eventType: event.type,
        attempt: context.attempt,
        error: error.message
      });

      // Retry logic
      if (context.attempt < context.maxAttempts) {
        await this.scheduleRetry(event, config, {
          ...context,
          attempt: context.attempt + 1
        });
      } else {
        await this.sendToDeadLetterQueue(event, error.message);
      }

      await this.trackEventMetrics(event, 'failed');
    }
  }

  private async scheduleRetry(
    event: BaseEvent,
    config: SubscriptionConfig,
    context: EventContext
  ): Promise<void> {
    const delay = config.retryDelay! * Math.pow(2, context.attempt - 1); // Exponential backoff
    
    setTimeout(async () => {
      await this.executeEventHandler(event, config, context);
    }, delay);

    await this.trackEventMetrics(event, 'retried');
  }

  private async sendToDeadLetterQueue(event: BaseEvent, error: string): Promise<void> {
    const dlqKey = `dlq:${event.type}`;
    const dlqEntry = {
      ...event,
      failedAt: new Date().toISOString(),
      error,
      originalQueue: this.getRoutingKey(event)
    };

    await this.redis.lpush(dlqKey, JSON.stringify(dlqEntry));
    await this.redis.expire(dlqKey, this.config.deadLetterTtl);

    logger.warn('Event sent to dead letter queue', {
      eventId: event.id,
      eventType: event.type,
      error
    });
  }

  private async trackEventMetrics(
    event: BaseEvent,
    action: 'published' | 'processed' | 'failed' | 'retried',
    processingTime?: number
  ): Promise<void> {
    const metricsKey = `metrics:${event.tenantId}`;
    const globalMetricsKey = 'metrics:global';
    
    const pipeline = this.redis.pipeline();
    
    // Increment counters
    pipeline.hincrby(metricsKey, action, 1);
    pipeline.hincrby(globalMetricsKey, action, 1);
    
    // Update processing time average
    if (processingTime && action === 'processed') {
      const currentAvg = await this.redis.hget(metricsKey, 'avgProcessingTime');
      const currentCount = await this.redis.hget(metricsKey, 'processed');
      
      if (currentAvg && currentCount) {
        const newAvg = (parseFloat(currentAvg) * (parseInt(currentCount) - 1) + processingTime) / parseInt(currentCount);
        pipeline.hset(metricsKey, 'avgProcessingTime', newAvg.toString());
      } else {
        pipeline.hset(metricsKey, 'avgProcessingTime', processingTime.toString());
      }
    }
    
    // Update timestamp
    pipeline.hset(metricsKey, 'lastUpdated', new Date().toISOString());
    pipeline.hset(globalMetricsKey, 'lastUpdated', new Date().toISOString());
    
    await pipeline.exec();
  }

  private startEventProcessor(): void {
    // Process events from priority queues
    setInterval(async () => {
      if (this.isShuttingDown) return;

      const priorities = [EventPriority.CRITICAL, EventPriority.HIGH, EventPriority.MEDIUM, EventPriority.LOW];
      
      for (const priority of priorities) {
        await this.processQueueBatch(`queue:${priority}`);
      }
    }, 1000); // Process every second
  }

  private async processQueueBatch(queueName: string): Promise<void> {
    try {
      const events = await this.redis.brpop(queueName, 1);
      if (!events) return;

      const [, eventData] = events;
      const event = JSON.parse(eventData);
      
      // Process the event
      const processingPromise = this.processEventForSubscriptions(event);
      this.processingQueue.set(event.id, processingPromise);
      
      await processingPromise;
      this.processingQueue.delete(event.id);
      
    } catch (error) {
      logger.error('Failed to process queue batch', {
        queueName,
        error: error.message
      });
    }
  }
}

