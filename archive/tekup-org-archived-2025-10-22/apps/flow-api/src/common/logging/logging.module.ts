import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { StructuredLoggerService } from './structured-logger.service.js';
import { LoggingInterceptor } from './logging.interceptor.js';
import { CorrelationIdMiddleware } from './correlation-id.middleware.js';

@Global()
@Module({
  providers: [
    StructuredLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [StructuredLoggerService],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}