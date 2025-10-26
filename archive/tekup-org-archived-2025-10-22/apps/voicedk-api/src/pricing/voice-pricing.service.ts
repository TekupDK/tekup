import { Injectable } from '@nestjs/common';
// TODO: Create PrismaService or use TypeORM instead
// import { PrismaService } from '../common/prisma/prisma.service';
import { createLogger } from '@tekup/shared';
import { TenantContext } from '@tekup/sso';

const logger = createLogger('voicedk-pricing');

@Injectable()
export class VoicePricingService {
  constructor(
    // private readonly prisma: PrismaService // TODO: Add when PrismaService is available
  ) {}

  // VoiceDK Pricing Tiers (DKK per minute)
  private readonly pricingTiers = {
    BASIC: {
      danishStandard: 0.50,    // Standard Danish
      danishDialects: 0.75,    // Regional dialects (Jutlandic, etc.)
      realTimeProcessing: 0.25, // Real-time processing fee
      apiCall: 0.10            // Base API call fee
    },
    PROFESSIONAL: {
      danishStandard: 0.35,
      danishDialects: 0.55,
      realTimeProcessing: 0.20,
      apiCall: 0.08,
      volumeDiscount: 0.15     // 15% discount on bulk
    },
    ENTERPRISE: {
      danishStandard: 0.25,
      danishDialects: 0.40,
      realTimeProcessing: 0.15,
      apiCall: 0.05,
      volumeDiscount: 0.25,    // 25% discount
      customRates: true        // Negotiable rates
    }
  };

  /**
   * Calculate cost for voice processing request
   */
  async calculateVoiceProcessingCost(request: VoiceProcessingRequest): Promise<VoiceCostCalculation> {
    try {
      const tenant = await this.getTenantPricingTier(request.tenantId);
      const tierPricing = this.pricingTiers[tenant.pricingTier];
      
      // Calculate audio duration in minutes
      const durationMinutes = request.audioDurationSeconds / 60;
      
      // Base cost calculation
      let baseCost = 0;
      
      // Language/dialect pricing
      if (request.dialect === 'standard_danish') {
        baseCost += durationMinutes * tierPricing.danishStandard;
      } else {
        baseCost += durationMinutes * tierPricing.danishDialects;
      }
      
      // Real-time processing fee
      if (request.realTime) {
        baseCost += durationMinutes * tierPricing.realTimeProcessing;
      }
      
      // API call fee
      baseCost += tierPricing.apiCall;
      
      // Volume discount
      let finalCost = baseCost;
      if (tierPricing.volumeDiscount && tenant.monthlyMinutes > 500) {
        finalCost = baseCost * (1 - tierPricing.volumeDiscount);
      }
      
      const costCalculation: VoiceCostCalculation = {
        requestId: request.id,
        tenantId: request.tenantId,
        baseCost: Math.round(baseCost * 100) / 100, // Round to 2 decimal places
        finalCost: Math.round(finalCost * 100) / 100,
        currency: 'DKK',
        breakdown: {
          languageProcessing: durationMinutes * (request.dialect === 'standard_danish' ? tierPricing.danishStandard : tierPricing.danishDialects),
          realTimeProcessing: request.realTime ? durationMinutes * tierPricing.realTimeProcessing : 0,
          apiCallFee: tierPricing.apiCall,
          volumeDiscount: tierPricing.volumeDiscount ? baseCost * tierPricing.volumeDiscount : 0
        },
        durationMinutes,
        pricingTier: tenant.pricingTier,
        processedAt: new Date()
      };

      // Store cost calculation for billing
      await this.prisma.voiceProcessingCost.create({
        data: costCalculation
      });

      logger.info(`Voice processing cost calculated: ${finalCost} DKK for ${durationMinutes} minutes (${request.tenantId})`);
      
      return costCalculation;
      
    } catch (error) {
      logger.error(`Cost calculation failed for request ${request.id}:`, error);
      throw new Error('Failed to calculate voice processing cost');
    }
  }

  /**
   * Process monthly billing for voice services
   */
  async processMonthlyBilling(tenantId: string, month: Date): Promise<MonthlyVoiceBill> {
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const costs = await this.prisma.voiceProcessingCost.findMany({
        where: {
          tenantId,
          processedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const monthlyBill: MonthlyVoiceBill = {
        tenantId,
        billingPeriod: {
          start: startDate,
          end: endDate
        },
        totalCalls: costs.length,
        totalMinutes: costs.reduce((sum, cost) => sum + cost.durationMinutes, 0),
        totalCost: costs.reduce((sum, cost) => sum + cost.finalCost, 0),
        currency: 'DKK',
        breakdown: {
          standardDanish: costs.filter(c => c.breakdown.languageProcessing <= c.durationMinutes * 0.50).length,
          dialectProcessing: costs.filter(c => c.breakdown.languageProcessing > c.durationMinutes * 0.50).length,
          realTimeProcessing: costs.filter(c => c.breakdown.realTimeProcessing > 0).length,
          totalApiCalls: costs.length
        },
        generatedAt: new Date(),
        status: 'PENDING'
      };

      // Create billing record
      await this.prisma.voiceBilling.create({
        data: monthlyBill
      });

      // Generate Danish invoice if amount > 0
      if (monthlyBill.totalCost > 0) {
        await this.generateDanishVoiceInvoice(monthlyBill);
      }

      logger.info(`Monthly voice billing processed for ${tenantId}: ${monthlyBill.totalCost} DKK (${monthlyBill.totalMinutes} minutes)`);
      
      return monthlyBill;
      
    } catch (error) {
      logger.error(`Monthly billing failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage analytics for tenant
   */
  async getVoiceUsageAnalytics(tenantId: string, period: 'month' | 'quarter' | 'year'): Promise<VoiceUsageAnalytics> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const costs = await this.prisma.voiceProcessingCost.findMany({
      where: {
        tenantId,
        processedAt: { gte: startDate }
      }
    });

    const analytics: VoiceUsageAnalytics = {
      tenantId,
      period,
      dateRange: { start: startDate, end: now },
      totalCalls: costs.length,
      totalMinutes: costs.reduce((sum, cost) => sum + cost.durationMinutes, 0),
      totalCost: costs.reduce((sum, cost) => sum + cost.finalCost, 0),
      averageCostPerMinute: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost.finalCost, 0) / costs.reduce((sum, cost) => sum + cost.durationMinutes, 0) : 0,
      languageBreakdown: {
        standardDanish: costs.filter(c => c.breakdown.languageProcessing <= c.durationMinutes * 0.50).length,
        jutlandic: costs.filter(c => c.breakdown.languageProcessing > c.durationMinutes * 0.50 && c.requestId.includes('jutlandic')).length,
        copenhagener: costs.filter(c => c.breakdown.languageProcessing > c.durationMinutes * 0.50 && c.requestId.includes('copenhagen')).length,
        other: costs.filter(c => c.breakdown.languageProcessing > c.durationMinutes * 0.50 && !c.requestId.includes('jutlandic') && !c.requestId.includes('copenhagen')).length
      },
      realTimeUsage: costs.filter(c => c.breakdown.realTimeProcessing > 0).length,
      peakUsageHours: this.calculatePeakUsageHours(costs),
      costTrend: this.calculateCostTrend(costs, period)
    };

    return analytics;
  }

  /**
   * Upgrade/downgrade tenant pricing tier
   */
  async updateTenantPricingTier(tenantId: string, newTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        voicePricingTier: newTier,
        updatedAt: new Date()
      }
    });

    logger.info(`Tenant ${tenantId} pricing tier updated to ${newTier}`);
  }

  private async getTenantPricingTier(tenantId: string): Promise<TenantPricingInfo> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { voicePricingTier: true, monthlyVoiceMinutes: true }
    });

    return {
      pricingTier: tenant?.voicePricingTier || 'BASIC',
      monthlyMinutes: tenant?.monthlyVoiceMinutes || 0
    };
  }

  private async generateDanishVoiceInvoice(bill: MonthlyVoiceBill): Promise<void> {
    // Integration with Billy accounting system for Danish invoicing
    // This would be implemented in production
    logger.info(`Danish voice invoice generated for ${bill.tenantId}: ${bill.totalCost} DKK`);
  }

  private calculatePeakUsageHours(costs: any[]): number[] {
    const hourUsage = new Array(24).fill(0);
    
    costs.forEach(cost => {
      const hour = cost.processedAt.getHours();
      hourUsage[hour]++;
    });
    
    return hourUsage;
  }

  private calculateCostTrend(costs: any[], period: 'month' | 'quarter' | 'year'): number[] {
    // Simple trend calculation - would be more sophisticated in production
    const trend = [];
    const groupSize = period === 'month' ? 7 : period === 'quarter' ? 30 : 90; // Days
    
    // Group costs by time periods and calculate trend
    for (let i = 0; i < costs.length; i += groupSize) {
      const groupCosts = costs.slice(i, i + groupSize);
      const groupTotal = groupCosts.reduce((sum, cost) => sum + cost.finalCost, 0);
      trend.push(groupTotal);
    }
    
    return trend;
  }
}

// Types
export interface VoiceProcessingRequest {
  id: string;
  tenantId: string;
  audioDurationSeconds: number;
  dialect: 'standard_danish' | 'jutlandic' | 'copenhagener' | 'funen' | 'bornholm';
  realTime: boolean;
  quality: 'standard' | 'high' | 'premium';
}

export interface VoiceCostCalculation {
  requestId: string;
  tenantId: string;
  baseCost: number;
  finalCost: number;
  currency: string;
  breakdown: {
    languageProcessing: number;
    realTimeProcessing: number;
    apiCallFee: number;
    volumeDiscount: number;
  };
  durationMinutes: number;
  pricingTier: string;
  processedAt: Date;
}

export interface MonthlyVoiceBill {
  tenantId: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  totalCalls: number;
  totalMinutes: number;
  totalCost: number;
  currency: string;
  breakdown: {
    standardDanish: number;
    dialectProcessing: number;
    realTimeProcessing: number;
    totalApiCalls: number;
  };
  generatedAt: Date;
  status: 'PENDING' | 'SENT' | 'PAID';
}

export interface VoiceUsageAnalytics {
  tenantId: string;
  period: string;
  dateRange: { start: Date; end: Date };
  totalCalls: number;
  totalMinutes: number;
  totalCost: number;
  averageCostPerMinute: number;
  languageBreakdown: {
    standardDanish: number;
    jutlandic: number;
    copenhagener: number;
    other: number;
  };
  realTimeUsage: number;
  peakUsageHours: number[];
  costTrend: number[];
}

interface TenantPricingInfo {
  pricingTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  monthlyMinutes: number;
}
