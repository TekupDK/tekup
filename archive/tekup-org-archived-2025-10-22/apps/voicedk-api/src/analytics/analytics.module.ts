import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// TODO: Create UsageMetric entity
// import { UsageMetric } from './entities/usage-metric.entity';

// TODO: Implement AnalyticsService and AnalyticsController
// import { AnalyticsService } from './analytics.service';
// import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    // TypeOrmModule.forFeature([UsageMetric]), // TODO: Create entity
  ],
  controllers: [
    // AnalyticsController, // TODO: Create this
  ],
  providers: [
    // AnalyticsService, // TODO: Create this
  ],
  exports: [
    // AnalyticsService, // TODO: Create this
  ],
})
export class AnalyticsModule {}
