import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { MCPServerModule } from './mcp-server/mcp-server.module';
import { PluginMarketplaceModule } from './plugin-marketplace/plugin-marketplace.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { BillingModule } from './billing/billing.module';
import { OrganizationModule } from './organization/organization.module';
import { WebSocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    MCPServerModule,
    PluginMarketplaceModule,
    MonitoringModule,
    BillingModule,
    OrganizationModule,
    WebSocketModule,
    HealthModule,
  ],
})
export class AppModule {}