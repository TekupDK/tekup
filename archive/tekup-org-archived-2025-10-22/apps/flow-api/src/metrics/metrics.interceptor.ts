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
import { BusinessMetricsService } from './business-metrics.service.js';
import { MetricsService } from './metrics.service.js';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(
    private readonly businessMetricsService: BusinessMetricsService,
    private readonly metricsService: MetricsService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const method = request.method;
    const endpoint = request.route?.path || request.path;
    const tenantId = (request as any).tenantId;
    const apiKeyId = (request as any).apiKeyId;
    const userAgent = request.get('User-Agent');
    const contentLength = parseInt(request.get('content-length') || '0');

    // Record request start
    this.metricsService.increment('http_requests_started_total', {
      method,
      endpoint: this.normalizeEndpoint(endpoint),
      tenant: tenantId || 'unknown',
    });

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;
        const responseSize = this.getResponseSize(data);

        // Record successful request metrics
        this.recordRequestMetrics(
          method,
          endpoint,
          statusCode,
          responseTime,
          tenantId,
          apiKeyId,
          userAgent,
          contentLength,
          responseSize
        );

        // Record tenant-specific metrics
        if (tenantId) {
          this.recordTenantMetrics(tenantId, method, endpoint, responseTime, statusCode);
        }

        // Record API key metrics
        if (apiKeyId) {
          this.recordApiKeyMetrics(apiKeyId, method, endpoint, responseTime, statusCode, tenantId);
        }

        // Record business events for important endpoints
        this.recordBusinessEvents(method, endpoint, statusCode, tenantId);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Record error metrics
        this.recordRequestMetrics(
          method,
          endpoint,
          statusCode,
          responseTime,
          tenantId,
          apiKeyId,
          userAgent,
          contentLength,
          0
        );

        // Record error-specific metrics
        this.metricsService.increment('http_errors_total', {
          method,
          endpoint: this.normalizeEndpoint(endpoint),
          status_code: statusCode.toString(),
          error_type: error.constructor.name,
          tenant: tenantId || 'unknown',
        });

        // Record error response time
        this.metricsService.histogram('http_error_duration_seconds', responseTime / 1000, {
          method,
          endpoint: this.normalizeEndpoint(endpoint),
          status_code: statusCode.toString(),
          tenant: tenantId || 'unknown',
        });

        throw error;
      })
    );
  }

  private recordRequestMetrics(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    tenantId?: string,
    apiKeyId?: string,
    userAgent?: string,
    requestSize?: number,
    responseSize?: number
  ): void {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);

    // Use business metrics service for comprehensive recording
    this.businessMetricsService.recordHttpRequest(
      method,
      normalizedEndpoint,
      statusCode,
      responseTime,
      tenantId
    );

    // Record additional detailed metrics
    if (requestSize) {
      this.metricsService.histogram('http_request_size_bytes', requestSize, {
        method,
        endpoint: normalizedEndpoint,
        tenant: tenantId || 'unknown',
      });
    }

    if (responseSize) {
      this.metricsService.histogram('http_response_size_bytes', responseSize, {
        method,
        endpoint: normalizedEndpoint,
        status_code: statusCode.toString(),
        tenant: tenantId || 'unknown',
      });
    }

    // Record user agent metrics (for API client tracking)
    if (userAgent) {
      const clientType = this.categorizeUserAgent(userAgent);
      this.metricsService.increment('http_requests_by_client_total', {
        client_type: clientType,
        tenant: tenantId || 'unknown',
      });
    }

    // Record slow requests
    if (responseTime > 5000) { // 5 seconds threshold
      this.metricsService.increment('http_slow_requests_total', {
        method,
        endpoint: normalizedEndpoint,
        tenant: tenantId || 'unknown',
      });
    }

    // Record concurrent requests (approximate)
    const concurrentRequests = this.estimateConcurrentRequests();
    this.metricsService.gauge('http_concurrent_requests', concurrentRequests);
  }

  private recordTenantMetrics(
    tenantId: string,
    method: string,
    endpoint: string,
    responseTime: number,
    statusCode: number
  ): void {
    // Record tenant-specific request volume
    this.metricsService.increment('tenant_requests_total', {
      tenant: tenantId,
      method,
    });

    // Record tenant response times
    this.metricsService.histogram('tenant_response_time_seconds', responseTime / 1000, {
      tenant: tenantId,
    });

    // Record tenant error rates
    if (statusCode >= 400) {
      this.metricsService.increment('tenant_errors_total', {
        tenant: tenantId,
        status_code: statusCode.toString(),
      });
    }

    // Update tenant activity timestamp
    this.metricsService.gauge('tenant_last_activity_timestamp', Date.now(), {
      tenant: tenantId,
    });
  }

  private recordApiKeyMetrics(
    apiKeyId: string,
    method: string,
    endpoint: string,
    responseTime: number,
    statusCode: number,
    tenantId?: string
  ): void {
    // Record API key usage
    this.metricsService.increment('api_key_requests_total', {
      api_key_id: apiKeyId.substring(0, 8), // Only record prefix for privacy
      method,
      endpoint: this.normalizeEndpoint(endpoint),
      tenant: tenantId || 'unknown',
    });

    // Record API key response times
    this.metricsService.histogram('api_key_response_time_seconds', responseTime / 1000, {
      api_key_id: apiKeyId.substring(0, 8),
      tenant: tenantId || 'unknown',
    });

    // Record API key errors
    if (statusCode >= 400) {
      this.metricsService.increment('api_key_errors_total', {
        api_key_id: apiKeyId.substring(0, 8),
        status_code: statusCode.toString(),
        tenant: tenantId || 'unknown',
      });
    }

    // Update API key last used timestamp
    this.metricsService.gauge('api_key_last_used_timestamp', Date.now(), {
      api_key_id: apiKeyId.substring(0, 8),
    });
  }

  private recordBusinessEvents(
    method: string,
    endpoint: string,
    statusCode: number,
    tenantId?: string
  ): void {
    if (!tenantId) return;

    const normalizedEndpoint = this.normalizeEndpoint(endpoint);

    // Record lead creation events
    if (method === 'POST' && normalizedEndpoint.includes('/leads') && statusCode === 201) {
      this.businessMetricsService.recordBusinessEvent('lead_created', tenantId);
    }

    // Record lead status change events
    if (method === 'PATCH' && normalizedEndpoint.includes('/leads') && normalizedEndpoint.includes('/status') && statusCode === 200) {
      this.businessMetricsService.recordBusinessEvent('lead_status_changed', tenantId);
    }

    // Record form submission events
    if (method === 'POST' && normalizedEndpoint.includes('/ingest') && statusCode === 201) {
      this.businessMetricsService.recordBusinessEvent('form_submission', tenantId);
    }

    // Record API key events
    if (normalizedEndpoint.includes('/auth/api-keys')) {
      if (method === 'POST' && statusCode === 201) {
        this.businessMetricsService.recordBusinessEvent('api_key_created', tenantId);
      } else if (method === 'POST' && normalizedEndpoint.includes('/rotate') && statusCode === 200) {
        this.businessMetricsService.recordBusinessEvent('api_key_rotated', tenantId);
      } else if (method === 'DELETE' && statusCode === 200) {
        this.businessMetricsService.recordBusinessEvent('api_key_revoked', tenantId);
      }
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\/[0-9a-f-]{36}/g, '/:id') // Replace UUIDs with :id
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs with :id
      .replace(/\/[^\/]+@[^\/]+/g, '/:email') // Replace emails with :email
      .toLowerCase();
  }

  private categorizeUserAgent(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('postman')) return 'postman';
    if (ua.includes('insomnia')) return 'insomnia';
    if (ua.includes('curl')) return 'curl';
    if (ua.includes('wget')) return 'wget';
    if (ua.includes('python')) return 'python';
    if (ua.includes('node')) return 'nodejs';
    if (ua.includes('java')) return 'java';
    if (ua.includes('go-http-client')) return 'go';
    if (ua.includes('axios')) return 'axios';
    if (ua.includes('fetch')) return 'fetch';
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari')) return 'safari';
    if (ua.includes('bot') || ua.includes('crawler')) return 'bot';
    
    return 'other';
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      } else if (typeof data === 'object') {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private estimateConcurrentRequests(): number {
    // This is a simplified estimation - in production you'd want a more accurate method
    // possibly using a sliding window counter or integration with load balancer metrics
    return Math.floor(Math.random() * 10) + 1; // Placeholder
  }
}