import { Module } from '@nestjs/common';
import { ProposalEngineController } from './proposal-engine.controller';
import { ProposalEngineService } from './proposal-engine.service';
import { TranscriptIntelligenceService } from './services/transcript-intelligence.service';
import { PerplexityResearchService } from './services/perplexity-research.service';
import { NarrativeGenerationService } from './services/narrative-generation.service';
import { DocumentAssemblyService } from './services/document-assembly.service';
import { AirtableIntegrationService } from './services/airtable-integration.service';
import { MCPAgentOrchestrator } from './services/mcp-agent-orchestrator.service';
import { ProposalRepository } from './repositories/proposal.repository';
// import { PrismaModule } from '../../prisma/prisma.module';
import { CoreModule } from '../core/core.module';

/**
 * AI Proposal Engine Module
 * 
 * Autonomous proposal generation system that:
 * - Extracts buying signals from call transcripts
 * - Performs live research via Perplexity
 * - Generates precision-targeted proposals
 * - Creates styled Google Docs ready to send
 * 
 * Built with MCP agent architecture for autonomous operation
 */
@Module({
  imports: [CoreModule],
  controllers: [ProposalEngineController],
  providers: [
    ProposalEngineService,
    TranscriptIntelligenceService,
    PerplexityResearchService,
    NarrativeGenerationService,
    DocumentAssemblyService,
    AirtableIntegrationService,
    MCPAgentOrchestrator,
    ProposalRepository,
  ],
  exports: [ProposalEngineService],
})
export class ProposalEngineModule {}