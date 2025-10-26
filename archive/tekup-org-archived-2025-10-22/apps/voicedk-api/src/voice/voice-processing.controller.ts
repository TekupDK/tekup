import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, TenantContext } from '@tekup/sso';
import { VoicePricingService, VoiceProcessingRequest, VoiceUsageAnalytics } from '../pricing/voice-pricing.service';
import { DanishVoiceRecognitionService } from './danish-voice-recognition.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('voicedk-api-controller');

@ApiTags('Voice Processing')
@ApiBearerAuth()
@Controller('voice')
@UseGuards(TekUpAuthGuard)
export class VoiceProcessingController {
  constructor(
    private readonly voiceRecognition: DanishVoiceRecognitionService,
    private readonly pricingService: VoicePricingService,
  ) {}

  @Post('process')
  @ApiOperation({ summary: 'Process Danish voice audio with multi-dialect support' })
  @ApiResponse({ status: 200, description: 'Voice processing completed successfully' })
  async processVoice(
    @Body() processRequest: ProcessVoiceDto,
    @CurrentUser() user: TenantContext,
  ) {
    try {
      // Create voice processing request
      const voiceRequest: VoiceProcessingRequest = {
        id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tenantId: user.tenantId,
        audioDurationSeconds: processRequest.audioDurationSeconds,
        dialect: processRequest.dialect,
        realTime: processRequest.realTime || false,
        quality: processRequest.quality || 'standard'
      };

      // Calculate cost before processing
      const costCalculation = await this.pricingService.calculateVoiceProcessingCost(voiceRequest);

      // Process the voice audio
      const transcription = await this.voiceRecognition.processAudio({
        audioData: processRequest.audioData,
        format: processRequest.format,
        dialect: processRequest.dialect,
        realTime: processRequest.realTime,
        enhanceForDanish: true
      });

      const response = {
        requestId: voiceRequest.id,
        transcription: transcription.text,
        confidence: transcription.confidence,
        dialect: transcription.detectedDialect,
        processingTime: transcription.processingTimeMs,
        cost: {
          amount: costCalculation.finalCost,
          currency: costCalculation.currency,
          breakdown: costCalculation.breakdown
        },
        metadata: {
          audioDuration: voiceRequest.audioDurationSeconds,
          realTimeProcessed: processRequest.realTime,
          qualityLevel: processRequest.quality
        }
      };

      logger.info(`Voice processing completed: ${voiceRequest.id} (${user.tenantId}) - ${costCalculation.finalCost} DKK`);
      
      return response;
      
    } catch (error) {
      logger.error('Voice processing failed:', error);
      throw new Error(`Voice processing failed: ${error.message}`);
    }
  }

  @Post('process/streaming')
  @ApiOperation({ summary: 'Real-time streaming voice recognition for Danish' })
  async streamVoiceProcessing(
    @Body() streamRequest: StreamVoiceDto,
    @CurrentUser() user: TenantContext,
  ) {
    // WebSocket-based streaming implementation would go here
    // For now, return a placeholder response
    return {
      streamId: `stream_${Date.now()}`,
      status: 'streaming',
      dialect: streamRequest.dialect,
      realTime: true,
      message: 'Real-time streaming initialized for Danish voice recognition'
    };
  }

  @Get('usage/analytics')
  @ApiOperation({ summary: 'Get voice usage analytics and costs' })
  async getUsageAnalytics(
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
    @CurrentUser() user: TenantContext,
  ): Promise<VoiceUsageAnalytics> {
    return this.pricingService.getVoiceUsageAnalytics(user.tenantId, period);
  }

  @Get('pricing')
  @ApiOperation({ summary: 'Get current pricing information' })
  getPricing(@CurrentUser() user: TenantContext) {
    return {
      tenantId: user.tenantId,
      pricingModel: 'pay-per-minute',
      currency: 'DKK',
      rates: {
        standardDanish: {
          basic: '0.50 DKK/min',
          professional: '0.35 DKK/min',
          enterprise: '0.25 DKK/min'
        },
        danishDialects: {
          basic: '0.75 DKK/min',
          professional: '0.55 DKK/min', 
          enterprise: '0.40 DKK/min'
        },
        realTimeProcessing: '+0.25 DKK/min additional',
        apiCallFee: '0.10 DKK per call'
      },
      supportedDialects: [
        'standard_danish',
        'jutlandic',
        'copenhagener', 
        'funen',
        'bornholm'
      ],
      features: {
        multiDialectSupport: true,
        realTimeProcessing: true,
        highAccuracyMode: true,
        danishLanguageOptimized: true,
        noiseCancellation: true
      }
    };
  }

  @Post('pricing/upgrade')
  @ApiOperation({ summary: 'Upgrade pricing tier' })
  async upgradePricingTier(
    @Body('tier') tier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE',
    @CurrentUser() user: TenantContext,
  ) {
    await this.pricingService.updateTenantPricingTier(user.tenantId, tier);
    
    return {
      message: `Pricing tier upgraded to ${tier}`,
      tenantId: user.tenantId,
      newTier: tier,
      effectiveDate: new Date()
    };
  }

  @Get('billing/monthly')
  @ApiOperation({ summary: 'Get monthly voice processing bill' })
  async getMonthlyBill(
    @Query('month') monthStr: string,
    @CurrentUser() user: TenantContext,
  ) {
    const month = monthStr ? new Date(monthStr) : new Date();
    return this.pricingService.processMonthlyBilling(user.tenantId, month);
  }

  @Get('dialects/detect')
  @ApiOperation({ summary: 'Detect Danish dialect from audio sample' })
  async detectDialect(
    @Body() audioSample: { audioData: string; format: string },
    @CurrentUser() user: TenantContext,
  ) {
    const detection = await this.voiceRecognition.detectDanishDialect(audioSample.audioData);
    
    return {
      detectedDialect: detection.dialect,
      confidence: detection.confidence,
      alternativeDialects: detection.alternatives,
      recommendation: `Use '${detection.dialect}' for optimal recognition accuracy`
    };
  }
}

// DTOs
export interface ProcessVoiceDto {
  audioData: string; // Base64 encoded audio
  format: 'wav' | 'mp3' | 'flac' | 'webm';
  dialect?: 'standard_danish' | 'jutlandic' | 'copenhagener' | 'funen' | 'bornholm';
  audioDurationSeconds: number;
  realTime?: boolean;
  quality?: 'standard' | 'high' | 'premium';
}

export interface StreamVoiceDto {
  streamId?: string;
  dialect: 'standard_danish' | 'jutlandic' | 'copenhagener' | 'funen' | 'bornholm';
  sampleRate: number;
  channels: number;
}
