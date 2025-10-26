import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { TenantId } from '../core/decorators/tenant-id.decorator';
import { AIService } from '../core/services/ai.service';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string; // website, social, referral, etc.
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  score?: number; // Lead scoring 0-100
  qualifiedAt?: Date;
  convertedAt?: Date;
  conversionType?: string; // customer, opportunity, etc.
  notes?: string;
  customData: Record<string, any>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadQualification {
  id: string;
  criteria: string; // What was evaluated
  result: string; // Result of evaluation
  score?: number; // Individual score for this criteria
  notes?: string;
  leadId: string;
  createdAt: Date;
}

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly aiService: AIService,
  ) {}

  // Lead CRUD endpoints
  @Get()
  async listLeads(
    @TenantId() tenantId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
    // Validate pagination parameters
    if (page < 1) {
      throw new HttpException('Page must be greater than 0', HttpStatus.BAD_REQUEST);
    }
    if (limit < 1 || limit > 1000) {
      throw new HttpException('Limit must be between 1 and 1000', HttpStatus.BAD_REQUEST);
    }
    
    try {
      return await this.leadsService.listLeads(tenantId, { page, limit, search, status, source });
    } catch (error) {
      throw new HttpException('Failed to retrieve leads', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async getLead(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<Lead | null> {
    return this.leadsService.getLead(id, tenantId);
  }

  @Post()
  async createLead(
    @Body() leadData: Partial<Lead>,
    @TenantId() tenantId: string,
  ): Promise<Lead> {
    return this.leadsService.createLead(leadData, tenantId);
  }

  @Put(':id')
  async updateLead(
    @Param('id') id: string,
    @Body() leadData: Partial<Lead>,
    @TenantId() tenantId: string,
  ): Promise<Lead> {
    return this.leadsService.updateLead(id, leadData, tenantId);
  }

  @Delete(':id')
  async deleteLead(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{ success: boolean }> {
    await this.leadsService.deleteLead(id, tenantId);
    return { success: true };
  }

  // Lead Qualification endpoints
  @Post(':id/qualify')
  async qualifyLead(
    @Param('id') id: string,
    @Body() qualificationData: { criteria: string; result: string; score?: number; notes?: string },
    @TenantId() tenantId: string,
  ): Promise<LeadQualification> {
    return this.leadsService.qualifyLead(id, qualificationData, tenantId);
  }

  @Get(':id/qualifications')
  async getLeadQualifications(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<LeadQualification[]> {
    return this.leadsService.getLeadQualifications(id, tenantId);
  }

  @Post(':id/score')
  async calculateLeadScore(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{ leadId: string; score: number; factors: Record<string, any> }> {
    return this.leadsService.calculateLeadScore(id, tenantId);
  }

  // Lead Conversion endpoints
  @Post(':id/convert')
  async convertLead(
    @Param('id') id: string,
    @Body() conversionData: { conversionType: string; notes?: string },
    @TenantId() tenantId: string,
  ): Promise<{ lead: Lead; customerId?: string; message: string }> {
    return this.leadsService.convertLead(id, conversionData, tenantId);
  }

  // Lead Assignment endpoints
  @Post(':id/assign')
  async assignLead(
    @Param('id') id: string,
    @Body() assignmentData: { assignedTo: string; notes?: string },
    @TenantId() tenantId: string,
  ): Promise<Lead> {
    return this.leadsService.assignLead(id, assignmentData, tenantId);
  }

  // Lead Follow-up endpoints
  @Post(':id/follow-up')
  async scheduleFollowUp(
    @Param('id') id: string,
    @Body() followUpData: { scheduledAt: Date; type: string; notes?: string },
    @TenantId() tenantId: string,
  ): Promise<{ leadId: string; followUpId: string; scheduledAt: Date }> {
    return this.leadsService.scheduleFollowUp(id, followUpData, tenantId);
  }

  // Lead Analytics endpoints
  @Get('analytics/conversion')
  async getConversionAnalytics(
    @TenantId() tenantId: string,
    @Query('period') period: string = '30d',
  ): Promise<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    conversionsBySource: Record<string, number>;
    conversionTrend: Array<{ date: string; conversions: number }>;
  }> {
    return this.leadsService.getConversionAnalytics(tenantId, period);
  }

  @Get('analytics/sources')
  async getSourceAnalytics(
    @TenantId() tenantId: string,
    @Query('period') period: string = '30d',
  ): Promise<{
    sourcePerformance: Array<{
      source: string;
      totalLeads: number;
      qualifiedLeads: number;
      convertedLeads: number;
      averageScore: number;
    }>;
  }> {
    return this.leadsService.getSourceAnalytics(tenantId, period);
  }

  @Get('analytics/pipeline')
  async getPipelineAnalytics(
    @TenantId() tenantId: string,
  ): Promise<{
    pipeline: Record<string, number>;
    totalValue: number;
    averageScore: number;
  }> {
    return this.leadsService.getPipelineAnalytics(tenantId);
  }

  // AI-powered lead insights
  @Post(':id/insights')
  async getLeadInsights(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<{
    leadId: string;
    insights: string[];
    recommendations: string[];
    riskFactors: string[];
  }> {
    const lead = await this.leadsService.getLead(id, tenantId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const prompt = `Analyze this lead profile and provide insights:
Name: ${lead.name}
Company: ${lead.company || 'Unknown'}
Source: ${lead.source || 'Unknown'}
Status: ${lead.status}
Score: ${lead.score || 'Not scored'}
Notes: ${lead.notes || 'None'}

Provide analysis in JSON format with insights, recommendations, and risk factors.`;

    try {
      const aiResponse = await this.aiService.generateText(prompt);
      const analysis = JSON.parse(aiResponse.content);
      
      return {
        leadId: id,
        insights: analysis.insights || [],
        recommendations: analysis.recommendations || [],
        riskFactors: analysis.riskFactors || [],
      };
    } catch (error) {
      // Fallback if AI is not available
      return {
        leadId: id,
        insights: [`Lead from ${lead.source || 'unknown source'}`, `Current status: ${lead.status}`],
        recommendations: ['Follow up within 24 hours', 'Verify contact information'],
        riskFactors: lead.score && lead.score < 50 ? ['Low lead score'] : [],
      };
    }
  }
}
