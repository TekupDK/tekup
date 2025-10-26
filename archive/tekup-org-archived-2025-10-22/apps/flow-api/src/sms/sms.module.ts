import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { SMSService } from './sms.service.js';
import { SMSController } from './sms.controller.js';
import { StructuredLoggerModule } from '../common/logging/structured-logger.module.js';

@Module({
  imports: [
    PrismaModule,
    MetricsModule,
    StructuredLoggerModule
  ],
  providers: [SMSService],
  controllers: [SMSController],
  exports: [SMSService]
})
export class SMSModule {}