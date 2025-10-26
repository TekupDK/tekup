import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    ScheduleModule.forRoot(),
    
    // Core modules
    PrismaModule,
    
    // Feature modules
    TeamsModule,
    SchedulingModule,
    ComplianceModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
