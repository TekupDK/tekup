import { Injectable, Logger } from '@nestjs/common';

export interface CleaningJob {
  type: 'ugentlig' | 'hovedrengoring' | 'flytterengoring' | 'vinduer' | 'erhverv' | 'airbnb' | 'efter_handvarkere';
  squareMeters: number;
  rooms?: number;
  bathrooms?: number;
  extras?: string[];
  condition?: 'normal' | 'heavy' | 'light';
}

export interface PricingEstimate {
  estimatedHours: number;
  priceExclVat: number;
  priceInclVat: number;
  hourlyRate: number;
  breakdown: {
    baseTime: number;
    extraTime: number;
    totalTime: number;
  };
  description: string;
}

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly HOURLY_RATE = 349; // DKK incl. VAT
  private readonly VAT_RATE = 0.25;

  // Time per square meter guidelines from Rendetalje knowledge base
  private readonly TIME_RATES = {
    ugentlig: { min: 0.04, max: 0.05 },
    hovedrengoring: { min: 0.045, max: 0.055 },
    flytterengoring: { min: 0.05, max: 0.065 },
    efter_handvarkere: { min: 0.06, max: 0.08 },
    erhverv: { min: 0.03, max: 0.045 },
    vinduer: { min: 0.01, max: 0.015 },
    airbnb: { min: 0.035, max: 0.045 },
  };

  calculateEstimate(job: CleaningJob): PricingEstimate {
    this.logger.log(`Calculating estimate for ${job.type} job: ${job.squareMeters}m²`);

    const timeRate = this.TIME_RATES[job.type];
    if (!timeRate) {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    // Base time calculation
    let timePerSqm = (timeRate.min + timeRate.max) / 2;
    
    // Adjust based on condition
    if (job.condition === 'heavy') {
      timePerSqm *= 1.2;
    } else if (job.condition === 'light') {
      timePerSqm *= 0.9;
    }

    const baseTime = job.squareMeters * timePerSqm;
    
    // Extra time for additional features
    let extraTime = 0;
    
    // Bathroom complexity
    if (job.bathrooms && job.bathrooms > 1) {
      extraTime += (job.bathrooms - 1) * 0.5; // 30 min per extra bathroom
    }

    // Room complexity for detailed cleaning
    if (job.type === 'hovedrengoring' && job.rooms && job.rooms > 4) {
      extraTime += (job.rooms - 4) * 0.25; // 15 min per extra room
    }

    // Extras
    if (job.extras) {
      for (const extra of job.extras) {
        switch (extra) {
          case 'ovn':
            extraTime += 1.0; // 1 hour for oven cleaning
            break;
          case 'koleskab':
            extraTime += 0.5; // 30 min for fridge
            break;
          case 'vinduer_indvendig':
            extraTime += job.squareMeters * 0.01; // 1 min per sqm
            break;
          case 'vinduer_udvendig':
            extraTime += job.squareMeters * 0.015; // 1.5 min per sqm
            break;
          case 'skabe_indvendig':
            extraTime += 2.0; // 2 hours for cabinet interiors
            break;
          default:
            extraTime += 0.5; // Default 30 min for unknown extras
        }
      }
    }

    const totalTime = baseTime + extraTime;
    const priceInclVat = totalTime * this.HOURLY_RATE;
    const priceExclVat = priceInclVat / (1 + this.VAT_RATE);

    const estimate: PricingEstimate = {
      estimatedHours: Math.round(totalTime * 10) / 10, // Round to 1 decimal
      priceExclVat: Math.round(priceExclVat),
      priceInclVat: Math.round(priceInclVat),
      hourlyRate: this.HOURLY_RATE,
      breakdown: {
        baseTime: Math.round(baseTime * 10) / 10,
        extraTime: Math.round(extraTime * 10) / 10,
        totalTime: Math.round(totalTime * 10) / 10,
      },
      description: this.generateDescription(job, totalTime, priceInclVat),
    };

    this.logger.log(`Estimate calculated: ${estimate.estimatedHours}h = ${estimate.priceInclVat} DKK`);
    
    return estimate;
  }

  private generateDescription(job: CleaningJob, hours: number, price: number): string {
    const jobTypeNames = {
      ugentlig: 'Ugentlig rengøring',
      hovedrengoring: 'Hovedrengøring',
      flytterengoring: 'Flytterengøring',
      vinduer: 'Vinduespolering',
      erhverv: 'Erhvervsrengøring',
      airbnb: 'Airbnb rengøring',
      efter_handvarkere: 'Rengøring efter håndværkere',
    };

    const jobName = jobTypeNames[job.type] || job.type;
    const roundedHours = Math.round(hours * 10) / 10;
    
    let description = `${jobName} på ${job.squareMeters} m²`;
    
    if (job.bathrooms && job.bathrooms > 1) {
      description += `, ${job.bathrooms} badeværelser`;
    }
    
    description += ` - ca. ${roundedHours} timer. Pris: ${price.toLocaleString('da-DK')} kr inkl. moms.`;

    if (job.extras && job.extras.length > 0) {
      const extraNames = {
        ovn: 'ovn',
        koleskab: 'køleskab',
        vinduer_indvendig: 'vinduer indvendigt',
        vinduer_udvendig: 'vinduer udvendigt',
        skabe_indvendig: 'skabe indvendigt',
      };
      
      const extrasList = job.extras
        .map(extra => extraNames[extra] || extra)
        .join(', ');
      
      description += ` Inkl. ${extrasList}.`;
    }

    return description;
  }

  getJobTypeGuidelines(): Record<string, any> {
    return {
      ugentlig: {
        description: 'Fast interval, basis vedligehold inkl. overflader, gulve, bad, køkken',
        timeRange: this.TIME_RATES.ugentlig,
        typical: 'Mindre variation; kundens tilstand påvirker',
      },
      hovedrengoring: {
        description: 'Dybdegående – detaljer som paneler, skabe udvendigt, grundig bad/komfur',
        timeRange: this.TIME_RATES.hovedrengoring,
        typical: 'Mer for detaljer / bad antal',
      },
      flytterengoring: {
        description: 'Efter fraflytning – inkl. køkkenskabe ind/ud, ovn, køleskab, bad detaljer',
        timeRange: this.TIME_RATES.flytterengoring,
        typical: 'Ofte skabe indv., ovn, hvidevarer',
      },
      efter_handvarkere: {
        description: 'Støv, byggespor, finrens af overflader',
        timeRange: this.TIME_RATES.efter_handvarkere,
        typical: 'Støvniveau kritisk faktor',
      },
      erhverv: {
        description: 'Kontor-/erhvervsarealer, fokus på hygiejne og præsentation',
        timeRange: this.TIME_RATES.erhverv,
        typical: 'Jævn rytme, få køkkener',
      },
      vinduer: {
        description: 'Indvendig (og udvendig hvor muligt) pudsning',
        timeRange: this.TIME_RATES.vinduer,
        typical: 'Tilgængelighed påvirker tid',
      },
      airbnb: {
        description: 'Hurtig turnaround, fokus på helhedsindtryk, senge, overflader, bad',
        timeRange: this.TIME_RATES.airbnb,
        typical: 'Standardiseret proces for hurtig vending',
      },
    };
  }
}