import { Injectable, Logger } from '@nestjs/common';
import { BuyingSignalDto } from '../dto/proposal.dto';

/**
 * Transcript Intelligence Service
 * 
 * Extracts buying signals from call transcripts with sniper precision:
 * - Pain points and challenges
 * - Budget indicators and financial signals
 * - Timeline urgency and decision-making signals
 * - Decision maker identification
 * - Competitor mentions and positioning
 */
@Injectable()
export class TranscriptIntelligenceService {
  private readonly logger = new Logger(TranscriptIntelligenceService.name);

  /**
   * Analyze transcript and extract buying signals
   * 
   * @param transcript - Raw transcript text
   * @returns Array of buying signals with confidence scores
   */
  async extractBuyingSignals(transcript: string): Promise<BuyingSignalDto[]> {
    this.logger.log('Starting buying signal extraction from transcript');

    try {
      const signals: BuyingSignalDto[] = [];

      // Extract pain points
      const painPoints = await this.extractPainPoints(transcript);
      signals.push(...painPoints);

      // Extract budget indicators
      const budgetSignals = await this.extractBudgetSignals(transcript);
      signals.push(...budgetSignals);

      // Extract timeline signals
      const timelineSignals = await this.extractTimelineSignals(transcript);
      signals.push(...timelineSignals);

      // Extract decision maker signals
      const decisionMakerSignals = await this.extractDecisionMakerSignals(transcript);
      signals.push(...decisionMakerSignals);

      // Extract competitor mentions
      const competitorSignals = await this.extractCompetitorSignals(transcript);
      signals.push(...competitorSignals);

      this.logger.log(`Extracted ${signals.length} buying signals from transcript`);

      return signals.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      this.logger.error(`Failed to extract buying signals: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract pain points and challenges
   */
  private async extractPainPoints(transcript: string): Promise<BuyingSignalDto[]> {
    const painPointPatterns = [
      // Direct pain expressions
      /(?:struggling|struggle|challenging|challenge|difficult|problem|issue|frustrated|frustrating)/gi,
      // Time-related pain
      /(?:wasting time|time consuming|too much time|inefficient|slow|delayed)/gi,
      // Cost-related pain
      /(?:expensive|costly|over budget|wasting money|inefficient|losing money)/gi,
      // Process pain
      /(?:manual|tedious|repetitive|error prone|complicated|complex)/gi,
      // Competitive pain
      /(?:losing|behind|outdated|obsolete|not competitive)/gi,
    ];

    const signals: BuyingSignalDto[] = [];
    const sentences = transcript.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      painPointPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          signals.push({
            type: 'pain_point',
            content: sentence.trim(),
            confidence: this.calculateConfidence(sentence, pattern),
            context: this.getContext(sentences, index),
            timestamp: this.estimateTimestamp(transcript, sentence),
          });
        }
      });
    });

    return signals;
  }

  /**
   * Extract budget and financial indicators
   */
  private async extractBudgetSignals(transcript: string): Promise<BuyingSignalDto[]> {
    const budgetPatterns = [
      // Direct budget mentions
      /(?:budget|budgeted|allocation|allotted|set aside|invest|investment)/gi,
      // Financial capacity indicators
      /(?:afford|affordable|cost effective|roi|return on investment|value)/gi,
      // Price sensitivity
      /(?:expensive|cheap|costly|price|pricing|quote|estimate)/gi,
      // Financial urgency
      /(?:urgent|asap|quickly|immediately|this quarter|this year)/gi,
    ];

    const signals: BuyingSignalDto[] = [];
    const sentences = transcript.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      budgetPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          signals.push({
            type: 'budget_indicator',
            content: sentence.trim(),
            confidence: this.calculateConfidence(sentence, pattern),
            context: this.getContext(sentences, index),
            timestamp: this.estimateTimestamp(transcript, sentence),
          });
        }
      });
    });

    return signals;
  }

  /**
   * Extract timeline and urgency signals
   */
  private async extractTimelineSignals(transcript: string): Promise<BuyingSignalDto[]> {
    const timelinePatterns = [
      // Urgency indicators
      /(?:urgent|asap|immediately|quickly|fast|rush|deadline)/gi,
      // Timeline mentions
      /(?:timeline|schedule|deadline|due date|launch|go live|implementation)/gi,
      // Time constraints
      /(?:this week|this month|this quarter|by end of|before|after)/gi,
      // Project phases
      /(?:phase|stage|step|milestone|deliverable)/gi,
    ];

    const signals: BuyingSignalDto[] = [];
    const sentences = transcript.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      timelinePatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          signals.push({
            type: 'timeline_signal',
            content: sentence.trim(),
            confidence: this.calculateConfidence(sentence, pattern),
            context: this.getContext(sentences, index),
            timestamp: this.estimateTimestamp(transcript, sentence),
          });
        }
      });
    });

    return signals;
  }

  /**
   * Extract decision maker identification signals
   */
  private async extractDecisionMakerSignals(transcript: string): Promise<BuyingSignalDto[]> {
    const decisionMakerPatterns = [
      // Authority indicators
      /(?:i decide|i choose|i approve|my decision|i need to|i want)/gi,
      // Role mentions
      /(?:ceo|cto|cfo|director|manager|head of|vp|vice president)/gi,
      // Decision process
      /(?:approve|sign off|green light|go ahead|final say)/gi,
      // Influence indicators
      /(?:influence|recommend|suggest|advise|consult)/gi,
    ];

    const signals: BuyingSignalDto[] = [];
    const sentences = transcript.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      decisionMakerPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          signals.push({
            type: 'decision_maker',
            content: sentence.trim(),
            confidence: this.calculateConfidence(sentence, pattern),
            context: this.getContext(sentences, index),
            timestamp: this.estimateTimestamp(transcript, sentence),
          });
        }
      });
    });

    return signals;
  }

  /**
   * Extract competitor mentions and positioning
   */
  private async extractCompetitorSignals(transcript: string): Promise<BuyingSignalDto[]> {
    const competitorPatterns = [
      // Direct competitor mentions
      /(?:competitor|competition|alternative|option|other|instead)/gi,
      // Comparison language
      /(?:better|worse|compared to|versus|vs|rather than)/gi,
      // Switching indicators
      /(?:switch|change|replace|upgrade|migrate)/gi,
      // Vendor mentions
      /(?:vendor|supplier|provider|partner|company)/gi,
    ];

    const signals: BuyingSignalDto[] = [];
    const sentences = transcript.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      competitorPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          signals.push({
            type: 'competitor_mention',
            content: sentence.trim(),
            confidence: this.calculateConfidence(sentence, pattern),
            context: this.getContext(sentences, index),
            timestamp: this.estimateTimestamp(transcript, sentence),
          });
        }
      });
    });

    return signals;
  }

  /**
   * Calculate confidence score for a signal
   */
  private calculateConfidence(sentence: string, pattern: RegExp): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for multiple matches
    const matches = sentence.match(pattern);
    if (matches) {
      confidence += matches.length * 0.1;
    }

    // Increase confidence for strong emotional language
    const strongEmotionPatterns = [
      /(?:really|very|extremely|absolutely|definitely|certainly)/gi,
      /(?:must|need|have to|got to|should)/gi,
      /(?:urgent|critical|important|essential)/gi,
    ];

    strongEmotionPatterns.forEach(emotionPattern => {
      if (sentence.match(emotionPattern)) {
        confidence += 0.2;
      }
    });

    // Increase confidence for specific numbers or timeframes
    if (sentence.match(/\d+/)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get context around a sentence
   */
  private getContext(sentences: string[], index: number): string {
    const start = Math.max(0, index - 1);
    const end = Math.min(sentences.length, index + 2);
    return sentences.slice(start, end).join('. ').trim();
  }

  /**
   * Estimate timestamp for a sentence
   */
  private estimateTimestamp(transcript: string, sentence: string): number {
    const sentenceIndex = transcript.indexOf(sentence);
    const totalLength = transcript.length;
    const position = sentenceIndex / totalLength;
    
    // Assume average speaking rate of 150 words per minute
    const wordsPerSecond = 150 / 60;
    const totalWords = transcript.split(/\s+/).length;
    const totalSeconds = totalWords / wordsPerSecond;
    
    return Math.floor(position * totalSeconds);
  }

  /**
   * Generate buying signal summary
   */
  async generateBuyingSignalSummary(signals: BuyingSignalDto[]): Promise<{
    painPoints: string[];
    budgetIndicators: string[];
    timelineSignals: string[];
    decisionMakers: string[];
    competitors: string[];
    overallUrgency: 'low' | 'medium' | 'high';
    estimatedValue: 'low' | 'medium' | 'high';
  }> {
    const painPoints = signals
      .filter(s => s.type === 'pain_point')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(s => s.content);

    const budgetIndicators = signals
      .filter(s => s.type === 'budget_indicator')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.content);

    const timelineSignals = signals
      .filter(s => s.type === 'timeline_signal')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.content);

    const decisionMakers = signals
      .filter(s => s.type === 'decision_maker')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.content);

    const competitors = signals
      .filter(s => s.type === 'competitor_mention')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(s => s.content);

    // Calculate overall urgency
    const urgencySignals = signals.filter(s => 
      s.type === 'timeline_signal' && 
      s.content.toLowerCase().includes('urgent')
    );
    const overallUrgency = urgencySignals.length > 2 ? 'high' : 
                          urgencySignals.length > 0 ? 'medium' : 'low';

    // Calculate estimated value based on budget signals
    const budgetSignals = signals.filter(s => s.type === 'budget_indicator');
    const estimatedValue = budgetSignals.length > 3 ? 'high' :
                          budgetSignals.length > 1 ? 'medium' : 'low';

    return {
      painPoints,
      budgetIndicators,
      timelineSignals,
      decisionMakers,
      competitors,
      overallUrgency,
      estimatedValue,
    };
  }
}