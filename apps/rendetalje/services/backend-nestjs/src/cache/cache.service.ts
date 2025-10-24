import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Whether to compress large values
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      if (redisUrl) {
        this.redis = new Redis(redisUrl);
      } else {
        this.redis = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying
            return Math.min(times * 100, 2000); // Exponential backoff
          },
        });
      }

      this.redis.on('connect', () => {
        this.logger.log('Connected to Redis');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      this.redis.on('ready', () => {
        this.logger.log('Redis is ready');
      });

    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.prefixKey(key));
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return JSON.parse(value);
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      const prefixedKey = this.prefixKey(key);
      
      if (options.ttl) {
        await this.redis.setex(prefixedKey, options.ttl, serializedValue);
      } else {
        await this.redis.set(prefixedKey, serializedValue);
      }

      // Store tags for cache invalidation
      if (options.tags && options.tags.length > 0) {
        await this.addKeyToTags(key, options.tags);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.prefixKey(key));
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.prefixKey(key));
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key existence ${key}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const prefixedKeys = keys.map(key => this.prefixKey(key));
      const values = await this.redis.mget(...prefixedKeys);
      
      return values.map(value => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        this.stats.hits++;
        return JSON.parse(value);
      });
    } catch (error) {
      this.logger.error('Failed to get multiple cache keys:', error);
      this.stats.misses += keys.length;
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const { key, value, options = {} } of keyValuePairs) {
        const serializedValue = JSON.stringify(value);
        const prefixedKey = this.prefixKey(key);
        
        if (options.ttl) {
          pipeline.setex(prefixedKey, options.ttl, serializedValue);
        } else {
          pipeline.set(prefixedKey, serializedValue);
        }

        // Handle tags
        if (options.tags && options.tags.length > 0) {
          for (const tag of options.tags) {
            pipeline.sadd(this.tagKey(tag), key);
          }
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Failed to set multiple cache keys:', error);
      return false;
    }
  }

  // Cache invalidation by tags
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(this.tagKey(tag));
      
      if (keys.length === 0) {
        return 0;
      }

      const prefixedKeys = keys.map(key => this.prefixKey(key));
      const pipeline = this.redis.pipeline();
      
      // Delete all keys with this tag
      for (const key of prefixedKeys) {
        pipeline.del(key);
      }
      
      // Remove the tag set
      pipeline.del(this.tagKey(tag));
      
      const results = await pipeline.exec();
      return keys.length;
    } catch (error) {
      this.logger.error(`Failed to invalidate cache by tag ${tag}:`, error);
      return 0;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;
    
    for (const tag of tags) {
      totalInvalidated += await this.invalidateByTag(tag);
    }
    
    return totalInvalidated;
  }

  // Pattern-based operations
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(this.prefixKey(pattern));
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete keys by pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Cache warming
  async warmCache<T>(
    key: string,
    dataLoader: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Load data and cache it
      const data = await dataLoader();
      await this.set(key, data, options);
      
      return data;
    } catch (error) {
      this.logger.error(`Failed to warm cache for key ${key}:`, error);
      // Fallback to loading data without caching
      return await dataLoader();
    }
  }

  // Batch cache warming
  async warmCacheBatch<T>(
    items: Array<{
      key: string;
      dataLoader: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    // Get all keys that exist in cache
    const keys = items.map(item => item.key);
    const cachedValues = await this.mget<T>(keys);
    
    // Identify which items need to be loaded
    const itemsToLoad: Array<{ index: number; item: typeof items[0] }> = [];
    
    for (let i = 0; i < items.length; i++) {
      if (cachedValues[i] === null) {
        itemsToLoad.push({ index: i, item: items[i] });
      } else {
        results[i] = cachedValues[i];
      }
    }

    // Load missing data in parallel
    const loadPromises = itemsToLoad.map(async ({ index, item }) => {
      try {
        const data = await item.dataLoader();
        results[index] = data;
        
        // Cache the loaded data
        await this.set(item.key, data, item.options);
        
        return data;
      } catch (error) {
        this.logger.error(`Failed to load data for key ${item.key}:`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    return results;
  }

  // Cache statistics
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();
      
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';
      
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: Math.round(hitRate * 100) / 100,
        totalKeys: keyCount,
        memoryUsage
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: 'Unknown'
      };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Failed to cleanup Redis connection:', error);
    }
  }

  // Private helper methods
  private prefixKey(key: string): string {
    const prefix = this.configService.get<string>('CACHE_PREFIX', 'rendetalje');
    return `${prefix}:${key}`;
  }

  private tagKey(tag: string): string {
    return this.prefixKey(`tag:${tag}`);
  }

  private async addKeyToTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(this.tagKey(tag), key);
    }
    
    await pipeline.exec();
  }
}

// Cache decorators for easy use
export function Cacheable(key: string, options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      
      if (!cacheService) {
        return method.apply(this, args);
      }

      // Generate cache key with method arguments
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cacheService.set(cacheKey, result, options);
      
      return result;
    };
  };
}

export function CacheEvict(tags: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      const cacheService: CacheService = this.cacheService;
      if (cacheService) {
        await cacheService.invalidateByTags(tags);
      }
      
      return result;
    };
  };
}