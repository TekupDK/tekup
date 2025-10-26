import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LeadScoreFactors {
  voiceInteractions: number;
  responseTime: number;
  engagementLevel: number;
  companySize: number;
  industry: number;
  sourceQuality: number;
  contactFrequency: number;
  lastActivity: number;
}

export interface LeadScore {
  totalScore: number;
  factors: LeadScoreFactors;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
  nextAction: string;
}

export interface VoiceInteraction {
  command: string;
  parameters?: Record<string, any>;
  response: any;
  duration: number;
  timestamp: Date;
}

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate lead score based on various factors
   */
  async calculateLeadScore(leadId: string, tenantId: string): Promise<LeadScore> {
    try {
      // Get lead data
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId },
        include: {
          metadata: true,
        },
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Get voice interactions for this lead
      const voiceInteractions = await this.getVoiceInteractions(leadId, tenantId);
      
      // Calculate individual factor scores
      const factors: LeadScoreFactors = {
        voiceInteractions: this.calculateVoiceInteractionScore(voiceInteractions),
        responseTime: this.calculateResponseTimeScore(lead),
        engagementLevel: this.calculateEngagementScore(lead, voiceInteractions),
        companySize: this.calculateCompanySizeScore(lead),
        industry: this.calculateIndustryScore(lead),
        sourceQuality: this.calculateSourceQualityScore(lead),
        contactFrequency: this.calculateContactFrequencyScore(lead),
        lastActivity: this.calculateLastActivityScore(lead),
      };

      // Calculate total score (weighted average)
      const totalScore = this.calculateTotalScore(factors);
      
      // Determine grade
      const grade = this.determineGrade(totalScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, grade);
      
      // Determine next action
      const nextAction = this.determineNextAction(factors, grade);

      return {
        totalScore,
        factors,
        grade,
        recommendations,
        nextAction,
      };

    } catch (error) {
      this.logger.error(`Failed to calculate lead score for ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Get voice interactions for a lead
   */
  private async getVoiceInteractions(leadId: string, tenantId: string): Promise<VoiceInteraction[]> {
    // This would typically query a voice interactions table
    // For now, we'll simulate with metadata
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      select: { metadata: true },
    });

    if (!lead?.metadata || !lead.metadata.voiceInteractions) {
      return [];
    }

    return lead.metadata.voiceInteractions as VoiceInteraction[];
  }

  /**
   * Calculate voice interaction score (0-100)
   */
  private calculateVoiceInteractionScore(interactions: VoiceInteraction[]): number {
    if (interactions.length === 0) return 0;

    let score = 0;
    
    // Base score for having interactions
    score += Math.min(interactions.length * 10, 30);
    
    // Quality score based on command types
    const commandTypes = new Set(interactions.map(i => i.command));
    score += commandTypes.size * 5;
    
    // Engagement score based on response quality
    const successfulInteractions = interactions.filter(i => i.response?.success);
    score += (successfulInteractions.length / interactions.length) * 20;
    
    // Duration score (shorter = better engagement)
    const avgDuration = interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
    if (avgDuration < 5000) score += 20; // Very engaged
    else if (avgDuration < 15000) score += 15; // Engaged
    else if (avgDuration < 30000) score += 10; // Somewhat engaged
    else score += 5; // Less engaged

    return Math.min(score, 100);
  }

  /**
   * Calculate response time score (0-100)
   */
  private calculateResponseTimeScore(lead: any): number {
    const createdAt = new Date(lead.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation < 1) return 100; // Immediate response
    if (hoursSinceCreation < 24) return 80; // Same day
    if (hoursSinceCreation < 72) return 60; // Within 3 days
    if (hoursSinceCreation < 168) return 40; // Within week
    return 20; // Over a week
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(lead: any, interactions: VoiceInteraction[]): number {
    let score = 0;
    
    // Base engagement from lead status
    if (lead.status === 'CONTACTED') score += 30;
    else if (lead.status === 'NEW') score += 10;
    
    // Engagement from voice interactions
    if (interactions.length > 0) {
      score += Math.min(interactions.length * 15, 40);
    }
    
    // Engagement from payload completeness
    const payload = lead.metadata?.originalPayload || {};
    const requiredFields = ['name', 'email', 'company', 'phone'];
    const completedFields = requiredFields.filter(field => payload[field]);
    score += (completedFields.length / requiredFields.length) * 30;

    return Math.min(score, 100);
  }

  /**
   * Calculate company size score (0-100)
   */
  private calculateCompanySizeScore(lead: any): number {
    const company = lead.metadata?.originalPayload?.company;
    if (!company) return 50; // Unknown

    const companyLower = company.toLowerCase();
    
    if (companyLower.includes('inc') || companyLower.includes('corp') || companyLower.includes('ltd')) {
      return 80; // Likely larger company
    }
    
    if (companyLower.includes('consulting') || companyLower.includes('agency') || companyLower.includes('group')) {
      return 70; // Professional services
    }
    
    if (companyLower.includes('startup') || companyLower.includes('tech') || companyLower.includes('digital')) {
      return 60; // Tech/startup
    }
    
    return 50; // Standard company
  }

  /**
   * Calculate industry score (0-100)
   */
  private calculateIndustryScore(lead: any): number {
    const company = lead.metadata?.originalPayload?.company;
    if (!company) return 50;

    const companyLower = company.toLowerCase();
    
    // High-value industries
    if (companyLower.includes('tech') || companyLower.includes('software') || companyLower.includes('digital')) {
      return 90;
    }
    
    if (companyLower.includes('finance') || companyLower.includes('bank') || companyLower.includes('insurance')) {
      return 85;
    }
    
    if (companyLower.includes('health') || companyLower.includes('medical') || companyLower.includes('pharma')) {
      return 80;
    }
    
    if (companyLower.includes('consulting') || companyLower.includes('legal') || companyLower.includes('accounting')) {
      return 75;
    }
    
    return 50; // Other industries
  }

  /**
   * Calculate source quality score (0-100)
   */
  private calculateSourceQualityScore(lead: any): number {
    const source = lead.source?.toLowerCase();
    
    if (source === 'voice') return 90; // Direct voice interaction
    if (source === 'website') return 80; // Website form
    if (source === 'referral') return 85; // Referral
    if (source === 'email') return 70; // Email campaign
    if (source === 'social') return 60; // Social media
    if (source === 'cold') return 40; // Cold outreach
    
    return 50; // Unknown source
  }

  /**
   * Calculate contact frequency score (0-100)
   */
  private calculateContactFrequencyScore(lead: any): number {
    // This would typically analyze contact history
    // For now, we'll use a simple heuristic
    const interactions = lead.metadata?.voiceInteractions || [];
    
    if (interactions.length === 0) return 0;
    if (interactions.length === 1) return 30;
    if (interactions.length === 2) return 60;
    if (interactions.length === 3) return 80;
    return 100; // 4+ interactions
  }

  /**
   * Calculate last activity score (0-100)
   */
  private calculateLastActivityScore(lead: any): number {
    const lastActivity = lead.metadata?.lastVoiceInteraction || lead.updatedAt;
    const now = new Date();
    const hoursSinceActivity = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 1) return 100; // Very recent
    if (hoursSinceActivity < 24) return 80; // Today
    if (hoursSinceActivity < 72) return 60; // Within 3 days
    if (hoursSinceActivity < 168) return 40; // Within week
    if (hoursSinceActivity < 720) return 20; // Within month
    return 0; // Over a month
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(factors: LeadScoreFactors): number {
    const weights = {
      voiceInteractions: 0.25,
      responseTime: 0.15,
      engagementLevel: 0.20,
      companySize: 0.10,
      industry: 0.10,
      sourceQuality: 0.10,
      contactFrequency: 0.05,
      lastActivity: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([factor, weight]) => {
      totalScore += factors[factor as keyof LeadScoreFactors] * weight;
      totalWeight += weight;
    });

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Determine letter grade
   */
  private determineGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate recommendations based on factors
   */
  private generateRecommendations(factors: LeadScoreFactors, grade: string): string[] {
    const recommendations: string[] = [];

    if (grade === 'A') {
      recommendations.push('High-priority lead - immediate follow-up recommended');
      recommendations.push('Consider premium service offerings');
      recommendations.push('Schedule executive-level meeting');
    } else if (grade === 'B') {
      recommendations.push('Good quality lead - follow up within 24 hours');
      recommendations.push('Send personalized proposal');
      recommendations.push('Schedule discovery call');
    } else if (grade === 'C') {
      recommendations.push('Moderate quality - nurture campaign recommended');
      recommendations.push('Send educational content');
      recommendations.push('Follow up within 48 hours');
    } else if (grade === 'D') {
      recommendations.push('Lower quality - consider automated nurturing');
      recommendations.push('Send general company information');
      recommendations.push('Follow up within 1 week');
    } else {
      recommendations.push('Low quality - consider disqualification');
      recommendations.push('Send basic information only');
      recommendations.push('No immediate follow-up required');
    }

    // Specific recommendations based on factors
    if (factors.voiceInteractions < 30) {
      recommendations.push('Increase voice engagement through targeted commands');
    }
    
    if (factors.responseTime < 50) {
      recommendations.push('Improve response time to increase engagement');
    }
    
    if (factors.engagementLevel < 50) {
      recommendations.push('Focus on building relationship and trust');
    }

    return recommendations;
  }

  /**
   * Determine next action
   */
  private determineNextAction(factors: LeadScoreFactors, grade: string): string {
    if (grade === 'A') {
      return 'Immediate executive outreach and proposal';
    } else if (grade === 'B') {
      return 'Schedule discovery call within 24 hours';
    } else if (grade === 'C') {
      return 'Send personalized nurturing sequence';
    } else if (grade === 'D') {
      return 'Add to automated nurturing campaign';
    } else {
      return 'Monitor for improvement or consider disqualification';
    }
  }

  /**
   * Update lead score in database
   */
  async updateLeadScore(leadId: string, tenantId: string): Promise<LeadScore> {
    const score = await this.calculateLeadScore(leadId, tenantId);
    
    // Update lead metadata with score
    await this.prisma.lead.update({
      where: { id: leadId, tenantId },
      data: {
        metadata: {
          leadScore: score,
          lastScored: new Date(),
        },
      },
    });

    this.logger.log(`Updated lead score for ${leadId}: ${score.grade} (${score.totalScore})`);
    
    return score;
  }

  /**
   * Get leads by score range
   */
  async getLeadsByScore(tenantId: string, minScore: number, maxScore: number) {
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        metadata: {
          path: ['leadScore', 'totalScore'],
          gte: minScore,
          lte: maxScore,
        },
      },
      orderBy: {
        metadata: {
          path: ['leadScore', 'totalScore'],
          order: 'desc',
        },
      },
    });

    return leads;
  }

  /**
   * Get top scoring leads
   */
  async getTopLeads(tenantId: string, limit: number = 10) {
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        metadata: {
          path: ['leadScore', 'totalScore'],
          not: null,
        },
      },
      orderBy: {
        metadata: {
          path: ['leadScore', 'totalScore'],
          order: 'desc',
        },
      },
      take: limit,
    });

    return leads;
  }
}