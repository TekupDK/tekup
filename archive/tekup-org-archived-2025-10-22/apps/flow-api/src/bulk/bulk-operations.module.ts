import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service.js';
import { BulkOperationsController } from './bulk-operations.controller.js';
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
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
  exports: [BulkOperationsService],
})
export class BulkOperationsModule {}