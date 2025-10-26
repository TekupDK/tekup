import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '@tekup/auth';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  generateKey(@Body() body: { name: string; permissions: string[] }) {
    const { name, permissions } = body;
    // In a real implementation, we would get tenantId from the authenticated user
    return this.apiKeysService.generateApiKey('tenant-id', name, permissions);
  }

  @Get()
  listKeys() {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.apiKeysService.listApiKeys('tenant-id');
  }

  @Delete(':id')
  revokeKey(@Param('id') id: string) {
    // In a real implementation, we would get tenantId from the authenticated user
    return this.apiKeysService.revokeApiKey(id, 'tenant-id');
  }
}