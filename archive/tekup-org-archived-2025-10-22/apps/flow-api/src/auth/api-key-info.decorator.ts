import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface ApiKeyInfo {
  keyId: string;
  scopes: string[];
  permissions: string[];
  environment: string;
  tenantId: string;
}

/**
 * Parameter decorator to extract API key information from request
 * Requires ApiKeyMiddleware to have validated the API key first
 * 
 * @example
 * ```typescript
 * @Patch('/settings')
 * async updateSettings(@ApiKeyInfo() apiKey: ApiKeyInfo, @Body() updates: any) {
 *   // apiKey.scopes, apiKey.keyId, etc. are available
 *   return this.settingsService.update(apiKey.tenantId, updates, apiKey.keyId);
 * }
 * ```
 */
export const ApiKeyInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ApiKeyInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    const tenantId = (request as any).tenantId;
    const keyId = (request as any).apiKeyId;
    const scopes = (request as any).apiKeyScopes || [];
    const permissions = (request as any).apiKeyPermissions || [];
    const environment = (request as any).apiKeyEnvironment || 'production';
    
    if (!tenantId || !keyId) {
      throw new Error('ApiKeyInfo decorator used without API key validation. Ensure ApiKeyMiddleware is applied.');
    }
    
    return {
      keyId,
      scopes,
      permissions,
      environment,
      tenantId
    };
  },
);
