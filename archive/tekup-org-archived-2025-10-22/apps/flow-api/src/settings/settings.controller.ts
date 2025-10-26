import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ScopesGuard } from '../auth/scopes.guard.js';
import { RequireScopes } from '../auth/scopes.decorator.js';
import { TenantId } from '../auth/tenant-id.decorator.js';
import { ApiKeyInfo } from '../auth/api-key-info.decorator.js';
import { SCOPE_MANAGE_SETTINGS } from '../auth/scopes.constants.js';
import type { ApiKeyInfo as ApiKeyInfoType } from '../auth/api-key-info.decorator.js';

@Controller('settings')
@UseGuards(ApiKeyGuard, ScopesGuard)
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  async get(@TenantId() tenantId: string): Promise<any> {
    const resolved = await this.settings.getResolved(tenantId);
    return { settings: resolved };
  }

  @Patch()
  @RequireScopes(SCOPE_MANAGE_SETTINGS)
  async patch(
    @TenantId() tenantId: string,
    @ApiKeyInfo() apiKey: ApiKeyInfoType,
    @Body() body: any
  ): Promise<any> {
    const updates = body?.updates || {};
    const result = await this.settings.update(tenantId, updates, apiKey.keyId);
    return { settings: result };
  }
}
