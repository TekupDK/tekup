import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createLogger } from '@tekup/shared';

const logger = createLogger('ai-lead-scoring');

export interface LeadScoringResult {
  score: number;
  confidence: number;
  factors: {
    urgency: number;
    businessEmail: number;
    phoneNumber: number;
    completeness: number;
    serviceType: number;
  };
  recommendation: 'HOT' | 'WARM' | 'COLD';
  autoResponse: boolean;
}

@Injectable()
export class AILeadScoringService {
  constructor(private prisma: PrismaService) {}

  /**
   * Analyser lead og beregn AI score baseret på email indhold
   */
  async scoreLead(leadId: string): Promise<LeadScoringResult> {
    try {
      const lead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          contact: true,
          company: true
        }
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`);
      }

      const emailContent = lead.metadata?.rawText || '';
      const factors = this.analyzeLeadFactors(emailContent, lead);
      const score = this.calculateScore(factors);
      const recommendation = this.getRecommendation(score);

      const result: LeadScoringResult = {
        score,
        confidence: this.calculateConfidence(factors),
        factors,
        recommendation,
        autoResponse: score >= 85
      };

      // Opdater lead med AI score
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          score,
          metadata: {
            ...lead.metadata,
            aiScoring: result,
            lastScored: new Date()
          }
        }
      });

      logger.info(`Lead ${leadId} scored: ${score} (${recommendation})`);
      return result;

    } catch (error) {
      logger.error(`Lead scoring failed for ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Analyser lead faktorer baseret på email indhold
   */
  private analyzeLeadFactors(emailContent: string, lead: any): LeadScoringResult['factors'] {
    const text = emailContent.toLowerCase();
    
    // Urgency Analysis (0-30 points)
    const urgencyKeywords = ['akut', 'hurtig', 'i dag', 'asap', 'øjeblikkelig', 'nu', 'straks'];
    const urgencyScore = urgencyKeywords.reduce((score, keyword) => {
      return text.includes(keyword) ? score + 5 : score;
    }, 0);

    // Business Email Analysis (0-25 points)
    const email = lead.contact?.email || '';
    const isBusinessEmail = email && !email.includes('gmail.com') && !email.includes('hotmail.com') && !email.includes('yahoo.com');
    const businessEmailScore = isBusinessEmail ? 25 : 0;

    // Phone Number Analysis (0-20 points)
    const hasPhone = /\d{8}|\d{2}\s\d{2}\s\d{2}\s\d{2}/.test(emailContent);
    const phoneScore = hasPhone ? 20 : 0;

    // Completeness Analysis (0-15 points)
    const hasName = !!(lead.contact?.firstName && lead.contact?.lastName);
    const hasAddress = !!text.match(/adresse|vej|gade|plads/);
    const hasServiceType = !!text.match(/rengøring|hovedrengøring|flytterengøring|privatrengøring/);
    const completenessScore = (hasName ? 5 : 0) + (hasAddress ? 5 : 0) + (hasServiceType ? 5 : 0);

    // Service Type Analysis (0-10 points)
    const highValueServices = ['hovedrengøring', 'flytterengøring', 'erhverv'];
    const serviceTypeScore = highValueServices.some(service => text.includes(service)) ? 10 : 5;

    return {
      urgency: Math.min(urgencyScore, 30),
      businessEmail: businessEmailScore,
      phoneNumber: phoneScore,
      completeness: completenessScore,
      serviceType: serviceTypeScore
    };
  }

  /**
   * Beregn samlet score baseret på faktorer
   */
  private calculateScore(factors: LeadScoringResult['factors']): number {
    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    return Math.min(totalScore, 100);
  }

  /**
   * Beregn confidence baseret på data kvalitet
   */
  private calculateConfidence(factors: LeadScoringResult['factors']): number {
    const maxPossible = 30 + 25 + 20 + 15 + 10; // 100
    const actual = Object.values(factors).reduce((sum, score) => sum + score, 0);
    return Math.round((actual / maxPossible) * 100) / 100;
  }

  /**
   * Få anbefaling baseret på score
   */
  private getRecommendation(score: number): 'HOT' | 'WARM' | 'COLD' {
    if (score >= 85) return 'HOT';
    if (score >= 65) return 'WARM';
    return 'COLD';
  }

  /**
   * Batch score alle nye leads
   */
  async batchScoreLeads(tenantId: string): Promise<void> {
    const unsecoredLeads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        score: 0,
        status: 'new'
      },
      take: 50 // Process max 50 at a time
    });

    logger.info(`Batch scoring ${unsecoredLeads.length} leads for tenant ${tenantId}`);

    for (const lead of unsecoredLeads) {
      try {
        await this.scoreLead(lead.id);
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to score lead ${lead.id}:`, error);
      }
    }
  }

  /**
   * Få top scored leads for dashboard
   */
  async getTopScoredLeads(tenantId: string, limit: number = 10) {
    return this.prisma.lead.findMany({
      where: { tenantId },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        contact: true,
        company: true
      }
    });
  }

  /**
   * Få lead scoring statistikker
   */
  async getLeadScoringStats(tenantId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: { score: true, status: true }
    });

    const hotLeads = leads.filter(l => l.score >= 85).length;
    const warmLeads = leads.filter(l => l.score >= 65 && l.score < 85).length;
    const coldLeads = leads.filter(l => l.score < 65).length;
    const averageScore = leads.reduce((sum, l) => sum + l.score, 0) / leads.length || 0;

    return {
      total: leads.length,
      hotLeads,
      warmLeads,
      coldLeads,
      averageScore: Math.round(averageScore),
      distribution: {
        hot: Math.round((hotLeads / leads.length) * 100) || 0,
        warm: Math.round((warmLeads / leads.length) * 100) || 0,
        cold: Math.round((coldLeads / leads.length) * 100) || 0
      }
    };
  }
}
