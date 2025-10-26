import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoiceDKHealthService } from './voicedk-health.service.js';
import { StandardHealthController } from '@tekup/health-check';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule,
  ],
  controllers: [StandardHealthController],
  providers: [
    {
      provide: 'StandardHealthService',
      useClass: VoiceDKHealthService,
    },
  ],
  exports: [VoiceDKHealthService],
})
export class HealthModule {}
