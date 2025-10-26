import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TekUpAuthGuard } from '@tekup/sso';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { PrismaModule } from './prisma/prisma.module';
import { MCPModule } from './mcp/mcp.module';
import { ProjectsModule } from './projects/projects.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { TestingModule } from './testing/testing.module';
import { DeploymentModule } from './deployment/deployment.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mcp-studio-secret',
      signOptions: { expiresIn: '24h' }
    }),
    ScheduleModule.forRoot(),
    
    // Core modules
    PrismaModule,
    
    // Feature modules
    MCPModule,
    ProjectsModule,
    MarketplaceModule,
    TestingModule,
    DeploymentModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TekUpAuthGuard,
    }
  ],
})
export class AppModule {}
