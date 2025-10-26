import { Injectable } from '@nestjs/common';
import { LeadPayloadShared } from '@tekup/shared';

export interface ScoringWeights {
  tenantId: string;
  contactInfo: number;     // Email, phone availability
  urgency: number;         // Timeframe indicators
  budget: number;          // Budget indicators
  completeness: number;    // How complete the lead information is
  engagement: number;      // Quality of message/inquiry
  source: number;          // Lead source quality
  domainSpecific: number;  // Domain-specific factors (sqm, job type, frequency)
  recency: number;         // How recent the lead is
  geoMatch: number;        // Geographic match for service area
}

@Injectable()
export class LeadScoringService {
  /**
   * Calculate lead score based on payload completeness and quality
   */
  async calculateScore(
    payload: LeadPayloadShared & {
      sqm?: number;
      address?: { postal_code?: string };
      job?: { category?: string; frequency?: string };
      source?: string;
      created_at?: Date;
    },
    tenantId: string,
    customWeights?: Partial<ScoringWeights>
  ): Promise<number> {
    const weights = { ...this.getDefaultWeights(tenantId), ...customWeights };
    
    let totalScore = 0;
    
    // Contact Information Score (0-100)
    const contactScore = this.scoreContactInfo(payload);
    totalScore += contactScore * weights.contactInfo;
    
    // Urgency Score (0-100)
    const urgencyScore = this.scoreUrgency(payload);
    totalScore += urgencyScore * weights.urgency;
    
    // Budget Score (0-100)
    const budgetScore = this.scoreBudget(payload);
    totalScore += budgetScore * weights.budget;
    
    // Completeness Score (0-100)
    const completenessScore = this.scoreCompleteness(payload);
    totalScore += completenessScore * weights.completeness;
    
    // Engagement Score (0-100)
    const engagementScore = this.scoreEngagement(payload);
    totalScore += engagementScore * weights.engagement;
    
    // Source Score (0-100)
    const sourceScore = this.scoreSource(payload);
    totalScore += sourceScore * weights.source;
    
    // Domain-Specific Score (0-100)
    const domainScore = this.scoreDomainSpecific(payload, tenantId);
    totalScore += domainScore * weights.domainSpecific;
    
    // Recency Score (0-100)
    const recencyScore = this.scoreRecency(payload);
    totalScore += recencyScore * weights.recency;
    
    // Geographic Match Score (0-100)
    const geoScore = this.scoreGeoMatch(payload, tenantId);
    totalScore += geoScore * weights.geoMatch;
    
    return Math.min(Math.max(Math.round(totalScore), 0), 100);
  }

  private getDefaultWeights(tenantId: string): ScoringWeights {
    // Rendetalje-specific weights for cleaning domain
    if (tenantId === 'rendetalje') {
      return {
        tenantId,
        contactInfo: 0.20,
        urgency: 0.15,
        budget: 0.10,
        completeness: 0.15,
        engagement: 0.10,
        source: 0.15,        // Channel matters a lot
        domainSpecific: 0.10, // sqm, job type, frequency
        recency: 0.03,       // Fresh leads score higher
        geoMatch: 0.02,      // Must be in Aarhus area
      };
    }
    
    // Default weights for other tenants
    return {
      tenantId,
      contactInfo: 0.25,
      urgency: 0.20,
      budget: 0.15,
      completeness: 0.15,
      engagement: 0.15,
      source: 0.10,
      domainSpecific: 0.00,
      recency: 0.00,
      geoMatch: 0.00,
    };
  }

  private scoreContactInfo(payload: LeadPayloadShared): number {
    let score = 0;
    
    // Email scoring
    if (payload.email) {
      if (this.isValidEmail(payload.email)) {
        score += 40;
        // Business emails score higher
        if (!this.isPersonalEmailDomain(payload.email)) {
          score += 10;
        }
      } else {
        score += 10; // Has email but invalid format
      }
    }
    
    // Phone scoring
    if (payload.phone) {
      if (this.isValidPhone(payload.phone)) {
        score += 50; // Phone contact is very valuable
      } else {
        score += 20; // Has phone but invalid format
      }
    }
    
    return Math.min(score, 100);
  }

  private scoreUrgency(payload: LeadPayloadShared): number {
    let score = 50; // Default score
    
    if (payload.message) {
      const message = payload.message.toLowerCase();
      
      // High urgency indicators
      if (message.includes('hurtigst') || message.includes('asap') || message.includes('akut')) {
        score += 40;
      } else if (message.includes('i dag') || message.includes('today')) {
        score += 35;
      } else if (message.includes('i morgen') || message.includes('tomorrow')) {
        score += 30;
      } else if (message.includes('denne uge') || message.includes('this week')) {
        score += 20;
      }
    }
    
    return Math.min(score, 100);
  }

  private scoreBudget(payload: LeadPayloadShared): number {
    let score = 50; // Default score
    
    if (payload.message) {
      const message = payload.message.toLowerCase();
      
      // Budget indicators
      if (message.includes('budget') || message.includes('pris') || message.includes('price')) {
        score += 20;
      }
      if (message.includes('tilbud') || message.includes('quote')) {
        score += 25;
      }
      if (message.includes('billig') || message.includes('cheap')) {
        score -= 20; // Price-sensitive leads might be lower value
      }
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  private scoreCompleteness(payload: LeadPayloadShared & { sqm?: number; address?: any; job?: any }): number {
    let score = 0;
    const fields = ['email', 'phone', 'name', 'message', 'company'];
    const domainFields = ['sqm', 'address', 'job'];
    
    // Basic fields
    for (const field of fields) {
      if (payload[field as keyof typeof payload]) {
        score += 15;
      }
    }
    
    // Domain-specific fields
    for (const field of domainFields) {
      if (payload[field as keyof typeof payload]) {
        score += 10;
      }
    }
    
    return Math.min(score, 100);
  }

  private scoreEngagement(payload: LeadPayloadShared): number {
    let score = 0;
    
    if (payload.message) {
      const messageLength = payload.message.length;
      
      // Score based on message length and quality
      if (messageLength > 100) score += 30;
      else if (messageLength > 50) score += 20;
      else if (messageLength > 20) score += 10;
      
      // Check for domain-specific keywords
      const keywords = this.getDomainKeywords('rendetalje');
      const message = payload.message.toLowerCase();
      
      for (const [keyword, boost] of Object.entries(keywords)) {
        if (message.includes(keyword)) {
          score += boost;
        }
      }
    }
    
    // Additional engagement indicators
    if (payload.company) score += 10; // Business inquiries show higher engagement
    
    return Math.min(score, 100);
  }

  private scoreSource(payload: LeadPayloadShared & { source?: string }): number {
    const source = payload.source?.toLowerCase();
    
    // Rendetalje-specific source scoring based on conversion rates
    const sourceScores: Record<string, number> = {
      'leadpoint': 95,      // Phone leads - highest intent
      'phone': 95,          // Direct phone calls
      '3match': 85,         // Good quality but time-sensitive
      'nettbureau': 80,     // Solid web leads
      'website': 75,        // Direct website inquiries
      'email': 60,          // Email inquiries
      'facebook': 50,       // Social media varies
      'google_ads': 70,     // Paid search
    };
    
    return sourceScores[source || ''] || 50;
  }

  private scoreDomainSpecific(payload: LeadPayloadShared & {
    sqm?: number;
    job?: { category?: string; frequency?: string };
  }, tenantId: string): number {
    if (tenantId !== 'rendetalje') return 50;
    
    let score = 0;
    
    // Square meters scoring
    if (payload.sqm) {
      if (payload.sqm >= 100) score += 30;      // Large properties
      else if (payload.sqm >= 60) score += 20;  // Medium properties
      else if (payload.sqm >= 30) score += 15;  // Small properties
      else score += 5;                          // Very small
    }
    
    // Job category scoring
    if (payload.job?.category) {
      const categoryScores: Record<string, number> = {
        'flytte': 25,           // Moving cleaning - high value
        'hovedrengøring': 20,   // Deep cleaning
        'fast': 15,             // Regular cleaning
        'vindue': 10,           // Window cleaning
        'tæppe': 12,            // Carpet cleaning
      };
      score += categoryScores[payload.job.category] || 5;
    }
    
    // Frequency scoring (for recurring services)
    if (payload.job?.frequency) {
      const frequencyScores: Record<string, number> = {
        'weekly': 20,     // Weekly = high LTV
        'biweekly': 15,   // Bi-weekly = good LTV
        'monthly': 10,    // Monthly = decent LTV
        'once': 5,        // One-time = lower LTV
      };
      score += frequencyScores[payload.job.frequency] || 0;
    }
    
    return Math.min(score, 100);
  }
  
  private scoreRecency(payload: LeadPayloadShared & { created_at?: Date }): number {
    if (!payload.created_at) return 50;
    
    const hoursAgo = (Date.now() - payload.created_at.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo <= 1) return 100;      // Within 1 hour
    if (hoursAgo <= 4) return 90;       // Within 4 hours
    if (hoursAgo <= 12) return 80;      // Within 12 hours
    if (hoursAgo <= 24) return 70;      // Within 24 hours
    if (hoursAgo <= 48) return 60;      // Within 48 hours
    if (hoursAgo <= 72) return 40;      // Within 72 hours
    return 20;                          // Older than 72 hours
  }
  
  private scoreGeoMatch(payload: LeadPayloadShared & {
    address?: { postal_code?: string };
  }, tenantId: string): number {
    if (tenantId !== 'rendetalje') return 100;
    
    const postalCode = payload.address?.postal_code;
    if (!postalCode) return 0;
    
    // Aarhus postal codes
    const aarhusPostalCodes = [
      '8000', '8200', '8210', '8220', '8230', 
      '8240', '8250', '8260', '8270', '8310', '8362'
    ];
    
    return aarhusPostalCodes.includes(postalCode) ? 100 : 0;
  }

  private getDomainKeywords(tenantId: string): Record<string, number> {
    const keywords: Record<string, Record<string, number>> = {
      'rendetalje': {
        // Urgency indicators
        'hurtigst': 15, 'asap': 15, 'akut': 15,
        'i dag': 12, 'i morgen': 10, 'denne uge': 8,
        
        // Service types
        'flytterengøring': 10, 'flytter': 8, 'flytning': 8,
        'hovedrengøring': 8, 'dybderengøring': 8,
        'fast rengøring': 6, 'ugentlig': 6, 'månedlig': 4,
        
        // Quality indicators
        'professionel': 5, 'erfaren': 5, 'kvalitet': 5,
        'forsikret': 8, 'garanti': 6,
        
        // Size indicators
        'stor': 3, 'lille': 2, 'villa': 5, 'lejlighed': 3,
        
        // Budget indicators
        'pris': 3, 'tilbud': 5, 'budget': 4,
      },
      'default': {
        'urgent': 10, 'asap': 10, 'immediately': 10,
        'budget': 5, 'quote': 5,
      },
    };
    
    return keywords[tenantId] || keywords['default'];
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Danish phone number validation
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 8 && cleanPhone.length <= 12;
  }

  private isPersonalEmailDomain(email: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'live.com', 'msn.com', 'aol.com', 'icloud.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return personalDomains.includes(domain);
  }
}
