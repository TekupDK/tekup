import { Controller, Get, Post, Body } from '@nestjs/common';
import { AIService, AIResponse } from './services/ai.service';

@Controller()
export class CoreController {
  constructor(private readonly aiService: AIService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'tekup-unified-platform',
      version: '1.0.0',
      ai: {
        enabled: this.aiService.isAIEnabled(),
        providers: this.aiService.getAvailableProviders(),
      },
    };
  }

  @Get('info')
  info() {
    return {
      platform: 'Tekup Unified Platform',
      version: '1.0.0',
      description: 'Unified platform consolidating all Tekup services',
      modules: ['flow', 'crm', 'leads', 'voice', 'security'],
      environment: process.env.NODE_ENV || 'development',
      ai: {
        enabled: this.aiService.isAIEnabled(),
        providers: this.aiService.getAvailableProviders(),
      },
    };
  }

  @Post('ai/generate')
  async generateAI(
    @Body() body: { prompt: string; maxTokens?: number; temperature?: number }
  ): Promise<AIResponse> {
    return this.aiService.generateText(body.prompt, {
      maxTokens: body.maxTokens,
      temperature: body.temperature,
    });
  }

  @Post('ai/analyze')
  async analyzeText(@Body() body: { text: string }) {
    return this.aiService.analyzeText(body.text);
  }
}
