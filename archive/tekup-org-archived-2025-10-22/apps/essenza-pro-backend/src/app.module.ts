import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TekUpAuthGuard } from '@tekup/sso';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';

// Feature modules
import { PrismaModule } from './prisma/prisma.module';
import { BookingsModule } from './bookings/bookings.module';
import { ServicesModule } from './services/services.module';
import { ClientsModule } from './clients/clients.module';
import { StaffModule } from './staff/staff.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { PaymentsModule } from './payments/payments.module';
import { MarketingModule } from './marketing/marketing.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'essenza-secret',
      signOptions: { expiresIn: '24h' }
    }),
    ScheduleModule.forRoot(),
    
    // Core modules
    PrismaModule,
    
    // Feature modules
    BookingsModule,
    ServicesModule,
    ClientsModule,
    StaffModule,
    LoyaltyModule,
    PaymentsModule,
    MarketingModule,
    AnalyticsModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TekUpAuthGuard,
    }
  ],
})
export class AppModule {}
