import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Guard that validates API key is present in request
 * Should be applied after ApiKeyMiddleware has validated the key
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if tenantId was set by ApiKeyMiddleware
    const tenantId = (request as any).tenantId;
    const apiKeyId = (request as any).apiKeyId;
    
    if (!tenantId || !apiKeyId) {
      throw new UnauthorizedException({
        error: 'missing_valid_api_key',
        message: 'Valid API key required for this endpoint'
      });
    }
    
    return true;
  }
}
