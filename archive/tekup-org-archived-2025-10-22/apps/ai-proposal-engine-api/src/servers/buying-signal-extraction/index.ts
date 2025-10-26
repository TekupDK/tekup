import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import { Logger, ConfigManager, BuyingSignalAnalyzer } from '../../shared/utils.js';
import { 
  TranscriptData, 
  BuyingSignal, 
  BuyingSignalType, 
  PainPoint 
} from '../../types/index.js';

/**
 * Buying Signal Extraction MCP Server
 * Analyzes transcripts to identify buying signals and pain points
 */
export class BuyingSignalExtractionServer {
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
        name: 'buying-signal-extraction-server',
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
            name: 'extract_signals',
            description: 'Extract buying signals and pain points from a processed transcript',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptData: {
                  type: 'object',
                  description: 'The processed transcript data'
                }
              },
              required: ['transcriptData']
            }
          },
          {
            name: 'analyze_pain_points',
            description: 'Analyze and categorize pain points from transcript',
            inputSchema: {
              type: 'object',
              properties: {
                transcriptData: {
                  type: 'object',
                  description: 'The processed transcript data'
                }
              },
              required: ['transcriptData']
            }
          },
          {
            name: 'score_buying_intent',
            description: 'Calculate overall buying intent score from signals',
            inputSchema: {
              type: 'object',
              properties: {
                signals: {
                  type: 'array',
                  description: 'Array of buying signals'
                }
              },
              required: ['signals']
            }
          }
        ] as Tool[]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'extract_signals':
            return await this.extractSignals(args.transcriptData as TranscriptData);
          
          case 'analyze_pain_points':
            return await this.analyzePainPoints(args.transcriptData as TranscriptData);
          
          case 'score_buying_intent':
            return await this.scoreBuyingIntent(args.signals as BuyingSignal[]);
          
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
      this.logger.error('Buying Signal Extraction Server error:', error);
    };

    process.on('SIGINT', async () => {
      this.logger.info('Shutting down Buying Signal Extraction Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Extract buying signals from transcript data
   */
  private async extractSignals(transcriptData: TranscriptData): Promise<{ content: BuyingSignal[] }> {
    this.logger.info(`Extracting buying signals from transcript: ${transcriptData.id}`);

    try {
      const signals: BuyingSignal[] = [];

      // Use rule-based extraction first
      const ruleBasedSignals = this.extractRuleBasedSignals(transcriptData);
      signals.push(...ruleBasedSignals);

      // Enhance with AI-powered extraction
      const aiSignals = await this.extractAISignals(transcriptData);
      signals.push(...aiSignals);

      // Deduplicate and rank signals
      const uniqueSignals = this.deduplicateSignals(signals);
      const rankedSignals = this.rankSignals(uniqueSignals);

      this.logger.info(`Extracted ${rankedSignals.length} buying signals`);
      return { content: rankedSignals };

    } catch (error) {
      this.logger.error('Error extracting buying signals:', error);
      throw new Error(`Failed to extract buying signals: ${error.message}`);
    }
  }

  /**
   * Analyze pain points from transcript
   */
  private async analyzePainPoints(transcriptData: TranscriptData): Promise<{ content: PainPoint[] }> {
    this.logger.info(`Analyzing pain points from transcript: ${transcriptData.id}`);

    try {
      const painPoints = await this.extractPainPoints(transcriptData);
      this.logger.info(`Identified ${painPoints.length} pain points`);
      return { content: painPoints };

    } catch (error) {
      this.logger.error('Error analyzing pain points:', error);
      throw new Error(`Failed to analyze pain points: ${error.message}`);
    }
  }

  /**
   * Calculate buying intent score
   */
  private async scoreBuyingIntent(signals: BuyingSignal[]): Promise<{ content: { score: number, breakdown: any } }> {
    this.logger.info(`Calculating buying intent score from ${signals.length} signals`);

    try {
      const score = this.calculateBuyingIntentScore(signals);
      const breakdown = this.generateScoreBreakdown(signals);

      return { 
        content: { 
          score, 
          breakdown 
        } 
      };

    } catch (error) {
      this.logger.error('Error calculating buying intent score:', error);
      throw new Error(`Failed to calculate buying intent score: ${error.message}`);
    }
  }

  /**
   * Extract signals using rule-based patterns
   */
  private extractRuleBasedSignals(transcriptData: TranscriptData): BuyingSignal[] {
    const signals: BuyingSignal[] = [];

    for (const speaker of transcriptData.speakers) {
      // Focus on prospect signals
      if (speaker.role === 'prospect' || speaker.role === 'unknown') {
        for (const segment of speaker.segments) {
          const segmentSignals = BuyingSignalAnalyzer.analyzeBuyingSignals(
            segment.text,
            speaker.name || speaker.id,
            segment.startTime
          );
          signals.push(...segmentSignals);
        }
      }
    }

    return signals;
  }

  /**
   * Extract signals using AI/LLM analysis
   */
  private async extractAISignals(transcriptData: TranscriptData): Promise<BuyingSignal[]> {
    const prospectContent = this.extractProspectContent(transcriptData);
    
    if (!prospectContent.trim()) {
      return [];
    }

    const prompt = this.buildSignalExtractionPrompt(prospectContent);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales analyst specializing in identifying buying signals from sales call transcripts. Analyze the provided transcript and identify specific buying signals with high precision.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const aiAnalysis = response.choices[0]?.message?.content;
      if (!aiAnalysis) {
        this.logger.warn('No AI analysis received');
        return [];
      }

      return this.parseAISignals(aiAnalysis, transcriptData);

    } catch (error) {
      this.logger.error('Error in AI signal extraction:', error);
      return [];
    }
  }

  /**
   * Extract pain points using AI analysis
   */
  private async extractPainPoints(transcriptData: TranscriptData): Promise<PainPoint[]> {
    const prospectContent = this.extractProspectContent(transcriptData);
    
    if (!prospectContent.trim()) {
      return [];
    }

    const prompt = `
Analyze the following sales call transcript and identify specific pain points mentioned by the prospect.

For each pain point, provide:
1. A clear description of the problem
2. Severity level (low/medium/high)
3. Category (operational, technical, financial, strategic, etc.)

Transcript:
${prospectContent}

Return your analysis in JSON format:
{
  "painPoints": [
    {
      "description": "specific pain point description",
      "severity": "high|medium|low",
      "category": "category name"
    }
  ]
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying business pain points from sales conversations. Focus on explicit problems, challenges, and frustrations mentioned by prospects.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const aiAnalysis = response.choices[0]?.message?.content;
      if (!aiAnalysis) {
        return [];
      }

      return this.parseAIPainPoints(aiAnalysis);

    } catch (error) {
      this.logger.error('Error extracting pain points:', error);
      return [];
    }
  }

  /**
   * Extract content spoken by prospects
   */
  private extractProspectContent(transcriptData: TranscriptData): string {
    const prospectSegments: string[] = [];

    for (const speaker of transcriptData.speakers) {
      if (speaker.role === 'prospect' || speaker.role === 'unknown') {
        for (const segment of speaker.segments) {
          prospectSegments.push(`${speaker.name || 'Prospect'}: ${segment.text}`);
        }
      }
    }

    return prospectSegments.join('\n\n');
  }

  /**
   * Build prompt for AI signal extraction
   */
  private buildSignalExtractionPrompt(content: string): string {
    return `
Analyze the following sales call transcript and identify buying signals. Look for:

1. URGENCY signals (deadlines, time pressure, immediate needs)
2. BUDGET signals (mentions of money, approved budgets, pricing discussions)
3. AUTHORITY signals (decision-making power, approval processes)
4. INTEREST signals (positive reactions, engagement, curiosity)
5. TIMELINE signals (implementation schedules, start dates)
6. PAIN POINT acknowledgments (problems they want to solve)

For each signal found, provide:
- Type of signal
- Exact quote from transcript
- Confidence level (0.0-1.0)
- Brief explanation

Transcript:
${content}

Return your analysis in JSON format:
{
  "signals": [
    {
      "type": "urgency|budget|authority|interest|timeline|pain_point",
      "quote": "exact text from transcript",
      "confidence": 0.0-1.0,
      "explanation": "brief explanation"
    }
  ]
}
`;
  }

  /**
   * Parse AI-generated signals
   */
  private parseAISignals(aiAnalysis: string, transcriptData: TranscriptData): BuyingSignal[] {
    try {
      const parsed = JSON.parse(aiAnalysis);
      const signals: BuyingSignal[] = [];

      if (parsed.signals && Array.isArray(parsed.signals)) {
        for (const signal of parsed.signals) {
          signals.push({
            type: signal.type as BuyingSignalType,
            text: signal.quote,
            confidence: signal.confidence,
            timestamp: 0, // Would need more sophisticated timestamp matching
            speaker: 'prospect',
            context: signal.explanation || ''
          });
        }
      }

      return signals;

    } catch (error) {
      this.logger.error('Error parsing AI signals:', error);
      return [];
    }
  }

  /**
   * Parse AI-generated pain points
   */
  private parseAIPainPoints(aiAnalysis: string): PainPoint[] {
    try {
      const parsed = JSON.parse(aiAnalysis);
      const painPoints: PainPoint[] = [];

      if (parsed.painPoints && Array.isArray(parsed.painPoints)) {
        for (const point of parsed.painPoints) {
          painPoints.push({
            description: point.description,
            severity: point.severity,
            category: point.category,
            relatedSignals: []
          });
        }
      }

      return painPoints;

    } catch (error) {
      this.logger.error('Error parsing AI pain points:', error);
      return [];
    }
  }

  /**
   * Remove duplicate signals
   */
  private deduplicateSignals(signals: BuyingSignal[]): BuyingSignal[] {
    const unique: BuyingSignal[] = [];
    const seen = new Set<string>();

    for (const signal of signals) {
      const key = `${signal.type}-${signal.text.substring(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(signal);
      }
    }

    return unique;
  }

  /**
   * Rank signals by confidence and importance
   */
  private rankSignals(signals: BuyingSignal[]): BuyingSignal[] {
    return signals.sort((a, b) => {
      // Sort by confidence first, then by signal type importance
      const typeWeight = this.getSignalTypeWeight(a.type) - this.getSignalTypeWeight(b.type);
      if (typeWeight !== 0) return typeWeight;
      
      return b.confidence - a.confidence;
    });
  }

  /**
   * Get weight for signal type (higher = more important)
   */
  private getSignalTypeWeight(type: BuyingSignalType): number {
    const weights = {
      [BuyingSignalType.URGENCY]: 5,
      [BuyingSignalType.BUDGET]: 4,
      [BuyingSignalType.AUTHORITY]: 4,
      [BuyingSignalType.TIMELINE]: 3,
      [BuyingSignalType.PAIN_POINT]: 3,
      [BuyingSignalType.INTEREST]: 2,
      [BuyingSignalType.COMPETITIVE]: 2,
      [BuyingSignalType.TECHNICAL_REQUIREMENT]: 1
    };
    
    return weights[type] || 0;
  }

  /**
   * Calculate overall buying intent score
   */
  private calculateBuyingIntentScore(signals: BuyingSignal[]): number {
    if (!signals || signals.length === 0) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const signal of signals) {
      const weight = this.getSignalTypeWeight(signal.type);
      const signalScore = signal.confidence * weight;
      
      totalScore += signalScore;
      maxPossibleScore += weight;
    }

    // Normalize to 0-100 scale
    const normalizedScore = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    // Apply signal count bonus (more signals = higher confidence)
    const countBonus = Math.min(signals.length * 2, 20);
    
    return Math.min(normalizedScore + countBonus, 100);
  }

  /**
   * Generate score breakdown
   */
  private generateScoreBreakdown(signals: BuyingSignal[]): any {
    const breakdown = {
      totalSignals: signals.length,
      signalsByType: {} as any,
      averageConfidence: 0,
      strongSignals: 0
    };

    // Count signals by type
    for (const signal of signals) {
      if (!breakdown.signalsByType[signal.type]) {
        breakdown.signalsByType[signal.type] = 0;
      }
      breakdown.signalsByType[signal.type]++;
      
      if (signal.confidence >= 0.8) {
        breakdown.strongSignals++;
      }
    }

    // Calculate average confidence
    if (signals.length > 0) {
      breakdown.averageConfidence = signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
    }

    return breakdown;
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('Buying Signal Extraction Server started and listening...');
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new BuyingSignalExtractionServer();
  server.start().catch((error) => {
    console.error('Failed to start Buying Signal Extraction Server:', error);
    process.exit(1);
  });
}
