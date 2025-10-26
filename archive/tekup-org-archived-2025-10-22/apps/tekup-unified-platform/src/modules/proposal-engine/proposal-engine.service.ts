import { Injectable, Logger } from '@nestjs/common';
import { TranscriptIntelligenceService } from './services/transcript-intelligence.service';
import { PerplexityResearchService } from './services/perplexity-research.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { DocumentAssemblyService } from './services/document-assembly.service';
import { AirtableIntegrationService } from './services/airtable-integration.service';
import { MCPAgentOrchestrator } from './services/mcp-agent-orchestrator.service';
import { ProposalRepository } from './repositories/proposal.repository';
import { CreateProposalDto, ProposalResponse, ProposalStatus } from './dto/proposal.dto';

/**
 * AI Proposal Engine Service
 * 
 * Orchestrates the complete proposal generation pipeline:
 * 1. Transcript Intelligence → Extract buying signals
 * 2. Live Research → Strengthen context with Perplexity
 * 3. Narrative Generation → Write in your voice
 * 4. Document Assembly → Create styled Google Doc
 * 5. One-Shot Deployment → Fully autonomous creation
 */
@Injectable()
export class ProposalEngineService {
  private readonly logger = new Logger(ProposalEngineService.name);

  constructor(
    private readonly transcriptIntelligence: TranscriptIntelligenceService,
    private readonly perplexityResearch: PerplexityResearchService,
    private readonly narrativeGeneration: NarrativeGenerationService,
    private readonly documentAssembly: DocumentAssemblyService,
    private readonly airtableIntegration: AirtableIntegrationService,
    private readonly mcpAgentOrchestrator: MCPAgentOrchestrator,
    private readonly proposalRepository: ProposalRepository,
  ) {}

  /**
   * Generate proposal from call transcript
   * 
   * @param tenantId - Multi-tenant isolation
   * @param transcriptId - Airtable transcript ID
   * @param options - Generation options
   * @returns Generated proposal with status tracking
   */
  async generateProposal(
    tenantId: string,
    transcriptId: string,
    options: CreateProposalDto,
  ): Promise<ProposalResponse> {
    this.logger.log(`Starting proposal generation for tenant ${tenantId}, transcript ${transcriptId}`);

    try {
      // Step 1: Create proposal record
      const proposal = await this.proposalRepository.create({
        tenantId,
        transcriptId,
        status: ProposalStatus.PROCESSING,
        options,
      });

      // Step 2: Orchestrate MCP agents for autonomous generation
      const result = await this.mcpAgentOrchestrator.executeProposalGeneration({
        proposalId: proposal.id,
        tenantId,
        transcriptId,
        options,
      });

      // Step 3: Update proposal with results
      const updatedProposal = await this.proposalRepository.update(proposal.id, {
        status: result.success ? ProposalStatus.COMPLETED : ProposalStatus.FAILED,
        documentUrl: result.documentUrl,
        metadata: result.metadata,
        errorMessage: result.error,
      });

      this.logger.log(`Proposal generation completed for proposal ${proposal.id}`);

      return {
        success: result.success,
        proposal: updatedProposal,
        message: result.success 
          ? 'Proposal generated successfully' 
          : 'Proposal generation failed',
      };

    } catch (error) {
      this.logger.error(`Proposal generation failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        proposal: null,
        message: `Proposal generation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get proposal by ID
   */
  async getProposal(tenantId: string, proposalId: string): Promise<ProposalResponse> {
    const proposal = await this.proposalRepository.findByTenantAndId(tenantId, proposalId);
    
    if (!proposal) {
      return {
        success: false,
        proposal: null,
        message: 'Proposal not found',
      };
    }

    return {
      success: true,
      proposal,
      message: 'Proposal retrieved successfully',
    };
  }

  /**
   * List proposals for tenant
   */
  async listProposals(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ proposals: any[]; total: number; page: number; limit: number }> {
    return this.proposalRepository.findByTenant(tenantId, page, limit);
  }

  /**
   * Get proposal generation status
   */
  async getProposalStatus(tenantId: string, proposalId: string): Promise<{
    status: ProposalStatus;
    progress: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
  }> {
    const proposal = await this.proposalRepository.findByTenantAndId(tenantId, proposalId);
    
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    return {
      status: proposal.status,
      progress: this.calculateProgress(proposal.status),
      currentStep: this.getCurrentStep(proposal.status),
      estimatedTimeRemaining: this.estimateTimeRemaining(proposal.status),
    };
  }

  /**
   * Retry failed proposal generation
   */
  async retryProposal(tenantId: string, proposalId: string): Promise<ProposalResponse> {
    const proposal = await this.proposalRepository.findByTenantAndId(tenantId, proposalId);
    
    if (!proposal) {
      return {
        success: false,
        proposal: null,
        message: 'Proposal not found',
      };
    }

    if (proposal.status !== ProposalStatus.FAILED) {
      return {
        success: false,
        proposal,
        message: 'Can only retry failed proposals',
      };
    }

    // Reset status and retry
    await this.proposalRepository.update(proposalId, {
      status: ProposalStatus.PROCESSING,
      errorMessage: null,
    });

    return this.generateProposal(tenantId, proposal.transcriptId, proposal.options);
  }

  private calculateProgress(status: ProposalStatus): number {
    const progressMap = {
      [ProposalStatus.PENDING]: 0,
      [ProposalStatus.PROCESSING]: 50,
      [ProposalStatus.COMPLETED]: 100,
      [ProposalStatus.FAILED]: 0,
    };
    return progressMap[status] || 0;
  }

  private getCurrentStep(status: ProposalStatus): string {
    const stepMap = {
      [ProposalStatus.PENDING]: 'Waiting to start',
      [ProposalStatus.PROCESSING]: 'Generating proposal',
      [ProposalStatus.COMPLETED]: 'Completed',
      [ProposalStatus.FAILED]: 'Failed',
    };
    return stepMap[status] || 'Unknown';
  }

  private estimateTimeRemaining(status: ProposalStatus): number | undefined {
    if (status === ProposalStatus.COMPLETED || status === ProposalStatus.FAILED) {
      return undefined;
    }
    
    // Estimate 2-3 minutes for complete generation
    return status === ProposalStatus.PROCESSING ? 120 : 180;
  }
}