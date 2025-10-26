import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from './settings.service.js';
import { SettingsController } from './settings.controller.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ScopesGuard } from '../auth/scopes.guard.js';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [MetricsModule],
  providers: [PrismaService, SettingsService, ApiKeyGuard, ScopesGuard, Reflector],
  controllers: [SettingsController],
  exports: [SettingsService]
})
export class SettingsModule {}
