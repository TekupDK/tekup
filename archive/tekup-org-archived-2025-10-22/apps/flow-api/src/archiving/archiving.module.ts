import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ArchivingService } from './archiving.service.js';
import { ArchivingController } from './archiving.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { ValidationModule } from '../common/validation/validation.module.js';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    MetricsModule,
    LoggingModule,
    ValidationModule,
  ],
  providers: [ArchivingService],
  controllers: [ArchivingController],
  exports: [ArchivingService],
})
export class ArchivingModule {}