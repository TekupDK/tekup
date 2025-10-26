import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StructuredLoggerService } from './structured-logger.service.js';

export interface RequestWithContext extends Request {
  correlationId: string;
  requestId: string;
  tenantId?: string;
  userId?: string;
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly logger: StructuredLoggerService) {}

  use(req: RequestWithContext, res: Response, next: NextFunction): void {
    // Extract or generate correlation ID
    const correlationId = this.extractOrGenerateCorrelationId(req);
    const requestId = this.generateRequestId();

    // Set correlation ID on request object
    req.correlationId = correlationId;
    req.requestId = requestId;

    // Set response headers
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Request-ID', requestId);

    // Set up logging context for this request
    const context = {
      correlationId,
      requestId,
      tenantId: this.extractTenantId(req),
      userId: this.extractUserId(req),
    };

    // Store context in async local storage
    this.logger.runWithContext(context, () => {
      next();
    });
  }

  /**
   * Extract or generate correlation ID from request headers
   */
  private extractOrGenerateCorrelationId(req: Request): string {
    const headers = [
      'x-correlation-id',
      'x-request-id',
      'correlation-id',
      'request-id',
      'x-trace-id',
    ];

    for (const header of headers) {
      const value = req.headers[header];
      if (value && typeof value === 'string' && this.isValidCorrelationId(value)) {
        return value;
      }
    }

    return this.logger.generateCorrelationId();
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `req_${timestamp}_${random}`;
  }

  /**
   * Extract tenant ID from request
   */
  private extractTenantId(req: Request): string | undefined {
    // Check API key header
    const apiKey = req.headers['x-tenant-key'] as string;
    if (apiKey) {
      // In production, decode the API key to get tenant ID
      return (req as any).tenantId;
    }

    // Check URL path patterns
    const pathPatterns = [
      /\/api\/tenants\/([^\/]+)/,
      /\/t\/([^\/]+)/,
      /\/tenant\/([^\/]+)/,
    ];

    for (const pattern of pathPatterns) {
      const match = req.path.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Check query parameter
    const tenantId = req.query.tenantId as string;
    if (tenantId) {
      return tenantId;
    }

    return undefined;
  }

  /**
   * Extract user ID from request
   */
  private extractUserId(req: Request): string | undefined {
    // Check for user context set by authentication middleware
    const user = (req as any).user;
    if (user) {
      return user.id || user.userId || user.sub;
    }

    // Check headers
    const userId = req.headers['x-user-id'] as string;
    if (userId) {
      return userId;
    }

    return undefined;
  }

  /**
   * Validate correlation ID format
   */
  private isValidCorrelationId(id: string): boolean {
    // Check if it's a valid UUID or similar format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const customIdRegex = /^[a-zA-Z0-9_-]{8,64}$/;
    
    return uuidRegex.test(id) || customIdRegex.test(id);
  }
}