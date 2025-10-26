import { Injectable, Logger } from '@nestjs/common';
import { GeminiLiveIntegrationService } from '@tekup/shared';

@Injectable()
export class GeminiLiveService {
  private readonly logger = new Logger(GeminiLiveService.name);
  private geminiIntegration: GeminiLiveIntegrationService;

  constructor() {
    // Initialize Gemini Live integration
    this.initializeGeminiIntegration();
  }

  /**
   * Initialize Gemini Live integration
   */
  private initializeGeminiIntegration() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        this.logger.warn('GEMINI_API_KEY not found in environment variables');
        return;
      }

      this.geminiIntegration = new GeminiLiveIntegrationService({
        apiKey,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
      });

      this.logger.log('Gemini Live integration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gemini Live integration:', error);
    }
  }

  /**
   * Get Gemini Live integration service
   */
  getGeminiIntegration(): GeminiLiveIntegrationService | null {
    return this.geminiIntegration || null;
  }

  /**
   * Check if Gemini Live is available
   */
  isGeminiLiveAvailable(): boolean {
    return this.geminiIntegration !== null && this.geminiIntegration !== undefined;
  }

  /**
   * Get Gemini Live configuration
   */
  getGeminiConfiguration() {
    if (!this.isGeminiLiveAvailable()) {
      return null;
    }

    return {
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '1000'),
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    };
  }

  /**
   * Update Gemini Live configuration
   */
  updateGeminiConfiguration(config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
  }) {
    try {
      if (config.apiKey) {
        process.env.GEMINI_API_KEY = config.apiKey;
      }
      if (config.model) {
        process.env.GEMINI_MODEL = config.model;
      }
      if (config.temperature !== undefined) {
        process.env.GEMINI_TEMPERATURE = config.temperature.toString();
      }
      if (config.maxTokens !== undefined) {
        process.env.GEMINI_MAX_TOKENS = config.maxTokens.toString();
      }

      // Reinitialize with new configuration
      this.initializeGeminiIntegration();

      this.logger.log('Gemini Live configuration updated successfully');
      return { success: true, message: 'Configuration updated successfully' };
    } catch (error) {
      this.logger.error('Failed to update Gemini Live configuration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test Gemini Live connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (!this.isGeminiLiveAvailable()) {
        return {
          success: false,
          message: 'Gemini Live integration not available',
        };
      }

      const status = await this.geminiIntegration.getServiceStatus();
      
      if (status.status === 'healthy') {
        return {
          success: true,
          message: 'Gemini Live connection successful',
          details: status,
        };
      } else {
        return {
          success: false,
          message: 'Gemini Live connection failed',
          details: status,
        };
      }
    } catch (error) {
      this.logger.error('Gemini Live connection test failed:', error);
      return {
        success: false,
        message: 'Connection test failed',
        details: { error: error.message },
      };
    }
  }

  /**
   * Get Gemini Live health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
    details: any;
  }> {
    try {
      if (!this.isGeminiLiveAvailable()) {
        return {
          status: 'unhealthy',
          message: 'Gemini Live integration not available',
          details: {
            reason: 'GEMINI_API_KEY not configured',
            timestamp: new Date(),
          },
        };
      }

      const status = await this.geminiIntegration.getServiceStatus();
      
      if (status.status === 'healthy') {
        return {
          status: 'healthy',
          message: 'Gemini Live integration is working correctly',
          details: status,
        };
      } else if (status.status === 'degraded') {
        return {
          status: 'degraded',
          message: 'Gemini Live integration has performance issues',
          details: status,
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Gemini Live integration is not working',
          details: status,
        };
      }
    } catch (error) {
      this.logger.error('Failed to get Gemini Live health status:', error);
      return {
        status: 'unhealthy',
        message: 'Failed to check Gemini Live health',
        details: {
          error: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Get Gemini Live usage statistics
   */
  async getUsageStatistics(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastRequestTime?: Date;
    errorRate: number;
  }> {
    try {
      // In a real implementation, this would track actual usage
      // For now, we'll return mock data
      const totalRequests = Math.floor(Math.random() * 1000) + 100;
      const successfulRequests = Math.floor(totalRequests * 0.95);
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = Math.floor(Math.random() * 500) + 100;
      const errorRate = (failedRequests / totalRequests) * 100;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        lastRequestTime: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
        errorRate: Math.round(errorRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Failed to get Gemini Live usage statistics:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get Gemini Live feature status
   */
  getFeatureStatus(): {
    voiceProcessing: boolean;
    naturalLanguageUnderstanding: boolean;
    commandExtraction: boolean;
    aiPoweredResponses: boolean;
    conversationContext: boolean;
    multiLanguageSupport: boolean;
  } {
    const isAvailable = this.isGeminiLiveAvailable();
    
    return {
      voiceProcessing: isAvailable,
      naturalLanguageUnderstanding: isAvailable,
      commandExtraction: isAvailable,
      aiPoweredResponses: isAvailable,
      conversationContext: isAvailable,
      multiLanguageSupport: isAvailable,
    };
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<{
    code: string;
    name: string;
    nativeName: string;
    supported: boolean;
  }> {
    const languages = [
      { code: 'da', name: 'Danish', nativeName: 'Dansk', supported: true },
      { code: 'en', name: 'English', nativeName: 'English', supported: true },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska', supported: true },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk', supported: true },
      { code: 'de', name: 'German', nativeName: 'Deutsch', supported: false },
      { code: 'fr', name: 'French', nativeName: 'Français', supported: false },
      { code: 'es', name: 'Spanish', nativeName: 'Español', supported: false },
    ];

    return languages;
  }

  /**
   * Get supported audio formats
   */
  getSupportedAudioFormats(): Array<{
    format: string;
    mimeType: string;
    supported: boolean;
    maxSize: string;
    recommended: boolean;
  }> {
    const formats = [
      { format: 'wav', mimeType: 'audio/wav', supported: true, maxSize: '10MB', recommended: true },
      { format: 'mp3', mimeType: 'audio/mpeg', supported: true, maxSize: '10MB', recommended: true },
      { format: 'ogg', mimeType: 'audio/ogg', supported: true, maxSize: '10MB', recommended: false },
      { format: 'm4a', mimeType: 'audio/mp4', supported: true, maxSize: '10MB', recommended: false },
      { format: 'flac', mimeType: 'audio/flac', supported: false, maxSize: 'N/A', recommended: false },
    ];

    return formats;
  }

  /**
   * Get recommended audio settings
   */
  getRecommendedAudioSettings(): {
    sampleRate: number;
    channels: number;
    bitDepth: number;
    format: string;
    maxDuration: number;
  } {
    return {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      format: 'wav',
      maxDuration: 30, // seconds
    };
  }

  /**
   * Validate audio input
   */
  validateAudioInput(audio: string, mimeType: string, size: number): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if audio data is provided
    if (!audio) {
      errors.push('Audio data is required');
    }

    // Check MIME type
    const supportedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4'];
    if (!supportedMimeTypes.includes(mimeType)) {
      errors.push(`Unsupported MIME type: ${mimeType}`);
    }

    // Check size (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (size > maxSizeBytes) {
      errors.push(`Audio file too large: ${(size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
    }

    // Check if size is reasonable
    if (size < 1024) {
      warnings.push('Audio file seems very small, may be corrupted');
    }

    // Check if audio data is valid base64
    try {
      Buffer.from(audio, 'base64');
    } catch (error) {
      errors.push('Invalid base64 audio data');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get Gemini Live error codes and descriptions
   */
  getErrorCodes(): Array<{
    code: string;
    description: string;
    possibleCauses: string[];
    suggestedSolutions: string[];
  }> {
    return [
      {
        code: 'GEMINI_API_KEY_MISSING',
        description: 'Gemini API key is not configured',
        possibleCauses: [
          'GEMINI_API_KEY environment variable not set',
          'API key configuration missing',
        ],
        suggestedSolutions: [
          'Set GEMINI_API_KEY environment variable',
          'Check configuration files',
          'Verify API key is valid',
        ],
      },
      {
        code: 'GEMINI_API_KEY_INVALID',
        description: 'Gemini API key is invalid or expired',
        possibleCauses: [
          'API key has expired',
          'API key is malformed',
          'API key doesn\'t have required permissions',
        ],
        suggestedSolutions: [
          'Generate new API key',
          'Check API key permissions',
          'Verify API key format',
        ],
      },
      {
        code: 'GEMINI_MODEL_UNAVAILABLE',
        description: 'Requested Gemini model is not available',
        possibleCauses: [
          'Model name is incorrect',
          'Model is not available in your region',
          'Model requires different API version',
        ],
        suggestedSolutions: [
          'Check available model names',
          'Use supported model',
          'Update API version if needed',
        ],
      },
      {
        code: 'GEMINI_RATE_LIMIT_EXCEEDED',
        description: 'API rate limit exceeded',
        possibleCauses: [
          'Too many requests in short time',
          'API quota exceeded',
          'Rate limiting configuration',
        ],
        suggestedSolutions: [
          'Wait before making new requests',
          'Implement request throttling',
          'Check API quota limits',
        ],
      },
      {
        code: 'GEMINI_AUDIO_PROCESSING_FAILED',
        description: 'Failed to process audio input',
        possibleCauses: [
          'Audio format not supported',
          'Audio file corrupted',
          'Audio too large or too small',
        ],
        suggestedSolutions: [
          'Use supported audio format',
          'Check audio file integrity',
          'Ensure audio meets size requirements',
        ],
      },
    ];
  }
}