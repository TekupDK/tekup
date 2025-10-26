import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { ComprehensiveHealthService } from './comprehensive-health.service.js';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CacheModule } from '../cache/cache.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    CircuitBreakerModule, 
    PrismaModule, 
    CacheModule, 
    LoggingModule,
    MetricsModule,
  ],
  controllers: [HealthController],
  providers: [ComprehensiveHealthService],
  exports: [ComprehensiveHealthService],
})
export class HealthModule {}