import { Injectable, Logger } from '@nestjs/common';

export interface EstimationInput {
  cleaningType: 'weekly' | 'main' | 'move_out' | 'airbnb' | 'commercial' | 'event' | 'after_construction';
  squareMeters: number;
  rooms?: number;
  bathrooms?: number;
  firstTime: boolean;
  extras: string[]; // ['windows', 'oven', 'fridge', 'deep_clean', 'garden']
}

export interface EstimationResult {
  estimatedHours: number;
  price: number; // Always 349 * hours, rounded to whole kroner
  breakdown: EstimationBreakdown[];
  teamSize: number;
  flags: string[]; // ['long_job', 'requires_two_people', 'difficult_access']
  confidence: number; // 0-100
}

export interface EstimationBreakdown {
  component: string;
  hours: number;
  description: string;
}

/**
 * Estimation Engine Service
 * 
 * Deterministic time and price calculation for Rendetalje cleaning services.
 * Based on real historical data and business rules:
 * 
 * - Hourly rate: 349 DKK including VAT (fixed, no discounts)
 * - Time estimates based on square meters and service type
 * - Additional time for extras (windows, oven, etc.)
 * - First-time multipliers for initial cleanings
 * - Team size recommendations for large jobs
 * 
 * All calculations are deterministic and auditable for consistency.
 */
@Injectable()
export class EstimationEngineService {
  private readonly logger = new Logger(EstimationEngineService.name);
  private readonly HOURLY_RATE = 349; // DKK including VAT
  private readonly MIN_HOURS = 1.0;
  private readonly MAX_SINGLE_PERSON_HOURS = 8.0;

  /**
   * Calculate time and price estimate for cleaning job
   */
  async calculateEstimate(input: EstimationInput): Promise<EstimationResult> {
    this.logger.debug(`Calculating estimate for ${input.cleaningType}, ${input.squareMeters}m²`);

    const breakdown: EstimationBreakdown[] = [];
    let totalHours = 0;
    let teamSize = 1;
    const flags: string[] = [];

    // 1. Base time calculation by service type
    const baseHours = this.calculateBaseHours(input.cleaningType, input.squareMeters);
    breakdown.push({
      component: 'base_cleaning',
      hours: baseHours,
      description: `${input.cleaningType} cleaning for ${input.squareMeters}m²`,
    });
    totalHours += baseHours;

    // 2. First-time multiplier
    if (input.firstTime) {
      const multiplier = this.getFirstTimeMultiplier(input.cleaningType);
      const extraHours = baseHours * (multiplier - 1);
      breakdown.push({
        component: 'first_time',
        hours: extraHours,
        description: `First-time cleaning adjustment (${Math.round(multiplier * 100)}%)`,
      });
      totalHours += extraHours;
    }

    // 3. Extras calculation
    for (const extra of input.extras) {
      const extraHours = this.calculateExtraHours(extra, input.squareMeters, input.rooms);
      if (extraHours > 0) {
        breakdown.push({
          component: extra,
          hours: extraHours,
          description: this.getExtraDescription(extra),
        });
        totalHours += extraHours;
      }
    }

    // 4. Apply minimum hours
    if (totalHours < this.MIN_HOURS) {
      const adjustment = this.MIN_HOURS - totalHours;
      breakdown.push({
        component: 'minimum',
        hours: adjustment,
        description: 'Minimum job duration',
      });
      totalHours = this.MIN_HOURS;
    }

    // 5. Round to quarter hours
    totalHours = this.roundToQuarterHour(totalHours);

    // 6. Team size optimization
    if (totalHours > this.MAX_SINGLE_PERSON_HOURS) {
      teamSize = 2;
      flags.push('requires_two_people');
      // Note: Total hours stay same, but split between team members
      // Calendar booking will account for team capacity
    }

    if (totalHours > 6) {
      flags.push('long_job');
    }

    // 7. Quality flags
    if (input.squareMeters > 200) {
      flags.push('large_property');
    }

    if (input.cleaningType === 'move_out' && input.squareMeters > 150) {
      flags.push('complex_moveout');
    }

    // 8. Calculate final price (always rounded to whole kroner)
    const price = Math.round(totalHours * this.HOURLY_RATE);

    // 9. Confidence score based on input completeness
    const confidence = this.calculateConfidence(input);

    const result: EstimationResult = {
      estimatedHours: totalHours,
      price,
      breakdown,
      teamSize,
      flags,
      confidence,
    };

    this.logger.debug(`Estimation result: ${totalHours}h, ${price} DKK, team size: ${teamSize}`);
    return result;
  }

  /**
   * Calculate base hours by cleaning type
   */
  private calculateBaseHours(type: string, squareMeters: number): number {
    switch (type) {
      case 'weekly':
        return squareMeters / 35; // 35 m²/hour for regular cleaning
      
      case 'main':
        return squareMeters / 40; // 40 m²/hour for thorough cleaning
      
      case 'move_out':
        return squareMeters / 25; // 25 m²/hour for move-out (intensive)
      
      case 'airbnb':
        return squareMeters / 45; // 45 m²/hour for turnover cleaning
      
      case 'commercial':
        return squareMeters / 50; // 50 m²/hour for office spaces
      
      case 'event':
        return squareMeters / 30; // 30 m²/hour for post-event cleanup
      
      case 'after_construction':
        return squareMeters / 20; // 20 m²/hour for construction cleanup
      
      default:
        return squareMeters / 35; // Default to weekly rate
    }
  }

  /**
   * Get first-time multiplier by service type
   */
  private getFirstTimeMultiplier(type: string): number {
    switch (type) {
      case 'weekly':
        return 2.0; // Double time for first weekly cleaning
      case 'main':
        return 1.2; // 20% extra for first main cleaning
      case 'move_out':
        return 1.5; // 50% extra for unknown property condition
      case 'airbnb':
        return 1.1; // 10% extra for setup
      default:
        return 1.0; // No multiplier for other types
    }
  }

  /**
   * Calculate hours for extras
   */
  private calculateExtraHours(extra: string, squareMeters: number, rooms?: number): number {
    switch (extra) {
      case 'windows':
        return Math.max(0.5, squareMeters / 100); // Minimum 30 min, or 1 hour per 100m²
      
      case 'oven':
        return 0.5; // 30 minutes
      
      case 'fridge':
        return 0.25; // 15 minutes
      
      case 'deep_clean':
        return squareMeters / 60; // Extra deep cleaning
      
      case 'garden':
        return 1.0; // 1 hour for basic garden tidying
      
      case 'balcony':
        return 0.25; // 15 minutes per balcony
      
      default:
        return 0;
    }
  }

  /**
   * Get description for extras
   */
  private getExtraDescription(extra: string): string {
    const descriptions = {
      windows: 'Window cleaning (interior)',
      oven: 'Oven deep cleaning',
      fridge: 'Refrigerator cleaning',
      deep_clean: 'Deep cleaning supplement',
      garden: 'Basic garden tidying',
      balcony: 'Balcony cleaning',
    };
    
    return descriptions[extra] || `${extra} cleaning`;
  }

  /**
   * Round to nearest quarter hour
   */
  private roundToQuarterHour(hours: number): number {
    return Math.ceil(hours * 4) / 4;
  }

  /**
   * Calculate confidence score based on input completeness
   */
  private calculateConfidence(input: EstimationInput): number {
    let score = 80; // Base confidence

    if (input.squareMeters > 0) score += 10;
    if (input.rooms && input.rooms > 0) score += 5;
    if (input.bathrooms && input.bathrooms > 0) score += 5;

    // Deduct for unusual cases
    if (input.squareMeters > 300) score -= 10; // Very large properties
    if (input.squareMeters < 20) score -= 10; // Very small properties

    return Math.min(100, Math.max(50, score));
  }

  /**
   * Get estimation for quote without full processing
   */
  async getQuickEstimate(squareMeters: number, cleaningType: string): Promise<{ hours: number; price: number }> {
    const input: EstimationInput = {
      cleaningType: cleaningType as any,
      squareMeters,
      firstTime: true, // Assume first-time for conservative estimate
      extras: [],
    };

    const result = await this.calculateEstimate(input);
    return {
      hours: result.estimatedHours,
      price: result.price,
    };
  }
}