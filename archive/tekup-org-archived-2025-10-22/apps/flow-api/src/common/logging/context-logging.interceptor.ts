import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { StructuredLogger } from './structured-logger.service.js';
import { AsyncContextService, RequestContext } from './async-context.service.js';

@Injectable()
export class ContextLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: StructuredLogger,
    private readonly contextService: AsyncContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Skip for health checks and metrics
    if (this.shouldSkipLogging(request.path)) {
      return next.handle();
    }

    // Create request context
    const requestContext: RequestContext = {
      correlationId: this.extractOrGenerateCorrelationId(request),
      requestId: this.extractOrGenerateRequestId(request),
      tenantId: (request as any).tenantId,
      userId: (request as any).userId,
      startTime,
      endpoint: request.path,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: this.extractClientIp(request),
    };

    // Set headers for downstream services
    response.setHeader('X-Correlation-ID', requestContext.correlationId);
    response.setHeader('X-Request-ID', requestContext.requestId);

    // Attach to request for backward compatibility
    (request as any).correlationId = requestContext.correlationId;
    (request as any).requestId = requestContext.requestId;

    // Run within async context
    return new Observable(subscriber => {
      this.contextService.run(requestContext, () => {
        // Log request start
        this.logger.logRequestStart(this.contextService.toLogContext());

        // Execute the request handler
        const handler = next.handle().pipe(
          tap(async (responseData) => {
            const duration = Date.now() - startTime;
            
            // Update context with response info
            this.contextService.updateContext({
              metadata: {
                statusCode: response.statusCode,
                contentLength: response.get('Content-Length'),
                cacheStatus: response.get('X-Cache'),
              },
            });

            // Log successful completion
            this.logger.logRequestEnd({
              ...this.contextService.toLogContext(),
              statusCode: response.statusCode,
              duration,
            });

            // Log performance metrics
            this.logger.logPerformanceMetric(
              `${request.method} ${request.path}`,
              duration,
              'ms',
              this.contextService.toLogContext()
            );

            // Log slow requests
            if (duration > 1000) {
              this.logger.warn('Slow request detected', {
                ...this.contextService.toLogContext(),
                metadata: {
                  slowRequest: true,
                  threshold: 1000,
                  actualDuration: duration,
                },
              });
            }
          }),
          catchError(async (error) => {
            const duration = Date.now() - startTime;
            
            // Update context with error info
            this.contextService.updateContext({
              metadata: {
                error: {
                  name: error.name,
                  message: error.message,
                  code: error.code,
                  statusCode: error.statusCode,
                },
              },
            });

            // Log error
            this.logger.error(
              `Request failed: ${error.message}`,
              {
                ...this.contextService.toLogContext(),
                statusCode: response.statusCode || 500,
                duration,
                errorCode: error.name,
                stackTrace: error.stack,
              }
            );

            // Log security events if relevant
            if (this.isSecurityRelevantError(error)) {
              this.logger.logSecurityEvent(
                'request_error',
                this.determineSecuritySeverity(error),
                this.contextService.toLogContext()
              );
            }

            throw error;
          })
        );

        handler.subscribe(subscriber);
      });
    });
  }

  private shouldSkipLogging(path: string): boolean {
    const excludePaths = ['/health', '/metrics', '/favicon.ico'];
    return excludePaths.some(excludePath => path.includes(excludePath));
  }

  private extractOrGenerateCorrelationId(request: Request): string {
    return (
      request.get('X-Correlation-ID') ||
      request.get('Correlation-ID') ||
      StructuredLogger.generateCorrelationId()
    );
  }

  private extractOrGenerateRequestId(request: Request): string {
    return (
      request.get('X-Request-ID') ||
      request.get('Request-ID') ||
      StructuredLogger.generateRequestId()
    );
  }

  private extractClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      request.get('X-Real-IP') ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private isSecurityRelevantError(error: any): boolean {
    const securityErrorCodes = [
      'UNAUTHORIZED',
      'FORBIDDEN', 
      'INVALID_TOKEN',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_API_KEY',
    ];

    return (
      securityErrorCodes.includes(error.code) ||
      error.statusCode === 401 ||
      error.statusCode === 403 ||
      error.statusCode === 429
    );
  }

  private determineSecuritySeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    if (error.statusCode === 401) return 'medium';
    if (error.statusCode === 403) return 'high';
    if (error.statusCode === 429) return 'medium';
    if (error.code === 'INVALID_API_KEY') return 'high';
    return 'low';
  }
}