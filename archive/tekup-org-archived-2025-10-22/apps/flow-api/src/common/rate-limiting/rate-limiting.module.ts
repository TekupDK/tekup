import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitingService } from './rate-limiting.service.js';
import { RateLimitingInterceptor } from './rate-limiting.interceptor.js';
import { RateLimitingController } from './rate-limiting.controller.js';
import { AdaptiveRateLimitingService } from './adaptive-rate-limiting.service.js';
import { LoggingModule } from '../logging/logging.module.js';
import { MetricsModule } from '../../metrics/metrics.module.js';

@Module({
  imports: [ConfigModule, LoggingModule, MetricsModule],
  controllers: [RateLimitingController],
  providers: [
    RateLimitingService,
    AdaptiveRateLimitingService,
    RateLimitingInterceptor,
    {
      provide: 'ADAPTIVE_RATE_LIMITING_SETUP',
      useFactory: (rateLimitingService: RateLimitingService, adaptiveService: AdaptiveRateLimitingService) => {
        // Set up the adaptive service in the main service to avoid circular dependency
        rateLimitingService.setAdaptiveService(adaptiveService);
        return true;
      },
      inject: [RateLimitingService, AdaptiveRateLimitingService],
    },
  ],
  exports: [RateLimitingService, AdaptiveRateLimitingService, RateLimitingInterceptor],
})
export class RateLimitingModule {}