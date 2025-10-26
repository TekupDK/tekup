import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../types/auth.types.js';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);

export const TenantContext = createParamDecorator(
  (data: keyof TenantContext, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    return data ? user?.[data] : user;
  },
);
