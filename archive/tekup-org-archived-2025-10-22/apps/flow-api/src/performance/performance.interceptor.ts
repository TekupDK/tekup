import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PerformanceService } from './performance.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

export interface PerformanceInterceptorOptions {
  enableSlowQueryLogging?: boolean;
  slowQueryThreshold?: number;
  trackDatabaseQueries?: boolean;
  trackCacheOperations?: boolean;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(
    private readonly performanceService: PerformanceService,
    private readonly metricsService: MetricsService,
    private readonly options: PerformanceInterceptorOptions = {}
  ) {
    // Set default options
    this.options = {
      enableSlowQueryLogging: true,
      slowQueryThreshold: 1000, // 1 second
      trackDatabaseQueries: true,
      trackCacheOperations: true,
      ...options,
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const requestId = this.getRequestId(request);
    const tenantId = (request as any).tenantId || 'unknown';
    const endpoint = `${request.method} ${request.path}`;

    // Set request start time for downstream services
    (request as any).performanceStartTime = startTime;
    (request as any).requestId = requestId;

    return next.handle().pipe(
      tap(async (data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record basic performance metrics
        this.recordEndpointPerformance(endpoint, duration, tenantId, 'success');
        
        // Set performance headers
        response.setHeader('X-Response-Time', `${duration}ms`);
        response.setHeader('X-Request-ID', requestId);
        
        // Log slow requests
        if (this.options.enableSlowQueryLogging && duration > this.options.slowQueryThreshold!) {
          this.logger.warn(`Slow request detected: ${endpoint} took ${duration}ms (tenant: ${tenantId})`);
        }

        // Track database queries if enabled
        if (this.options.trackDatabaseQueries) {
          await this.trackDatabasePerformance(request, duration, tenantId);
        }
      }),
      catchError(async (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Record error metrics
        this.recordEndpointPerformance(endpoint, duration, tenantId, 'error');
        
        // Log error with performance context
        this.logger.error(
          `Request failed: ${endpoint} (${duration}ms, tenant: ${tenantId})`,
          error.stack
        );
        
        throw error;
      })
    );
  }

  private getRequestId(request: Request): string {
    return (request as any).id || 
           request.get('X-Request-ID') || 
           `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordEndpointPerformance(
    endpoint: string, 
    duration: number, 
    tenantId: string, 
    status: 'success' | 'error'
  ): void {
    // Record histogram for response times
    this.metricsService.histogram('http_request_duration_ms', duration, {
      endpoint,
      tenant: tenantId,
      status,
    });

    // Record counter for total requests
    this.metricsService.increment('http_requests_total', {
      endpoint,
      tenant: tenantId,
      status,
    });

    // Record slow requests counter
    if (duration > (this.options.slowQueryThreshold || 1000)) {
      this.metricsService.increment('http_slow_requests_total', {
        endpoint,
        tenant: tenantId,
      });
    }
  }

  private async trackDatabasePerformance(
    request: Request, 
    totalDuration: number, 
    tenantId: string
  ): Promise<void> {
    try {
      // Extract database query information from request context
      const dbQueries = (request as any).dbQueries || [];
      
      for (const query of dbQueries) {
        await this.performanceService.measureQuery(
          async () => query.result,
          {
            operation: query.operation || 'unknown',
            table: query.table || 'unknown',
            tenantId,
            estimatedRows: query.rowCount,
            parameters: query.parameters,
          }
        );
      }

      // Record database performance metrics
      if (dbQueries.length > 0) {
        const totalDbTime = dbQueries.reduce((sum: number, q: any) => sum + (q.duration || 0), 0);
        const dbUtilization = totalDbTime / totalDuration * 100;

        this.metricsService.gauge('request_database_utilization_percent', dbUtilization, {
          tenant: tenantId,
        });

        this.metricsService.histogram('request_database_queries_count', dbQueries.length, {
          tenant: tenantId,
        });
      }
    } catch (error) {
      this.logger.error('Failed to track database performance:', error);
    }
  }
}

/**
 * Decorator to enable performance tracking on controllers
 */
export function TrackPerformance(options?: PerformanceInterceptorOptions) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-performance-');

  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    // This would be implemented as a method decorator or class decorator
    // For now, it's a placeholder for the concept
    if (descriptor) {
      // Method decorator
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        const startTime = Date.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          if (options?.enableSlowQueryLogging && duration > (options.slowQueryThreshold || 1000)) {
            logger.info(`Slow method execution: ${target.constructor.name}.${propertyKey} took ${duration}ms`);
          }
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`Method error: ${target.constructor.name}.${propertyKey} failed after ${duration}ms`, error);
          throw error;
        }
      };
    }
    return descriptor || target;
  };
}