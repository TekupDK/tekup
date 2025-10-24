import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { CustomersModule } from './customers/customers.module';
import { TeamModule } from './team/team.module';
import { AiFridayModule } from './ai-friday/ai-friday.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SupabaseModule } from './supabase/supabase.module';
import { LoggerModule } from './common/logger/logger.module';
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
    LoggerModule,
    SupabaseModule,
    AuthModule,
    JobsModule,
    CustomersModule,
    TeamModule,
    AiFridayModule,
    IntegrationsModule,
  ],
})
export class AppModule {}