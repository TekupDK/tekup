import { Injectable, Logger } from '@nestjs/common';

export interface FragranceProfile {
  id: string;
  name: string;
  brand: string;
  category: 'floral' | 'woody' | 'fresh' | 'oriental' | 'fruity' | 'spicy' | 'aquatic';
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  intensity: number; // 1-10 scale
  longevity: number; // Hours
  sillage: number; // 1-5 scale (projection)
  season: ('spring' | 'summer' | 'fall' | 'winter')[];
  occasion: ('casual' | 'formal' | 'romantic' | 'professional' | 'evening')[];
  price: number;
  popularity: number;
  inStock: boolean;
}

export interface CustomerPreference {
  customerId: string;
  preferredCategories: string[];
  dislikedNotes: string[];
  intensityPreference: number; // 1-10
  budgetRange: { min: number; max: number };
  occasions: string[];
  previousPurchases: string[]; // Fragrance IDs
  skinType?: 'oily' | 'dry' | 'normal' | 'sensitive';
  age?: number;
  lifestyle?: 'active' | 'professional' | 'social' | 'quiet';
}

export interface RecommendationResult {
  fragrances: FragranceProfile[];
  score: number;
  reasoning: string;
  alternatives: FragranceProfile[];
  crossSells: FragranceProfile[];
}

@Injectable()
export class FragranceEngineService {
  private readonly logger = new Logger(FragranceEngineService.name);
  private fragrances: Map<string, FragranceProfile> = new Map();

  constructor() {
    this.initializeFragranceDatabase();
  }

  async getRecommendations(
    customerPreference: CustomerPreference,
    limit: number = 5,
  ): Promise<RecommendationResult> {
    this.logger.log(`Generating recommendations for customer ${customerPreference.customerId}`);

    const availableFragrances = Array.from(this.fragrances.values())
      .filter(f => f.inStock);

    // Score each fragrance based on customer preferences
    const scoredFragrances = availableFragrances.map(fragrance => ({
      fragrance,
      score: this.calculateCompatibilityScore(fragrance, customerPreference),
    }));

    // Sort by score and filter
    scoredFragrances.sort((a, b) => b.score - a.score);

    const recommendations = scoredFragrances
      .slice(0, limit)
      .map(sf => sf.fragrance);

    const alternatives = scoredFragrances
      .slice(limit, limit + 3)
      .map(sf => sf.fragrance);

    // Generate cross-sell recommendations
    const crossSells = this.generateCrossSells(recommendations, customerPreference);

    const reasoning = this.generateRecommendationReasoning(
      recommendations[0],
      customerPreference,
      scoredFragrances[0]?.score || 0
    );

    return {
      fragrances: recommendations,
      score: scoredFragrances[0]?.score || 0,
      reasoning,
      alternatives,
      crossSells,
    };
  }

  private calculateCompatibilityScore(
    fragrance: FragranceProfile,
    preference: CustomerPreference,
  ): number {
    let score = 0;
    let maxScore = 0;

    // Category preference (30% weight)
    const categoryWeight = 30;
    if (preference.preferredCategories.includes(fragrance.category)) {
      score += categoryWeight;
    }
    maxScore += categoryWeight;

    // Note preferences (25% weight)
    const noteWeight = 25;
    const allNotes = [...fragrance.notes.top, ...fragrance.notes.middle, ...fragrance.notes.base];
    const hasDislikedNotes = allNotes.some(note => 
      preference.dislikedNotes.some(disliked => 
        note.toLowerCase().includes(disliked.toLowerCase())
      )
    );
    
    if (!hasDislikedNotes) {
      score += noteWeight;
    }
    maxScore += noteWeight;

    // Intensity preference (20% weight)
    const intensityWeight = 20;
    const intensityDiff = Math.abs(fragrance.intensity - preference.intensityPreference);
    const intensityScore = Math.max(0, intensityWeight - (intensityDiff * 3));
    score += intensityScore;
    maxScore += intensityWeight;

    // Budget compatibility (15% weight)
    const budgetWeight = 15;
    if (fragrance.price >= preference.budgetRange.min && 
        fragrance.price <= preference.budgetRange.max) {
      score += budgetWeight;
    }
    maxScore += budgetWeight;

    // Occasion matching (10% weight)
    const occasionWeight = 10;
    const hasMatchingOccasion = fragrance.occasion.some(occ => 
      preference.occasions.includes(occ)
    );
    if (hasMatchingOccasion) {
      score += occasionWeight;
    }
    maxScore += occasionWeight;

    // Avoid duplicates from previous purchases
    if (preference.previousPurchases.includes(fragrance.id)) {
      score *= 0.5; // Reduce score for already purchased items
    }

    return (score / maxScore) * 100;
  }

  private generateCrossSells(
    recommendations: FragranceProfile[],
    preference: CustomerPreference,
  ): FragranceProfile[] {
    const crossSells: FragranceProfile[] = [];

    // Find complementary fragrances
    for (const rec of recommendations.slice(0, 2)) {
      // Find fragrances in different categories but similar price range
      const complementary = Array.from(this.fragrances.values())
        .filter(f => 
          f.category !== rec.category &&
          f.price >= rec.price * 0.7 &&
          f.price <= rec.price * 1.3 &&
          f.inStock &&
          !recommendations.some(r => r.id === f.id)
        )
        .slice(0, 2);

      crossSells.push(...complementary);
    }

    return crossSells.slice(0, 3);
  }

  private generateRecommendationReasoning(
    fragrance: FragranceProfile,
    preference: CustomerPreference,
    score: number,
  ): string {
    const reasons: string[] = [];

    if (preference.preferredCategories.includes(fragrance.category)) {
      reasons.push(`matches your preferred ${fragrance.category} category`);
    }

    const intensityMatch = Math.abs(fragrance.intensity - preference.intensityPreference) <= 2;
    if (intensityMatch) {
      reasons.push(`perfect intensity level (${fragrance.intensity}/10)`);
    }

    if (fragrance.price >= preference.budgetRange.min && 
        fragrance.price <= preference.budgetRange.max) {
      reasons.push('fits within your budget');
    }

    const occasionMatch = fragrance.occasion.some(occ => preference.occasions.includes(occ));
    if (occasionMatch) {
      const matchingOccasions = fragrance.occasion.filter(occ => preference.occasions.includes(occ));
      reasons.push(`ideal for ${matchingOccasions.join(' and ')} occasions`);
    }

    if (fragrance.popularity > 80) {
      reasons.push('highly rated by customers');
    }

    const reasonText = reasons.length > 0 
      ? `This fragrance ${reasons.join(', ')}.`
      : 'This fragrance matches your general preferences.';

    return `${reasonText} Compatibility score: ${Math.round(score)}%.`;
  }

  private initializeFragranceDatabase(): void {
    // Initialize with sample fragrance data
    const sampleFragrances: FragranceProfile[] = [
      {
        id: 'chanel-no5',
        name: 'No. 5',
        brand: 'Chanel',
        category: 'floral',
        notes: {
          top: ['Neroli', 'Lemon', 'Bergamot'],
          middle: ['Jasmine', 'Rose', 'Lily of the Valley'],
          base: ['Sandalwood', 'Vanilla', 'Amber'],
        },
        intensity: 7,
        longevity: 8,
        sillage: 4,
        season: ['fall', 'winter'],
        occasion: ['formal', 'evening'],
        price: 1200,
        popularity: 95,
        inStock: true,
      },
      {
        id: 'tom-ford-oud',
        name: 'Oud Wood',
        brand: 'Tom Ford',
        category: 'woody',
        notes: {
          top: ['Oud', 'Rosewood'],
          middle: ['Sandalwood', 'Palissander'],
          base: ['Vanilla', 'Amber'],
        },
        intensity: 8,
        longevity: 10,
        sillage: 5,
        season: ['fall', 'winter'],
        occasion: ['formal', 'evening'],
        price: 2500,
        popularity: 88,
        inStock: true,
      },
      {
        id: 'dolce-light-blue',
        name: 'Light Blue',
        brand: 'Dolce & Gabbana',
        category: 'fresh',
        notes: {
          top: ['Lemon', 'Apple', 'Cedar'],
          middle: ['Bamboo', 'Jasmine'],
          base: ['Cedarwood', 'Musk', 'Amber'],
        },
        intensity: 5,
        longevity: 6,
        sillage: 3,
        season: ['spring', 'summer'],
        occasion: ['casual', 'professional'],
        price: 800,
        popularity: 92,
        inStock: true,
      },
    ];

    for (const fragrance of sampleFragrances) {
      this.fragrances.set(fragrance.id, fragrance);
    }

    this.logger.log(`Initialized fragrance database with ${this.fragrances.size} fragrances`);
  }

  async addFragrance(fragrance: FragranceProfile): Promise<void> {
    this.fragrances.set(fragrance.id, fragrance);
    this.logger.log(`Added fragrance: ${fragrance.name} by ${fragrance.brand}`);
  }

  async searchFragrances(query: string): Promise<FragranceProfile[]> {
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.fragrances.values())
      .filter(fragrance => 
        fragrance.name.toLowerCase().includes(searchTerm) ||
        fragrance.brand.toLowerCase().includes(searchTerm) ||
        fragrance.category.toLowerCase().includes(searchTerm) ||
        [...fragrance.notes.top, ...fragrance.notes.middle, ...fragrance.notes.base]
          .some(note => note.toLowerCase().includes(searchTerm))
      );
  }

  async getFragrancesByCategory(category: string): Promise<FragranceProfile[]> {
    return Array.from(this.fragrances.values())
      .filter(fragrance => fragrance.category === category && fragrance.inStock);
  }
}