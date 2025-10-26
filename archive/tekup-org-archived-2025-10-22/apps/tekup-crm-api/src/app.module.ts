import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';
import { TeamModule } from './team/team.module';
import { RoutesModule } from './routes/routes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DanishBusinessModule } from './danish-business/danish-business.module';
import { HealthModule } from './health/health.module';
import { RendetaljeFridayModule } from './integrations/rendetalje-ai/rendetalje-friday.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    PrismaModule,
    
    // Core modules
    AuthModule,
    UsersModule,
    TenantsModule,
    CustomersModule,
    JobsModule,
    TeamModule,
    RoutesModule,
    AnalyticsModule,
    DanishBusinessModule,
    HealthModule,
    
    // Integrations
    RendetaljeFridayModule,
  ],
})
export class AppModule {}