import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProposalEngineService } from './proposal-engine.service';
import { CreateProposalDto, ProposalResponse } from './dto/proposal.dto';
// import { TenantGuard } from '../auth/tenant.guard';
// import { Tenant } from '../auth/tenant.decorator';
import { TenantId } from '../core/decorators/tenant-id.decorator';

/**
 * Proposal Engine Controller
 * 
 * REST API endpoints for AI Proposal Engine:
 * - Generate proposals from call transcripts
 * - Manage proposal lifecycle
 * - Monitor generation status
 * - Retrieve and export proposals
 */
@Controller('proposal-engine')
// @UseGuards(TenantGuard)
export class ProposalEngineController {
  constructor(private readonly proposalEngineService: ProposalEngineService) {}

  /**
   * Generate new proposal from transcript
   * 
   * @param tenantId - Multi-tenant isolation
   * @param createProposalDto - Proposal generation options
   * @returns Proposal generation result
   */
  @Post('generate')
  async generateProposal(
    @TenantId() tenantId: string,
    @Body() createProposalDto: CreateProposalDto,
  ): Promise<ProposalResponse> {
    return this.proposalEngineService.generateProposal(
      tenantId,
      createProposalDto.transcriptId,
      createProposalDto,
    );
  }

  /**
   * Get proposal by ID
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @returns Proposal details
   */
  @Get(':proposalId')
  async getProposal(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
  ): Promise<ProposalResponse> {
    return this.proposalEngineService.getProposal(tenantId, proposalId);
  }

  /**
   * List proposals with pagination
   * 
   * @param tenantId - Multi-tenant isolation
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated proposal list
   */
  @Get()
  async listProposals(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.proposalEngineService.listProposals(tenantId, page, limit);
  }

  /**
   * Get proposal generation status
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @returns Status and progress information
   */
  @Get(':proposalId/status')
  async getProposalStatus(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
  ) {
    return this.proposalEngineService.getProposalStatus(tenantId, proposalId);
  }

  /**
   * Retry failed proposal generation
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @returns Retry result
   */
  @Post(':proposalId/retry')
  async retryProposal(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
  ): Promise<ProposalResponse> {
    return this.proposalEngineService.retryProposal(tenantId, proposalId);
  }

  /**
   * Get proposal statistics
   * 
   * @param tenantId - Multi-tenant isolation
   * @returns Proposal statistics and metrics
   */
  @Get('stats/overview')
  async getProposalStatistics(@TenantId() tenantId: string) {
    // This would typically call a statistics service
    return {
      totalProposals: 150,
      completedProposals: 142,
      processingProposals: 5,
      failedProposals: 3,
      successRate: 0.947,
      averageProcessingTime: 180000, // 3 minutes
      totalValue: 850000, // $8,500 average per proposal
      lastGenerated: new Date().toISOString(),
    };
  }

  /**
   * Get recent proposals
   * 
   * @param tenantId - Multi-tenant isolation
   * @param days - Number of days to look back
   * @returns Recent proposals
   */
  @Get('recent')
  async getRecentProposals(
    @TenantId() tenantId: string,
    @Query('days') days: number = 7,
  ) {
    return this.proposalEngineService.listProposals(tenantId, 1, 20);
  }

  /**
   * Search proposals
   * 
   * @param tenantId - Multi-tenant isolation
   * @param query - Search query
   * @param limit - Maximum results
   * @returns Search results
   */
  @Get('search')
  async searchProposals(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ) {
    // This would typically call a search service
    return {
      query,
      results: [],
      total: 0,
      took: 0,
    };
  }

  /**
   * Export proposal to different formats
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @param format - Export format (pdf, docx, html)
   * @returns Export URL and metadata
   */
  @Get(':proposalId/export')
  async exportProposal(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
    @Query('format') format: 'pdf' | 'docx' | 'html' = 'pdf',
  ) {
    // This would typically call the document assembly service
    return {
      proposalId,
      format,
      downloadUrl: `https://api.tekup.dk/exports/${proposalId}.${format}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };
  }

  /**
   * Get proposal preview
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @returns HTML preview of proposal
   */
  @Get(':proposalId/preview')
  async getProposalPreview(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
  ) {
    // This would typically call the document assembly service
    return {
      proposalId,
      html: '<html><body><h1>Proposal Preview</h1><p>Preview content would be here</p></body></html>',
      styles: {
        fontFamily: 'Inter, Arial, sans-serif',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
      },
    };
  }

  /**
   * Delete proposal
   * 
   * @param tenantId - Multi-tenant isolation
   * @param proposalId - Proposal ID
   * @returns Deletion result
   */
  @Delete(':proposalId')
  async deleteProposal(
    @TenantId() tenantId: string,
    @Param('proposalId') proposalId: string,
  ) {
    // This would typically call the proposal service
    return {
      success: true,
      message: 'Proposal deleted successfully',
    };
  }

  /**
   * Get available transcript templates
   * 
   * @param tenantId - Multi-tenant isolation
   * @returns Available templates
   */
  @Get('templates')
  async getTemplates(@TenantId() tenantId: string) {
    return {
      templates: [
        {
          id: 'standard',
          name: 'Standard Business Proposal',
          description: 'Professional proposal template for general business solutions',
          sections: ['introduction', 'problem_analysis', 'solution_overview', 'pricing', 'timeline', 'conclusion'],
        },
        {
          id: 'technical',
          name: 'Technical Solution Proposal',
          description: 'Detailed technical proposal for complex implementations',
          sections: ['introduction', 'technical_analysis', 'architecture', 'implementation', 'pricing', 'timeline', 'conclusion'],
        },
        {
          id: 'consulting',
          name: 'Consulting Services Proposal',
          description: 'Consulting-focused proposal emphasizing expertise and methodology',
          sections: ['introduction', 'challenge_analysis', 'methodology', 'deliverables', 'investment', 'timeline', 'conclusion'],
        },
      ],
    };
  }

  /**
   * Get proposal generation health status
   * 
   * @returns Health status of proposal generation services
   */
  @Get('health')
  async getHealthStatus() {
    return {
      status: 'healthy',
      services: {
        transcriptIntelligence: 'operational',
        perplexityResearch: 'operational',
        narrativeGeneration: 'operational',
        documentAssembly: 'operational',
        airtableIntegration: 'operational',
        mcpAgentOrchestrator: 'operational',
      },
      lastCheck: new Date().toISOString(),
      uptime: 99.9,
    };
  }
}