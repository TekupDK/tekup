import { Module } from '@nestjs/common';
import { SearchService } from './search.service.js';
import { SearchController } from './search.controller.js';
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
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}