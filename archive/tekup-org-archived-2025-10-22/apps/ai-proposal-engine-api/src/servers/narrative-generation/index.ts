import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { Logger, ConfigManager } from '../../shared/utils.js';
import { 
  TranscriptData,
  BuyingSignal,
  ResearchResult,
  ProposalNarrative,
  ProposalSection,
  ProposalSectionType,
  PainPoint
} from '../../types/index.js';

/**
 * Narrative Generation MCP Server
 * Creates compelling proposal narratives based on transcript analysis and research
 */
export class NarrativeGenerationServer {
  private server: Server;
  private logger: Logger;
  private openai: OpenAI;
  private config: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.config = ConfigManager.getOpenAIConfig();
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: this.config.apiKey
    });

    this.server = new Server(
      {
        name: 'narrative-generation-server',
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
            name: 'generate_narrative',
            description: 'Generate a complete proposal narrative from transcript analysis and research',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptData: {
                  type: 'object',
                  description: 'Processed transcript data'
                },
                buyingSignals: {
                  type: 'array',
                  description: 'Extracted buying signals'
                },
                researchResults: {
                  type: 'array',
                  description: 'Live research results'
                },
                customInstructions: {
                  type: 'string',
                  description: 'Custom instructions for narrative generation'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Target audience for the proposal'
                }
              },
              required: ['transcriptData', 'buyingSignals']
            }
          },
          {
            name: 'generate_section',
            description: 'Generate a specific section of the proposal',
            inputSchema: {
              type: 'object',
              properties: {
                sectionType: {
                  type: 'string',
                  enum: ['executive_summary', 'problem_statement', 'proposed_solution', 'benefits', 'implementation', 'timeline', 'pricing', 'next_steps'],
                  description: 'Type of section to generate'
                },
                context: {
                  type: 'object',
                  description: 'Context data for section generation'
                }
              },
              required: ['sectionType', 'context']
            }
          },
          {
            name: 'refine_narrative',
            description: 'Refine and improve an existing narrative',
            inputSchema: {
              type: 'object',
              properties: {
                narrative: {
                  type: 'object',
                  description: 'Existing narrative to refine'
                },
                feedback: {
                  type: 'string',
                  description: 'Feedback for refinement'
                }
              },
              required: ['narrative']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_narrative':
            return await this.generateNarrative(
              args.transcriptData as TranscriptData,
              args.buyingSignals as BuyingSignal[],
              args.researchResults as ResearchResult[],
              args.customInstructions as string,
              args.targetAudience as string
            );
          
          case 'generate_section':
            return await this.generateSection(
              args.sectionType as ProposalSectionType,
              args.context as any
            );
          
          case 'refine_narrative':
            return await this.refineNarrative(
              args.narrative as ProposalNarrative,
              args.feedback as string
            );
          
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
      this.logger.error('Narrative Generation Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Narrative Generation Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Generate complete proposal narrative
   */
  private async generateNarrative(
    transcriptData: TranscriptData,
    buyingSignals: BuyingSignal[],
    researchResults: ResearchResult[] = [],
    customInstructions?: string,
    targetAudience?: string
  ): Promise<{ content: ProposalNarrative }> {
    this.logger.info(`Generating narrative for transcript: ${transcriptData.id}`);

    try {
      // Extract key information
      const painPoints = this.extractPainPointsFromSignals(buyingSignals);
      const urgencySignals = buyingSignals.filter(s => s.type === 'urgency');
      const budgetSignals = buyingSignals.filter(s => s.type === 'budget');
      
      // Determine tone and approach
      const tone = this.determineTone(targetAudience, buyingSignals);
      
      // Generate each section
      const sections: ProposalSection[] = [];
      
      // Executive Summary
      const executiveSummary = await this.generateExecutiveSummary({
        transcriptData,
        buyingSignals,
        painPoints,
        researchResults,
        customInstructions
      });
      sections.push(executiveSummary);

      // Problem Statement
      const problemStatement = await this.generateProblemStatement({
        painPoints,
        buyingSignals,
        researchResults,
        companyContext: transcriptData.metadata
      });
      sections.push(problemStatement);

      // Proposed Solution
      const proposedSolution = await this.generateProposedSolution({
        painPoints,
        buyingSignals,
        researchResults,
        customInstructions
      });
      sections.push(proposedSolution);

      // Benefits
      const benefits = await this.generateBenefits({
        painPoints,
        researchResults,
        buyingSignals
      });
      sections.push(benefits);

      // Implementation (if timeline signals present)
      if (urgencySignals.length > 0 || buyingSignals.some(s => s.type === 'timeline')) {
        const implementation = await this.generateImplementation({
          urgencySignals,
          buyingSignals,
          customInstructions
        });
        sections.push(implementation);
      }

      // Next Steps
      const nextSteps = await this.generateNextSteps({
        buyingSignals,
        urgencySignals,
        budgetSignals
      });
      sections.push(nextSteps);

      // Extract key messages
      const keyMessages = this.extractKeyMessages(sections, buyingSignals);

      const narrative: ProposalNarrative = {
        sections,
        tone,
        targetAudience: targetAudience || 'Business Decision Makers',
        keyMessages
      };

      this.logger.info(`Generated narrative with ${sections.length} sections`);
      return { content: narrative };

    } catch (error) {
      this.logger.error('Error generating narrative:', error);
      throw new Error(`Failed to generate narrative: ${error.message}`);
    }
  }

  /**
   * Generate specific section
   */
  private async generateSection(
    sectionType: ProposalSectionType,
    context: any
  ): Promise<{ content: ProposalSection }> {
    this.logger.info(`Generating section: ${sectionType}`);

    try {
      let section: ProposalSection;

      switch (sectionType) {
        case ProposalSectionType.EXECUTIVE_SUMMARY:
          section = await this.generateExecutiveSummary(context);
          break;
        case ProposalSectionType.PROBLEM_STATEMENT:
          section = await this.generateProblemStatement(context);
          break;
        case ProposalSectionType.PROPOSED_SOLUTION:
          section = await this.generateProposedSolution(context);
          break;
        case ProposalSectionType.BENEFITS:
          section = await this.generateBenefits(context);
          break;
        case ProposalSectionType.IMPLEMENTATION:
          section = await this.generateImplementation(context);
          break;
        case ProposalSectionType.NEXT_STEPS:
          section = await this.generateNextSteps(context);
          break;
        default:
          throw new Error(`Unsupported section type: ${sectionType}`);
      }

      return { content: section };

    } catch (error) {
      this.logger.error(`Error generating section ${sectionType}:`, error);
      throw new Error(`Failed to generate section: ${error.message}`);
    }
  }

  /**
   * Refine existing narrative
   */
  private async refineNarrative(
    narrative: ProposalNarrative,
    feedback?: string
  ): Promise<{ content: ProposalNarrative }> {
    this.logger.info('Refining narrative based on feedback');

    try {
      // Apply refinements based on feedback
      const refinedSections = await Promise.all(
        narrative.sections.map(section => this.refineSection(section, feedback))
      );

      const refinedNarrative: ProposalNarrative = {
        ...narrative,
        sections: refinedSections
      };

      return { content: refinedNarrative };

    } catch (error) {
      this.logger.error('Error refining narrative:', error);
      throw new Error(`Failed to refine narrative: ${error.message}`);
    }
  }

  /**
   * Generate Executive Summary section
   */
  private async generateExecutiveSummary(context: any): Promise<ProposalSection> {
    const prompt = this.buildExecutiveSummaryPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert proposal writer specializing in executive summaries that capture attention and drive action. Write compelling, concise summaries that highlight key value propositions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || 'Executive Summary content could not be generated.';

    return {
      type: ProposalSectionType.EXECUTIVE_SUMMARY,
      title: 'Executive Summary',
      content,
      order: 1
    };
  }

  /**
   * Generate Problem Statement section
   */
  private async generateProblemStatement(context: any): Promise<ProposalSection> {
    const prompt = this.buildProblemStatementPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at articulating business problems in a way that resonates with decision makers. Focus on pain points, challenges, and the cost of inaction.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || 'Problem statement could not be generated.';

    return {
      type: ProposalSectionType.PROBLEM_STATEMENT,
      title: 'Current Challenges',
      content,
      order: 2
    };
  }

  /**
   * Generate Proposed Solution section
   */
  private async generateProposedSolution(context: any): Promise<ProposalSection> {
    const prompt = this.buildProposedSolutionPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert solution architect who creates compelling, detailed solution descriptions that directly address identified problems and demonstrate clear value.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1200
    });

    const content = response.choices[0]?.message?.content || 'Proposed solution could not be generated.';

    return {
      type: ProposalSectionType.PROPOSED_SOLUTION,
      title: 'Recommended Solution',
      content,
      order: 3
    };
  }

  /**
   * Generate Benefits section
   */
  private async generateBenefits(context: any): Promise<ProposalSection> {
    const prompt = this.buildBenefitsPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at articulating business benefits and ROI. Focus on quantifiable outcomes, competitive advantages, and strategic value.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || 'Benefits could not be generated.';

    return {
      type: ProposalSectionType.BENEFITS,
      title: 'Expected Benefits & ROI',
      content,
      order: 4
    };
  }

  /**
   * Generate Implementation section
   */
  private async generateImplementation(context: any): Promise<ProposalSection> {
    const prompt = this.buildImplementationPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert project manager who creates clear, actionable implementation plans that address timeline concerns and minimize risk.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content || 'Implementation plan could not be generated.';

    return {
      type: ProposalSectionType.IMPLEMENTATION,
      title: 'Implementation Approach',
      content,
      order: 5
    };
  }

  /**
   * Generate Next Steps section
   */
  private async generateNextSteps(context: any): Promise<ProposalSection> {
    const prompt = this.buildNextStepsPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating compelling calls to action that drive prospects to take the next step in the sales process.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 600
    });

    const content = response.choices[0]?.message?.content || 'Next steps could not be generated.';

    return {
      type: ProposalSectionType.NEXT_STEPS,
      title: 'Next Steps',
      content,
      order: 6
    };
  }

  /**
   * Build prompt for executive summary
   */
  private buildExecutiveSummaryPrompt(context: any): string {
    const painPoints = context.painPoints?.map((p: PainPoint) => p.description).join(', ') || 'operational challenges';
    const urgencySignals = context.buyingSignals?.filter((s: BuyingSignal) => s.type === 'urgency') || [];
    const researchInsights = context.researchResults?.flatMap((r: ResearchResult) => r.keyInsights).slice(0, 3) || [];

    return `
Write a compelling executive summary for a business proposal. Include:

1. Brief overview of the client's key challenges: ${painPoints}
2. High-level solution approach
3. Primary benefits and value proposition
4. Call to action

Key context:
- Urgency indicators: ${urgencySignals.map((s: BuyingSignal) => s.text).join('; ')}
- Research insights: ${researchInsights.join('; ')}
- Custom instructions: ${context.customInstructions || 'None'}

Keep it concise (2-3 paragraphs), impactful, and focused on business outcomes.
`;
  }

  /**
   * Build prompt for problem statement
   */
  private buildProblemStatementPrompt(context: any): string {
    const painPoints = context.painPoints?.map((p: PainPoint) => `${p.description} (${p.severity} severity)`).join('\n- ') || 'operational inefficiencies';
    const researchData = context.researchResults?.map((r: ResearchResult) => r.summary).join('\n\n') || '';

    return `
Write a detailed problem statement that articulates the business challenges. Include:

1. Current state analysis
2. Specific pain points and their impact:
   - ${painPoints}
3. Cost of inaction
4. Industry context and trends

Supporting research:
${researchData}

Make it compelling and relatable to business decision makers. Use data and statistics where available.
`;
  }

  /**
   * Build prompt for proposed solution
   */
  private buildProposedSolutionPrompt(context: any): string {
    const painPoints = context.painPoints?.map((p: PainPoint) => p.description).join(', ') || 'operational challenges';
    const researchInsights = context.researchResults?.flatMap((r: ResearchResult) => r.keyInsights).slice(0, 5) || [];

    return `
Write a comprehensive proposed solution that addresses the identified challenges:

Problems to solve: ${painPoints}

Include:
1. Solution overview and approach
2. Key components and features
3. How it specifically addresses each pain point
4. Differentiation from alternatives
5. Technology/methodology details (appropriate level)

Supporting insights:
${researchInsights.join('\n- ')}

Custom requirements: ${context.customInstructions || 'Standard business solution'}

Make it detailed but accessible, focusing on business value over technical specifications.
`;
  }

  /**
   * Build prompt for benefits section
   */
  private buildBenefitsPrompt(context: any): string {
    const painPoints = context.painPoints?.map((p: PainPoint) => p.description).join(', ') || 'operational challenges';
    const statistics = context.researchResults?.flatMap((r: ResearchResult) => r.statistics) || [];

    return `
Write a compelling benefits section that demonstrates ROI and value. Include:

1. Quantifiable benefits (use statistics where available)
2. Operational improvements
3. Strategic advantages
4. Risk mitigation
5. Competitive positioning

Problems being solved: ${painPoints}

Available statistics:
${statistics.map((s: any) => `- ${s.value}: ${s.description}`).join('\n')}

Focus on measurable outcomes and business impact. Use industry benchmarks and data to support claims.
`;
  }

  /**
   * Build prompt for implementation section
   */
  private buildImplementationPrompt(context: any): string {
    const urgencySignals = context.urgencySignals?.map((s: BuyingSignal) => s.text).join('; ') || '';

    return `
Write an implementation approach that addresses timeline concerns and minimizes risk. Include:

1. Implementation phases and milestones
2. Timeline considerations
3. Resource requirements
4. Risk mitigation strategies
5. Success metrics

Timeline concerns from client: ${urgencySignals}

Custom considerations: ${context.customInstructions || 'Standard implementation approach'}

Make it realistic but responsive to their urgency. Show how you'll deliver value quickly while ensuring quality.
`;
  }

  /**
   * Build prompt for next steps section
   */
  private buildNextStepsPrompt(context: any): string {
    const urgencySignals = context.urgencySignals?.map((s: BuyingSignal) => s.text).join('; ') || '';
    const budgetSignals = context.budgetSignals?.map((s: BuyingSignal) => s.text).join('; ') || '';

    return `
Write a compelling next steps section that drives action. Include:

1. Immediate next steps
2. Decision timeline
3. What you need from them
4. What they can expect from you
5. Contact information and availability

Context:
- Urgency indicators: ${urgencySignals}
- Budget discussions: ${budgetSignals}

Create urgency while being professional. Make it easy for them to say yes and move forward.
`;
  }

  /**
   * Extract pain points from buying signals
   */
  private extractPainPointsFromSignals(buyingSignals: BuyingSignal[]): PainPoint[] {
    const painPointSignals = buyingSignals.filter(s => s.type === 'pain_point');
    
    return painPointSignals.map(signal => ({
      description: signal.text,
      severity: signal.confidence > 0.8 ? 'high' : signal.confidence > 0.6 ? 'medium' : 'low',
      category: 'operational',
      relatedSignals: [signal.text]
    }));
  }

  /**
   * Determine appropriate tone based on audience and signals
   */
  private determineTone(targetAudience?: string, buyingSignals: BuyingSignal[] = []): 'professional' | 'casual' | 'technical' | 'consultative' {
    if (targetAudience?.toLowerCase().includes('technical') || targetAudience?.toLowerCase().includes('engineer')) {
      return 'technical';
    }
    
    if (targetAudience?.toLowerCase().includes('c-level') || targetAudience?.toLowerCase().includes('executive')) {
      return 'consultative';
    }

    // Default to professional
    return 'professional';
  }

  /**
   * Extract key messages from sections
   */
  private extractKeyMessages(sections: ProposalSection[], buyingSignals: BuyingSignal[]): string[] {
    const messages: string[] = [];
    
    // Extract from urgency signals
    const urgencySignals = buyingSignals.filter(s => s.type === 'urgency');
    if (urgencySignals.length > 0) {
      messages.push('Time-sensitive solution addressing immediate needs');
    }

    // Extract from budget signals
    const budgetSignals = buyingSignals.filter(s => s.type === 'budget');
    if (budgetSignals.length > 0) {
      messages.push('Cost-effective solution with clear ROI');
    }

    // Add default messages
    messages.push('Tailored approach to specific business challenges');
    messages.push('Proven methodology with measurable outcomes');

    return messages.slice(0, 4); // Limit to 4 key messages
  }

  /**
   * Refine a section based on feedback
   */
  private async refineSection(section: ProposalSection, feedback?: string): Promise<ProposalSection> {
    if (!feedback) return section;

    const prompt = `
Refine the following proposal section based on the feedback provided:

Section: ${section.title}
Current Content:
${section.content}

Feedback:
${feedback}

Provide an improved version that addresses the feedback while maintaining the professional tone and structure.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert proposal writer who excels at incorporating feedback to improve content quality and effectiveness.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1200
      });

      const refinedContent = response.choices[0]?.message?.content || section.content;

      return {
        ...section,
        content: refinedContent
      };

    } catch (error) {
      this.logger.error('Error refining section:', error);
      return section;
    }
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Narrative Generation Server started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new NarrativeGenerationServer();
  server.start().catch((error) => {
    console.error('Failed to start Narrative Generation Server:', error);
    process.exit(1);
  });
}
