import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

const RATE_LIMIT_KEY = 'rateLimit';

// In-memory store for rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, descriptor.value);
    } else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, config, target);
    }
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    ) || this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getClass(),
    );

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getKey(request);
    const now = Date.now();

    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      requestCounts.set(key, {
        count: 1,
        resetTime: now + rateLimitConfig.windowMs,
      });
      return true;
    }

    if (record.count >= rateLimitConfig.maxRequests) {
      const message = rateLimitConfig.message || 'Too many requests';
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  private getKey(request: Request): string {
    // Use IP address and user ID (if authenticated) as key
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const userId = (request as any).user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }
}