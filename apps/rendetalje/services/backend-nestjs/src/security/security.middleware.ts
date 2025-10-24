import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'ws:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })(req, res, () => {});

    // CORS configuration
    const allowedOrigins = this.configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'https://app.rendetalje.dk',
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}

// Rate limiting configurations
export const createRateLimiters = (configService: ConfigService) => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    // General API rate limiting
    general: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // Authentication endpoints (stricter)
    auth: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 5 : 50, // limit each IP to 5 login attempts per windowMs in production
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    }),

    // Password reset (very strict)
    passwordReset: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: isProduction ? 3 : 10, // limit each IP to 3 password reset attempts per hour in production
      message: {
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: '1 hour',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    // File upload endpoints
    upload: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProduction ? 20 : 100, // limit each IP to 20 uploads per windowMs in production
      message: {
        error: 'Too many upload attempts, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  };
};