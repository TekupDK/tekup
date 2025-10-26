import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import RedisLib from 'ioredis';
import type { Redis as RedisType } from 'ioredis';
import { CacheConfig, CacheOptions, CacheStats, defaultCacheConfig } from './cache.config.js';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis?: RedisType;
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };
  private disabled = false;
  private memory = new Map<string, string>();

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...defaultCacheConfig, ...config };
  }

  async onModuleInit() {
    // Auto-disable in test environment unless explicitly enabled
    if (process.env.PX_DISABLE_REDIS === '1' || process.env.JEST_WORKER_ID) {
      this.disabled = true;
      this.logger.log('CacheService running in disabled (in-memory) mode for tests');
      return;
    }

    try {
  this.redis = new (RedisLib as any)({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        // Removed unsupported retryDelayOnFailover for type safety
        maxRetriesPerRequest: this.config.maxRetriesPerRequest,
        connectTimeout: this.config.connectTimeout,
        // ioredis does not have commandTimeout in older versions; guard with cast
        // @ts-ignore
        commandTimeout: this.config.commandTimeout,
        lazyConnect: true,
        keyPrefix: this.config.keyPrefix,
      });

      // Event listeners for monitoring
      this.redis!.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.redis!.on('error', (error: unknown) => {
        this.logger.error('Redis connection error:', error as any);
        this.stats.errors++;
      });

      this.redis!.on('reconnecting', () => {
        this.logger.warn('Redis reconnecting...');
      });

      // Connect to Redis
  await this.redis!.connect();

      // Configure Redis settings
      await this.configureRedis();

      this.logger.log('Cache service initialized successfully');
    } catch (error: unknown) {
      this.logger.error('Failed to initialize cache service:', error as any);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redis && !this.disabled) {
      await this.redis.disconnect();
      this.logger.log('Cache service disconnected');
    }
  }

  private async configureRedis() {
    if (this.disabled) return; // Skip when disabled
    try {
      // Set memory policy
  await this.redis!.config('SET', 'maxmemory-policy', this.config.evictionPolicy);
  await this.redis!.config('SET', 'maxmemory', this.config.maxMemory);
    } catch (error: unknown) {
      const msg = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'unknown';
      this.logger.warn('Could not configure Redis settings (may not have admin privileges): ' + msg);
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.disabled) {
      const raw = this.memory.get(key) ?? null;
      if (raw === null) { this.stats.misses++; return null; }
      this.stats.hits++; return JSON.parse(raw) as T;
    }
    try {
      const value = await this.redis!.get(key);
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error: unknown) {
      this.logger.error(`Cache get error for key ${key}:`, error as any);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.config.defaultTTL;
      const serializedValue = JSON.stringify(value);

      if (this.disabled) {
        this.memory.set(key, serializedValue);
      } else {
        if (ttl > 0) {
          await this.redis!.setex(key, ttl, serializedValue);
        } else {
          await this.redis!.set(key, serializedValue);
        }
      }

      // Handle tags for tag-based invalidation
  if (!this.disabled && options?.tags && options.tags.length > 0) {
        await this.addTagsToKey(key, options.tags);
      }

      this.stats.sets++;
    } catch (error: unknown) {
      this.logger.error(`Cache set error for key ${key}:`, error as any);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (this.disabled) {
        const existed = this.memory.delete(key);
        if (existed) this.stats.deletes++;
        return existed;
      }
      const result = await this.redis!.del(key);
      this.stats.deletes++;
      return result > 0;
    } catch (error: unknown) {
      this.logger.error(`Cache delete error for key ${key}:`, error as any);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Invalidate keys by pattern
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      if (this.disabled) {
        let removed = 0;
        for (const k of Array.from(this.memory.keys())) {
          if (k.includes(pattern.replace('*',''))) {
            this.memory.delete(k); removed++;
          }
        }
        this.stats.deletes += removed;
        return removed;
      }
      const keys = await this.redis!.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis!.del(...keys);
      this.stats.deletes += result;
      this.logger.debug(`Invalidated ${result} keys matching pattern: ${pattern}`);
      return result;
    } catch (error: unknown) {
      this.logger.error(`Cache invalidate error for pattern ${pattern}:`, error as any);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Invalidate keys by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
  try {
      let totalInvalidated = 0;

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
    if (this.disabled) continue; // tag operations skipped in memory mode
    const keys = await this.redis!.smembers(tagKey);
        
        if (keys.length > 0) {
          // Delete the actual cached keys
          const deleted = await this.redis!.del(...keys);
          totalInvalidated += deleted;
          
          // Clean up the tag set
          await this.redis!.del(tagKey);
        }
      }

      this.stats.deletes += totalInvalidated;
      this.logger.debug(`Invalidated ${totalInvalidated} keys for tags: ${tags.join(', ')}`);
      return totalInvalidated;
    } catch (error: unknown) {
      this.logger.error(`Cache invalidateByTags error for tags ${tags.join(', ')}:`, error as any);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.disabled) return this.memory.has(key);
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error: unknown) {
      this.logger.error(`Cache exists error for key ${key}:`, error as any);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    try {
      if (this.disabled) return -1; // Not tracked in memory mode
      return await this.redis!.ttl(key);
    } catch (error: unknown) {
      this.logger.error(`Cache getTTL error for key ${key}:`, error as any);
      this.stats.errors++;
      return -1;
    }
  }


  /**
   * Extend TTL for a key
   */
  async extendTTL(key: string, ttl: number): Promise<boolean> {
    try {
  const result = await this.redis!.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache extendTTL error for key ${key}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
  const info = await this.redis!.info('memory');
  const keyspace = await this.redis!.info('keyspace');
  const clients = await this.redis!.info('clients');

      // Parse memory usage
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      // Parse total keys
      const keysMatch = keyspace.match(/keys=(\d+)/);
      const totalKeys = keysMatch ? parseInt(keysMatch[1]) : 0;

      // Parse connected clients
      const clientsMatch = clients.match(/connected_clients:(\d+)/);
      const connectedClients = clientsMatch ? parseInt(clientsMatch[1]) : 0;

      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
      const missRate = totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0;

      return {
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round(missRate * 100) / 100,
        evictionCount: 0, // Would need to track this separately
        memoryUsage,
        totalKeys,
        connectedClients,
      };
    } catch (error) {
      this.logger.error('Cache getStats error:', error);
      return {
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
        memoryUsage: 0,
        totalKeys: 0,
        connectedClients: 0,
      };
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
  await this.redis!.flushdb();
      this.logger.warn('Cache cleared (all keys deleted)');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
  await this.redis!.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
  error: (error as any).message,
      };
    }
  }

  /**
   * Generate cache key with tenant isolation
   */
  generateKey(tenantId: string, namespace: string, identifier: string, params?: Record<string, any>): string {
    let key = `${tenantId}:${namespace}:${identifier}`;
    
    if (params && Object.keys(params).length > 0) {
      // Sort params for consistent key generation
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${params[k]}`)
        .join('&');
      key += `:${Buffer.from(sortedParams).toString('base64')}`;
    }
    
    return key;
  }

  /**
   * Add tags to a key for tag-based invalidation
   */
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    try {
  const pipeline = this.redis!.pipeline();
      
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        pipeline.sadd(tagKey, key);
        // Set TTL on tag set to prevent memory leaks
        pipeline.expire(tagKey, this.config.defaultTTL * 2);
      }
      
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Error adding tags to key ${key}:`, error);
    }
  }

  /**
   * Get the underlying Redis client (for advanced operations)
   */
  getClient(): any { return this.redis; }
}