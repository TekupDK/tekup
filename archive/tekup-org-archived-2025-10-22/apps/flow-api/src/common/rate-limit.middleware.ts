import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RateLimitException } from './rate-limit.exception.js';
import { MetricsService } from '../metrics/metrics.service.js';

interface Bucket { tokens: number; updated: number }
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private buckets = new Map<string, Bucket>();
  private capacity = 60; // 60 requests
  private refillPerSec = 1; // 1 token per second (60/sec window ~1/min capacity)
  constructor(private metrics?: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const key = req.header('x-tenant-key') || 'anon';
    const now = Date.now();
    let b = this.buckets.get(key);
    if (!b) { b = { tokens: this.capacity, updated: now }; this.buckets.set(key, b); }
    const deltaSec = (now - b.updated)/1000;
    if (deltaSec > 0) {
      b.tokens = Math.min(this.capacity, b.tokens + deltaSec * this.refillPerSec);
      b.updated = now;
    }
    if (b.tokens < 1) {
      // Remaining time to a single token
      const retryMs = 1000 - ((now - b.updated) % 1000);
      res.setHeader('Retry-After', Math.ceil(retryMs/1000));
      res.setHeader('X-RateLimit-Limit', this.capacity.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      if (this.metrics) this.metrics.increment('rate_limit_exceeded_total', { tenant: (req as any).tenantId || 'unknown' });
      throw new RateLimitException();
    }
    b.tokens -= 1;
    if (this.metrics) this.metrics.increment('rate_limited_requests_total', { tenant: (req as any).tenantId || 'unknown' });
    res.setHeader('X-RateLimit-Limit', this.capacity.toString());
    res.setHeader('X-RateLimit-Remaining', Math.floor(b.tokens).toString());
    next();
  }
}