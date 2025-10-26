import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { RateLimitingService, RateLimitConfig, RateLimitInfo } from './rate-limiting.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';

export const RATE_LIMIT_KEY = 'rate_limit';

/**
 * Decorator to configure rate limiting for a specific endpoint
 */
export function RateLimit(config: Partial<RateLimitConfig>) {
  return (target: any, propertyName?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, target);
    }
    return descriptor || target;
  };
}

@Injectable()
export class RateLimitingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RateLimitingInterceptor.name);

  constructor(
    private readonly rateLimitingService: RateLimitingService,
    private readonly reflector: Reflector,
    private readonly contextService: AsyncContextService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestStartTime = Date.now();

    // Extract tenant and identifier information
    const tenantId = this.extractTenantId(request);
    const identifier = this.extractIdentifier(request);
    const endpoint = this.extractEndpoint(request);
    const method = request.method;
    const userAgent = request.get('User-Agent');
    const sourceIp = this.extractSourceIp(request);

    // Check for endpoint-specific rate limit configuration
    const handler = context.getHandler();
    const rateLimitConfig = this.reflector.get<Partial<RateLimitConfig>>(
      RATE_LIMIT_KEY,
      handler
    );

    try {
      // Apply rate limiting with initial check (no response time yet)
      const rateLimitInfo = await this.rateLimitingService.checkRateLimit(
        tenantId,
        identifier,
        endpoint,
        method,
        userAgent,
        sourceIp
      );

      // Add rate limit headers
      this.addRateLimitHeaders(response, rateLimitInfo);

      // Check if rate limit is exceeded
      if (rateLimitInfo.isLimited) {
        // Throw exception (handled by RateLimitingService)
        await this.rateLimitingService.enforceRateLimit(
          tenantId,
          identifier,
          endpoint,
          method,
          userAgent
        );
      }

      // Continue with request processing
      return next.handle().pipe(
        tap(async (data) => {
          // Calculate response time and record for adaptive analysis
          const responseTime = Date.now() - requestStartTime;
          
          try {
            await this.rateLimitingService.checkRateLimit(
              tenantId,
              identifier,
              endpoint,
              method,
              userAgent,
              sourceIp,
              responseTime,
              false // Not an error since we're in tap()
            );
          } catch (error) {
            // Ignore errors in post-request recording
          }
          
          // Update rate limit headers with final values after request completion
          this.updateRateLimitHeaders(response, rateLimitInfo);
        }),
        catchError(async (error) => {
          // Record error for adaptive analysis
          const responseTime = Date.now() - requestStartTime;
          
          try {
            await this.rateLimitingService.checkRateLimit(
              tenantId,
              identifier,
              endpoint,
              method,
              userAgent,
              sourceIp,
              responseTime,
              true // This is an error
            );
          } catch (recordError) {
            // Ignore errors in error recording
          }
          
          throw error;
        })
      );
    } catch (error) {
      // If rate limiting fails, add error headers and continue
      if (error.name === 'TooManyRequestsException') {
        throw error; // Re-throw rate limit exceptions
      }

      this.logger.warn(
        `Rate limiting check failed for ${tenantId}:${identifier}:${endpoint}`,
        error
      );

      // Continue without rate limiting on error
      return next.handle();
    }
  }

  private extractTenantId(request: Request): string {
    // Extract tenant ID from request context
    return (request as any).tenantId || 
           request.params?.tenant || 
           request.headers['x-tenant-id'] as string || 
           'default';
  }

  private extractIdentifier(request: Request): string {
    // Use API key if available, otherwise IP address
    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `api:${apiKey}`;
    }

    // Get real IP address considering proxies
    const ip = request.ip || 
               request.connection.remoteAddress || 
               request.headers['x-forwarded-for'] as string ||
               request.headers['x-real-ip'] as string ||
               'unknown';

    return `ip:${Array.isArray(ip) ? ip[0] : ip}`;
  }

  private extractEndpoint(request: Request): string {
    // Normalize endpoint path for rate limiting
    let path = request.route?.path || request.path;
    
    // Replace parameter placeholders for consistent grouping
    path = path.replace(/\/:\w+/g, '/*');
    path = path.replace(/\/\d+/g, '/*');
    
    return path;
  }

  private addRateLimitHeaders(response: Response, rateLimitInfo: RateLimitInfo): void {
    response.setHeader('X-RateLimit-Limit', rateLimitInfo.maxRequests);
    response.setHeader('X-RateLimit-Remaining', rateLimitInfo.remainingRequests);
    response.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime.getTime() / 1000));
    response.setHeader('X-RateLimit-Window', Math.ceil(rateLimitInfo.windowMs / 1000));

    if (rateLimitInfo.isLimited) {
      response.setHeader('Retry-After', rateLimitInfo.retryAfter);
    }
  }

  private extractSourceIp(request: Request): string {
    // Get real IP address considering proxies
    const ip = request.ip || 
               request.connection.remoteAddress || 
               request.headers['x-forwarded-for'] as string ||
               request.headers['x-real-ip'] as string ||
               'unknown';

    return Array.isArray(ip) ? ip[0] : ip;
  }

  private updateRateLimitHeaders(response: Response, rateLimitInfo: RateLimitInfo): void {
    // Update remaining count after successful request processing
    const remaining = Math.max(0, rateLimitInfo.remainingRequests - 1);
    response.setHeader('X-RateLimit-Remaining', remaining);
  }
}