import { Module } from '@nestjs/common';
import { FilterService } from './filter.service.js';
import { FilterController } from './filter.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { CacheModule } from '../cache/cache.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggingModule,
    MetricsModule,
    CacheModule,
  ],
  controllers: [FilterController],
  providers: [FilterService],
  exports: [FilterService],
})
export class FilterModule {}