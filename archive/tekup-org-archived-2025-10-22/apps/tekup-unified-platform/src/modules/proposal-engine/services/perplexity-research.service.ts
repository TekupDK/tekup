import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResearchContextDto } from '../dto/proposal.dto';

/**
 * Perplexity Research Service
 * 
 * Performs live research to strengthen proposal context:
 * - Industry trends and insights
 * - Competitor analysis and positioning
 * - Market data and statistics
 * - Technology solutions and best practices
 * - Case studies and success stories
 */
@Injectable()
export class PerplexityResearchService {
  private readonly logger = new Logger(PerplexityResearchService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('PERPLEXITY_API_KEY not configured - research features will be disabled');
    }
  }

  /**
   * Perform comprehensive research for proposal context
   * 
   * @param buyingSignals - Extracted buying signals from transcript
   * @param clientName - Client company name
   * @param projectType - Type of project/solution
   * @returns Research context with relevant insights
   */
  async performResearch(
    buyingSignals: any[],
    clientName?: string,
    projectType?: string,
  ): Promise<ResearchContextDto[]> {
    if (!this.apiKey) {
      this.logger.warn('Perplexity API key not available - skipping research');
      return [];
    }

    this.logger.log('Starting Perplexity research for proposal context');

    try {
      const researchContexts: ResearchContextDto[] = [];

      // Research industry trends
      const industryTrends = await this.researchIndustryTrends(projectType);
      researchContexts.push(...industryTrends);

      // Research competitor landscape
      const competitorAnalysis = await this.researchCompetitorLandscape(projectType);
      researchContexts.push(...competitorAnalysis);

      // Research technology solutions
      const technologySolutions = await this.researchTechnologySolutions(buyingSignals);
      researchContexts.push(...technologySolutions);

      // Research case studies
      const caseStudies = await this.researchCaseStudies(projectType, clientName);
      researchContexts.push(...caseStudies);

      // Research market data
      const marketData = await this.researchMarketData(projectType);
      researchContexts.push(...marketData);

      this.logger.log(`Completed research - found ${researchContexts.length} relevant contexts`);

      return researchContexts.sort((a, b) => b.relevanceScore - a.relevanceScore);

    } catch (error) {
      this.logger.error(`Research failed: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Research industry trends and insights
   */
  private async researchIndustryTrends(projectType?: string): Promise<ResearchContextDto[]> {
    const query = projectType 
      ? `Latest trends and insights in ${projectType} industry 2024`
      : 'Latest business technology trends and insights 2024';

    const response = await this.makePerplexityRequest(query);
    
    return this.parseResearchResponse(response, 'industry_trends', 0.8);
  }

  /**
   * Research competitor landscape and positioning
   */
  private async researchCompetitorLandscape(projectType?: string): Promise<ResearchContextDto[]> {
    const query = projectType
      ? `Top competitors and market leaders in ${projectType} solutions 2024`
      : 'Business technology solution providers and market leaders 2024';

    const response = await this.makePerplexityRequest(query);
    
    return this.parseResearchResponse(response, 'competitor_analysis', 0.7);
  }

  /**
   * Research technology solutions based on buying signals
   */
  private async researchTechnologySolutions(buyingSignals: any[]): Promise<ResearchContextDto[]> {
    const painPoints = buyingSignals
      .filter(s => s.type === 'pain_point')
      .map(s => s.content)
      .join(', ');

    if (!painPoints) {
      return [];
    }

    const query = `Technology solutions and tools to address: ${painPoints}`;
    const response = await this.makePerplexityRequest(query);
    
    return this.parseResearchResponse(response, 'technology_solutions', 0.9);
  }

  /**
   * Research relevant case studies
   */
  private async researchCaseStudies(projectType?: string, clientName?: string): Promise<ResearchContextDto[]> {
    let query = 'Success stories and case studies in business technology implementation';
    
    if (projectType) {
      query += ` specifically for ${projectType}`;
    }
    
    if (clientName) {
      query += ` similar to ${clientName}`;
    }

    const response = await this.makePerplexityRequest(query);
    
    return this.parseResearchResponse(response, 'case_studies', 0.6);
  }

  /**
   * Research market data and statistics
   */
  private async researchMarketData(projectType?: string): Promise<ResearchContextDto[]> {
    const query = projectType
      ? `Market size, growth, and statistics for ${projectType} industry 2024`
      : 'Business technology market size and growth statistics 2024';

    const response = await this.makePerplexityRequest(query);
    
    return this.parseResearchResponse(response, 'market_data', 0.5);
  }

  /**
   * Make request to Perplexity API
   */
  private async makePerplexityRequest(query: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a business research assistant. Provide accurate, up-to-date information with specific details, statistics, and actionable insights. Always cite sources when possible.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ['perplexity.ai'],
        search_recency_filter: 'month',
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse Perplexity response into research contexts
   */
  private parseResearchResponse(
    response: any,
    topic: string,
    baseRelevance: number,
  ): ResearchContextDto[] {
    const contexts: ResearchContextDto[] = [];

    if (!response.choices || !response.choices[0]?.message?.content) {
      return contexts;
    }

    const content = response.choices[0].message.content;
    const citations = response.citations || [];

    // Split content into sections
    const sections = content.split('\n\n').filter(section => section.trim().length > 0);

    sections.forEach((section, index) => {
      if (section.trim().length < 50) return; // Skip short sections

      const relevanceScore = this.calculateRelevanceScore(section, baseRelevance);
      
      contexts.push({
        topic,
        content: section.trim(),
        source: 'Perplexity AI',
        url: citations[index]?.url || undefined,
        relevanceScore,
      });
    });

    return contexts;
  }

  /**
   * Calculate relevance score for research content
   */
  private calculateRelevanceScore(content: string, baseRelevance: number): number {
    let score = baseRelevance;

    // Increase score for specific data points
    if (content.match(/\d+%|\$\d+|\d+\.\d+%|million|billion/)) {
      score += 0.1;
    }

    // Increase score for actionable insights
    const actionWords = ['solution', 'strategy', 'approach', 'method', 'best practice', 'recommendation'];
    const actionCount = actionWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    score += actionCount * 0.05;

    // Increase score for specific company names
    if (content.match(/[A-Z][a-z]+ (Inc|Corp|LLC|Ltd|Company|Technologies|Solutions)/)) {
      score += 0.1;
    }

    // Increase score for recent dates
    if (content.match(/2024|2023|recent|latest|current/)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate research summary for proposal
   */
  async generateResearchSummary(researchContexts: ResearchContextDto[]): Promise<{
    keyInsights: string[];
    marketData: string[];
    competitorIntel: string[];
    technologyRecommendations: string[];
    caseStudyHighlights: string[];
  }> {
    const keyInsights = researchContexts
      .filter(c => c.topic === 'industry_trends')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(c => c.content);

    const marketData = researchContexts
      .filter(c => c.topic === 'market_data')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 2)
      .map(c => c.content);

    const competitorIntel = researchContexts
      .filter(c => c.topic === 'competitor_analysis')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 2)
      .map(c => c.content);

    const technologyRecommendations = researchContexts
      .filter(c => c.topic === 'technology_solutions')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(c => c.content);

    const caseStudyHighlights = researchContexts
      .filter(c => c.topic === 'case_studies')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 2)
      .map(c => c.content);

    return {
      keyInsights,
      marketData,
      competitorIntel,
      technologyRecommendations,
      caseStudyHighlights,
    };
  }
}