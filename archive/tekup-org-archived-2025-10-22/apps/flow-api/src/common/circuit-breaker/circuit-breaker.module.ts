import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsModule } from '../../metrics/metrics.module.js';
import { LoggingModule } from '../logging/logging.module.js';

@Module({
  imports: [MetricsModule, LoggingModule],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}