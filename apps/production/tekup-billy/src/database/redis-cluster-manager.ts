/**
 * Redis Cluster Manager for Tekup-Billy MCP v2.0
 * 
 * Provides Redis Cluster integration optimized for Render.com deployment:
 * - Connection pooling and failover handling
 * - Distributed session management for multi-instance deployment
 * - Circuit breaker pattern for Redis operations
 * - Intelligent cache invalidation with pub/sub
 * - Performance monitoring and metrics
 */

import Redis, { Cluster, RedisOptions, ClusterOptions } from 'ioredis';
import { log } from '../utils/logger.js';

// Redis configuration interfaces
export interface RedisClusterConfig {
  nodes: Array<{ host: string; port: number }>;
  options: ClusterOptions;
  fallbackEnabled: boolean;
  circuitBreakerEnabled: boolean;
}

export interface RedisConnectionPool {
  read: Cluster | Redis;
  write: Cluster | Redis;
  pubsub: Cluster | Redis;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  avgResponseTime: number;
  connectionCount: number;
  lastError?: string;
}

/**
 * Circuit breaker for Redis operations
 */
class RedisCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - Redis operations disabled');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      log.warn('Redis circuit breaker opened', {
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
    log.info('Redis circuit breaker reset');
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Enhanced Redis Cluster Manager
 */
export class RedisClusterManager {
  private connectionPool: RedisConnectionPool | null = null;
  private circuitBreaker: RedisCircuitBreaker;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    avgResponseTime: 0,
    connectionCount: 0
  };
  private config: RedisClusterConfig;
  private isConnected = false;

  constructor(config?: Partial<RedisClusterConfig>) {
    this.config = this.buildConfig(config);
    this.circuitBreaker = new RedisCircuitBreaker();
  }

  /**
   * Build Redis configuration from environment and options
   */
  private buildConfig(config?: Partial<RedisClusterConfig>): RedisClusterConfig {
    // Parse Render.com Redis URL or use cluster nodes
    const redisUrl = process.env.REDIS_URL;
    const nodes = config?.nodes || this.parseRedisNodes(redisUrl);

    return {
      nodes,
      options: {
        enableReadyCheck: true,
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableOfflineQueue: false,
          ...config?.options?.redisOptions
        },
        clusterRetryDelayOnFailover: 100,
        clusterRetryDelayOnClusterDown: 300,
        clusterMaxRedirections: 16,
        scaleReads: 'slave',
        ...config?.options
      },
      fallbackEnabled: config?.fallbackEnabled ?? true,
      circuitBreakerEnabled: config?.circuitBreakerEnabled ?? true
    };
  }

  /**
   * Parse Redis nodes from URL or environment
   */
  private parseRedisNodes(redisUrl?: string): Array<{ host: string; port: number }> {
    if (redisUrl) {
      try {
        const url = new URL(redisUrl);
        return [{ host: url.hostname, port: parseInt(url.port) || 6379 }];
      } catch (error) {
        log.warn('Failed to parse REDIS_URL, using localhost', { error });
      }
    }

    // Default to localhost for development
    return [{ host: 'localhost', port: 6379 }];
  }

  /**
   * Initialize Redis cluster connections
   */
  async connect(): Promise<void> {
    try {
      log.info('Initializing Redis cluster connections', {
        nodes: this.config.nodes,
        clusterMode: this.config.nodes.length > 1
      });

      // Create connection pool
      if (this.config.nodes.length > 1) {
        // Cluster mode
        this.connectionPool = {
          read: new Cluster(this.config.nodes, {
            ...this.config.options,
            scaleReads: 'slave'
          }),
          write: new Cluster(this.config.nodes, {
            ...this.config.options,
            scaleReads: 'master'
          }),
          pubsub: new Cluster(this.config.nodes, this.config.options)
        };
      } else {
        // Single node mode (Render.com Redis addon)
        const nodeConfig = this.config.nodes[0];
        const redisOptions: RedisOptions = {
          host: nodeConfig.host,
          port: nodeConfig.port,
          ...this.config.options.redisOptions
        };

        const readClient = new Redis(redisOptions);
        const writeClient = new Redis(redisOptions);
        const pubsubClient = new Redis(redisOptions);

        this.connectionPool = {
          read: readClient,
          write: writeClient,
          pubsub: pubsubClient
        };
      }

      // Set up event handlers
      this.setupEventHandlers();

      // Test connections
      await this.testConnections();
      
      this.isConnected = true;
      log.info('Redis cluster connections established successfully');

    } catch (error) {
      log.error('Failed to initialize Redis cluster', error);
      throw error;
    }
  }

  /**
   * Set up Redis event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connectionPool) return;

    const clients = [
      this.connectionPool.read,
      this.connectionPool.write,
      this.connectionPool.pubsub
    ];

    clients.forEach((client, index) => {
      const clientType = ['read', 'write', 'pubsub'][index];

      client.on('connect', () => {
        log.info(`Redis ${clientType} client connected`);
        this.metrics.connectionCount++;
      });

      client.on('error', (error) => {
        log.error(`Redis ${clientType} client error`, error);
        this.metrics.errors++;
        this.metrics.lastError = error.message;
      });

      client.on('close', () => {
        log.warn(`Redis ${clientType} client disconnected`);
        this.metrics.connectionCount = Math.max(0, this.metrics.connectionCount - 1);
      });

      if (client instanceof Cluster) {
        client.on('node error', (error, node) => {
          log.error(`Redis cluster node error`, error, { node: node.options });
        });
      }
    });
  }

  /**
   * Test all Redis connections
   */
  private async testConnections(): Promise<void> {
    if (!this.connectionPool) {
      throw new Error('Connection pool not initialized');
    }

    const testKey = 'tekup:health:test';
    const testValue = Date.now().toString();

    try {
      // Test write
      await this.connectionPool.write.set(testKey, testValue, 'EX', 10);
      
      // Test read
      const result = await this.connectionPool.read.get(testKey);
      if (result !== testValue) {
        throw new Error('Read/write test failed');
      }

      // Clean up
      await this.connectionPool.write.del(testKey);

      log.info('Redis connection tests passed');
    } catch (error) {
      log.error('Redis connection test failed', error);
      throw error;
    }
  }

  /**
   * Execute Redis operation with circuit breaker
   */
  private async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (!this.config.circuitBreakerEnabled) {
      return operation();
    }

    try {
      return await this.circuitBreaker.execute(operation);
    } catch (error) {
      if (this.config.fallbackEnabled && fallback) {
        log.warn('Redis operation failed, using fallback', { error });
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
    if (!this.isConnected || !this.connectionPool) {
      if (fallback) {
        return fallback();
      }
      return null;
    }

    const startTime = Date.now();

    try {
      const result = await this.executeWithCircuitBreaker(
        async () => {
          const value = await this.connectionPool!.read.get(key);
          return value ? JSON.parse(value) : null;
        },
        fallback
      );

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics(result !== null, duration);

      return result;
    } catch (error) {
      log.error('Redis GET operation failed', error, { key });
      this.metrics.errors++;
      
      if (fallback) {
        return fallback();
      }
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.connectionPool) {
      return false;
    }

    try {
      return await this.executeWithCircuitBreaker(async () => {
        const serialized = JSON.stringify(value);
        
        if (ttlSeconds) {
          await this.connectionPool!.write.setex(key, ttlSeconds, serialized);
        } else {
          await this.connectionPool!.write.set(key, serialized);
        }
        
        return true;
      });
    } catch (error) {
      log.error('Redis SET operation failed', error, { key });
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.connectionPool) {
      return false;
    }

    try {
      return await this.executeWithCircuitBreaker(async () => {
        const result = await this.connectionPool!.write.del(key);
        return result > 0;
      });
    } catch (error) {
      log.error('Redis DEL operation failed', error, { key });
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Invalidate cache pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.connectionPool) {
      return 0;
    }

    try {
      return await this.executeWithCircuitBreaker(async () => {
        const keys = await this.connectionPool!.read.keys(pattern);
        if (keys.length === 0) {
          return 0;
        }
        
        const result = await this.connectionPool!.write.del(...keys);
        
        // Publish invalidation event
        await this.publishInvalidation(pattern, keys);
        
        return result;
      });
    } catch (error) {
      log.error('Redis pattern invalidation failed', error, { pattern });
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Publish cache invalidation event
   */
  async publishInvalidation(pattern: string, keys: string[]): Promise<void> {
    if (!this.connectionPool) return;

    try {
      const event = {
        type: 'cache_invalidation',
        pattern,
        keys,
        timestamp: Date.now(),
        instance: process.env.RENDER_INSTANCE_ID || 'unknown'
      };

      await this.connectionPool.pubsub.publish(
        'tekup:cache:invalidation',
        JSON.stringify(event)
      );
    } catch (error) {
      log.error('Failed to publish invalidation event', error);
    }
  }

  /**
   * Subscribe to cache invalidation events
   */
  async subscribeToInvalidations(
    callback: (pattern: string, keys: string[]) => void
  ): Promise<void> {
    if (!this.connectionPool) return;

    try {
      await this.connectionPool.pubsub.subscribe('tekup:cache:invalidation');
      
      this.connectionPool.pubsub.on('message', (channel, message) => {
        if (channel === 'tekup:cache:invalidation') {
          try {
            const event = JSON.parse(message);
            
            // Don't process our own invalidation events
            if (event.instance === (process.env.RENDER_INSTANCE_ID || 'unknown')) {
              return;
            }
            
            callback(event.pattern, event.keys);
          } catch (error) {
            log.error('Failed to process invalidation event', error);
          }
        }
      });

      log.info('Subscribed to cache invalidation events');
    } catch (error) {
      log.error('Failed to subscribe to invalidation events', error);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(hit: boolean, duration: number): void {
    if (hit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }

    // Update average response time (simple moving average)
    const totalOps = this.metrics.hits + this.metrics.misses;
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (totalOps - 1) + duration) / totalOps;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    connected: boolean;
    circuitBreakerState: string;
    metrics: CacheMetrics;
    nodeCount: number;
  }> {
    let nodeCount = 0;
    
    if (this.connectionPool?.read instanceof Cluster) {
      nodeCount = this.connectionPool.read.nodes().length;
    } else if (this.connectionPool?.read) {
      nodeCount = 1;
    }

    return {
      connected: this.isConnected,
      circuitBreakerState: this.circuitBreaker.getState(),
      metrics: this.getMetrics(),
      nodeCount
    };
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    if (!this.connectionPool) return;

    try {
      log.info('Disconnecting Redis cluster connections');

      const disconnectPromises = [
        this.connectionPool.read.disconnect(),
        this.connectionPool.write.disconnect(),
        this.connectionPool.pubsub.disconnect()
      ];

      await Promise.all(disconnectPromises);
      
      this.connectionPool = null;
      this.isConnected = false;
      
      log.info('Redis cluster connections closed');
    } catch (error) {
      log.error('Error during Redis disconnect', error);
    }
  }
}

/**
 * Global Redis cluster manager instance
 */
let redisClusterManager: RedisClusterManager | null = null;

/**
 * Get or create Redis cluster manager
 */
export function getRedisClusterManager(config?: Partial<RedisClusterConfig>): RedisClusterManager {
  if (!redisClusterManager) {
    redisClusterManager = new RedisClusterManager(config);
  }
  return redisClusterManager;
}

/**
 * Initialize Redis cluster for the application
 */
export async function initializeRedisCluster(config?: Partial<RedisClusterConfig>): Promise<RedisClusterManager> {
  const manager = getRedisClusterManager(config);
  await manager.connect();
  return manager;
}

/**
 * Check if Redis is enabled
 */
export function isRedisEnabled(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}