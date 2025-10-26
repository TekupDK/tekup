import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { BusinessMetricsService } from './business-metrics.service.js';
import { MetricsInterceptor } from './metrics.interceptor.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    LoggingModule,
  ],
  providers: [
    MetricsService,
    BusinessMetricsService,
    MetricsInterceptor,
  ],
  controllers: [MetricsController],
  exports: [
    MetricsService,
    BusinessMetricsService,
    MetricsInterceptor,
  ],
})
export class MetricsModule {}
