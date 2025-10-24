import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomersModule } from './customers/customers.module';
// import { AuthModule } from './auth/auth.module';  // Disabled - needs Prisma conversion
// import { JobsModule } from './jobs/jobs.module';  // Disabled - needs Prisma conversion
// import { TeamModule } from './team/team.module';  // Disabled - needs Prisma conversion
// import { AiFridayModule } from './ai-friday/ai-friday.module';  // Disabled - needs Prisma conversion
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
    
    // TODO: Convert remaining modules from Supabase to Prisma
    // AuthModule, // Uses Supabase Auth
    // JobsModule, // 100+ Supabase queries
    // TeamModule, // 50+ Supabase queries
    // AiFridayModule, // Uses Supabase
    // IntegrationsModule, // Check dependencies
  ],
})
export class AppModule {}