import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TekUpSSOService } from '../sso.service.js';
import { UserRole } from '../types/auth.types.js';

@Injectable()
export class TekUpAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly ssoService: TekUpSSOService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from Authorization header or x-tenant-key header (for backward compatibility)
    const authHeader = request.headers.authorization;
    const tenantKey = request.headers['x-tenant-key'];
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tenantKey) {
      // Handle legacy API key authentication
      token = tenantKey;
    }

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify token and get tenant context
      const tenantContext = await this.ssoService.verifyToken(token);
      
      // Add tenant context to request for controllers to use
      request.user = tenantContext;
      request.tenantId = tenantContext.tenantId;
      
      // Check role requirements if specified
      const requiredRole = this.reflector.get<UserRole>('role', context.getHandler());
      if (requiredRole && !this.ssoService.validateRole(tenantContext.role, requiredRole)) {
        throw new UnauthorizedException('Insufficient permissions');
      }
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
}
