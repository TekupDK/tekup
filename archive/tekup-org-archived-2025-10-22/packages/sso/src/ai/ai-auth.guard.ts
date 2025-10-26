import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TekUpSSOService } from '../sso.service.js';
import { TekUpAIAuthService } from './ai-auth.service.js';
import { AIServiceCategory, AIServicePermission } from '../types/auth.types.js';

@Injectable()
export class AIAuthGuard implements CanActivate {
  constructor(
    private readonly ssoService: TekUpSSOService,
    private readonly aiAuthService: TekUpAIAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authentication token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Verify token and get user context
      const userContext = await this.ssoService.verifyToken(token);
      
      // Add user context to request
      request.user = userContext;
      request.tenantId = userContext.tenantId;

      // Check AI service permissions if specified
      const requiredService = this.reflector.get<AIServiceCategory>('aiService', context.getHandler());
      const requiredPermission = this.reflector.get<AIServicePermission>('aiPermission', context.getHandler());
      
      if (requiredService && requiredPermission) {
        const hasPermission = await this.aiAuthService.checkPermission({
          service: requiredService,
          action: requiredPermission,
          tenantId: userContext.tenantId!,
          userId: userContext.userId
        });

        if (!hasPermission) {
          throw new ForbiddenException(`Insufficient permissions for ${requiredService}:${requiredPermission}`);
        }

        // Check quota if specified
        const checkQuota = this.reflector.get<boolean>('checkQuota', context.getHandler());
        if (checkQuota) {
          const quotaCheck = await this.aiAuthService.checkQuota(
            userContext.userId,
            userContext.tenantId!,
            requiredService
          );

          if (!quotaCheck.allowed) {
            throw new ForbiddenException('AI service quota exceeded. Please try again later.');
          }
        }

        // Track usage
        await this.aiAuthService.trackUsage({
          tenantId: userContext.tenantId!,
          userId: userContext.userId,
          service: requiredService,
          action: requiredPermission,
          timestamp: new Date(),
          metadata: {
            endpoint: request.url,
            method: request.method,
            userAgent: request.headers['user-agent']
          }
        });
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}

