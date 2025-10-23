/**
 * Redis Client for Distributed State Management
 * 
 * Provides:
 * - Connection pooling
 * - Automatic reconnection
 * - Health checking
 * - Graceful degradation when Redis unavailable
 */

import Redis from 'ioredis';
import { log } from './logger.js';

let redisClient: Redis | null = null;
let redisEnabled = false;

/**
 * Initialize Redis client
 */
export function initializeRedis(): void {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    log.warn('Redis: REDIS_URL not configured - running in standalone mode (no distributed features)');
    redisEnabled = false;
    return;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('connect', () => {
      log.info('Redis: Connected successfully');
      redisEnabled = true;
    });

    redisClient.on('error', (error) => {
      log.error('Redis: Connection error', { error: error.message });
      redisEnabled = false;
    });

    redisClient.on('close', () => {
      log.warn('Redis: Connection closed');
      redisEnabled = false;
    });

    redisClient.on('reconnecting', () => {
      log.info('Redis: Reconnecting...');
    });

  } catch (error) {
    log.error('Redis: Failed to initialize', { error });
    redisEnabled = false;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is enabled and connected
 */
export function isRedisEnabled(): boolean {
  return redisEnabled && redisClient !== null;
}

/**
 * Check Redis connectivity
 */
export async function checkRedisHealth(): Promise<boolean> {
  if (!isRedisEnabled() || !redisClient) {
    return false;
  }

  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    log.error('Redis: Health check failed', { error });
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      log.info('Redis: Connection closed gracefully');
    } catch (error) {
      log.error('Redis: Error closing connection', { error });
    } finally {
      redisClient = null;
      redisEnabled = false;
    }
  }
}

/**
 * Session storage in Redis
 */
export class RedisSessionStore {
  private prefix: string;
  private ttlSeconds: number;

  constructor(prefix: string = 'session:', ttlSeconds: number = 3600) {
    this.prefix = prefix;
    this.ttlSeconds = ttlSeconds;
  }

  async set(sessionId: string, data: any): Promise<boolean> {
    if (!isRedisEnabled() || !redisClient) {
      return false;
    }

    try {
      const key = `${this.prefix}${sessionId}`;
      await redisClient.setex(key, this.ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      log.error('Redis: Failed to set session', { sessionId, error });
      return false;
    }
  }

  async get(sessionId: string): Promise<any | null> {
    if (!isRedisEnabled() || !redisClient) {
      return null;
    }

    try {
      const key = `${this.prefix}${sessionId}`;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      log.error('Redis: Failed to get session', { sessionId, error });
      return null;
    }
  }

  async delete(sessionId: string): Promise<boolean> {
    if (!isRedisEnabled() || !redisClient) {
      return false;
    }

    try {
      const key = `${this.prefix}${sessionId}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      log.error('Redis: Failed to delete session', { sessionId, error });
      return false;
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    if (!isRedisEnabled() || !redisClient) {
      return false;
    }

    try {
      const key = `${this.prefix}${sessionId}`;
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      log.error('Redis: Failed to check session existence', { sessionId, error });
      return false;
    }
  }
}
