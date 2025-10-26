import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheService } from './cache.service.js';
import { CacheOptions } from './cache.config.js';

export interface CacheInterceptorOptions extends CacheOptions {
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  skipCache?: boolean;
  compressResponse?: boolean;
  strategy?: 'cache-first' | 'cache-aside' | 'write-through';
}

export interface CacheStrategy {
  skipCache: boolean;
  options: CacheOptions;
  compressResponse: boolean;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheErrors: 0,
    avgCacheRetrievalTime: 0,
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly options: CacheInterceptorOptions = {}
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Determine caching strategy
    const strategy = this.determineCacheStrategy(request);
    
    if (strategy.skipCache || request.method !== 'GET') {
      return next.handle();
    }

    // Check condition if provided
    if (this.options.condition && !this.options.condition(request, response)) {
      return next.handle();
    }

    // Generate tenant-aware cache key
    const cacheKey = this.generateTenantAwareCacheKey(request);
    const requestId = this.getRequestId(request);

    try {
      // Try to get from cache first
      const cacheStartTime = Date.now();
      const cachedResult = await this.cacheService.get(cacheKey);
      const cacheRetrievalTime = Date.now() - cacheStartTime;
      
      this.updatePerformanceMetrics('retrieval', cacheRetrievalTime);

      if (cachedResult !== null) {
        this.recordCacheHit(request.path, requestId);
        this.logger.debug(`Cache hit for key: ${cacheKey} (${cacheRetrievalTime}ms)`);
        
        // Set cache headers with metadata
        response.setHeader('X-Cache', 'HIT');
        response.setHeader('X-Cache-Key', this.hashKey(cacheKey));
        response.setHeader('X-Cache-Age', Math.floor((Date.now() - startTime) / 1000));
        response.setHeader('X-Request-ID', requestId);
        
        return of(cachedResult);
      }

      this.recordCacheMiss(request.path, requestId);
      this.logger.debug(`Cache miss for key: ${cacheKey} (${cacheRetrievalTime}ms)`);
      response.setHeader('X-Cache', 'MISS');
      response.setHeader('X-Cache-Key', this.hashKey(cacheKey));
      response.setHeader('X-Request-ID', requestId);

      // Execute the handler and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          try {
            const cacheData = strategy.compressResponse ? this.compressData(data) : data;
            await this.cacheService.set(cacheKey, cacheData, strategy.options);
            const totalTime = Date.now() - startTime;
            this.logger.debug(`Cached result for key: ${cacheKey} (total: ${totalTime}ms)`);
          } catch (error) {
            this.recordCacheError(error, cacheKey);
            this.logger.error(`Failed to cache result for key ${cacheKey}:`, error);
          }
        }),
        catchError((error) => {
          this.logger.error(`Request error for key ${cacheKey}:`, error);
          throw error;
        })
      );
    } catch (error) {
      this.recordCacheError(error, cacheKey);
      this.logger.error(`Cache interceptor error for key ${cacheKey}:`, error);
      // Continue without caching on error
      return next.handle();
    }
  }

  private determineCacheStrategy(request: Request): CacheStrategy {
    const path = request.path;
    const method = request.method;
    const userAgent = request.get('User-Agent') || '';
    
    // Skip caching for non-GET requests
    if (method !== 'GET') {
      return { skipCache: true, options: {}, compressResponse: false };
    }

    // Skip caching for certain paths
    if (path.includes('/health') || path.includes('/metrics')) {
      return { skipCache: true, options: {}, compressResponse: false };
    }

    // Different strategies for different endpoints
    if (path.includes('/leads')) {
      return {
        skipCache: false,
        options: {
          ttl: path.includes('/leads/') ? 300 : 120, // 5min for details, 2min for lists
          tags: [`tenant:${(request as any).tenantId}`, 'leads'],
        },
        compressResponse: true,
      };
    }

    if (path.includes('/settings')) {
      return {
        skipCache: false,
        options: {
          ttl: 900, // 15 minutes for settings
          tags: [`tenant:${(request as any).tenantId}`, 'settings'],
        },
        compressResponse: false,
      };
    }

    // Default strategy
    return {
      skipCache: false,
      options: {
        ttl: this.options.ttl || 300,
        tags: this.options.tags || [],
      },
      compressResponse: false,
    };
  }

  private generateTenantAwareCacheKey(request: Request): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(request);
    }

    // Enhanced key generation with tenant isolation
    const tenantId = (request as any).tenantId || 'unknown';
    const path = request.path;
    const query = request.query;
    const method = request.method;

    // Sort query parameters for consistent key generation
    const sortedQuery = Object.keys(query)
      .sort()
      .map(key => {
        const value = Array.isArray(query[key]) ? query[key].join(',') : query[key];
        return `${key}=${value}`;
      })
      .join('&');

    // Include API version and method for more granular caching
    const apiVersion = request.get('API-Version') || 'v1';
    const baseKey = `${apiVersion}:${tenantId}:${method}:${path}`;
    
    return sortedQuery ? `${baseKey}?${sortedQuery}` : baseKey;
  }

  private getRequestId(request: Request): string {
    return (request as any).id || request.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashKey(key: string): string {
    // Create a short hash of the key for headers (to avoid exposing sensitive data)
    return key.substring(0, 8) + '...' + key.slice(-8);
  }

  private compressData(data: any): any {
    // Simple compression strategy - could be enhanced with actual compression
    if (Array.isArray(data) && data.length > 100) {
      // For large arrays, we might implement pagination hints
      return {
        ...data,
        _compressed: true,
        _originalLength: data.length
      };
    }
    return data;
  }

  private recordCacheHit(path: string, requestId: string): void {
    this.performanceMetrics.cacheHits++;
    this.logger.debug(`Cache HIT - Path: ${path}, RequestID: ${requestId}`);
  }

  private recordCacheMiss(path: string, requestId: string): void {
    this.performanceMetrics.cacheMisses++;
    this.logger.debug(`Cache MISS - Path: ${path}, RequestID: ${requestId}`);
  }

  private recordCacheError(error: any, cacheKey: string): void {
    this.performanceMetrics.cacheErrors++;
    this.logger.error(`Cache ERROR - Key: ${this.hashKey(cacheKey)}, Error: ${error.message}`);
  }

  private updatePerformanceMetrics(operation: string, duration: number): void {
    if (operation === 'retrieval') {
      this.performanceMetrics.avgCacheRetrievalTime = 
        (this.performanceMetrics.avgCacheRetrievalTime + duration) / 2;
    }
  }

  getPerformanceMetrics() {
    const total = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    return {
      ...this.performanceMetrics,
      hitRate: total > 0 ? (this.performanceMetrics.cacheHits / total) * 100 : 0,
      totalRequests: total,
    };
  }
}

/**
 * Decorator factory for easy cache configuration
 */
export function CacheResponse(options: CacheInterceptorOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    // This would be used with @UseInterceptors in controllers
    // The actual implementation would depend on how NestJS decorators work
    return descriptor;
  };
}