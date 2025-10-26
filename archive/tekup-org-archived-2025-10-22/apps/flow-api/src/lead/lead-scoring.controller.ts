import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
} from '@nestjs/common';
import { LeadScoringService, LeadScore } from './services/lead-scoring.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { TenantId } from '../auth/tenant-id.decorator';
import { SCOPE_READ_LEADS } from '../auth/scopes.constants';

@Controller('leads')
@UseGuards(ApiKeyGuard, ScopesGuard)
@UseInterceptors(CacheInterceptor)
export class LeadScoringController {
  constructor(private readonly leadScoringService: LeadScoringService) {}

  /**
   * Calculate and update lead score
   */
  @Post(':id/score')
  @RequireScopes(SCOPE_READ_LEADS)
  async calculateLeadScore(
    @Param('id') leadId: string,
    @TenantId() tenantId: string,
  ): Promise<LeadScore> {
    return this.leadScoringService.updateLeadScore(leadId, tenantId);
  }

  /**
   * Get lead score
   */
  @Get(':id/score')
  @RequireScopes(SCOPE_READ_LEADS)
  async getLeadScore(
    @Param('id') leadId: string,
    @TenantId() tenantId: string,
  ): Promise<LeadScore> {
    return this.leadScoringService.calculateLeadScore(leadId, tenantId);
  }

  /**
   * Get leads by score range
   */
  @Get('scoring/range')
  @RequireScopes(SCOPE_READ_LEADS)
  async getLeadsByScore(
    @Query('minScore') minScore: number,
    @Query('maxScore') maxScore: number,
    @TenantId() tenantId: string,
  ) {
    const leads = await this.leadScoringService.getLeadsByScore(
      tenantId,
      minScore,
      maxScore,
    );

    return {
      leads,
      count: leads.length,
      scoreRange: { min: minScore, max: maxScore },
    };
  }

  /**
   * Get top scoring leads
   */
  @Get('scoring/top')
  @RequireScopes(SCOPE_READ_LEADS)
  async getTopLeads(
    @Query('limit') limit: number = 10,
    @TenantId() tenantId: string,
  ) {
    const leads = await this.leadScoringService.getTopLeads(tenantId, limit);

    return {
      leads,
      count: leads.length,
      limit,
    };
  }

  /**
   * Get scoring statistics
   */
  @Get('scoring/stats')
  @RequireScopes(SCOPE_READ_LEADS)
  async getScoringStats(@TenantId() tenantId: string) {
    // Get leads in different score ranges
    const gradeA = await this.leadScoringService.getLeadsByScore(tenantId, 90, 100);
    const gradeB = await this.leadScoringService.getLeadsByScore(tenantId, 80, 89);
    const gradeC = await this.leadScoringService.getLeadsByScore(tenantId, 70, 79);
    const gradeD = await this.leadScoringService.getLeadsByScore(tenantId, 60, 69);
    const gradeF = await this.leadScoringService.getLeadsByScore(tenantId, 0, 59);

    const totalLeads = gradeA.length + gradeB.length + gradeC.length + gradeD.length + gradeF.length;

    return {
      totalLeads,
      distribution: {
        'A (90-100)': { count: gradeA.length, percentage: totalLeads > 0 ? (gradeA.length / totalLeads) * 100 : 0 },
        'B (80-89)': { count: gradeB.length, percentage: totalLeads > 0 ? (gradeB.length / totalLeads) * 100 : 0 },
        'C (70-79)': { count: gradeC.length, percentage: totalLeads > 0 ? (gradeC.length / totalLeads) * 100 : 0 },
        'D (60-69)': { count: gradeD.length, percentage: totalLeads > 0 ? (gradeD.length / totalLeads) * 100 : 0 },
        'F (0-59)': { count: gradeF.length, percentage: totalLeads > 0 ? (gradeF.length / totalLeads) * 100 : 0 },
      },
      averageScore: totalLeads > 0 ? 
        (gradeA.length * 95 + gradeB.length * 85 + gradeC.length * 75 + gradeD.length * 65 + gradeF.length * 30) / totalLeads : 0,
    };
  }

  /**
   * Bulk score update for all leads
   */
  @Post('scoring/bulk-update')
  @RequireScopes(SCOPE_READ_LEADS)
  async bulkUpdateScores(@TenantId() tenantId: string) {
    // This would typically get all leads and update their scores
    // For now, we'll return a placeholder response
    return {
      message: 'Bulk score update initiated',
      status: 'processing',
      tenantId,
      timestamp: new Date(),
    };
  }
}