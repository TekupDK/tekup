import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { RetryService } from './retry.service.js';
import { CustomExceptionFilter } from '../exceptions/custom-exception.filter.js';
import { LoggingModule } from '../logging/logging.module.js';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [
    RetryService,
    {
      provide: APP_FILTER,
      useClass: CustomExceptionFilter,
    },
  ],
  exports: [RetryService],
})
export class RetryModule {}