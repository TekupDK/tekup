import { Module } from '@nestjs/common';
import { GeminiLiveController } from './gemini-live.controller';
import { GeminiLiveService } from './gemini-live.service';

@Module({
  controllers: [GeminiLiveController],
  providers: [GeminiLiveService],
  exports: [GeminiLiveService],
})
export class GeminiLiveModule {}