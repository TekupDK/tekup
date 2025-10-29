import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Get,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AiService, SendMessageDto } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnthropicProvider } from './providers/anthropic.provider';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly anthropicProvider: AnthropicProvider,
  ) {}

  @Post('chat/stream')
  @ApiOperation({ summary: 'Stream AI chat response (SSE)' })
  @ApiResponse({ status: 200, description: 'Streaming response started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async streamChat(
    @CurrentUser('userId') userId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.aiService.streamMessage(userId, dto, res);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send message and get complete response' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @CurrentUser('userId') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiService.sendMessage(userId, dto);
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ status: 200, description: 'Available models retrieved' })
  async getModels() {
    return {
      models: this.anthropicProvider.getAvailableModels(),
      default: 'claude-3-5-sonnet-20241022',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      status: 'healthy',
      provider: 'anthropic',
      timestamp: new Date().toISOString(),
    };
  }
}
