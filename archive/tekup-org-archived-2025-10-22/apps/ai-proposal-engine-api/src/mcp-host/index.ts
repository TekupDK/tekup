import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger, ConfigManager } from '../shared/utils.js';
import { 
  ProposalGenerationRequest, 
  ProposalGenerationResult,
  TranscriptData,
  BuyingSignal,
  ResearchResult,
  ProposalNarrative
} from '../types/index.js';

/**
 * MCP Host - Orchestrates the AI Proposal Engine workflow
 */
export class MCPHost {
  private server: Server;
  private logger: Logger;
  private config: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.config = ConfigManager.loadConfig();
    
    this.server = new Server(
      {
        name: 'ai-proposal-engine-host',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupErrorHandling();
  }

  private setupTools(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_proposal',
            description: 'Generate a complete proposal from a sales call transcript',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptId: {
                  type: 'string',
                  description: 'The ID of the transcript in Airtable'
                },
                templateId: {
                  type: 'string',
                  description: 'Optional template ID for the proposal'
                },
                customInstructions: {
                  type: 'string',
                  description: 'Optional custom instructions for proposal generation'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience for the proposal'
                }
              },
              required: ['transcriptId']
            }
          },
          {
            name: 'analyze_transcript',
            description: 'Analyze a transcript for buying signals and pain points',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptId: {
                  type: 'string',
                  description: 'The ID of the transcript in Airtable'
                }
              },
              required: ['transcriptId']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_proposal':
            return await this.generateProposal(args as ProposalGenerationRequest);
          
          case 'analyze_transcript':
            return await this.analyzeTranscript(args.transcriptId as string);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      this.logger.error('MCP Host error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down MCP Host...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Main workflow: Generate a complete proposal from transcript
   */
  private async generateProposal(request: ProposalGenerationRequest): Promise<{ content: ProposalGenerationResult }> {
    this.logger.info(`Starting proposal generation for transcript: ${request.transcriptId}`);
    const startTime = Date.now();

    try {
      // Step 1: Process transcript
      this.logger.info('Step 1: Processing transcript...');
      const transcriptData = await this.callMCPServer('transcript-intelligence', 'process_transcript', {
        transcriptId: request.transcriptId
      });

      // Step 2: Extract buying signals
      this.logger.info('Step 2: Extracting buying signals...');
      const buyingSignals = await this.callMCPServer('buying-signal-extraction', 'extract_signals', {
        transcriptData
      });

      // Step 3: Conduct live research
      this.logger.info('Step 3: Conducting live research...');
      const researchResults = await this.callMCPServer('live-research', 'research_context', {
        buyingSignals,
        companyContext: request.companyContext
      });

      // Step 4: Generate narrative
      this.logger.info('Step 4: Generating proposal narrative...');
      const narrative = await this.callMCPServer('narrative-generation', 'generate_narrative', {
        transcriptData,
        buyingSignals,
        researchResults,
        customInstructions: request.customInstructions,
        targetAudience: request.targetAudience
      });

      // Step 5: Assemble document
      this.logger.info('Step 5: Assembling final document...');
      const documentResult = await this.callMCPServer('document-assembly', 'create_document', {
        narrative,
        templateId: request.templateId
      });

      const generationTime = Date.now() - startTime;
      this.logger.info(`Proposal generation completed in ${generationTime}ms`);

      const result: ProposalGenerationResult = {
        documentUrl: documentResult.documentUrl,
        generationTime,
        confidence: this.calculateOverallConfidence(buyingSignals),
        usedSignals: buyingSignals,
        researchSources: researchResults.sources || [],
        sections: narrative.sections || []
      };

      return { content: result };

    } catch (error) {
      this.logger.error('Error in proposal generation workflow:', error);
      throw new Error(`Proposal generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze transcript for buying signals only
   */
  private async analyzeTranscript(transcriptId: string): Promise<{ content: { signals: BuyingSignal[], transcript: TranscriptData } }> {
    this.logger.info(`Analyzing transcript: ${transcriptId}`);

    try {
      // Process transcript
      const transcriptData = await this.callMCPServer('transcript-intelligence', 'process_transcript', {
        transcriptId
      });

      // Extract buying signals
      const buyingSignals = await this.callMCPServer('buying-signal-extraction', 'extract_signals', {
        transcriptData
      });

      return {
        content: {
          signals: buyingSignals,
          transcript: transcriptData
        }
      };

    } catch (error) {
      this.logger.error('Error in transcript analysis:', error);
      throw new Error(`Transcript analysis failed: ${error.message}`);
    }
  }

  /**
   * Call an MCP server (placeholder for actual MCP client implementation)
   */
  private async callMCPServer(serverName: string, toolName: string, args: any): Promise<any> {
    // In a real implementation, this would use MCP client to call the appropriate server
    // For now, we'll simulate the calls
    this.logger.debug(`Calling ${serverName}.${toolName}`, args);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return mock data based on server and tool
    switch (`${serverName}.${toolName}`) {
      case 'transcript-intelligence.process_transcript':
        return this.mockTranscriptData();
      
      case 'buying-signal-extraction.extract_signals':
        return this.mockBuyingSignals();
      
      case 'live-research.research_context':
        return this.mockResearchResults();
      
      case 'narrative-generation.generate_narrative':
        return this.mockNarrative();
      
      case 'document-assembly.create_document':
        return { documentUrl: 'https://docs.google.com/document/d/mock-document-id' };
      
      default:
        throw new Error(`Unknown server.tool: ${serverName}.${toolName}`);
    }
  }

  private calculateOverallConfidence(signals: BuyingSignal[]): number {
    if (!signals || signals.length === 0) return 0;
    
    const avgConfidence = signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
    const signalCount = signals.length;
    
    // Boost confidence based on number of signals
    const countBoost = Math.min(signalCount * 0.1, 0.3);
    
    return Math.min(avgConfidence + countBoost, 1.0);
  }

  // Mock data methods (to be replaced with actual server calls)
  private mockTranscriptData(): TranscriptData {
    return {
      id: 'mock-transcript-1',
      content: 'Mock transcript content with buying signals...',
      speakers: [],
      metadata: {
        duration: 1800,
        recordingDate: new Date(),
        participants: ['John Doe', 'Jane Smith']
      }
    };
  }

  private mockBuyingSignals(): BuyingSignal[] {
    return [
      {
        type: 'urgency' as any,
        text: 'We need this implemented by end of quarter',
        confidence: 0.9,
        timestamp: 300,
        speaker: 'prospect',
        context: 'Discussing timeline requirements'
      }
    ];
  }

  private mockResearchResults(): ResearchResult {
    return {
      query: 'industry trends',
      sources: [],
      summary: 'Mock research summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      statistics: []
    };
  }

  private mockNarrative(): ProposalNarrative {
    return {
      sections: [],
      tone: 'professional',
      targetAudience: 'C-level executives',
      keyMessages: ['Message 1', 'Message 2']
    };
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP Host started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const host = new MCPHost();
  host.start().catch((error) => {
    console.error('Failed to start MCP Host:', error);
    process.exit(1);
  });
}
