import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  ProposalPermission,
  ContentPermission,
  SupportPermission,
  CRMPermission,
  MarketingPermission,
  ProjectPermission,
  AnalyticsPermission,
  VoiceAIPermission,
  BIPermission,
  ReadOnlyAI,
  WriteAccess,
  AdminAccess,
  HighUsageAI
} from '../ai/ai-permission.decorator.js';
import {
  AIServiceCategory,
  AIServicePermission,
  TenantContext
} from '../types/auth.types.js';

/**
 * Example controller showing how to use AI authentication decorators
 * This demonstrates how each AI service should protect its endpoints
 */

// ==========================================
// AI PROPOSAL ENGINE CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/proposals')
export class AIProposalExampleController {

  /**
   * Get proposals - requires read permission
   */
  @Get()
  @ProposalPermission(AIServicePermission.PROPOSAL_READ, false)
  async getProposals(@Req() request: Request) {
    const user = request.user as TenantContext;
    return {
      message: 'Retrieved proposals',
      tenantId: user.tenantId,
      userId: user.userId
    };
  }

  /**
   * Generate new proposal - requires write permission and quota check
   */
  @Post('generate')
  @ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
  async generateProposal(@Body() proposalData: any, @Req() request: Request) {
    const user = request.user as TenantContext;
    return {
      message: 'Proposal generated successfully',
      tenantId: user.tenantId,
      proposalId: 'prop-123'
    };
  }

  /**
   * High-usage AI operation for advanced proposal features
   */
  @Post('advanced-analysis')
  @HighUsageAI(AIServiceCategory.PROPOSAL, AIServicePermission.PROPOSAL_WRITE)
  async advancedAnalysis(@Body() data: any, @Req() request: Request) {
    return {
      message: 'Advanced proposal analysis completed',
      insights: ['High conversion probability', 'Recommend urgency language']
    };
  }

  /**
   * Admin operation - manage proposal templates
   */
  @Post('admin/templates')
  @AdminAccess(AIServiceCategory.PROPOSAL)
  async manageTemplates(@Body() templateData: any) {
    return {
      message: 'Proposal template updated',
      templateId: 'template-123'
    };
  }
}

// ==========================================
// AI CONTENT GENERATOR CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/content')
export class AIContentExampleController {

  @Get()
  @ReadOnlyAI(AIServiceCategory.CONTENT)
  async getContent() {
    return { message: 'Retrieved content library' };
  }

  @Post('generate')
  @ContentPermission(AIServicePermission.CONTENT_WRITE, true)
  async generateContent(@Body() contentRequest: any) {
    return {
      message: 'Content generated',
      contentId: 'content-123',
      wordCount: 500
    };
  }

  @Post('publish')
  @ContentPermission(AIServicePermission.CONTENT_PUBLISH, true)
  async publishContent(@Body() publishData: any) {
    return {
      message: 'Content published successfully',
      publishedAt: new Date()
    };
  }
}

// ==========================================
// AI CUSTOMER SUPPORT CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/support')
export class AISupportExampleController {

  @Get('sessions')
  @SupportPermission(AIServicePermission.SUPPORT_READ, false)
  async getSupportSessions() {
    return { message: 'Retrieved support sessions' };
  }

  @Post('chat')
  @SupportPermission(AIServicePermission.SUPPORT_WRITE, true)
  async handleChatMessage(@Body() chatData: any) {
    return {
      message: 'AI response generated',
      response: 'How can I help you today?',
      confidence: 0.95
    };
  }

  @Post('escalate')
  @SupportPermission(AIServicePermission.SUPPORT_ESCALATE, false)
  async escalateToHuman(@Body() escalationData: any) {
    return {
      message: 'Session escalated to human agent',
      ticketId: 'ticket-123'
    };
  }
}

// ==========================================
// ENHANCED CRM CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/crm')
export class AICRMExampleController {

  @Get('leads')
  @CRMPermission(AIServicePermission.CRM_READ, false)
  async getLeads() {
    return { message: 'Retrieved leads with AI scoring' };
  }

  @Post('leads/score')
  @CRMPermission(AIServicePermission.CRM_WRITE, true)
  async scoreLeads(@Body() leadData: any) {
    return {
      message: 'Leads scored by AI',
      averageScore: 75,
      highValueLeads: 12
    };
  }

  @Post('contacts/enrich')
  @CRMPermission(AIServicePermission.CRM_WRITE, true)
  async enrichContacts(@Body() contactIds: string[]) {
    return {
      message: 'Contacts enriched with AI data',
      enrichedCount: contactIds.length
    };
  }
}

// ==========================================
// MARKETING AUTOMATION CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/marketing')
export class AIMarketingExampleController {

  @Get('campaigns')
  @MarketingPermission(AIServicePermission.MARKETING_READ, false)
  async getCampaigns() {
    return { message: 'Retrieved AI-optimized campaigns' };
  }

  @Post('campaigns/optimize')
  @MarketingPermission(AIServicePermission.MARKETING_WRITE, true)
  async optimizeCampaign(@Body() campaignData: any) {
    return {
      message: 'Campaign optimized by AI',
      improvements: ['Better subject line', 'Optimized send time'],
      expectedIncrease: '15% CTR improvement'
    };
  }

  @Post('campaigns/launch')
  @MarketingPermission(AIServicePermission.MARKETING_CAMPAIGN, true)
  async launchCampaign(@Body() campaignConfig: any) {
    return {
      message: 'AI-generated campaign launched',
      campaignId: 'campaign-123',
      audienceSize: 10000
    };
  }
}

// ==========================================
// PROJECT MANAGEMENT CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/projects')
export class AIProjectExampleController {

  @Get()
  @ProjectPermission(AIServicePermission.PROJECT_READ, false)
  async getProjects() {
    return { message: 'Retrieved projects with AI insights' };
  }

  @Post('optimize')
  @ProjectPermission(AIServicePermission.PROJECT_WRITE, true)
  async optimizeProject(@Body() projectData: any) {
    return {
      message: 'Project optimized by AI',
      recommendations: ['Reallocate resources', 'Adjust timeline'],
      riskAssessment: 'Medium'
    };
  }

  @Post('predict')
  @ProjectPermission(AIServicePermission.PROJECT_MANAGE, true)
  async predictOutcome(@Body() projectConfig: any) {
    return {
      message: 'Project outcome predicted',
      successProbability: 0.87,
      estimatedCompletion: '2024-12-15'
    };
  }
}

// ==========================================
// AI ANALYTICS CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/analytics')
export class AIAnalyticsExampleController {

  @Get('insights')
  @AnalyticsPermission(AIServicePermission.ANALYTICS_READ, false)
  async getInsights() {
    return { message: 'Retrieved AI-generated insights' };
  }

  @Post('predict')
  @AnalyticsPermission(AIServicePermission.ANALYTICS_WRITE, true)
  async generatePrediction(@Body() predictionRequest: any) {
    return {
      message: 'Prediction generated',
      predictionId: 'pred-123',
      confidence: 0.92,
      forecast: 'Revenue increase of 15% next quarter'
    };
  }
}

// ==========================================
// VOICE AI CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/voice')
export class AIVoiceExampleController {

  @Post('transcribe')
  @VoiceAIPermission(AIServicePermission.VOICE_AI_WRITE, true)
  async transcribeAudio(@Body() audioData: any) {
    return {
      message: 'Audio transcribed successfully',
      transcription: 'Hello, this is a test transcription',
      confidence: 0.98,
      duration: 30
    };
  }

  @Post('synthesize')
  @VoiceAIPermission(AIServicePermission.VOICE_AI_WRITE, true)
  async synthesizeSpeech(@Body() textData: any) {
    return {
      message: 'Speech synthesized',
      audioUrl: 'https://cdn.tekup.com/audio/speech-123.mp3',
      duration: 15
    };
  }
}

// ==========================================
// BUSINESS INTELLIGENCE CONTROLLER EXAMPLE
// ==========================================
@Controller('ai/bi')
export class AIBIExampleController {

  @Get('reports')
  @BIPermission(AIServicePermission.BI_READ, false)
  async getReports() {
    return { message: 'Retrieved AI-generated reports' };
  }

  @Post('reports/generate')
  @BIPermission(AIServicePermission.BI_WRITE, true)
  async generateReport(@Body() reportConfig: any) {
    return {
      message: 'AI report generated',
      reportId: 'report-123',
      insights: ['Sales up 20%', 'Customer satisfaction improved'],
      chartData: { /* chart configuration */ }
    };
  }

  @Get('dashboards/realtime')
  @BIPermission(AIServicePermission.BI_READ, true)
  async getRealtimeDashboard() {
    return {
      message: 'Real-time dashboard data',
      lastUpdated: new Date(),
      metrics: {
        revenue: 125000,
        leads: 350,
        conversion: 0.15
      }
    };
  }
}

/**
 * Example usage in your actual controllers:
 * 
 * 1. Import the decorators you need:
 *    import { ProposalPermission, AIServicePermission } from '@tekup/sso';
 * 
 * 2. Apply to your controller methods:
 *    @ProposalPermission(AIServicePermission.PROPOSAL_WRITE, true)
 *    async createProposal(@Body() data: CreateProposalDto) {
 *      // Your business logic here
 *    }
 * 
 * 3. Access user context in your controller:
 *    @Req() request: Request
 *    const user = request.user as TenantContext;
 *    console.log(user.tenantId, user.userId, user.role);
 * 
 * 4. The guard automatically:
 *    - Validates JWT token
 *    - Checks user permissions
 *    - Verifies quota limits (if enabled)
 *    - Tracks usage for analytics
 *    - Adds user context to request
 */

