import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { LeadQualificationService, QualificationResult, QualificationCriteria } from './qualification.service';
import { TenantGuard } from '../auth/tenant.guard';
import { CurrentTenant } from '../auth/tenant.decorator';

@ApiTags('Lead Qualification')
@ApiSecurity('tenant-key')
@Controller('qualification')
@UseGuards(TenantGuard)
export class LeadQualificationController {
  constructor(private qualificationService: LeadQualificationService) {}

  @Post(':leadId/qualify')
  @ApiOperation({ summary: 'Qualify a lead based on tenant-specific criteria' })
  @ApiResponse({ status: 200, description: 'Lead qualification completed' })
  async qualifyLead(
    @Param('leadId') leadId: string,
    @CurrentTenant() tenantId: string,
    @Body() criteria?: QualificationCriteria
  ): Promise<QualificationResult> {
    return this.qualificationService.qualifyLead(leadId, tenantId, criteria);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get qualification statistics for tenant' })
  @ApiResponse({ status: 200, description: 'Qualification statistics retrieved' })
  async getQualificationStats(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to)
    } : undefined;

    return this.qualificationService.getQualificationStats(tenantId, dateRange);
  }
}
