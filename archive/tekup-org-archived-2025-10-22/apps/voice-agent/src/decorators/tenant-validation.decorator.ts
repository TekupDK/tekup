import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const ValidateTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.body?.tenantId;
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID required');
    }
    
    // Validate tenant format (UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new UnauthorizedException('Invalid tenant ID format');
    }
    
    return tenantId;
  },
);

export const ValidateTenantAccess = createParamDecorator(
  (data: { allowedTenants: string[] }, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.body?.tenantId;
    
    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID required');
    }
    
    // Validate tenant format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new UnauthorizedException('Invalid tenant ID format');
    }
    
    // Check if tenant is in allowed list
    if (data?.allowedTenants && !data.allowedTenants.includes(tenantId)) {
      throw new UnauthorizedException(`Access denied: Tenant ${tenantId} not authorized for this operation`);
    }
    
    return tenantId;
  },
);