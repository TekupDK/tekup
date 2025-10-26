import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const method = req.method;
    // Normalize route to prevent cardinality explosion
    const route = this.normalizeRoute(req.route?.path || req.path);

    // Capture response finish to record metrics
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      const status = res.statusCode;

      // Record request counter with labels
      this.metricsService.increment('http_requests_total', {
        method,
        route,
        status: status.toString()
      });

      // Record request duration histogram
      this.metricsService.histogram('http_request_duration_seconds', duration, {
        method,
        route
      });
    });

    next();
  }

  /**
   * Normalize route paths to prevent cardinality explosion
   * e.g., /leads/123 -> /leads/:id
   */
  private normalizeRoute(path: string): string {
    // Replace ID-like patterns with placeholders
    return path
      .replace(/\/\d+[\/]?/g, '/:id/')
      .replace(/\/:id\/$/, '/:id');
  }
}