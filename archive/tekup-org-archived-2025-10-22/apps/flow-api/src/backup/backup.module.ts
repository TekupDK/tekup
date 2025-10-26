import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service.js';
import { BackupController } from './backup.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    PrismaModule,
    MetricsModule,
    LoggingModule,
  ],
  providers: [BackupService],
  controllers: [BackupController],
  exports: [BackupService],
})
export class BackupModule {}