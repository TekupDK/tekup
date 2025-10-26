import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator to extract tenant ID from request
 * Requires ApiKeyMiddleware to have validated the API key first
 * 
 * @example
 * ```typescript
 * @Get('/leads')
 * async getLeads(@TenantId() tenantId: string) {
 *   return this.leadService.findAll(tenantId);
 * }
 * ```
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const tenantId = (request as any).tenantId;
    
    if (!tenantId) {
      throw new Error('TenantId decorator used without API key validation. Ensure ApiKeyMiddleware is applied.');
    }
    
    return tenantId;
  },
);
