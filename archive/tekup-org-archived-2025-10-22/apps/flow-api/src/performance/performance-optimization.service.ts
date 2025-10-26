import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);
  
  constructor(
    private cacheService: CacheService,
    private metrics: MetricsService,
    private structuredLogger: StructuredLogger
  ) {}

  /**
   * Get cached lead statistics for a tenant
   * This reduces database queries for frequently accessed dashboard data
   */
  async getCachedLeadStats(tenantId: string): Promise<any> {
    const cacheKey = `lead_stats:${tenantId}`;
    
    try {
      // Try to get from cache first
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.metrics.increment('cache_hit_total', { 
          cache_type: 'lead_stats',
          tenant: tenantId
        });
        return cached;
      }
      
      this.metrics.increment('cache_miss_total', { 
        cache_type: 'lead_stats',
        tenant: tenantId
      });
      
      // Cache miss - return null to indicate need for fresh data
      return null;
    } catch (error) {
      this.logger.error('Error getting cached lead stats', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Set cached lead statistics for a tenant
   */
  async setCachedLeadStats(tenantId: string, stats: any, ttl: number = 300): Promise<void> {
    const cacheKey = `lead_stats:${tenantId}`;
    
    try {
      await this.cacheService.set(cacheKey, stats, ttl);
      this.metrics.increment('cache_set_total', { 
        cache_type: 'lead_stats',
        tenant: tenantId
      });
    } catch (error) {
      this.logger.error('Error setting cached lead stats', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get cached lead count for a tenant with filters
   */
  async getCachedLeadCount(tenantId: string, filters: any = {}): Promise<number | null> {
    const cacheKey = `lead_count:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        this.metrics.increment('cache_hit_total', { 
          cache_type: 'lead_count',
          tenant: tenantId
        });
        return cached;
      }
      
      this.metrics.increment('cache_miss_total', { 
        cache_type: 'lead_count',
        tenant: tenantId
      });
      
      return null;
    } catch (error) {
      this.logger.error('Error getting cached lead count', {
        tenantId,
        filters,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Set cached lead count for a tenant with filters
   */
  async setCachedLeadCount(tenantId: string, filters: any, count: number, ttl: number = 300): Promise<void> {
    const cacheKey = `lead_count:${tenantId}:${JSON.stringify(filters)}`;
    
    try {
      await this.cacheService.set(cacheKey, count, ttl);
      this.metrics.increment('cache_set_total', { 
        cache_type: 'lead_count',
        tenant: tenantId
      });
    } catch (error) {
      this.logger.error('Error setting cached lead count', {
        tenantId,
        filters,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Invalidate cached lead statistics for a tenant
   */
  async invalidateLeadStats(tenantId: string): Promise<void> {
    const cacheKey = `lead_stats:${tenantId}`;
    
    try {
      await this.cacheService.invalidate(cacheKey);
      this.metrics.increment('cache_invalidate_total', { 
        cache_type: 'lead_stats',
        tenant: tenantId
      });
    } catch (error) {
      this.logger.error('Error invalidating cached lead stats', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Invalidate cached lead counts for a tenant
   */
  async invalidateLeadCounts(tenantId: string): Promise<void> {
    try {
      // Invalidate all lead count caches for this tenant
      await this.cacheService.invalidatePattern(`lead_count:${tenantId}:*`);
      this.metrics.increment('cache_invalidate_total', { 
        cache_type: 'lead_count_pattern',
        tenant: tenantId
      });
    } catch (error) {
      this.logger.error('Error invalidating cached lead counts', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get cached compliance statistics for a tenant
   */
  async getCachedComplianceStats(tenantId: string): Promise<any> {
    const cacheKey = `compliance_stats:${tenantId}`;
    
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.metrics.increment('cache_hit_total', { 
          cache_type: 'compliance_stats',
          tenant: tenantId
        });
        return cached;
      }
      
      this.metrics.increment('cache_miss_total', { 
        cache_type: 'compliance_stats',
        tenant: tenantId
      });
      
      return null;
    } catch (error) {
      this.logger.error('Error getting cached compliance stats', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Set cached compliance statistics for a tenant
   */
  async setCachedComplianceStats(tenantId: string, stats: any, ttl: number = 300): Promise<void> {
    const cacheKey = `compliance_stats:${tenantId}`;
    
    try {
      await this.cacheService.set(cacheKey, stats, ttl);
      this.metrics.increment('cache_set_total', { 
        cache_type: 'compliance_stats',
        tenant: tenantId
      });
    } catch (error) {
      this.logger.error('Error setting cached compliance stats', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Warm up caches for a tenant by preloading commonly accessed data
   */
  async warmUpCaches(tenantId: string): Promise<void> {
    this.logger.log(`Warming up caches for tenant ${tenantId}`);
    
    try {
      // This would typically call services to preload data
      // For now, we'll just log the intention
      this.metrics.increment('cache_warmup_total', { 
        tenant: tenantId
      });
      
      this.structuredLogger.logBusinessEvent(
        'cache_warmup_started',
        'performance',
        'cache',
        {
          metadata: { tenantId }
        }
      );
    } catch (error) {
      this.logger.error('Error warming up caches', {
        tenantId,
        error: error.message,
        stack: error.stack
      });
    }
  }
}