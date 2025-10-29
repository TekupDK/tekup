import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { StreamService } from './streaming/stream.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AnthropicProvider, StreamService],
  exports: [AiService, AnthropicProvider, StreamService],
})
export class AiModule {}
