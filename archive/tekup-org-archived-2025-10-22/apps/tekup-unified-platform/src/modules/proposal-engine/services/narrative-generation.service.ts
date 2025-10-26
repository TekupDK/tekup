import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BuyingSignalDto, ResearchContextDto, NarrativeSectionDto } from '../dto/proposal.dto';

/**
 * Narrative Generation Service
 * 
 * Generates precision-targeted proposal content:
 * - Writes in your voice and structure
 * - Hits exact prospect psychological triggers
 * - Incorporates buying signals and research
 * - Creates compelling narrative flow
 * - Optimizes for conversion
 */
@Injectable()
export class NarrativeGenerationService {
  private readonly logger = new Logger(NarrativeGenerationService.name);
  private readonly openaiApiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!this.openaiApiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - narrative generation will be disabled');
    }
  }

  /**
   * Generate complete proposal narrative
   * 
   * @param buyingSignals - Extracted buying signals
   * @param researchContexts - Research insights
   * @param options - Generation options
   * @returns Structured proposal sections
   */
  async generateProposalNarrative(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: {
      clientName?: string;
      projectType?: string;
      tone?: 'professional' | 'friendly' | 'urgent' | 'consultative';
      estimatedValue?: number;
      urgency?: 'low' | 'medium' | 'high';
    },
  ): Promise<NarrativeSectionDto[]> {
    if (!this.openaiApiKey) {
      this.logger.warn('OpenAI API key not available - using fallback narrative generation');
      return this.generateFallbackNarrative(buyingSignals, researchContexts, options);
    }

    this.logger.log('Starting AI-powered narrative generation');

    try {
      const sections: NarrativeSectionDto[] = [];

      // Generate introduction
      const introduction = await this.generateIntroduction(buyingSignals, researchContexts, options);
      sections.push(introduction);

      // Generate problem analysis
      const problemAnalysis = await this.generateProblemAnalysis(buyingSignals, researchContexts, options);
      sections.push(problemAnalysis);

      // Generate solution overview
      const solutionOverview = await this.generateSolutionOverview(buyingSignals, researchContexts, options);
      sections.push(solutionOverview);

      // Generate pricing section
      if (options.estimatedValue) {
        const pricing = await this.generatePricingSection(buyingSignals, researchContexts, options);
        sections.push(pricing);
      }

      // Generate timeline
      const timeline = await this.generateTimelineSection(buyingSignals, researchContexts, options);
      sections.push(timeline);

      // Generate conclusion
      const conclusion = await this.generateConclusion(buyingSignals, researchContexts, options);
      sections.push(conclusion);

      this.logger.log(`Generated ${sections.length} narrative sections`);

      return sections;

    } catch (error) {
      this.logger.error(`Narrative generation failed: ${error.message}`, error.stack);
      return this.generateFallbackNarrative(buyingSignals, researchContexts, options);
    }
  }

  /**
   * Generate compelling introduction
   */
  private async generateIntroduction(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const painPoints = buyingSignals
      .filter(s => s.type === 'pain_point')
      .map(s => s.content)
      .join(', ');

    const prompt = `Write a compelling proposal introduction for ${options.clientName || 'a client'} that:

1. Acknowledges their specific challenges: ${painPoints}
2. Establishes credibility and understanding
3. Sets up the value proposition
4. Uses a ${options.tone || 'professional'} tone
5. Incorporates relevant industry insights: ${researchContexts.slice(0, 2).map(c => c.content).join(' ')}
6. Creates urgency and interest

Keep it concise (2-3 paragraphs) and focused on their specific situation.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Executive Summary',
      content,
      type: 'introduction',
      order: 1,
      metadata: {
        tone: options.tone,
        clientName: options.clientName,
        painPoints: painPoints.split(', '),
      },
    };
  }

  /**
   * Generate detailed problem analysis
   */
  private async generateProblemAnalysis(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const painPoints = buyingSignals
      .filter(s => s.type === 'pain_point')
      .map(s => s.content);

    const budgetSignals = buyingSignals
      .filter(s => s.type === 'budget_indicator')
      .map(s => s.content);

    const prompt = `Analyze the business challenges for ${options.clientName || 'this client'} based on:

Pain Points: ${painPoints.join(', ')}
Budget Indicators: ${budgetSignals.join(', ')}
Industry Context: ${researchContexts.filter(c => c.topic === 'industry_trends').map(c => c.content).join(' ')}

Create a problem analysis section that:
1. Demonstrates deep understanding of their specific challenges
2. Quantifies the impact of these problems
3. Shows industry context and trends
4. Builds urgency for action
5. Uses a consultative tone

Structure as 3-4 key problem areas with supporting details.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Understanding Your Challenges',
      content,
      type: 'problem_analysis',
      order: 2,
      metadata: {
        painPoints,
        budgetSignals,
        industryContext: researchContexts.filter(c => c.topic === 'industry_trends').length,
      },
    };
  }

  /**
   * Generate solution overview
   */
  private async generateSolutionOverview(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const technologySolutions = researchContexts
      .filter(c => c.topic === 'technology_solutions')
      .map(c => c.content);

    const caseStudies = researchContexts
      .filter(c => c.topic === 'case_studies')
      .map(c => c.content);

    const prompt = `Create a solution overview for ${options.projectType || 'this project'} that addresses the challenges identified. 

Technology Solutions Available: ${technologySolutions.join(' ')}
Success Stories: ${caseStudies.join(' ')}

The solution should:
1. Directly address each pain point mentioned
2. Leverage proven technology and methodologies
3. Include specific features and benefits
4. Reference relevant case studies or success stories
5. Show clear value proposition
6. Use a confident, solution-oriented tone

Structure as 4-5 key solution components with benefits.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Our Solution Approach',
      content,
      type: 'solution_overview',
      order: 3,
      metadata: {
        technologySolutions: technologySolutions.length,
        caseStudies: caseStudies.length,
        projectType: options.projectType,
      },
    };
  }

  /**
   * Generate pricing section
   */
  private async generatePricingSection(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const budgetSignals = buyingSignals
      .filter(s => s.type === 'budget_indicator')
      .map(s => s.content);

    const marketData = researchContexts
      .filter(c => c.topic === 'market_data')
      .map(c => c.content);

    const prompt = `Create a pricing section for a ${options.projectType || 'project'} with estimated value of $${options.estimatedValue}.

Budget Context: ${budgetSignals.join(', ')}
Market Data: ${marketData.join(' ')}

The pricing section should:
1. Present value-based pricing that justifies the investment
2. Break down costs into logical components
3. Show ROI calculations and payback period
4. Address budget concerns mentioned in the conversation
5. Include flexible payment options
6. Emphasize value over cost

Structure as 3-4 pricing tiers or components with clear value propositions.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Investment & Value Proposition',
      content,
      type: 'pricing',
      order: 4,
      metadata: {
        estimatedValue: options.estimatedValue,
        budgetSignals: budgetSignals.length,
        marketData: marketData.length,
      },
    };
  }

  /**
   * Generate timeline section
   */
  private async generateTimelineSection(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const timelineSignals = buyingSignals
      .filter(s => s.type === 'timeline_signal')
      .map(s => s.content);

    const urgency = options.urgency || 'medium';

    const prompt = `Create a project timeline for ${options.projectType || 'this project'} based on:

Timeline Signals: ${timelineSignals.join(', ')}
Urgency Level: ${urgency}
Project Type: ${options.projectType || 'general business solution'}

The timeline should:
1. Address any urgency or deadline concerns mentioned
2. Show realistic but efficient project phases
3. Include key milestones and deliverables
4. Account for client feedback and approval cycles
5. Demonstrate our commitment to timely delivery
6. Build confidence in our project management

Structure as 4-5 phases with specific timelines and deliverables.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Project Timeline & Milestones',
      content,
      type: 'timeline',
      order: 5,
      metadata: {
        urgency,
        timelineSignals: timelineSignals.length,
        phases: 4,
      },
    };
  }

  /**
   * Generate compelling conclusion
   */
  private async generateConclusion(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): Promise<NarrativeSectionDto> {
    const decisionMakers = buyingSignals
      .filter(s => s.type === 'decision_maker')
      .map(s => s.content);

    const prompt = `Write a compelling conclusion for this proposal that:

1. Summarizes the key value propositions
2. Addresses decision-making concerns: ${decisionMakers.join(', ')}
3. Creates urgency for action
4. Provides clear next steps
5. Reinforces our commitment to their success
6. Uses a confident, closing tone

Make it action-oriented and focused on moving forward.`;

    const content = await this.generateWithAI(prompt);
    
    return {
      title: 'Next Steps & Commitment',
      content,
      type: 'conclusion',
      order: 6,
      metadata: {
        decisionMakers: decisionMakers.length,
        callToAction: true,
      },
    };
  }

  /**
   * Generate content using OpenAI API
   */
  private async generateWithAI(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert business proposal writer with 20+ years of experience. Write compelling, professional proposals that close deals. Focus on value, address specific client needs, and create urgency for action.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Content generation failed';
  }

  /**
   * Fallback narrative generation without AI
   */
  private generateFallbackNarrative(
    buyingSignals: BuyingSignalDto[],
    researchContexts: ResearchContextDto[],
    options: any,
  ): NarrativeSectionDto[] {
    const painPoints = buyingSignals
      .filter(s => s.type === 'pain_point')
      .map(s => s.content);

    return [
      {
        title: 'Executive Summary',
        content: `Thank you for the opportunity to present our solution for ${options.clientName || 'your organization'}. Based on our discussion, we understand you're facing challenges with ${painPoints.slice(0, 2).join(' and ')}. Our comprehensive approach addresses these specific needs while delivering measurable value.`,
        type: 'introduction',
        order: 1,
        metadata: { fallback: true },
      },
      {
        title: 'Understanding Your Challenges',
        content: `We've identified several key challenges that are impacting your operations: ${painPoints.join(', ')}. These issues are common in your industry and can significantly impact efficiency and growth.`,
        type: 'problem_analysis',
        order: 2,
        metadata: { fallback: true },
      },
      {
        title: 'Our Solution Approach',
        content: `Our proven methodology addresses each of these challenges through a structured approach that combines industry best practices with innovative technology solutions.`,
        type: 'solution_overview',
        order: 3,
        metadata: { fallback: true },
      },
      {
        title: 'Next Steps',
        content: `We're excited about the opportunity to work together and help you achieve your goals. Let's schedule a follow-up meeting to discuss implementation details and answer any questions you may have.`,
        type: 'conclusion',
        order: 4,
        metadata: { fallback: true },
      },
    ];
  }
}