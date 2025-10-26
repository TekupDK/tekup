import { CacheService } from './cache.service.js';
import { CacheOptions } from './cache.config.js';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-flow-api-src-cache-cache-');

/**
 * Method decorator for caching method results
 */
export function Cacheable(options: CacheOptions & {
  keyGenerator?: (...args: any[]) => string;
  namespace?: string;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
  const cacheService: CacheService | undefined = (this as any)?.cacheService || (this as any)?.cache;
      
      if (!cacheService) {
        logger.warn(`CacheService not found in ${target.constructor.name}. Executing method without caching.`);
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      let cacheKey: string;
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(...args);
      } else {
        const tenantId = args[0] || 'default'; // Assume first arg is tenantId
        const namespace = options.namespace || target.constructor.name.toLowerCase();
        const methodName = propertyName;
        const argsHash = Buffer.from(JSON.stringify(args.slice(1))).toString('base64');
        cacheKey = cacheService.generateKey(tenantId, namespace, methodName, { args: argsHash });
      }

      try {
        // Try to get from cache
        const cachedResult = await cacheService.get(cacheKey);
        if (cachedResult !== null) {
          return cachedResult;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Cache the result
        await cacheService.set(cacheKey, result, options);

        return result;
      } catch (error) {
        logger.error(`Cache error in ${target.constructor.name}.${propertyName}:`, error);
        // Fallback to original method on cache error
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Method decorator for cache invalidation
 */
export function CacheEvict(options: {
  keys?: string[];
  patterns?: string[];
  tags?: string[];
  keyGenerator?: (...args: any[]) => string | string[];
  namespace?: string;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
  const cacheService: CacheService | undefined = (this as any)?.cacheService || (this as any)?.cache;
      
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      if (!cacheService) {
        logger.warn(`CacheService not found in ${target.constructor.name}. Skipping cache eviction.`);
        return result;
      }

      try {
        // Invalidate cache entries
        if (options.keyGenerator) {
          const keysToEvict = options.keyGenerator(...args);
          const keys = Array.isArray(keysToEvict) ? keysToEvict : [keysToEvict];
          
          for (const key of keys) {
            await cacheService.delete(key);
          }
        }

        if (options.keys) {
          for (const key of options.keys) {
            await cacheService.delete(key);
          }
        }

        if (options.patterns) {
          for (const pattern of options.patterns) {
            await cacheService.invalidate(pattern);
          }
        }

        if (options.tags) {
          await cacheService.invalidateByTags(options.tags);
        }
      } catch (error) {
        logger.error(`Cache eviction error in ${target.constructor.name}.${propertyName}:`, error);
        // Don't throw error for cache eviction failures
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Class decorator to inject CacheService
 */
export function CacheEnabled(target: any) {
  // This would typically be handled by NestJS dependency injection
  // This is a placeholder for the concept
  return target;
}

/**
 * Utility function to create cache key generators
 */
export class CacheKeyGenerators {

  /**
   * Generate key for lead list operations
   */
  static leadList(tenantId: string, filters?: any): string {
    const filterHash = filters ? Buffer.from(JSON.stringify(filters)).toString('base64') : 'all';
    return `${tenantId}:leads:list:${filterHash}`;
  }

  /**
   * Generate key for lead detail operations
   */
  static leadDetail(tenantId: string, leadId: string): string {
    return `${tenantId}:leads:detail:${leadId}`;
  }

  /**
   * Generate key for lead events
   */
  static leadEvents(tenantId: string, leadId: string): string {
    return `${tenantId}:leads:events:${leadId}`;
  }

  /**
   * Generate key for settings
   */
  static settings(tenantId: string, key?: string): string {
    return key ? `${tenantId}:settings:${key}` : `${tenantId}:settings:all`;
  }

  /**
   * Generate pattern for tenant-specific invalidation
   */
  static tenantPattern(tenantId: string, namespace?: string): string {
    return namespace ? `${tenantId}:${namespace}:*` : `${tenantId}:*`;
  }

  /**
   * Generate tags for lead-related cache entries
   */
  static leadTags(tenantId: string, leadId?: string): string[] {
    const tags = [`tenant:${tenantId}`, 'leads'];
    if (leadId) {
      tags.push(`lead:${leadId}`);
    }
    return tags;
  }
}