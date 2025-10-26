import { Module, Global } from '@nestjs/common';
import { PerformanceService } from './performance.service.js';
import { QueryOptimizerService } from './query-optimizer.service.js';
import { PerformanceController } from './performance.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Global()
@Module({
  imports: [PrismaModule, MetricsModule],
  controllers: [PerformanceController],
  providers: [PerformanceService, QueryOptimizerService],
  exports: [PerformanceService, QueryOptimizerService],
})
export class PerformanceModule {}