import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get('calls')
  async listCalls() {
    return this.voiceService.listCalls();
  }

  @Post('calls')
  async initiateCall(@Body() callData: any) {
    return this.voiceService.initiateCall(callData);
  }

  @Get('recordings/:id')
  async getRecording(@Param('id') id: string) {
    return this.voiceService.getRecording(id);
  }

  @Post('transcribe')
  async transcribeAudio(@Body() audioData: any) {
    return this.voiceService.transcribeAudio(audioData);
  }
}
