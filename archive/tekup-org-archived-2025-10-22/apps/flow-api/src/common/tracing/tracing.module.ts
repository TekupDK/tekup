import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TracingService } from './tracing.service.js';
import { TracingInterceptor } from './tracing.interceptor.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../../metrics/metrics.module.js';

@Global()
@Module({
  imports: [ConfigModule, LoggingModule, MetricsModule],
  providers: [TracingService, TracingInterceptor],
  exports: [TracingService, TracingInterceptor],
})
export class TracingModule {}