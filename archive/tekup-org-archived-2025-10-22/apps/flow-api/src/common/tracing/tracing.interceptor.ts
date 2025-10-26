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
import { TracingService, SpanStatus } from './tracing.service.js';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TracingInterceptor.name);

  constructor(private readonly tracingService: TracingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Extract or create trace context
    const extractedContext = this.tracingService.extractContext(request.headers as Record<string, string>);
    
    if (extractedContext) {
      this.tracingService.setContext(extractedContext);
    }

    // Create operation name
    const operationName = `HTTP ${request.method} ${this.normalizeRoute(request.route?.path || request.path)}`;
    
    // Start span for HTTP request
    const span = extractedContext 
      ? this.tracingService.startSpan(operationName)
      : this.tracingService.startTrace(operationName);

    if (span) {
      // Add HTTP-specific tags
      this.tracingService.addTags({
        'http.method': request.method,
        'http.url': request.url,
        'http.path': request.path,
        'http.user_agent': request.get('User-Agent'),
        'http.remote_addr': this.getClientIp(request),
        'component': 'http-server',
        'span.kind': 'server',
        'controller.name': controller.name,
        'handler.name': handler.name,
      });

      // Add tenant information if available
      const tenantId = (request as any).tenantId;
      if (tenantId) {
        this.tracingService.addTags({
          'tenant.id': tenantId,
        });
        this.tracingService.setBaggage('tenant.id', tenantId);
      }

      // Add API key information if available
      const apiKeyId = (request as any).apiKeyId;
      if (apiKeyId) {
        this.tracingService.addTags({
          'api_key.id': apiKeyId.substring(0, 8), // Only log prefix for security
        });
      }

      // Add request size
      const contentLength = request.get('content-length');
      if (contentLength) {
        this.tracingService.addTags({
          'http.request.size': parseInt(contentLength),
        });
      }
    }

    return next.handle().pipe(
      tap((data) => {
        if (span) {
          // Add response tags
          this.tracingService.addTags({
            'http.status_code': response.statusCode,
            'http.response.size': this.getResponseSize(data),
          });

          // Add success log
          this.tracingService.addLog('info', 'HTTP request completed successfully', {
            statusCode: response.statusCode,
            responseSize: this.getResponseSize(data),
          });

          // Finish span with success status
          this.tracingService.finishSpan(span, SpanStatus.OK);
        }
      }),
      catchError((error) => {
        if (span) {
          // Add error tags
          this.tracingService.addTags({
            'error': true,
            'error.message': error.message,
            'error.name': error.constructor.name,
            'http.status_code': error.status || 500,
          });

          // Add error log
          this.tracingService.addLog('error', 'HTTP request failed', {
            error: error.message,
            stack: error.stack,
            statusCode: error.status || 500,
          });

          // Finish span with error status
          const status = this.getSpanStatusFromHttpStatus(error.status || 500);
          this.tracingService.finishSpan(span, status);
        }

        throw error;
      })
    );
  }

  private normalizeRoute(route: string): string {
    return route
      .replace(/\/:[^/]+/g, '/*') // Replace :param with *
      .replace(/\/\*/g, '/*'); // Normalize multiple wildcards
  }

  private getClientIp(request: Request): string {
    return (
      request.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      request.get('X-Real-IP') ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
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

  private getSpanStatusFromHttpStatus(httpStatus: number): SpanStatus {
    if (httpStatus >= 200 && httpStatus < 300) {
      return SpanStatus.OK;
    } else if (httpStatus === 400) {
      return SpanStatus.INVALID_ARGUMENT;
    } else if (httpStatus === 401) {
      return SpanStatus.UNAUTHENTICATED;
    } else if (httpStatus === 403) {
      return SpanStatus.PERMISSION_DENIED;
    } else if (httpStatus === 404) {
      return SpanStatus.NOT_FOUND;
    } else if (httpStatus === 409) {
      return SpanStatus.ALREADY_EXISTS;
    } else if (httpStatus === 429) {
      return SpanStatus.RESOURCE_EXHAUSTED;
    } else if (httpStatus >= 500) {
      return SpanStatus.INTERNAL;
    } else {
      return SpanStatus.UNKNOWN;
    }
  }
}