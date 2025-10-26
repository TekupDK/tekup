import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    // Extract tenant ID from various sources
    // 1. From custom header (case-insensitive) - HIGHEST PRIORITY
    const tenantHeader = Object.keys(request.headers).find(
      key => key.toLowerCase() === 'x-tenant-id'
    );
    if (tenantHeader && request.headers[tenantHeader]) {
      const tenantId = request.headers[tenantHeader] as string;
      return tenantId;
    }
    
    // 2. From subdomain (e.g., tenant1.tekup.dk)
    const host = request.headers.host || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'tekup' && subdomain !== 'www' && subdomain !== 'api' && !subdomain.includes('localhost')) {
      return subdomain;
    }
    
    // 3. From user context (if authenticated)
    if (request.user?.tenantId) {
      return request.user.tenantId;
    }
    
    // 4. Default tenant for development
    return process.env.DEFAULT_TENANT_ID || 'default';
  },
);
