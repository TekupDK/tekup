import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'scopes';

/**
 * Decorator to specify required API key scopes for an endpoint
 * Use with ScopesGuard to enforce scope-based access control
 * 
 * @example
 * ```typescript
 * @RequireScopes('manage:settings', 'read:leads')
 * @Patch('/settings')
 * async updateSettings() { ... }
 * ```
 */
export const RequireScopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);
