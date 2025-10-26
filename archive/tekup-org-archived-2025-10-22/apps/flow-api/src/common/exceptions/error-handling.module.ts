import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { RetryService } from './retry.service.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../../metrics/metrics.module.js';

@Global()
@Module({
  imports: [LoggingModule, MetricsModule],
  providers: [
    RetryService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [RetryService],
})
export class ErrorHandlingModule {}