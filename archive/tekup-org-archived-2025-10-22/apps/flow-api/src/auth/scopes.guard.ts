import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SCOPES_KEY } from './scopes.decorator.js';
import { CROSS_TENANT_KEY, BUSINESS_ACCESS_KEY } from './cross-tenant.decorator.js';

/**
 * Guard that validates API key has required scopes
 * Must be used after ApiKeyGuard or ApiKeyMiddleware
 */
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required scopes from decorator metadata
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get cross-tenant requirements
    const crossTenantRequired = this.reflector.getAllAndOverride<string[]>(CROSS_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get business access requirements
    const businessAccessRequired = this.reflector.getAllAndOverride<string[]>(BUSINESS_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no requirements, allow access
    if ((!requiredScopes || requiredScopes.length === 0) && 
        (!crossTenantRequired || crossTenantRequired.length === 0) &&
        (!businessAccessRequired || businessAccessRequired.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = (request as any).tenantId;
    const apiKeyScopes: string[] = (request as any).apiKeyScopes || [];
    
    if (!tenantId) {
      throw new UnauthorizedException({
        error: 'missing_api_key_context',
        message: 'API key validation must occur before scope validation'
      });
    }

    // Check for admin scope (superuser)
    const hasAdminScope = apiKeyScopes.includes('admin');
    if (hasAdminScope) {
      return true;
    }

    // Validate cross-tenant access
    if (crossTenantRequired && crossTenantRequired.length > 0) {
      if (!this.hasCrossTenantPermission(apiKeyScopes, crossTenantRequired)) {
        throw new ForbiddenException({
          error: 'insufficient_cross_tenant_permissions',
          message: 'Cross-tenant operations require specific permissions',
          required: crossTenantRequired,
          provided: apiKeyScopes
        });
      }
    }

    // Validate business-specific access
    if (businessAccessRequired && businessAccessRequired.length > 0) {
      if (!this.hasBusinessPermission(apiKeyScopes, businessAccessRequired, tenantId)) {
        throw new ForbiddenException({
          error: 'insufficient_business_permissions',
          message: 'Business-specific operations require appropriate permissions',
          required: businessAccessRequired,
          provided: apiKeyScopes
        });
      }
    }

    // Check if API key has any of the required scopes
    if (requiredScopes && requiredScopes.length > 0) {
      const hasRequiredScope = requiredScopes.some(scope => apiKeyScopes.includes(scope));
      
      if (!hasRequiredScope) {
        throw new ForbiddenException({
          error: 'insufficient_scopes',
          message: 'API key lacks required scopes for this operation',
          required: requiredScopes,
          provided: apiKeyScopes
        });
      }
    }
    
    return true;
  }

  /**
   * Check if operation requires cross-tenant access
   */
  private requiresCrossTenantAccess(requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => scope.startsWith('cross_tenant:'));
  }

  /**
   * Check if operation requires business-specific access
   */
  private requiresBusinessAccess(requiredScopes: string[]): boolean {
    return requiredScopes.some(scope => scope.startsWith('business:'));
  }

  /**
   * Validate cross-tenant permissions
   */
  private hasCrossTenantPermission(apiKeyScopes: string[], requiredScopes: string[]): boolean {
    const crossTenantScopes = requiredScopes.filter(scope => scope.startsWith('cross_tenant:'));
    
    return crossTenantScopes.every(scope => {
      if (scope === 'cross_tenant:admin') {
        return apiKeyScopes.includes('cross_tenant:admin');
      }
      if (scope === 'cross_tenant:write') {
        return apiKeyScopes.includes('cross_tenant:write') || apiKeyScopes.includes('cross_tenant:admin');
      }
      if (scope === 'cross_tenant:read') {
        return apiKeyScopes.includes('cross_tenant:read') || 
               apiKeyScopes.includes('cross_tenant:write') || 
               apiKeyScopes.includes('cross_tenant:admin');
      }
      return false;
    });
  }

  /**
   * Validate business-specific permissions
   */
  private hasBusinessPermission(apiKeyScopes: string[], requiredScopes: string[], tenantId: string): boolean {
    const businessScopes = requiredScopes.filter(scope => scope.startsWith('business:'));
    
    // Map tenant IDs to business scopes (this should be configured per environment)
    const tenantBusinessMap: Record<string, string> = {
      'foodtruck-tenant-id': 'business:foodtruck',
      'essenza-tenant-id': 'business:essenza',
      'rendetalje-tenant-id': 'business:rendetalje',
      'tekup-admin-tenant-id': 'business:tekup_admin',
    };

    const requiredBusinessScope = tenantBusinessMap[tenantId];
    if (!requiredBusinessScope) {
      return false;
    }

    return businessScopes.every(scope => {
      // Allow access if scope matches tenant's business or is tekup_admin
      return scope === requiredBusinessScope || scope === 'business:tekup_admin';
    });
  }
}
