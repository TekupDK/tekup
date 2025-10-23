import { z } from 'zod';

// Shortwave.ai API integration
export interface ShortwaveConfig {
  apiKey: string;
  workspaceId: string;
  baseUrl: string;
}

export interface EmailAnalysis {
  type: 'booking_request' | 'complaint' | 'inquiry' | 'confirmation' | 'other';
  confidence: number;
  extractedInfo: {
    serviceType?: string;
    urgency?: 'low' | 'normal' | 'high';
    customerId?: string;
    preferredDate?: string;
    location?: string;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  actionRequired: 'create_booking' | 'handle_complaint' | 'respond_inquiry' | 'none';
}

export interface CustomerIntelligence {
  customerId: string;
  preferences: {
    preferredDay?: string;
    serviceType?: string;
    communicationStyle?: string;
  };
  riskFactors: {
    complaintHistory: boolean;
    satisfactionScore: number;
  };
  recommendations: string[];
}

export class ShortwaveAI {
  private config: ShortwaveConfig;

  constructor(config: ShortwaveConfig) {
    this.config = config;
  }

  async analyzeEmailContent(params: {
    emailId: string;
    content: string;
    sender: string;
    subject: string;
  }): Promise<EmailAnalysis> {
    try {
      // Simulate Shortwave.ai API call
      const response = await fetch(`${this.config.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailId: params.emailId,
          content: params.content,
          sender: params.sender,
          subject: params.subject
        })
      });

      if (!response.ok) {
        throw new Error(`Shortwave.ai API error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Shortwave.ai analysis error:', error);
      
      // Fallback analysis
      return this.fallbackAnalysis(params);
    }
  }

  private fallbackAnalysis(params: {
    content: string;
    sender: string;
    subject: string;
  }): EmailAnalysis {
    const content = params.content.toLowerCase();
    const subject = params.subject.toLowerCase();

    // Simple keyword-based analysis
    const bookingKeywords = ['booking', 'book', 'rengøring', 'cleaning', 'schedule'];
    const complaintKeywords = ['klage', 'complaint', 'problem', 'issue', 'dårlig'];
    const inquiryKeywords = ['spørgsmål', 'question', 'info', 'information'];

    let type: EmailAnalysis['type'] = 'other';
    let confidence = 0.5;
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let actionRequired: EmailAnalysis['actionRequired'] = 'none';

    if (bookingKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
      type = 'booking_request';
      confidence = 0.8;
      actionRequired = 'create_booking';
    } else if (complaintKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
      type = 'complaint';
      confidence = 0.9;
      sentiment = 'negative';
      actionRequired = 'handle_complaint';
    } else if (inquiryKeywords.some(keyword => content.includes(keyword) || subject.includes(keyword))) {
      type = 'inquiry';
      confidence = 0.7;
      actionRequired = 'respond_inquiry';
    }

    return {
      type,
      confidence,
      extractedInfo: {
        serviceType: content.includes('rengøring') ? 'rengøring' : undefined,
        urgency: content.includes('hurtig') || content.includes('urgent') ? 'high' : 'normal',
        customerId: this.extractCustomerId(params.sender),
        preferredDate: this.extractDate(content)
      },
      sentiment,
      actionRequired
    };
  }

  private extractCustomerId(sender: string): string | undefined {
    // Extract customer ID from email or generate one
    const email = sender.split('@')[0];
    return `customer_${email}`;
  }

  private extractDate(content: string): string | undefined {
    // Simple date extraction
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(næste uge|next week)/i,
      /(i morgen|tomorrow)/i
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  async extractBookingInfo(params: {
    emailContent: string;
    customerId?: string;
  }): Promise<{
    serviceType: string;
    preferredDate: string;
    location: string;
    notes: string;
  }> {
    const content = params.emailContent.toLowerCase();

    return {
      serviceType: content.includes('rengøring') ? 'rengøring' : 'cleaning',
      preferredDate: this.extractDate(params.emailContent) || 'next_week',
      location: this.extractLocation(content),
      notes: this.extractNotes(params.emailContent)
    };
  }

  private extractLocation(content: string): string {
    // Simple location extraction
    const locationPatterns = [
      /adresse[:\s]+([^,]+)/i,
      /adresse[:\s]+([^,]+)/i,
      /lokation[:\s]+([^,]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Ikke specificeret';
  }

  private extractNotes(content: string): string {
    // Extract notes from email
    const lines = content.split('\n');
    const notes = lines.filter(line => 
      line.trim().length > 10 && 
      !line.includes('@') && 
      !line.includes('http')
    );

    return notes.join(' ').trim();
  }

  async detectCustomerSentiment(params: {
    content: string;
    customerId: string;
    context?: string;
  }): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
    actionRequired: string;
  }> {
    const content = params.content.toLowerCase();

    const positiveWords = ['fantastisk', 'god', 'godt', 'tak', 'perfekt', 'flot'];
    const negativeWords = ['dårlig', 'problemer', 'klage', 'utilfreds', 'ikke godt'];

    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let confidence = 0.5;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      confidence = 0.8;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      confidence = 0.8;
    }

    return {
      sentiment,
      confidence,
      emotions: this.extractEmotions(content),
      actionRequired: sentiment === 'negative' ? 'follow_up' : 'none'
    };
  }

  private extractEmotions(content: string): string[] {
    const emotions: string[] = [];
    
    if (content.includes('tak') || content.includes('tusind tak')) {
      emotions.push('gratitude');
    }
    if (content.includes('fantastisk') || content.includes('perfekt')) {
      emotions.push('satisfaction');
    }
    if (content.includes('klage') || content.includes('problemer')) {
      emotions.push('frustration');
    }

    return emotions;
  }

  async learnFromEmailPatterns(params: {
    customerId: string;
    emailHistory: Array<{
      date: string;
      type: string;
      content: string;
      sentiment: string;
    }>;
  }): Promise<CustomerIntelligence> {
    const { customerId, emailHistory } = params;

    // Analyze patterns
    const patterns = this.analyzePatterns(emailHistory);
    const riskFactors = this.assessRiskFactors(emailHistory);
    const recommendations = this.generateRecommendations(patterns, riskFactors);

    return {
      customerId,
      preferences: patterns,
      riskFactors,
      recommendations
    };
  }

  private analyzePatterns(emailHistory: Array<{
    date: string;
    type: string;
    content: string;
    sentiment: string;
  }>): {
    preferredDay?: string;
    serviceType?: string;
    communicationStyle?: string;
  } {
    // Simple pattern analysis
    const serviceTypes = emailHistory.map(email => 
      email.content.includes('rengøring') ? 'rengøring' : 'cleaning'
    );
    const mostCommonService = serviceTypes.sort((a, b) => 
      serviceTypes.filter(v => v === a).length - serviceTypes.filter(v => v === b).length
    ).pop() || 'rengøring';

    return {
      serviceType: mostCommonService,
      communicationStyle: 'formal' // Default
    };
  }

  private assessRiskFactors(emailHistory: Array<{
    date: string;
    type: string;
    content: string;
    sentiment: string;
  }>): {
    complaintHistory: boolean;
    satisfactionScore: number;
  } {
    const complaints = emailHistory.filter(email => 
      email.type === 'complaint' || email.sentiment === 'negative'
    ).length;

    const totalEmails = emailHistory.length;
    const satisfactionScore = totalEmails > 0 ? 
      (totalEmails - complaints) / totalEmails : 1;

    return {
      complaintHistory: complaints > 0,
      satisfactionScore
    };
  }

  private generateRecommendations(
    patterns: any,
    riskFactors: any
  ): string[] {
    const recommendations: string[] = [];

    if (patterns.serviceType) {
      recommendations.push(`Use preferred service type: ${patterns.serviceType}`);
    }

    if (riskFactors.complaintHistory) {
      recommendations.push('Follow up after service to ensure satisfaction');
    }

    if (riskFactors.satisfactionScore < 0.7) {
      recommendations.push('Monitor customer satisfaction closely');
    }

    return recommendations;
  }
}

// Export singleton instance
export const shortwaveAI = new ShortwaveAI({
  apiKey: process.env.SHORTWAVE_API_KEY || '',
  workspaceId: process.env.SHORTWAVE_WORKSPACE_ID || '',
  baseUrl: process.env.SHORTWAVE_API_URL || 'https://api.shortwave.ai/v1'
});
