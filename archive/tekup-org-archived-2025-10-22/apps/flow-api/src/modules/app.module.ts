import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TekUpSSOService, TekUpAuthGuard } from '@tekup/sso';
import { LeadModule } from '../lead/lead.module.js';
import { MetricsModule } from '../metrics/metrics.module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IngestionHttpModule } from '../ingestion/ingestion.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { HealthController } from '../health/health.controller.js';
import { ApiKeyController } from '../auth/api-key.controller.js';
import { CacheModule } from '../cache/cache.module.js';
import { WebSocketModule } from '../websocket/websocket.module.js';
import { WorkflowModule } from '../workflows/workflow.module.js';
import { PerformanceMonitoringModule } from '../monitoring/performance-monitoring.module.js';
import { GeminiLiveModule } from '../voice/gemini-live.module.js';
import { DatabaseOptimizationModule } from '../database/database-optimization.module.js';
import { HorizontalScalingModule } from '../scaling/horizontal-scaling.module.js';
import { ArchivingModule } from '../archiving/archiving.module.js';
import { DeploymentModule } from '../deployment/deployment.module.js';
import { BackupModule } from '../backup/backup.module.js';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { LoggingModule } from '../common/logging/logging.module.js';
import { FeatureFlagModule } from '../feature-flags/feature-flag.module.js';
import { DocsModule } from '../docs/docs.module.js';
import { CrmModule } from '../crm/crm.module.js';
import { JarvisModule } from '../jarvis/jarvis.module.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'tekup-secret-key',
      signOptions: { expiresIn: '24h' }
    }),
    LoggingModule,
    FeatureFlagModule,
    DocsModule,
    PaginationModule,
    CacheModule,
    LeadModule,
    MetricsModule,
    IngestionHttpModule,
    SettingsModule,
    WebSocketModule,
    WorkflowModule,
    PerformanceMonitoringModule,
    GeminiLiveModule,
    DatabaseOptimizationModule,
    HorizontalScalingModule,
    ArchivingModule,
    DeploymentModule,
    BackupModule,
    CrmModule,
    JarvisModule
  ],
  controllers: [HealthController, ApiKeyController],
  providers: [
    PrismaService,
    TekUpSSOService,
    {
      provide: 'APP_GUARD',
      useClass: TekUpAuthGuard,
    }
  ]
})
export class AppModule {}
