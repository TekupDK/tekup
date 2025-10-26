import { BuyingSignal, BuyingSignalType } from '../types';

/**
 * Utility functions shared across MCP servers
 */

export class Logger {
  private static instance: Logger;
  private logLevel: string;

  private constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  public info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  public warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    }
  }

  public error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

export class TextProcessor {
  /**
   * Clean and normalize transcript text
   */
  public static cleanTranscript(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s.,!?;:'"()-]/g, '') // Remove special characters except punctuation
      .trim();
  }

  /**
   * Extract sentences from text
   */
  public static extractSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  public static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

export class BuyingSignalAnalyzer {
  private static readonly SIGNAL_PATTERNS = {
    [BuyingSignalType.URGENCY]: [
      /\b(urgent|asap|immediately|soon|quickly|deadline|time.?sensitive)\b/i,
      /\b(need.{0,10}(by|before)|must.{0,10}(have|get|implement))\b/i,
      /\b(running out of time|pressed for time|tight timeline)\b/i
    ],
    [BuyingSignalType.BUDGET]: [
      /\b(budget|cost|price|investment|funding|allocated|approved)\b/i,
      /\b(how much|what.{0,5}cost|pricing|quote|estimate)\b/i,
      /\b(\$|USD|dollars|money|financial|ROI|return on investment)\b/i
    ],
    [BuyingSignalType.AUTHORITY]: [
      /\b(decision|approve|authorize|sign off|final say)\b/i,
      /\b(I.{0,5}(decide|choose|select|pick)|my call|up to me)\b/i,
      /\b(team lead|manager|director|VP|CEO|CTO|decision maker)\b/i
    ],
    [BuyingSignalType.PAIN_POINT]: [
      /\b(problem|issue|challenge|struggle|difficulty|pain)\b/i,
      /\b(frustrated|annoyed|concerned|worried|stressed)\b/i,
      /\b(not working|broken|failing|inefficient|slow)\b/i
    ],
    [BuyingSignalType.INTEREST]: [
      /\b(interested|intrigued|curious|excited|impressed)\b/i,
      /\b(sounds good|looks great|perfect|exactly what|just what)\b/i,
      /\b(tell me more|learn more|know more|hear more)\b/i
    ],
    [BuyingSignalType.TIMELINE]: [
      /\b(when|timeline|schedule|start|begin|implement|launch)\b/i,
      /\b(next (week|month|quarter)|by (end of|beginning of))\b/i,
      /\b(Q[1-4]|January|February|March|April|May|June|July|August|September|October|November|December)\b/i
    ]
  };

  /**
   * Analyze text for buying signals
   */
  public static analyzeBuyingSignals(text: string, speaker: string, timestamp: number): BuyingSignal[] {
    const signals: BuyingSignal[] = [];
    const sentences = TextProcessor.extractSentences(text);

    for (const sentence of sentences) {
      for (const [signalType, patterns] of Object.entries(this.SIGNAL_PATTERNS)) {
        for (const pattern of patterns) {
          if (pattern.test(sentence)) {
            const confidence = this.calculateConfidence(sentence, pattern);
            signals.push({
              type: signalType as BuyingSignalType,
              text: sentence,
              confidence,
              timestamp,
              speaker,
              context: this.extractContext(text, sentence)
            });
          }
        }
      }
    }

    return signals;
  }

  private static calculateConfidence(sentence: string, pattern: RegExp): number {
    const matches = sentence.match(pattern);
    if (!matches) return 0;

    // Base confidence on pattern strength and sentence length
    let confidence = 0.7;
    
    // Boost confidence for multiple matches
    if (matches.length > 1) confidence += 0.1;
    
    // Boost confidence for shorter, more direct sentences
    if (sentence.length < 50) confidence += 0.1;
    
    // Boost confidence for first-person statements
    if (/\b(I|we|our|my)\b/i.test(sentence)) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private static extractContext(fullText: string, targetSentence: string): string {
    const sentences = TextProcessor.extractSentences(fullText);
    const targetIndex = sentences.findIndex(s => s.includes(targetSentence.substring(0, 20)));
    
    if (targetIndex === -1) return targetSentence;

    const start = Math.max(0, targetIndex - 1);
    const end = Math.min(sentences.length, targetIndex + 2);
    
    return sentences.slice(start, end).join(' ');
  }
}

export class ConfigManager {
  private static config: any = null;

  public static loadConfig(): any {
    if (!this.config) {
      require('dotenv').config();
      this.config = {
        openai: {
          apiKey: process.env.OPENAI_API_KEY
        },
        perplexity: {
          apiKey: process.env.PERPLEXITY_API_KEY
        },
        airtable: {
          apiKey: process.env.AIRTABLE_API_KEY,
          baseId: process.env.AIRTABLE_BASE_ID,
          tableName: process.env.AIRTABLE_TABLE_NAME
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: process.env.GOOGLE_REDIRECT_URI,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN
        },
        mcp: {
          hostPort: parseInt(process.env.MCP_HOST_PORT || '3000'),
          serverPortsStart: parseInt(process.env.MCP_SERVER_PORTS_START || '3001')
        }
      };
    }
    return this.config;
  }

  public static getOpenAIConfig() {
    return this.loadConfig().openai;
  }

  public static getPerplexityConfig() {
    return this.loadConfig().perplexity;
  }

  public static getAirtableConfig() {
    return this.loadConfig().airtable;
  }

  public static getGoogleConfig() {
    return this.loadConfig().google;
  }

  public static getMCPConfig() {
    return this.loadConfig().mcp;
  }
}
