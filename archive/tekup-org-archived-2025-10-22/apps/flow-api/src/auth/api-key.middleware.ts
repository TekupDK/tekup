import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EnhancedApiKeyService } from './enhanced-api-key.service.js';
import { TenantContextService } from './tenant-context.service.js';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-flow-api-src-auth-api-key');

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {

  constructor(
    private prisma: PrismaService,
    private enhancedApiKeyService: EnhancedApiKeyService,
    private tenantContextService: TenantContextService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const key = req.header('x-tenant-key') || req.header('x-api-key');
    if (!key) {
      throw new UnauthorizedException({ error: 'missing_api_key' });
    }

    // Extract client information for security validation
    const ipAddress = this.extractClientIp(req);
    const userAgent = req.get('User-Agent');

    // Validate API key using enhanced service
    const validationResult = await this.enhancedApiKeyService.validateApiKey(
      key,
      ipAddress,
      userAgent
    );

    if (!validationResult.valid || !validationResult.apiKey) {
      throw new UnauthorizedException({ 
        error: 'invalid_api_key',
        reason: validationResult.reason 
      });
    }

    const apiKey = validationResult.apiKey;

    // Set request context
    (req as any).tenantId = apiKey.tenantId;
    (req as any).apiKeyId = apiKey.id;
    (req as any).apiKeyScopes = apiKey.scopes || [];
    (req as any).apiKeyPermissions = apiKey.permissions || [];
    (req as any).apiKeyEnvironment = apiKey.environment;

    // Add rotation warning header if key should be rotated
    if (validationResult.shouldRotate) {
      res.setHeader('X-API-Key-Rotation-Recommended', 'true');
      res.setHeader('X-API-Key-Rotation-Reason', 'Key should be rotated for security');
    }

    // Set PostgreSQL tenant context for RLS using safe parameterized query
    try {
      await this.tenantContextService.setTenantContext(apiKey.tenantId);
    } catch (e) {
      logger.warn('Failed to set tenant context for RLS:', e);
    }

    // Log API key usage (async, don't block request)
    const startTime = Date.now();
    
    // Capture response for usage logging
    const originalSend = res.send;
    let responseSize = 0;
    let responseStatus = 200;
    
    res.send = function(data) {
      responseStatus = res.statusCode;
      if (data) {
        responseSize = Buffer.byteLength(data.toString(), 'utf8');
      }
      return originalSend.call(this, data);
    };

    // Handle response end for usage logging
    res.on('finish', async () => {
      const responseTime = Date.now() - startTime;
      const requestSize = req.get('content-length') ? parseInt(req.get('content-length')!) : 0;
      
      // Log usage asynchronously
      setImmediate(async () => {
        try {
          await this.enhancedApiKeyService.logUsage(apiKey.id, {
            endpoint: req.path,
            method: req.method,
            responseStatus,
            responseTime,
            userAgent,
            ipAddress,
            requestSize,
            responseSize,
            metadata: {
              query: req.query,
              // Don't log sensitive body data
              hasBody: !!req.body,
            },
          });
        } catch (error) {
          logger.warn('Failed to log API key usage:', error);
        }
      });
    });

    next();
  }

  private extractClientIp(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
      req.get('X-Real-IP') ||
      req.connection?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}