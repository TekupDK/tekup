import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnhancedApiKeyService } from './enhanced-api-key.service.js';
import { ApiKeyController } from './api-key.controller.js';
import { ApiKeyMiddleware } from './api-key.middleware.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, LoggingModule, MetricsModule],
  controllers: [ApiKeyController],
  providers: [EnhancedApiKeyService, ApiKeyMiddleware],
  exports: [EnhancedApiKeyService, ApiKeyMiddleware],
})
export class ApiKeyModule {}