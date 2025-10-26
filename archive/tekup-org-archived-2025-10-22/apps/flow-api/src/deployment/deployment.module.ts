import { Module, Global } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import { DeploymentController } from './deployment.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { HealthModule } from '../health/health.module.js';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MetricsModule,
    LoggingModule,
    HealthModule,
  ],
  providers: [DeploymentService],
  controllers: [DeploymentController],
  exports: [DeploymentService],
})
export class DeploymentModule {}