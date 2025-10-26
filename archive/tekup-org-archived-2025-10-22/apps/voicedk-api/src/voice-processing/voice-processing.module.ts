import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { VoiceProcessingService } from './voice-processing.service';
import { VoiceProcessingController } from './voice-processing.controller';
import { VoiceCommand } from './entities/voice-command.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceCommand]),
    BullModule.registerQueue({
      name: 'voice-processing',
    }),
  ],
  controllers: [VoiceProcessingController],
  providers: [VoiceProcessingService],
  exports: [VoiceProcessingService],
})
export class VoiceProcessingModule {}
