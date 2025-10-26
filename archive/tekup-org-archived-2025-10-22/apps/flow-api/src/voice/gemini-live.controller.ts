import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { TenantId } from '../auth/tenant-id.decorator';
import { SCOPE_READ_LEADS } from '../auth/scopes.constants';
import { GeminiLiveService } from './gemini-live.service';
import { GeminiLiveIntegrationService } from '@tekup/shared';

@Controller('voice/gemini')
@UseGuards(ApiKeyGuard, ScopesGuard)
@UseInterceptors(CacheInterceptor)
export class GeminiLiveController {
  constructor(
    private readonly geminiLiveService: GeminiLiveService,
    private readonly geminiIntegration: GeminiLiveIntegrationService,
  ) {}

  /**
   * Get Gemini Live service status
   */
  @Get('status')
  @RequireScopes(SCOPE_READ_LEADS)
  async getGeminiLiveStatus(@TenantId() tenantId: string) {
    try {
      const status = await this.geminiIntegration.getServiceStatus();
      
      return {
        ...status,
        tenantId,
        timestamp: new Date(),
        features: {
          voiceProcessing: true,
          naturalLanguageUnderstanding: true,
          commandExtraction: true,
          aiPoweredResponses: true,
          conversationContext: true,
          multiLanguageSupport: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        tenantId,
        timestamp: new Date(),
        error: error.message,
        features: {
          voiceProcessing: false,
          naturalLanguageUnderstanding: false,
          commandExtraction: false,
          aiPoweredResponses: false,
          conversationContext: false,
          multiLanguageSupport: false,
        },
      };
    }
  }

  /**
   * Process voice input with Gemini Live
   */
  @Post('process')
  @RequireScopes(SCOPE_READ_LEADS)
  async processVoiceInput(
    @Body() request: {
      audio?: string; // Base64 encoded audio
      text?: string; // Fallback text input
      mimeType?: string;
      sampleRate?: number;
      channels?: number;
      language?: string;
      sessionId?: string;
    },
    @TenantId() tenantId: string,
  ) {
    try {
      let result: any;

      if (request.audio) {
        // Process audio input
        const audioBuffer = Buffer.from(request.audio, 'base64');
        const voiceInput = {
          audio: audioBuffer.buffer,
          mimeType: request.mimeType || 'audio/wav',
          sampleRate: request.sampleRate || 16000,
          channels: request.channels || 1,
        };

        const voiceContext = {
          tenantId,
          sessionId: request.sessionId || `session_${Date.now()}`,
          conversationHistory: [],
          userPreferences: {
            language: request.language || 'da',
            voiceSpeed: 1.0,
            voicePitch: 1.0,
          },
        };

        result = await this.geminiIntegration.processVoiceInput(voiceInput, voiceContext);
      } else if (request.text) {
        // Process text input
        const voiceContext = {
          tenantId,
          sessionId: request.sessionId || `session_${Date.now()}`,
          conversationHistory: [],
          userPreferences: {
            language: request.language || 'da',
            voiceSpeed: 1.0,
            voicePitch: 1.0,
          },
        };

        const commandIntent = await this.geminiIntegration.processTextInput(request.text, voiceContext);
        result = {
          text: request.text,
          commandIntent,
          confidence: commandIntent.confidence,
          language: request.language || 'da',
        };
      } else {
        throw new Error('Either audio or text input is required');
      }

      return {
        success: true,
        result,
        tenantId,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tenantId,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Extract command intent from text
   */
  @Post('extract-command')
  @RequireScopes(SCOPE_READ_LEADS)
  async extractCommandIntent(
    @Body() request: {
      text: string;
      language?: string;
      sessionId?: string;
    },
    @TenantId() tenantId: string,
  ) {
    try {
      const voiceContext = {
        tenantId,
        sessionId: request.sessionId || `session_${Date.now()}`,
        conversationHistory: [],
        userPreferences: {
          language: request.language || 'da',
          voiceSpeed: 1.0,
          voicePitch: 1.0,
        },
      };

      const commandIntent = await this.geminiIntegration.extractCommandIntent(
        request.text,
        voiceContext
      );

      return {
        success: true,
        commandIntent,
        tenantId,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tenantId,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Generate AI-powered voice response
   */
  @Post('generate-response')
  @RequireScopes(SCOPE_READ_LEADS)
  async generateVoiceResponse(
    @Body() request: {
      commandResult: any;
      language?: string;
      sessionId?: string;
    },
    @TenantId() tenantId: string,
  ) {
    try {
      const voiceContext = {
        tenantId,
        sessionId: request.sessionId || `session_${Date.now()}`,
        conversationHistory: [],
        userPreferences: {
          language: request.language || 'da',
          voiceSpeed: 1.0,
          voicePitch: 1.0,
        },
      };

      const response = await this.geminiIntegration.generateVoiceResponse(
        request.commandResult,
        voiceContext
      );

      return {
        success: true,
        response,
        tenantId,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tenantId,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get conversation suggestions
   */
  @Get('suggestions')
  @RequireScopes(SCOPE_READ_LEADS)
  async getConversationSuggestions(
    @Query('sessionId') sessionId: string,
    @Query('maxSuggestions') maxSuggestions: number = 3,
    @Query('language') language: string = 'da',
    @TenantId() tenantId: string,
  ) {
    try {
      const voiceContext = {
        tenantId,
        sessionId,
        conversationHistory: [], // In production, this would be loaded from storage
        userPreferences: {
          language,
          voiceSpeed: 1.0,
          voicePitch: 1.0,
        },
      };

      const suggestions = await this.geminiIntegration.generateSuggestions(
        voiceContext,
        maxSuggestions
      );

      return {
        success: true,
        suggestions,
        sessionId,
        language,
        tenantId,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tenantId,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get available voice commands
   */
  @Get('commands')
  @RequireScopes(SCOPE_READ_LEADS)
  async getAvailableCommands(@TenantId() tenantId: string) {
    const commands = [
      {
        command: 'create_lead',
        description: 'Opret en ny lead',
        examples: [
          'Opret lead for John Doe fra ABC Company',
          'Ny lead med email john@example.com',
          'Opret lead med navn Jane Smith',
        ],
        parameters: ['name', 'email', 'company', 'message'],
        category: 'lead_management',
      },
      {
        command: 'get_leads',
        description: 'Hent leads',
        examples: [
          'Hent alle leads',
          'Vis leads fra denne måned',
          'Hent leads med status kontaktet',
        ],
        parameters: ['status', 'period', 'limit'],
        category: 'lead_management',
      },
      {
        command: 'search_leads',
        description: 'Søg efter leads',
        examples: [
          'Søg efter leads med navn John',
          'Find leads fra ABC Company',
          'Søg leads med email john@example.com',
        ],
        parameters: ['query', 'field', 'limit'],
        category: 'lead_management',
      },
      {
        command: 'get_metrics',
        description: 'Hent business metrics',
        examples: [
          'Vis metrics for denne måned',
          'Hent lead conversion rate',
          'Vis performance statistikker',
        ],
        parameters: ['period', 'metric', 'format'],
        category: 'reporting',
      },
      {
        command: 'start_backup',
        description: 'Start backup proces',
        examples: [
          'Start backup',
          'Kør backup med høj prioritet',
          'Start backup for alle data',
        ],
        parameters: ['priority', 'type', 'scope'],
        category: 'system',
      },
      {
        command: 'compliance_check',
        description: 'Kør compliance check',
        examples: [
          'Start compliance check',
          'Kør NIS2 compliance check',
          'Check compliance status',
        ],
        parameters: ['type', 'severity', 'scope'],
        category: 'compliance',
      },
    ];

    return {
      commands,
      count: commands.length,
      tenantId,
      timestamp: new Date(),
      categories: ['lead_management', 'reporting', 'system', 'compliance'],
    };
  }

  /**
   * Get voice processing capabilities
   */
  @Get('capabilities')
  @RequireScopes(SCOPE_READ_LEADS)
  async getVoiceCapabilities(@TenantId() tenantId: string) {
    return {
      capabilities: {
        audioFormats: ['wav', 'mp3', 'ogg', 'm4a'],
        sampleRates: [8000, 16000, 22050, 44100],
        channels: [1, 2],
        languages: ['da', 'en', 'sv', 'no'],
        maxAudioSize: '10MB',
        realTimeProcessing: true,
        commandExtraction: true,
        naturalLanguageUnderstanding: true,
        contextAwareness: true,
        aiPoweredResponses: true,
      },
      tenantId,
      timestamp: new Date(),
    };
  }

  /**
   * Test Gemini Live connection
   */
  @Post('test-connection')
  @RequireScopes(SCOPE_READ_LEADS)
  async testGeminiConnection(@TenantId() tenantId: string) {
    try {
      const status = await this.geminiIntegration.getServiceStatus();
      
      if (status.status === 'healthy') {
        return {
          success: true,
          message: 'Gemini Live connection successful',
          status: status.status,
          model: status.model,
          tenantId,
          timestamp: new Date(),
        };
      } else {
        return {
          success: false,
          message: 'Gemini Live connection failed',
          status: status.status,
          tenantId,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Gemini Live connection test failed',
        error: error.message,
        tenantId,
        timestamp: new Date(),
      };
    }
  }
}