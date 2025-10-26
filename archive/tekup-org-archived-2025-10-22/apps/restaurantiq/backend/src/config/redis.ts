/**
 * Redis Configuration for RestaurantIQ
 * Handles caching, sessions, and pub/sub functionality
 */

import Redis from 'ioredis';
import { config } from './env';
import { loggers } from './logger';

// Redis connection options
const redisOptions: Redis.RedisOptions = {
  lazyConnect: true,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  retryDelayOnClusterDown: 300,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  commandTimeout: 5000,
  family: 4, // IPv4
  keepAlive: 30000,
  
  // Connection event handlers
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  },
};

// Parse Redis URL
const parseRedisUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || config.redis.password,
    username: parsed.username,
  };
};

// Create Redis connections for different purposes
const createRedisConnection = (database: number, name: string): Redis => {
  const connectionInfo = parseRedisUrl(config.redis.url);
  
  const redis = new Redis({
    ...redisOptions,
    ...connectionInfo,
    db: database,
    connectionName: `restaurantiq-${name}`,
    keyPrefix: `restaurantiq:${name}:`,
  });

  // Connection event handlers
  redis.on('connect', () => {
    loggers.info(`Redis ${name} connected`, { database });
  });

  redis.on('ready', () => {
    loggers.info(`Redis ${name} ready`, { database });
  });

  redis.on('error', (error) => {
    loggers.error(`Redis ${name} error`, { database, error: error.message });
  });

  redis.on('close', () => {
    loggers.warn(`Redis ${name} connection closed`, { database });
  });

  redis.on('reconnecting', () => {
    loggers.info(`Redis ${name} reconnecting`, { database });
  });

  return redis;
};

// Main Redis connections
export const redis = createRedisConnection(config.redis.databases.default, 'main');
export const sessionRedis = createRedisConnection(config.redis.databases.sessions, 'sessions');
export const cacheRedis = createRedisConnection(config.redis.databases.cache, 'cache');

// Pub/Sub connection (separate connection required)
export const pubSubRedis = createRedisConnection(config.redis.databases.default, 'pubsub');

// Health check function
export const healthCheck = async (): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> => {
  const startTime = Date.now();
  
  try {
    await redis.ping();
    const responseTime = Date.now() - startTime;
    
    loggers.debug('Redis health check passed', { responseTime });
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
    
    loggers.error('Redis health check failed', { error: errorMessage, responseTime });
    
    return {
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
    };
  }
};

// Cache helper functions
export const cache = {
  // Get cached value with JSON parsing
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await cacheRedis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      loggers.error('Cache get error', { key, error });
      return null;
    }
  },

  // Set cached value with JSON stringification
  set: async (key: string, value: any, ttl?: number): Promise<boolean> => {
    try {
      const serialized = JSON.stringify(value);
      const actualTtl = ttl || config.cache.ttl.default;
      
      await cacheRedis.setex(key, actualTtl, serialized);
      return true;
    } catch (error) {
      loggers.error('Cache set error', { key, error });
      return false;
    }
  },

  // Delete cached value
  del: async (key: string): Promise<boolean> => {
    try {
      const result = await cacheRedis.del(key);
      return result > 0;
    } catch (error) {
      loggers.error('Cache delete error', { key, error });
      return false;
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const result = await cacheRedis.exists(key);
      return result === 1;
    } catch (error) {
      loggers.error('Cache exists check error', { key, error });
      return false;
    }
  },

  // Get multiple keys
  mget: async <T>(keys: string[]): Promise<(T | null)[]> => {
    try {
      const values = await cacheRedis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      loggers.error('Cache mget error', { keys, error });
      return keys.map(() => null);
    }
  },

  // Set multiple keys
  mset: async (keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> => {
    try {
      const serializedPairs: string[] = [];
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        serializedPairs.push(key, JSON.stringify(value));
      });
      
      await cacheRedis.mset(...serializedPairs);
      
      // Set TTL for all keys if specified
      if (ttl) {
        const keys = Object.keys(keyValuePairs);
        const pipeline = cacheRedis.pipeline();
        keys.forEach(key => pipeline.expire(key, ttl));
        await pipeline.exec();
      }
      
      return true;
    } catch (error) {
      loggers.error('Cache mset error', { keyValuePairs: Object.keys(keyValuePairs), error });
      return false;
    }
  },

  // Increment counter
  incr: async (key: string, amount: number = 1, ttl?: number): Promise<number> => {
    try {
      const result = await cacheRedis.incrby(key, amount);
      
      if (ttl && result === amount) {
        // Set TTL only if this is the first increment
        await cacheRedis.expire(key, ttl);
      }
      
      return result;
    } catch (error) {
      loggers.error('Cache increment error', { key, amount, error });
      return 0;
    }
  },

  // Get keys by pattern
  keys: async (pattern: string): Promise<string[]> => {
    try {
      // Remove prefix from pattern for scanning
      const scanPattern = pattern.startsWith('restaurantiq:cache:') 
        ? pattern.substring('restaurantiq:cache:'.length)
        : pattern;
      
      return await cacheRedis.keys(scanPattern);
    } catch (error) {
      loggers.error('Cache keys error', { pattern, error });
      return [];
    }
  },

  // Clear cache by pattern
  clear: async (pattern: string): Promise<number> => {
    try {
      const keys = await cache.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await cacheRedis.del(...keys);
      loggers.info(`Cleared ${result} cache entries`, { pattern });
      return result;
    } catch (error) {
      loggers.error('Cache clear error', { pattern, error });
      return 0;
    }
  },
};

// Rate limiting helper
export const rateLimit = {
  // Check if rate limit is exceeded
  check: async (key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, window);
      
      const results = await pipeline.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const allowed = count <= limit;
      const remaining = Math.max(0, limit - count);
      const resetTime = Date.now() + (window * 1000);
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      loggers.error('Rate limit check error', { key, error });
      return { allowed: true, remaining: limit, resetTime: Date.now() };
    }
  },
};

// Pub/Sub helper functions
export const pubSub = {
  // Publish message
  publish: async (channel: string, message: any): Promise<boolean> => {
    try {
      const serialized = JSON.stringify({
        timestamp: new Date().toISOString(),
        data: message,
      });
      
      await pubSubRedis.publish(channel, serialized);
      loggers.debug('Message published', { channel });
      return true;
    } catch (error) {
      loggers.error('Pub/Sub publish error', { channel, error });
      return false;
    }
  },

  // Subscribe to channel
  subscribe: (channel: string, callback: (message: any) => void): void => {
    const subscriber = createRedisConnection(config.redis.databases.default, 'subscriber');
    
    subscriber.subscribe(channel);
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          callback(parsed.data);
        } catch (error) {
          loggers.error('Pub/Sub message parse error', { channel, error });
        }
      }
    });
    
    loggers.info('Subscribed to channel', { channel });
  },
};

// Session helper functions (used by express-session)
export const createSessionStore = () => {
  // This will be used with express-session redis store
  return sessionRedis;
};

// Tenant-specific cache helpers
export const tenantCache = {
  // Get tenant-specific cache key
  key: (tenantId: string, resource: string, identifier?: string): string => {
    const parts = ['tenant', tenantId, resource];
    if (identifier) parts.push(identifier);
    return parts.join(':');
  },

  // Get cached value for tenant
  get: async <T>(tenantId: string, resource: string, identifier?: string): Promise<T | null> => {
    const key = tenantCache.key(tenantId, resource, identifier);
    return cache.get<T>(key);
  },

  // Set cached value for tenant
  set: async (tenantId: string, resource: string, value: any, identifier?: string, ttl?: number): Promise<boolean> => {
    const key = tenantCache.key(tenantId, resource, identifier);
    return cache.set(key, value, ttl);
  },

  // Delete tenant cache
  del: async (tenantId: string, resource?: string, identifier?: string): Promise<number> => {
    if (!resource) {
      // Clear all tenant cache
      const pattern = `tenant:${tenantId}:*`;
      return cache.clear(pattern);
    }
    
    const key = tenantCache.key(tenantId, resource, identifier);
    const result = await cache.del(key);
    return result ? 1 : 0;
  },
};

// Graceful shutdown
export const closeRedisConnections = async (): Promise<void> => {
  const connections = [redis, sessionRedis, cacheRedis, pubSubRedis];
  
  await Promise.all(
    connections.map(async (connection) => {
      try {
        await connection.quit();
        loggers.info('Redis connection closed gracefully');
      } catch (error) {
        loggers.error('Error closing Redis connection', { error });
        // Force disconnect if graceful quit fails
        await connection.disconnect();
      }
    })
  );
};

export default redis;
