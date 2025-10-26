import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

// Core modules
import { VoiceProcessingModule } from './voice-processing/voice-processing.module';
import { BusinessConfigModule } from './business-config/business-config.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { HealthModule } from './health/health.module';

// Database entities
// TODO: Create missing entities
// import { User } from './auth/entities/user.entity';
import { BusinessConfig } from './business-config/entities/business-config.entity';
import { VoiceCommand } from './voice-processing/entities/voice-command.entity';
// import { UsageMetric } from './analytics/entities/usage-metric.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'voicedk',
      entities: [BusinessConfig, VoiceCommand], // TODO: Add User, UsageMetric when implemented
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),

    // Redis for job queues
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Feature modules
    AuthModule,
    VoiceProcessingModule,
    BusinessConfigModule,
    AnalyticsModule,
    BillingModule,
    HealthModule,
  ],
})
export class AppModule {}