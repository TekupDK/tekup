import { Module } from '@nestjs/common';
import { DatabaseOptimizationService } from './database-optimization.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { PerformanceModule } from '../performance/performance.module.js';

@Module({
  imports: [
    PrismaModule,
    MetricsModule,
    LoggingModule,
    PerformanceModule,
  ],
  providers: [DatabaseOptimizationService],
  exports: [DatabaseOptimizationService],
})
export class DatabaseOptimizationModule {}