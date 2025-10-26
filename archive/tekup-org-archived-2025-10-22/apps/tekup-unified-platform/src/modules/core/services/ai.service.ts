import { Injectable, Logger } from '@nestjs/common';

export interface AIResponse {
  content: string;
  usage?: {
    tokens: number;
    cost?: number;
  };
  provider?: string;
  model?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_AI_FEATURES === 'true';
    
    if (this.enabled) {
      this.logger.log('AI features enabled');
    } else {
      this.logger.log('AI features disabled - platform running without AI');
    }
  }

  /**
   * Generate text using AI (optional - fallback to rule-based responses)
   */
  async generateText(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      context?: string;
    } = {}
  ): Promise<AIResponse> {
    if (!this.enabled) {
      return this.generateFallbackResponse(prompt);
    }

    try {
      // Try providers in order of preference
      const provider = process.env.AI_DEFAULT_PROVIDER || 'none';
      
      switch (provider) {
        case 'openai':
          return await this.generateOpenAI(prompt, options);
        case 'gemini':
          return await this.generateGemini(prompt, options);
        default:
          return this.generateFallbackResponse(prompt);
      }
    } catch (error) {
      this.logger.warn('AI generation failed, using fallback:', error.message);
      return this.generateFallbackResponse(prompt);
    }
  }

  /**
   * Analyze text without AI dependencies
   */
  async analyzeText(text: string): Promise<{
    sentiment?: 'positive' | 'negative' | 'neutral';
    keywords: string[];
    language?: string;
    summary?: string;
  }> {
    // Simple rule-based analysis
    const words = text.toLowerCase().split(/\s+/);
    
    // Basic sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'disgusting'];
    
    const positiveScore = words.filter(w => positiveWords.includes(w)).length;
    const negativeScore = words.filter(w => negativeWords.includes(w)).length;
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveScore > negativeScore) sentiment = 'positive';
    if (negativeScore > positiveScore) sentiment = 'negative';
    
    // Extract keywords (simple frequency analysis)
    const wordFreq = new Map<string, number>();
    words
      .filter(w => w.length > 3) // Filter out short words
      .filter(w => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can'].includes(w))
      .forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });
    
    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
    
    return {
      sentiment,
      keywords,
      language: this.detectLanguage(text),
      summary: text.length > 100 ? text.substring(0, 97) + '...' : text,
    };
  }

  /**
   * Check if AI features are available
   */
  isAIEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = ['fallback'];
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      providers.push('openai');
    }
    
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AI')) {
      providers.push('gemini');
    }
    
    return providers;
  }

  // Private methods

  private async generateOpenAI(prompt: string, options: any): Promise<AIResponse> {
    // Only attempt if OpenAI key is present
    if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Use eval to avoid TypeScript checking the import at build time
      const dynamicImport = eval(`() => import('openai')`);
      const openaiModule = await dynamicImport();
      const OpenAI = openaiModule.default;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 150,
        temperature: options.temperature || 0.7,
      });

      return {
        content: completion.choices[0]?.message?.content || 'No response generated',
        usage: {
          tokens: completion.usage?.total_tokens || 0,
        },
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      };
    } catch (error) {
      this.logger.error('OpenAI generation failed:', error.message);
      throw error;
    }
  }

  private async generateGemini(prompt: string, options: any): Promise<AIResponse> {
    // Only attempt if Gemini key is present  
    if (!process.env.GEMINI_API_KEY?.startsWith('AI')) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Use eval to avoid TypeScript checking the import at build time
      const dynamicImport = eval(`() => import('@google/generative-ai')`);
      const geminiModule = await dynamicImport();
      const { GoogleGenerativeAI } = geminiModule;

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        provider: 'gemini',
        model: 'gemini-pro',
      };
    } catch (error) {
      this.logger.error('Gemini generation failed:', error.message);
      throw error;
    }
  }

  private generateFallbackResponse(prompt: string): AIResponse {
    // Rule-based responses without AI
    const lowerPrompt = prompt.toLowerCase();
    
    let response: string;
    
    if (lowerPrompt.includes('lead') || lowerPrompt.includes('customer')) {
      response = 'Based on the data provided, I recommend following up with this lead within 24 hours. Consider their engagement level and tailor your approach accordingly.';
    } else if (lowerPrompt.includes('workflow') || lowerPrompt.includes('automat')) {
      response = 'This workflow can be optimized by adding validation steps and error handling. Consider implementing retry mechanisms for failed steps.';
    } else if (lowerPrompt.includes('crm') || lowerPrompt.includes('contact')) {
      response = 'For effective CRM management, ensure data quality and regular contact touchpoints. Segment your contacts based on engagement patterns.';
    } else if (lowerPrompt.includes('help') || lowerPrompt.includes('how')) {
      response = 'I can help you with lead management, workflow automation, and CRM optimization. What specific area would you like assistance with?';
    } else {
      response = 'Thank you for your query. While AI features are currently disabled, the platform provides comprehensive tools for lead management, workflow automation, and CRM functionality.';
    }

    return {
      content: response,
      provider: 'fallback',
      model: 'rule-based',
    };
  }

  private detectLanguage(text: string): string {
    // Simple language detection
    const danishWords = ['og', 'er', 'det', 'på', 'med', 'til', 'af', 'jeg', 'du', 'har'];
    const englishWords = ['and', 'the', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'];
    
    const words = text.toLowerCase().split(/\s+/);
    const danishCount = words.filter(w => danishWords.includes(w)).length;
    const englishCount = words.filter(w => englishWords.includes(w)).length;
    
    if (danishCount > englishCount) return 'da';
    if (englishCount > danishCount) return 'en';
    return 'unknown';
  }
}
