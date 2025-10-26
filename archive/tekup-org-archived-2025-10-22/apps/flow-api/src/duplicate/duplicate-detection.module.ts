import { Module } from '@nestjs/common';
import { DuplicateDetectionService } from './duplicate-detection.service.js';
import { DuplicateDetectionController } from './duplicate-detection.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggingModule,
    MetricsModule,
  ],
  controllers: [DuplicateDetectionController],
  providers: [DuplicateDetectionService],
  exports: [DuplicateDetectionService],
})
export class DuplicateDetectionModule {}