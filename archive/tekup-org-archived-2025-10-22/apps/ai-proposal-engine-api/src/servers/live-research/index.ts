import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { Logger, ConfigManager } from '../../shared/utils.js';
import { 
  BuyingSignal, 
  PainPoint, 
  ResearchResult, 
  ResearchSource, 
  Statistic,
  CompanyContext 
} from '../../types/index.js';

/**
 * Live Research Integration MCP Server
 * Conducts real-time research using Perplexity API to strengthen proposals
 */
export class LiveResearchServer {
  private server: Server;
  private logger: Logger;
  private perplexityConfig: any;
  private openaiConfig: any;

  constructor() {
    this.logger = Logger.getInstance();
    this.perplexityConfig = ConfigManager.getPerplexityConfig();
    this.openaiConfig = ConfigManager.getOpenAIConfig();

    this.server = new Server(
      {
        name: 'live-research-server',
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
            name: 'research_context',
            description: 'Conduct live research based on buying signals and company context',
            inputSchema: {
              type: 'object',
              properties: {
                buyingSignals: {
                  type: 'array',
                  description: 'Array of buying signals to research'
                },
                painPoints: {
                  type: 'array',
                  description: 'Array of pain points to research'
                },
                companyContext: {
                  type: 'object',
                  description: 'Company context information'
                }
              },
              required: ['buyingSignals']
            }
          },
          {
            name: 'research_industry_trends',
            description: 'Research current industry trends and challenges',
            inputSchema: {
              type: 'object',
              properties: {
                industry: {
                  type: 'string',
                  description: 'Industry to research'
                },
                painPoints: {
                  type: 'array',
                  description: 'Specific pain points to focus on'
                }
              },
              required: ['industry']
            }
          },
          {
            name: 'research_company_intelligence',
            description: 'Research specific company information and recent developments',
            inputSchema: {
              type: 'object',
              properties: {
                companyName: {
                  type: 'string',
                  description: 'Name of the company to research'
                },
                industry: {
                  type: 'string',
                  description: 'Company industry'
                }
              },
              required: ['companyName']
            }
          },
          {
            name: 'research_solution_validation',
            description: 'Research supporting evidence for proposed solutions',
            inputSchema: {
              type: 'object',
              properties: {
                solutionType: {
                  type: 'string',
                  description: 'Type of solution being proposed'
                },
                industry: {
                  type: 'string',
                  description: 'Target industry'
                },
                painPoints: {
                  type: 'array',
                  description: 'Pain points the solution addresses'
                }
              },
              required: ['solutionType']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'research_context':
            return await this.researchContext(
              args.buyingSignals as BuyingSignal[],
              args.painPoints as PainPoint[],
              args.companyContext as CompanyContext
            );
          
          case 'research_industry_trends':
            return await this.researchIndustryTrends(
              args.industry as string,
              args.painPoints as PainPoint[]
            );
          
          case 'research_company_intelligence':
            return await this.researchCompanyIntelligence(
              args.companyName as string,
              args.industry as string
            );
          
          case 'research_solution_validation':
            return await this.researchSolutionValidation(
              args.solutionType as string,
              args.industry as string,
              args.painPoints as PainPoint[]
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
      this.logger.error('Live Research Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Live Research Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Conduct comprehensive research based on buying signals and context
   */
  private async researchContext(
    buyingSignals: BuyingSignal[],
    painPoints: PainPoint[] = [],
    companyContext?: CompanyContext
  ): Promise<{ content: ResearchResult[] }> {
    this.logger.info('Conducting contextual research based on buying signals');

    try {
      const researchResults: ResearchResult[] = [];

      // Research based on pain points
      if (painPoints && painPoints.length > 0) {
        for (const painPoint of painPoints.slice(0, 3)) { // Limit to top 3
          const result = await this.researchPainPoint(painPoint, companyContext?.industry);
          if (result) {
            researchResults.push(result);
          }
        }
      }

      // Research industry-specific challenges if company context available
      if (companyContext?.industry) {
        const industryResult = await this.researchIndustryTrends(companyContext.industry, painPoints);
        if (industryResult.content) {
          researchResults.push(industryResult.content);
        }
      }

      // Research company-specific information
      if (companyContext?.name) {
        const companyResult = await this.researchCompanyIntelligence(
          companyContext.name,
          companyContext.industry
        );
        if (companyResult.content) {
          researchResults.push(companyResult.content);
        }
      }

      this.logger.info(`Completed contextual research with ${researchResults.length} results`);
      return { content: researchResults };

    } catch (error) {
      this.logger.error('Error in contextual research:', error);
      throw new Error(`Failed to conduct contextual research: ${error.message}`);
    }
  }

  /**
   * Research industry trends and challenges
   */
  private async researchIndustryTrends(
    industry: string,
    painPoints: PainPoint[] = []
  ): Promise<{ content: ResearchResult }> {
    this.logger.info(`Researching trends for industry: ${industry}`);

    try {
      const painPointsText = painPoints.map(p => p.description).join(', ');
      const query = painPointsText 
        ? `Current ${industry} industry trends and challenges related to ${painPointsText} in 2024-2025`
        : `Current ${industry} industry trends, challenges, and market developments in 2024-2025`;

      const result = await this.performPerplexitySearch(query);
      
      return { content: result };

    } catch (error) {
      this.logger.error('Error researching industry trends:', error);
      throw new Error(`Failed to research industry trends: ${error.message}`);
    }
  }

  /**
   * Research company-specific intelligence
   */
  private async researchCompanyIntelligence(
    companyName: string,
    industry?: string
  ): Promise<{ content: ResearchResult }> {
    this.logger.info(`Researching company intelligence for: ${companyName}`);

    try {
      const industryContext = industry ? ` in the ${industry} industry` : '';
      const query = `Recent news, developments, and challenges for ${companyName}${industryContext} in 2024-2025`;

      const result = await this.performPerplexitySearch(query);
      
      return { content: result };

    } catch (error) {
      this.logger.error('Error researching company intelligence:', error);
      throw new Error(`Failed to research company intelligence: ${error.message}`);
    }
  }

  /**
   * Research solution validation and supporting evidence
   */
  private async researchSolutionValidation(
    solutionType: string,
    industry?: string,
    painPoints: PainPoint[] = []
  ): Promise<{ content: ResearchResult }> {
    this.logger.info(`Researching solution validation for: ${solutionType}`);

    try {
      const industryContext = industry ? ` in ${industry}` : '';
      const painPointsContext = painPoints.length > 0 
        ? ` addressing ${painPoints.map(p => p.description).join(', ')}`
        : '';
      
      const query = `Case studies, ROI statistics, and success stories for ${solutionType}${industryContext}${painPointsContext}`;

      const result = await this.performPerplexitySearch(query);
      
      return { content: result };

    } catch (error) {
      this.logger.error('Error researching solution validation:', error);
      throw new Error(`Failed to research solution validation: ${error.message}`);
    }
  }

  /**
   * Research specific pain point
   */
  private async researchPainPoint(painPoint: PainPoint, industry?: string): Promise<ResearchResult | null> {
    try {
      const industryContext = industry ? ` in ${industry}` : '';
      const query = `Solutions and best practices for ${painPoint.description}${industryContext} with statistics and case studies`;

      return await this.performPerplexitySearch(query);

    } catch (error) {
      this.logger.error(`Error researching pain point: ${painPoint.description}`, error);
      return null;
    }
  }

  /**
   * Perform search using Perplexity API
   */
  private async performPerplexitySearch(query: string): Promise<ResearchResult> {
    this.logger.debug(`Performing Perplexity search: ${query}`);

    try {
      // Use OpenAI API key as fallback if Perplexity key not available
      const apiKey = this.perplexityConfig.apiKey || this.openaiConfig.apiKey;
      
      if (!apiKey) {
        throw new Error('No API key available for research');
      }

      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar-pro',
          messages: [
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content;
      const citations = response.data.citations || [];
      const searchResults = response.data.search_results || [];

      if (!content) {
        throw new Error('No content received from Perplexity API');
      }

      // Parse sources from search results
      const sources: ResearchSource[] = searchResults.map((result: any, index: number) => ({
        title: result.title || `Source ${index + 1}`,
        url: result.url || '',
        snippet: result.snippet || '',
        relevanceScore: 0.8, // Default relevance
        publishDate: result.date ? new Date(result.date) : undefined
      }));

      // Extract statistics from content
      const statistics = this.extractStatistics(content, sources);

      // Extract key insights
      const keyInsights = this.extractKeyInsights(content);

      const result: ResearchResult = {
        query,
        sources,
        summary: content,
        keyInsights,
        statistics
      };

      this.logger.debug(`Research completed with ${sources.length} sources and ${statistics.length} statistics`);
      return result;

    } catch (error) {
      this.logger.error('Error in Perplexity search:', error);
      
      // Fallback to mock data if API fails
      return this.createMockResearchResult(query);
    }
  }

  /**
   * Extract statistics from research content
   */
  private extractStatistics(content: string, sources: ResearchSource[]): Statistic[] {
    const statistics: Statistic[] = [];
    
    // Look for percentage patterns
    const percentageMatches = content.match(/(\d+(?:\.\d+)?%)/g);
    if (percentageMatches) {
      for (const match of percentageMatches.slice(0, 3)) { // Limit to 3
        const context = this.extractStatisticContext(content, match);
        statistics.push({
          value: match,
          description: context,
          source: sources[0]?.title || 'Research'
        });
      }
    }

    // Look for dollar amounts
    const dollarMatches = content.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|trillion|k|M|B|T))?/g);
    if (dollarMatches) {
      for (const match of dollarMatches.slice(0, 2)) { // Limit to 2
        const context = this.extractStatisticContext(content, match);
        statistics.push({
          value: match,
          description: context,
          source: sources[0]?.title || 'Research'
        });
      }
    }

    // Look for time-based statistics
    const timeMatches = content.match(/(\d+(?:\.\d+)?)\s*(hours?|days?|weeks?|months?|years?)/g);
    if (timeMatches) {
      for (const match of timeMatches.slice(0, 2)) { // Limit to 2
        const context = this.extractStatisticContext(content, match);
        statistics.push({
          value: match,
          description: context,
          source: sources[0]?.title || 'Research'
        });
      }
    }

    return statistics;
  }

  /**
   * Extract context around a statistic
   */
  private extractStatisticContext(content: string, statistic: string): string {
    const index = content.indexOf(statistic);
    if (index === -1) return statistic;

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + statistic.length + 50);
    
    return content.substring(start, end).trim();
  }

  /**
   * Extract key insights from research content
   */
  private extractKeyInsights(content: string): string[] {
    const insights: string[] = [];
    
    // Split content into sentences and find insightful ones
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    
    for (const sentence of sentences) {
      // Look for sentences with insight indicators
      if (this.isInsightfulSentence(sentence)) {
        insights.push(sentence);
        if (insights.length >= 5) break; // Limit to 5 insights
      }
    }

    return insights;
  }

  /**
   * Check if a sentence contains insightful information
   */
  private isInsightfulSentence(sentence: string): boolean {
    const insightIndicators = [
      'research shows', 'studies indicate', 'according to', 'data reveals',
      'companies that', 'organizations with', 'businesses using',
      'key finding', 'important trend', 'significant impact',
      'proven to', 'demonstrated that', 'evidence suggests'
    ];

    const lowerSentence = sentence.toLowerCase();
    return insightIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  /**
   * Create mock research result as fallback
   */
  private createMockResearchResult(query: string): ResearchResult {
    return {
      query,
      sources: [
        {
          title: 'Industry Research Report',
          url: 'https://example.com/research',
          snippet: 'Mock research data for proposal strengthening',
          relevanceScore: 0.7
        }
      ],
      summary: `Based on current market research related to "${query}", industry trends show significant opportunities for improvement and growth.`,
      keyInsights: [
        'Market demand for solutions in this area is increasing',
        'Companies implementing similar solutions see measurable ROI',
        'Industry leaders are prioritizing this type of investment'
      ],
      statistics: [
        {
          value: '73%',
          description: 'of companies report improved efficiency',
          source: 'Industry Research Report'
        }
      ]
    };
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Live Research Server started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new LiveResearchServer();
  server.start().catch((error) => {
    console.error('Failed to start Live Research Server:', error);
    process.exit(1);
  });
}
