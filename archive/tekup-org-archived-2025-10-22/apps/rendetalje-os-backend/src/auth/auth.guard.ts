import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // For now, allow all requests
    // TODO: Implement proper JWT validation with @tekup/sso
    return true;
  }
}

// Simple user decorator
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Mock current user for development
    return {
      id: 'user-1',
      email: 'admin@rendetalje.dk',
      role: 'admin'
    };
  },
);

// Simple tenant decorator  
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // Mock current tenant for development
    return {
      id: 'rendetalje-1',
      name: 'Rendetalje.dk'
    };
  },
);
