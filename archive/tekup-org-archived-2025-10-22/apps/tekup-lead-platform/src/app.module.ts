import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
// import { PrismaModule } from './prisma/prisma.module';
import { LeadQualificationModule } from './qualification/qualification.module';
// TODO: Enable these modules once imports are fixed
// import { LeadNurturingModule } from './nurturing/nurturing.module';
// import { IntegrationHubModule } from './integrations/integration-hub.module';
// import { AnalyticsModule } from './analytics/analytics.module';
// import { CommunicationModule } from './communication/communication.module';
// import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // PrismaModule,
    LeadQualificationModule,
    // TODO: Enable these modules once imports are fixed
    // LeadNurturingModule,
    // IntegrationHubModule,
    // AnalyticsModule,
    // CommunicationModule,
    // HealthModule,
  ],
})
export class AppModule {}
