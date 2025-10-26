import { Module } from '@nestjs/common';
import { PerformanceOptimizationService } from './performance-optimization.service.js';
import { CacheModule } from '../cache/cache.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [
    CacheModule,
    MetricsModule,
    CommonModule,
  ],
  providers: [PerformanceOptimizationService],
  exports: [PerformanceOptimizationService],
})
export class PerformanceOptimizationModule {}