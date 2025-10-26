import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLoggerService } from './structured-logger.service.js';

export interface RequestLogContext {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  tenantId?: string;
  userId?: string;
  requestId: string;
  correlationId: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate or extract correlation ID
    const correlationId = this.extractOrGenerateCorrelationId(request);
    const requestId = this.generateRequestId();

    // Extract tenant context
    const tenantId = this.extractTenantId(request);
    const userId = this.extractUserId(request);

    // Set up logging context
    const logContext: RequestLogContext = {
      method: request.method,
      url: request.url,
      correlationId,
      requestId,
      tenantId,
      userId,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
    };

    return this.logger.runWithContext(logContext, () => {
      // Set response headers for tracing
      response.setHeader('X-Correlation-ID', correlationId);
      response.setHeader('X-Request-ID', requestId);

      // Log incoming request
      this.logIncomingRequest(request, logContext);

      return next.handle().pipe(
        tap((data) => {
          const duration = Date.now() - startTime;
          this.logSuccessfulResponse(request, response, duration, data, logContext);
        }),
        catchError((error) => {
          const duration = Date.now() - startTime;
          this.logErrorResponse(request, response, duration, error, logContext);
          throw error;
        })
      );
    });
  }

  /**
   * Extract or generate correlation ID from request
   */
  private extractOrGenerateCorrelationId(request: Request): string {
    // Check various headers for correlation ID
    const correlationId = 
      request.headers['x-correlation-id'] ||
      request.headers['x-request-id'] ||
      request.headers['correlation-id'] ||
      request.headers['request-id'];

    if (correlationId && typeof correlationId === 'string') {
      return correlationId;
    }

    return this.logger.generateCorrelationId();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantId(request: Request): string | undefined {
    // Check API key header for tenant context
    const apiKey = request.headers['x-tenant-key'] as string;
    if (apiKey) {
      // In a real implementation, you'd decode the API key to get tenant ID
      // For now, we'll check if there's a tenant ID in the request context
      return (request as any).tenantId;
    }

    // Check URL path for tenant ID (e.g., /api/tenants/:tenantId/...)
    const pathMatch = request.path.match(/\/tenants\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    return undefined;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(request: Request): string | undefined {
    // Check for user context (would be set by authentication middleware)
    return (request as any).userId || (request as any).user?.id;
  }

  /**
   * Log incoming request
   */
  private logIncomingRequest(request: Request, logContext: RequestLogContext): void {
    const context = {
      method: request.method,
      url: this.sanitizeUrl(request.url),
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      contentLength: request.headers['content-length'],
      contentType: request.headers['content-type'],
      query: this.sanitizeQuery(request.query),
      params: request.params,
    };

    this.logger.http(`Incoming ${request.method} ${request.path}`, context);
  }

  /**
   * Log successful response
   */
  private logSuccessfulResponse(
    request: Request,
    response: Response,
    duration: number,
    data: any,
    logContext: RequestLogContext
  ): void {
    const context = {
      method: request.method,
      url: this.sanitizeUrl(request.url),
      statusCode: response.statusCode,
      contentLength: response.getHeader('content-length'),
      responseSize: this.getResponseSize(data),
    };

    this.logger.apiRequest(
      request.method,
      request.path,
      response.statusCode,
      duration,
      context
    );

    // Log slow requests
    if (duration > 1000) {
      this.logger.warn(`Slow request detected`, {
        ...context,
        duration,
        threshold: 1000,
      });
    }
  }

  /**
   * Log error response
   */
  private logErrorResponse(
    request: Request,
    response: Response,
    duration: number,
    error: any,
    logContext: RequestLogContext
  ): void {
    const context = {
      method: request.method,
      url: this.sanitizeUrl(request.url),
      statusCode: error.status || 500,
      errorName: error.name,
      errorMessage: error.message,
    };

    this.logger.error(
      `Request failed: ${request.method} ${request.path}`,
      error,
      context
    );

    this.logger.apiRequest(
      request.method,
      request.path,
      error.status || 500,
      duration,
      context
    );
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    ) as string;
  }

  /**
   * Sanitize URL for logging
   */
  private sanitizeUrl(url: string): string {
    // Remove sensitive query parameters
    return url.replace(/([?&])(password|token|key|secret|api_key)=[^&]*/gi, '$1$2=***');
  }

  /**
   * Sanitize query parameters
   */
  private sanitizeQuery(query: any): any {
    if (!query || typeof query !== 'object') {
      return query;
    }

    const sanitized = { ...query };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '***';
      }
    });

    return sanitized;
  }

  /**
   * Get response size estimate
   */
  private getResponseSize(data: any): number {
    if (!data) return 0;
    
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}