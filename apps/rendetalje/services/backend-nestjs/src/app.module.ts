import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomersModule } from './customers/customers.module';
import { LeadsModule } from './leads/leads.module';
import { AuthModule } from './auth/auth.module';
import { TeamModule } from './team/team.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { GdprModule } from './gdpr/gdpr.module';
import { QualityModule } from './quality/quality.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SecurityModule } from './security/security.module';
import { AiFridayModule } from './ai-friday/ai-friday.module';
// import { IntegrationsModule } from './integrations/integrations.module'; // Disabled - check dependencies
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    // LoggerModule,  // Temporarily disabled - dependency issue
    DatabaseModule,
    HealthModule,

    // Business modules
    CustomersModule, // ✅ ENABLED: Converted to Prisma
    LeadsModule, // ✅ ENABLED: Converted to Prisma (renamed from JobsModule)
    AuthModule, // ✅ ENABLED: JWT + Prisma + bcrypt
    TeamModule, // ✅ ENABLED: Converted to Prisma (team members + time entries)
    TimeTrackingModule, // ✅ ENABLED: Converted to Prisma (time corrections + overtime reports)
    GdprModule, // ✅ ENABLED: GDPR compliance (data export/deletion/consent/privacy policy)
    QualityModule, // ✅ ENABLED: Quality control (checklists + assessments + photo documentation)
    RealtimeModule, // ✅ ENABLED: Real-time notifications & WebSocket (Socket.IO)
    SecurityModule, // ✅ ENABLED: Security audit logging + event tracking (Owner/Admin only)
    AiFridayModule, // ✅ ENABLED: AI Friday assistant (chat, voice, analytics)
    
    // TODO: Convert remaining modules from Supabase to Prisma
    // IntegrationsModule, // Check dependencies
  ],
})
export class AppModule {}