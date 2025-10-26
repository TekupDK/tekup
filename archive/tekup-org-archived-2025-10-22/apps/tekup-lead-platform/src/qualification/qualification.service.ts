import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
import { LeadScoringService } from './scoring.service';
import { LeadStatusShared, LeadPayloadShared } from '@tekup/shared';

export interface QualificationResult {
  leadId: string;
  score: number;
  qualification: 'hot' | 'warm' | 'cold' | 'unqualified';
  nextAction: 'immediate_contact' | 'schedule_follow_up' | 'nurture_sequence' | 'disqualify';
  reasoning: string[];
  estimatedValue?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface QualificationCriteria {
  tenantId: string;
  allowedPostalCodes?: string[];         // fx ["8000","8200","8210","8220","8230","8240","8250","8260","8270","8310","8362"]
  sourceWeights?: Record<string, number>; // { nettbureau: 1.2, leadpoint_call: 1.3, 3match: 1.1, website: 1.0 }
  minFields?: string[];                   // ["sqm","address.postal_code","job.category"]
  recencyHours?: number;                  // <48 for 3Match, <4 for website, <2 for calls
  requiredGeo?: boolean;                  // kun Aarhus
  defaultRateDkk?: number;                // 349
  retentionMonthsDefault?: number;        // fx 6 for faste kunder
  industry?: string;
  minBudget?: number;
  requiredFields?: string[];
  timeframe?: 'immediate' | 'within_month' | 'within_quarter' | 'future';
}

@Injectable()
export class LeadQualificationService {
  constructor(
    // private prisma: PrismaService,
    private scoringService: LeadScoringService,
  ) {}

  /**
   * Qualify a lead based on tenant-specific criteria
   */
  async qualifyLead(
    leadId: string,
    tenantId: string,
    criteria?: QualificationCriteria
  ): Promise<QualificationResult> {
    // TODO: Implement with Prisma once client issues are resolved
    const tenantCriteria = await this.getTenantCriteria(tenantId);
    
    // Mock lead data for now
    const payload: LeadPayloadShared = {
      email: 'test@example.com',
      phone: '+45 12 34 56 78',
      name: 'Test Lead',
      message: 'Looking for cleaning service',
    };
    
    // Calculate lead score using scoring service
    const score = await this.scoringService.calculateScore(payload, tenantId);
    
    // Apply tenant-specific qualification logic
    const qualification = this.determineQualification(score, payload, criteria);
    const nextAction = this.determineNextAction(qualification, payload, tenantId);
    const reasoning = this.generateReasoning(score, payload, qualification);
    const estimatedValue = await this.estimateLeadValue(payload, tenantId);
    const priority = this.determinePriority(qualification, score, estimatedValue);

    // TODO: Store qualification result in database once Prisma is working
    
    return {
      leadId,
      score,
      qualification,
      nextAction,
      reasoning,
      estimatedValue,
      priority,
    };
  }

  /**
   * Get qualification statistics for tenant
   */
  async getQualificationStats(tenantId: string, dateRange?: { from: Date; to: Date }) {
    // TODO: Implement with Prisma once client issues are resolved
    // Return mock stats for now
    return {
      total: 10,
      qualified: 8,
      hot: 3,
      warm: 3,
      cold: 2,
      unqualified: 2,
      averageScore: 75,
      totalEstimatedValue: 25000,
    };
  }

  private determineQualification(
    score: number,
    payload: LeadPayloadShared & {
      sqm?: number;
      address?: { postal_code?: string };
      job?: { category?: string; frequency?: 'weekly'|'biweekly'|'monthly'|'once' };
      source?: 'nettbureau'|'leadpoint'|'3match'|'website'|'phone'|'email';
      preferred_slots?: string[];
    },
    criteria?: QualificationCriteria
  ): 'hot' | 'warm' | 'cold' | 'unqualified' {
    const geoOk = !criteria?.requiredGeo || (payload.address?.postal_code && criteria.allowedPostalCodes?.includes(payload.address.postal_code));
    const hasCore = !!(payload.sqm && payload.job?.category);
    const channelBoost = (criteria?.sourceWeights?.[payload.source ?? ''] ?? 1);

    if (!geoOk) return 'unqualified';
    if (!hasCore) return score >= 60 ? 'cold' : 'unqualified';

    // Kanal + domænebaseret tærskel
    const effScore = score * channelBoost
      + (payload.job?.frequency === 'weekly' ? 10 : 0)
      + (payload.source === 'phone' ? 10 : 0)
      + (payload.job?.category === 'flytte' ? 5 : 0);

    if (effScore >= 80) return 'hot';
    if (effScore >= 60) return 'warm';
    if (effScore >= 40) return 'cold';
    return 'unqualified';
  }

  private determineNextAction(
    qualification: string,
    payload: LeadPayloadShared & { source?: string },
    tenantId: string
  ): 'immediate_contact' | 'schedule_follow_up' | 'nurture_sequence' | 'disqualify' {
    if (qualification === 'unqualified') return 'disqualify';
    if (payload.source === 'leadpoint' || payload.source === 'phone') return 'immediate_contact';
    if (payload.source === '3match') return qualification === 'hot' ? 'immediate_contact' : 'schedule_follow_up'; // <48t
    if (payload.source === 'nettbureau' || payload.source === 'website') return qualification === 'hot' ? 'immediate_contact' : 'schedule_follow_up';
    return 'schedule_follow_up';
  }

  private generateReasoning(
    score: number,
    p: LeadPayloadShared & any,
    q: string
  ): string[] {
    const r = [];
    if (p.sqm) r.push(`sqm=${p.sqm}`);
    if (p.job?.category) r.push(`type=${p.job.category}`);
    if (p.job?.frequency) r.push(`freq=${p.job.frequency}`);
    if (p.address?.postal_code) r.push(`zip=${p.address.postal_code}`);
    if (p.source) r.push(`source=${p.source}`);
    if (p.email) r.push('Has valid email address');
    if (p.phone) r.push('Has phone number');
    if (p.company) r.push('Has company information');
    if (p.message) r.push('Provided detailed message');
    r.push(`score=${score}`, `level=${q}`);
    return r;
  }

  private async estimateLeadValue(
    p: LeadPayloadShared & any,
    tenantId: string
  ): Promise<number> {
    const rate = 349;
    // Flytterengøring: engangs
    if (p.job?.category === 'flytte') {
      const estHours = p.estimate_hours ?? 8; // fallback
      return Math.round(estHours * rate);
    }
    // Fast rengøring: frekvens × timer × retention
    const visitsPerMonth = p.job?.frequency === 'weekly' ? 4 : p.job?.frequency === 'biweekly' ? 2 : 1;
    const estHours = p.estimate_hours ?? (p.sqm ? Math.min(Math.max(p.sqm/35, 2), 5) : 3); // heuristik
    const retention = p.retention_months ?? 6;
    return Math.round(visitsPerMonth * estHours * rate * retention);
  }

  private determinePriority(
    q: string,
    score: number,
    value?: number
  ): 'high' | 'medium' | 'low' {
    if (q === 'hot' || (value ?? 0) >= 4000) return 'high';
    if (q === 'warm' || score >= 60) return 'medium';
    return 'low';
  }

  private async getTenantCriteria(tenantId: string): Promise<QualificationCriteria> {
    // Rendetalje-specific criteria for cleaning domain
    if (tenantId === 'rendetalje') {
      return {
        tenantId,
        allowedPostalCodes: ['8000', '8200', '8210', '8220', '8230', '8240', '8250', '8260', '8270', '8310', '8362'],
        sourceWeights: {
          'leadpoint': 1.3,    // Phone leads get 30% boost
          'phone': 1.3,
          '3match': 1.1,       // Good quality, 10% boost
          'nettbureau': 1.2,   // Solid leads, 20% boost
          'website': 1.0,      // Baseline
          'email': 0.9,        // Slightly lower
          'facebook': 0.8,     // Lower quality
        },
        minFields: ['sqm', 'address.postal_code', 'job.category'],
        recencyHours: 48,      // Prefer leads < 48 hours old
        requiredGeo: true,     // Must be in Aarhus area
        defaultRateDkk: 349,   // Standard hourly rate
        retentionMonthsDefault: 6, // Average customer retention
        industry: 'cleaning',
        minBudget: 1000,       // Minimum viable job value
        requiredFields: ['email', 'phone', 'address'],
        timeframe: 'within_month',
      };
    }
    
    // Default criteria for other tenants
    return {
      tenantId,
      industry: 'general',
      minBudget: 500,
      requiredFields: ['email', 'phone'],
      timeframe: 'within_month',
    };
  }
}
