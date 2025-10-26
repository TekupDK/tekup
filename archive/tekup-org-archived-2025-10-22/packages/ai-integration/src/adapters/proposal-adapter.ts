import { AIServiceCategory, AIServicePermission } from '@tekup/sso';
import { EventFactory } from '@tekup/event-bus';
import { BaseAIServiceAdapter } from './base-adapter.js';
import {
  AIServiceConfig,
  ServiceCapabilities,
  IntegrationContext,
  AIOperation
} from '../types/integration.types.js';

/**
 * AI Proposal Engine Adapter
 * Handles proposal generation, buying signal detection, and research integration
 */
export class ProposalEngineAdapter extends BaseAIServiceAdapter {
  
  constructor(config?: Partial<AIServiceConfig>) {
    const defaultConfig: AIServiceConfig = {
      serviceName: 'ai-proposal-engine',
      serviceCategory: AIServiceCategory.PROPOSAL,
      version: '1.0.0',
      enabled: true,
      database: {
        poolSize: 10,
        timeout: 30000
      },
      cache: {
        enabled: true,
        ttl: 3600,
        keyPrefix: 'proposal'
      },
      events: {
        enabled: true,
        publishEvents: ['proposal.created', 'buying-signal.detected', 'research.completed'],
        subscribeEvents: ['lead.created', 'lead.converted', 'contact.updated']
      },
      ai: {
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        maxTokens: 8000,
        temperature: 0.3
      },
      limits: {
        maxRequestsPerMinute: 50,
        maxRequestsPerDay: 1000,
        maxTokensPerRequest: 8000
      },
      ...config
    };

    super(defaultConfig);
  }

  /**
   * Get proposal engine capabilities
   */
  getCapabilities(): ServiceCapabilities {
    return {
      endpoints: [
        '/proposals/generate',
        '/proposals/analyze',
        '/proposals/research',
        '/proposals/signals',
        '/proposals/templates'
      ],
      features: [
        'transcript_analysis',
        'buying_signal_detection',
        'research_integration',
        'document_generation',
        'template_management',
        'confidence_scoring',
        'multi_language_support'
      ],
      supportedFormats: ['text', 'json', 'docx', 'pdf'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      batchProcessing: true,
      realTimeProcessing: true,
      asyncProcessing: true
    };
  }

  /**
   * Validate proposal-specific request data
   */
  protected async validateServiceRequest(context: IntegrationContext, data: any): Promise<boolean> {
    try {
      // Check if user has proposal permissions
      const hasPermission = await this.checkUserPermission(
        context,
        AIServicePermission.PROPOSAL_WRITE
      );
      
      if (!hasPermission) {
        return false;
      }

      // Validate based on operation type
      switch (data.operation) {
        case 'generate':
          return this.validateGenerateRequest(data);
        case 'analyze':
          return this.validateAnalyzeRequest(data);
        case 'research':
          return this.validateResearchRequest(data);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Proposal request validation failed:', error);
      return false;
    }
  }

  /**
   * Process AI proposal operations
   */
  protected async processAIRequest(context: IntegrationContext, operation: AIOperation): Promise<any> {
    const { operation: op, input, parameters, context: opContext } = operation;

    try {
      switch (op) {
        case 'generate':
          return await this.generateProposal(context, input, parameters);
        
        case 'analyze':
          return await this.analyzeTranscript(context, input, parameters);
        
        case 'summarize':
          return await this.summarizeProposal(context, input, parameters);
        
        default:
          throw new Error(`Unsupported proposal operation: ${op}`);
      }
    } catch (error) {
      this.logger.error('Proposal AI operation failed:', error);
      throw error;
    }
  }

  /**
   * Generate proposal from transcript or requirements
   */
  private async generateProposal(
    context: IntegrationContext, 
    input: any, 
    parameters?: any
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract transcript or requirements
      const { transcript, clientName, projectType, requirements } = input;
      
      // Get cached proposal if exists
      const cacheKey = `proposal:${this.hashInput(input)}`;
      const cached = await this.executeCache({
        operation: 'get',
        key: cacheKey
      });

      if (cached) {
        this.logger.info('Returning cached proposal');
        return {
          ...cached,
          fromCache: true,
          processingTime: Date.now() - startTime
        };
      }

      // Analyze transcript for buying signals
      const buyingSignals = await this.detectBuyingSignals(transcript);

      // Research client and industry
      const researchData = await this.researchClient(clientName);

      // Generate AI proposal
      const proposalContent = await this.generateAIProposal({
        transcript,
        clientName,
        projectType,
        requirements,
        buyingSignals,
        researchData,
        parameters
      });

      // Save to database
      const proposal = await this.executeDatabase({
        operation: 'create',
        table: 'aiProposal',
        data: {
          tenantId: context.tenantContext.tenantId,
          userId: context.tenantContext.userId,
          clientName,
          projectType,
          content: proposalContent.content,
          confidence: proposalContent.confidence,
          estimatedValue: proposalContent.estimatedValue,
          buyingSignals: buyingSignals,
          researchData: JSON.stringify(researchData),
          metadata: {
            generatedAt: new Date(),
            parameters,
            processingTime: Date.now() - startTime
          }
        }
      });

      // Cache the result
      await this.executeCache({
        operation: 'set',
        key: cacheKey,
        value: proposal,
        ttl: 3600
      });

      // Publish proposal created event
      await this.executeEvent({
        operation: 'publish',
        eventType: 'proposal.created',
        data: {
          proposalId: proposal.id,
          clientName,
          estimatedValue: proposalContent.estimatedValue,
          confidence: proposalContent.confidence
        },
        metadata: {
          tenantId: context.tenantContext.tenantId,
          userId: context.tenantContext.userId
        }
      });

      this.logger.info('Proposal generated successfully', {
        proposalId: proposal.id,
        clientName,
        confidence: proposalContent.confidence,
        processingTime: Date.now() - startTime
      });

      return {
        proposalId: proposal.id,
        content: proposalContent.content,
        confidence: proposalContent.confidence,
        estimatedValue: proposalContent.estimatedValue,
        buyingSignals,
        processingTime: Date.now() - startTime,
        tokensUsed: proposalContent.tokensUsed,
        cost: proposalContent.cost
      };

    } catch (error) {
      this.logger.error('Proposal generation failed:', error);
      throw error;
    }
  }

  /**
   * Analyze transcript for buying signals and opportunities
   */
  private async analyzeTranscript(
    context: IntegrationContext, 
    input: any, 
    parameters?: any
  ): Promise<any> {
    try {
      const { transcript } = input;
      
      // Detect buying signals
      const buyingSignals = await this.detectBuyingSignals(transcript);
      
      // Extract key information
      const keyInfo = await this.extractKeyInformation(transcript);
      
      // Sentiment analysis
      const sentiment = await this.analyzeSentiment(transcript);
      
      // Save analysis to database
      const analysis = await this.executeDatabase({
        operation: 'create',
        table: 'buyingSignal',
        data: {
          tenantId: context.tenantContext.tenantId,
          userId: context.tenantContext.userId,
          content: transcript,
          signalType: buyingSignals.primarySignal,
          confidence: buyingSignals.confidence,
          position: buyingSignals.position,
          metadata: {
            allSignals: buyingSignals.signals,
            keyInfo,
            sentiment,
            analyzedAt: new Date()
          }
        }
      });

      // Publish buying signal detected event
      if (buyingSignals.signals.length > 0) {
        await this.executeEvent({
          operation: 'publish',
          eventType: 'buying-signal.detected',
          data: {
            signalType: buyingSignals.primarySignal,
            content: transcript,
            confidence: buyingSignals.confidence,
            position: buyingSignals.position
          },
          metadata: {
            tenantId: context.tenantContext.tenantId,
            userId: context.tenantContext.userId
          }
        });
      }

      return {
        analysisId: analysis.id,
        buyingSignals: buyingSignals.signals,
        primarySignal: buyingSignals.primarySignal,
        confidence: buyingSignals.confidence,
        keyInformation: keyInfo,
        sentiment,
        recommendations: this.generateRecommendations(buyingSignals, sentiment)
      };

    } catch (error) {
      this.logger.error('Transcript analysis failed:', error);
      throw error;
    }
  }

  /**
   * Summarize existing proposal
   */
  private async summarizeProposal(
    context: IntegrationContext, 
    input: any, 
    parameters?: any
  ): Promise<any> {
    try {
      const { proposalId, summaryType = 'executive' } = input;
      
      // Get proposal from database
      const proposal = await this.executeDatabase({
        operation: 'read',
        table: 'aiProposal',
        conditions: {
          id: proposalId,
          tenantId: context.tenantContext.tenantId
        }
      });

      if (!proposal || proposal.length === 0) {
        throw new Error('Proposal not found');
      }

      // Generate summary using AI
      const summary = await this.generateAISummary(proposal[0].content, summaryType);

      return {
        proposalId,
        summary: summary.content,
        summaryType,
        keyPoints: summary.keyPoints,
        tokensUsed: summary.tokensUsed,
        cost: summary.cost
      };

    } catch (error) {
      this.logger.error('Proposal summarization failed:', error);
      throw error;
    }
  }

  // ==========================================
  // PRIVATE AI METHODS
  // ==========================================

  /**
   * Detect buying signals in transcript using AI
   */
  private async detectBuyingSignals(transcript: string): Promise<any> {
    // Mock implementation - would integrate with actual AI provider
    const signals = [
      {
        type: 'urgency',
        confidence: 0.87,
        content: 'need this implemented by end of quarter',
        position: 145
      },
      {
        type: 'budget',
        confidence: 0.92,
        content: 'we have budget allocated for this project',
        position: 312
      }
    ];

    return {
      signals,
      primarySignal: signals[0]?.type || 'none',
      confidence: signals[0]?.confidence || 0,
      position: signals[0]?.position || 0
    };
  }

  /**
   * Research client using external APIs
   */
  private async researchClient(clientName: string): Promise<any> {
    // Mock implementation - would integrate with research APIs
    return {
      companyInfo: {
        name: clientName,
        industry: 'Technology',
        size: '1000-5000 employees',
        revenue: '$100M-$500M'
      },
      recentNews: [],
      keyPersonnel: [],
      competitorAnalysis: {}
    };
  }

  /**
   * Generate proposal content using AI
   */
  private async generateAIProposal(data: any): Promise<any> {
    // Mock implementation - would integrate with AI provider
    const content = `
# Proposal for ${data.clientName}

## Executive Summary
Based on our analysis of your requirements and current market position...

## Proposed Solution
We recommend implementing a comprehensive AI-powered solution...

## Timeline & Investment
Project duration: 12-16 weeks
Investment: $${data.estimatedValue || 75000}

## Next Steps
1. Technical discovery session
2. Solution architecture design
3. Implementation planning
    `;

    return {
      content,
      confidence: 0.89,
      estimatedValue: 75000,
      tokensUsed: 1500,
      cost: 0.045
    };
  }

  /**
   * Extract key information from transcript
   */
  private async extractKeyInformation(transcript: string): Promise<any> {
    // Mock implementation
    return {
      clientNeeds: ['automation', 'scalability', 'integration'],
      timeline: '3-6 months',
      budget: 'TBD',
      decisionMakers: ['CTO', 'VP Engineering'],
      painPoints: ['manual processes', 'data silos']
    };
  }

  /**
   * Analyze sentiment of transcript
   */
  private async analyzeSentiment(transcript: string): Promise<any> {
    // Mock implementation
    return {
      overall: 'positive',
      confidence: 0.82,
      emotions: {
        enthusiasm: 0.7,
        concern: 0.2,
        urgency: 0.6
      }
    };
  }

  /**
   * Generate AI summary of proposal
   */
  private async generateAISummary(content: string, summaryType: string): Promise<any> {
    // Mock implementation
    return {
      content: 'Executive summary of the proposal...',
      keyPoints: [
        'Comprehensive AI solution',
        '12-16 week timeline',
        '$75,000 investment',
        'High ROI potential'
      ],
      tokensUsed: 500,
      cost: 0.015
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(buyingSignals: any, sentiment: any): string[] {
    const recommendations = [];

    if (buyingSignals.signals.some(s => s.type === 'urgency')) {
      recommendations.push('Emphasize quick implementation and immediate value');
    }

    if (buyingSignals.signals.some(s => s.type === 'budget')) {
      recommendations.push('Provide detailed ROI calculations and cost breakdown');
    }

    if (sentiment.overall === 'positive') {
      recommendations.push('Client shows strong interest - schedule follow-up quickly');
    }

    return recommendations;
  }

  // ==========================================
  // VALIDATION HELPERS
  // ==========================================

  private validateGenerateRequest(data: any): boolean {
    return !!(data.transcript || data.requirements) && !!data.clientName;
  }

  private validateAnalyzeRequest(data: any): boolean {
    return !!data.transcript && data.transcript.length > 50;
  }

  private validateResearchRequest(data: any): boolean {
    return !!data.clientName || !!data.companyId;
  }

  private async checkUserPermission(context: IntegrationContext, permission: AIServicePermission): Promise<boolean> {
    // This would integrate with the SSO service to check permissions
    // For now, returning true as placeholder
    return true;
  }

  private hashInput(input: any): string {
    // Simple hash function for caching
    return Buffer.from(JSON.stringify(input)).toString('base64').substring(0, 20);
  }
}

