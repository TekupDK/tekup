import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TekUpSSOService, TekUpAuthGuard } from '@tekup/sso';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { TruckModule } from './truck/truck.module';
import { InventoryModule } from './inventory/inventory.module';
import { POSModule } from './pos/pos.module';
import { ComplianceModule } from './compliance/compliance.module';
import { RouteModule } from './route/route.module';
import { EventModule } from './event/event.module';
import { PaymentModule } from './payment/payment.module';
import { ReportingModule } from './reporting/reporting.module';
import { HealthController } from './health/health.controller';
import { MenuModule } from './menu/menu.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'foodtruck-secret',
      signOptions: { expiresIn: '24h' }
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TruckModule,
    InventoryModule,
    POSModule,
    ComplianceModule,
    RouteModule,
    EventModule,
    PaymentModule,
    ReportingModule,
    MenuModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    TekUpSSOService,
    {
      provide: APP_GUARD,
      useClass: TekUpAuthGuard,
    }
  ],
})
export class AppModule {}
