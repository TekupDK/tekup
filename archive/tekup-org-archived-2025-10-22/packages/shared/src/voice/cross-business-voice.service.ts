import { DanishVoiceProcessorService, DanishVoiceInput, DanishVoiceOutput } from './danish-voice-processor.service';
import { BusinessVoiceWorkflow, getWorkflowsByBusiness } from './workflows/business-voice-workflows';
import { DANISH_VOICE_OPTIMIZATIONS } from './danish-language-model.config';
import { createLogger } from '../logging/logger';

const logger = createLogger('packages-shared-src-voice-cros');

export interface CrossBusinessCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferences: {
    language: 'da-DK';
    dialect: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm';
    formality: 'casual' | 'professional' | 'mixed';
  };
  businessPreferences: {
    foodtruck: {
      favoriteItems: string[];
      dietaryRestrictions: string[];
      preferredPayment: string;
      lastVisit: Date;
      totalOrders: number;
    };
    perfume: {
      favoriteBrands: string[];
      fragrancePreferences: string[];
      budget: string;
      lastPurchase: Date;
      totalPurchases: number;
    };
    construction: {
      projectTypes: string[];
      preferredMaterials: string[];
      budget: string;
      lastProject: Date;
      totalProjects: number;
    };
  };
  crossBusinessData: {
    totalSpent: number;
    loyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
    crossBusinessDiscounts: string[];
    referralHistory: Array<{
      business: string;
      customerId: string;
      date: Date;
      reward: string;
    }>;
  };
}

export interface CrossBusinessVoiceSession {
  id: string;
  customerId?: string;
  startTime: Date;
  endTime?: Date;
  businessContext: 'foodtruck' | 'perfume' | 'construction' | 'unified';
  conversationTurns: Array<{
    role: 'user' | 'assistant';
    content: string;
    businessContext: string;
    timestamp: Date;
    intent?: string;
    entities?: any[];
  }>;
  crossBusinessInteractions: Array<{
    fromBusiness: string;
    toBusiness: string;
    interaction: string;
    timestamp: Date;
  }>;
  analytics: {
    totalTurns: number;
    businessSwitches: number;
    crossSellingAttempts: number;
    customerSatisfaction?: number;
    processingTime: number;
  };
}

export interface CrossBusinessRecommendation {
  type: 'cross_sell' | 'upsell' | 'referral' | 'loyalty';
  business: 'foodtruck' | 'perfume' | 'construction';
  message: string;
  danishMessage: string;
  confidence: number;
  customerSegment: string;
  trigger: string;
}

export class CrossBusinessVoiceService {
  private voiceProcessors: Map<string, DanishVoiceProcessorService> = new Map();
  private currentSession: CrossBusinessVoiceSession | null = null;
  private customerDatabase: Map<string, CrossBusinessCustomer> = new Map();
  private analytics: {
    totalSessions: number;
    businessUsage: Record<string, number>;
    customerSatisfaction: number;
    crossBusinessInteractions: number;
    averageProcessingTime: number;
  } = {
    totalSessions: 0,
    businessUsage: { foodtruck: 0, perfume: 0, construction: 0, unified: 0 },
    customerSatisfaction: 0,
    crossBusinessInteractions: 0,
    averageProcessingTime: 0
  };

  constructor() {
    this.initializeVoiceProcessors();
    this.loadCustomerDatabase();
  }

  /**
   * Initialize voice processors for each business
   */
  private initializeVoiceProcessors(): void {
    const businessTypes = ['foodtruck', 'perfume', 'construction', 'unified'] as const;

    businessTypes.forEach(businessType => {
      const processor = new DanishVoiceProcessorService(
        businessType,
        'copenhagen', // Default dialect
        businessType === 'construction' ? 'professional' : 'casual'
      );

      this.voiceProcessors.set(businessType, processor);
    });

    logger.info('🚀 Initialized voice processors for all businesses');
  }

  /**
   * Load customer database (in real implementation, this would connect to CRM)
   */
  private loadCustomerDatabase(): void {
    // Simulate customer data
    const sampleCustomers: CrossBusinessCustomer[] = [
      {
        id: 'cust_001',
        name: 'Jonas Nielsen',
        email: 'jonas@example.com',
        phone: '+45 12 34 56 78',
        preferences: {
          language: 'da-DK',
          dialect: 'copenhagen',
          formality: 'casual'
        },
        businessPreferences: {
          foodtruck: {
            favoriteItems: ['burger', 'pommes'],
            dietaryRestrictions: [],
            preferredPayment: 'mobilepay',
            lastVisit: new Date('2024-01-15'),
            totalOrders: 12
          },
          perfume: {
            favoriteBrands: ['Chanel', 'Dior'],
            fragrancePreferences: ['let parfume', 'sommerparfume'],
            budget: '500-1000',
            lastPurchase: new Date('2024-01-10'),
            totalPurchases: 3
          },
          construction: {
            projectTypes: ['badeværelse', 'køkken'],
            preferredMaterials: ['træ', 'keramik'],
            budget: '50000-100000',
            lastProject: new Date('2023-12-01'),
            totalProjects: 2
          }
        },
        crossBusinessData: {
          totalSpent: 25000,
          loyaltyLevel: 'gold',
          crossBusinessDiscounts: ['foodtruck_10', 'perfume_15', 'construction_5'],
          referralHistory: [
            {
              business: 'foodtruck',
              customerId: 'cust_002',
              date: new Date('2024-01-01'),
              reward: 'free_burger'
            }
          ]
        }
      }
    ];

    sampleCustomers.forEach(customer => {
      this.customerDatabase.set(customer.id, customer);
    });

    logger.info(`👥 Loaded ${sampleCustomers.length} customers into database`);
  }

  /**
   * Start a new cross-business voice session
   */
  startSession(
    customerId?: string,
    initialBusiness: 'foodtruck' | 'perfume' | 'construction' | 'unified' = 'unified'
  ): CrossBusinessVoiceSession {
    const session: CrossBusinessVoiceSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      startTime: new Date(),
      businessContext: initialBusiness,
      conversationTurns: [],
      crossBusinessInteractions: [],
      analytics: {
        totalTurns: 0,
        businessSwitches: 0,
        crossSellingAttempts: 0,
        processingTime: 0
      }
    };

    this.currentSession = session;
    this.analytics.totalSessions++;
    this.analytics.businessUsage[initialBusiness]++;

    logger.info(`🎬 Started new cross-business voice session: ${session.id}`);

    return session;
  }

  /**
   * Process voice input with cross-business context awareness
   */
  async processCrossBusinessVoice(
    input: DanishVoiceInput,
    sessionId?: string
  ): Promise<DanishVoiceOutput & { crossBusinessFeatures: any }> {
    const session = sessionId ? this.findSession(sessionId) : this.currentSession;
    if (!session) {
      throw new Error('No active voice session found');
    }

    const startTime = Date.now();

    try {
      // Determine business context from input
      const businessContext = this.determineBusinessContext(input, session);

      // Switch business context if needed
      if (businessContext !== session.businessContext) {
        this.switchBusinessContext(session, businessContext);
      }

      // Get appropriate voice processor
      const processor = this.voiceProcessors.get(businessContext);
      if (!processor) {
        throw new Error(`No voice processor found for business: ${businessContext}`);
      }

      // Process voice input
      const result = await processor.processDanishVoice({
        ...input,
        businessContext
      });

      // Update session
      this.updateSession(session, input, result);

      // Generate cross-business recommendations
      const crossBusinessFeatures = await this.generateCrossBusinessFeatures(session, result);

      // Update analytics
      this.updateAnalytics(session, result, Date.now() - startTime);

      return {
        ...result,
        crossBusinessFeatures
      };

    } catch (error) {
      logger.error('❌ Cross-business voice processing failed: ' + String(error));
      throw error;
    }
  }

  /**
   * Determine business context from voice input
   */
  private determineBusinessContext(
    input: DanishVoiceInput,
    session: CrossBusinessVoiceSession
  ): 'foodtruck' | 'perfume' | 'construction' | 'unified' {
    // Check if input explicitly mentions a business
    const text = input.text?.toLowerCase() || '';

    if (text.includes('foodtruck') || text.includes('mad') || text.includes('bestille')) {
      return 'foodtruck';
    }

    if (text.includes('parfume') || text.includes('duft') || text.includes('essenza')) {
      return 'perfume';
    }

    if (text.includes('bygge') || text.includes('projekt') || text.includes('rendetalje')) {
      return 'construction';
    }

    // Return current context if no specific business mentioned
    return session.businessContext;
  }

  /**
   * Switch business context within a session
   */
  private switchBusinessContext(
    session: CrossBusinessVoiceSession,
    newBusiness: 'foodtruck' | 'perfume' | 'construction' | 'unified'
  ): void {
    if (session.businessContext !== newBusiness) {
      session.businessContext = newBusiness;
      session.analytics.businessSwitches++;

      // Record cross-business interaction
      session.crossBusinessInteractions.push({
        fromBusiness: session.businessContext,
        toBusiness: newBusiness,
        interaction: 'context_switch',
        timestamp: new Date()
      });

      logger.info(`🔄 Switched business context from ${session.businessContext} to ${newBusiness}`);
    }
  }

  /**
   * Update session with new conversation turn
   */
  private updateSession(
    session: CrossBusinessVoiceSession,
    input: DanishVoiceInput,
    result: DanishVoiceOutput
  ): void {
    // Add user turn
    session.conversationTurns.push({
      role: 'user',
      content: result.text,
      businessContext: session.businessContext,
      timestamp: new Date(),
      intent: result.intent,
      entities: result.entities
    });

    // Add assistant turn
    session.conversationTurns.push({
      role: 'assistant',
      content: result.response,
      businessContext: session.businessContext,
      timestamp: new Date(),
      intent: result.intent,
      entities: result.entities
    });

    session.analytics.totalTurns += 2;
  }

  /**
   * Generate cross-business features and recommendations
   */
  private async generateCrossBusinessFeatures(
    session: CrossBusinessVoiceSession,
    result: DanishVoiceOutput
  ): Promise<{
    customerRecognition?: string;
    crossSelling?: CrossBusinessRecommendation[];
    loyaltyRewards?: string[];
    unifiedAccount?: any;
  }> {
    const features: any = {};

    // Customer recognition
    if (session.customerId) {
      const customer = this.customerDatabase.get(session.customerId);
      if (customer) {
        features.customerRecognition = `Hej ${customer.name}, velkommen tilbage!`;
      }
    }

    // Cross-selling opportunities
    if (session.customerId) {
      const customer = this.customerDatabase.get(session.customerId);
      if (customer) {
        features.crossSelling = this.generateCrossSellingRecommendations(customer, session, result);
      }
    }

    // Loyalty rewards
    if (session.customerId) {
      const customer = this.customerDatabase.get(session.customerId);
      if (customer) {
        features.loyaltyRewards = this.getLoyaltyRewards(customer, session.businessContext);
      }
    }

    // Unified account information
    if (session.customerId) {
      const customer = this.customerDatabase.get(session.customerId);
      if (customer) {
        features.unifiedAccount = this.getUnifiedAccountInfo(customer);
      }
    }

    return features;
  }

  /**
   * Generate cross-selling recommendations
   */
  private generateCrossSellingRecommendations(
    customer: CrossBusinessCustomer,
    session: CrossBusinessVoiceSession,
    result: DanishVoiceOutput
  ): CrossBusinessRecommendation[] {
    const recommendations: CrossBusinessRecommendation[] = [];
    const currentBusiness = session.businessContext;

    // Foodtruck cross-selling
    if (currentBusiness !== 'foodtruck' && customer.businessPreferences.foodtruck.totalOrders > 0) {
      const lastVisit = customer.businessPreferences.foodtruck.lastVisit;
      const daysSinceLastVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastVisit > 7) {
        recommendations.push({
          type: 'cross_sell',
          business: 'foodtruck',
          message: 'You also ordered catering last time - would you like to do that again?',
          danishMessage: 'I bestilte også catering sidst - skal I det igen?',
          confidence: 0.8,
          customerSegment: 'returning_customer',
          trigger: 'time_based'
        });
      }
    }

    // Perfume cross-selling
    if (currentBusiness !== 'perfume' && customer.businessPreferences.perfume.totalPurchases > 0) {
      const lastPurchase = customer.businessPreferences.perfume.lastPurchase;
      const daysSinceLastPurchase = Math.floor((Date.now() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastPurchase > 30) {
        recommendations.push({
          type: 'cross_sell',
          business: 'perfume',
          message: 'We have new seasonal fragrances that might interest you',
          danishMessage: 'Vi har nye sæsonbetonede dufte der måske kan interessere dig',
          confidence: 0.7,
          customerSegment: 'seasonal_buyer',
          trigger: 'seasonal'
        });
      }
    }

    // Construction cross-selling
    if (currentBusiness !== 'construction' && customer.businessPreferences.construction.totalProjects > 0) {
      const lastProject = customer.businessPreferences.construction.lastProject;
      const monthsSinceLastProject = Math.floor((Date.now() - lastProject.getTime()) / (1000 * 60 * 60 * 24 * 30));

      if (monthsSinceLastProject > 6) {
        recommendations.push({
          type: 'cross_sell',
          business: 'construction',
          message: 'Would you like a free consultation for your next renovation project?',
          danishMessage: 'Vil du have en gratis konsultation til dit næste renoveringsprojekt?',
          confidence: 0.6,
          customerSegment: 'renovation_customer',
          trigger: 'maintenance'
        });
      }
    }

    session.analytics.crossSellingAttempts += recommendations.length;
    return recommendations;
  }

  /**
   * Get loyalty rewards for customer
   */
  private getLoyaltyRewards(
    customer: CrossBusinessCustomer,
    currentBusiness: string
  ): string[] {
    const rewards: string[] = [];
    const loyaltyLevel = customer.crossBusinessData.loyaltyLevel;

    // Business-specific rewards
    if (currentBusiness === 'foodtruck' && loyaltyLevel === 'gold') {
      rewards.push('Gratis pommes med din næste bestilling');
    }

    if (currentBusiness === 'perfume' && loyaltyLevel === 'platinum') {
      rewards.push('Eksklusiv tilgang til limited edition parfumer');
    }

    if (currentBusiness === 'construction' && loyaltyLevel === 'silver') {
      rewards.push('5% rabat på dit næste projekt');
    }

    // Cross-business rewards
    if (customer.crossBusinessData.crossBusinessDiscounts.length > 0) {
      rewards.push(...customer.crossBusinessData.crossBusinessDiscounts);
    }

    return rewards;
  }

  /**
   * Get unified account information
   */
  private getUnifiedAccountInfo(customer: CrossBusinessCustomer): any {
    return {
      totalSpent: customer.crossBusinessData.totalSpent,
      loyaltyLevel: customer.crossBusinessData.loyaltyLevel,
      totalOrders: customer.businessPreferences.foodtruck.totalOrders,
      totalPurchases: customer.businessPreferences.perfume.totalPurchases,
      totalProjects: customer.businessPreferences.construction.totalProjects,
      crossBusinessDiscounts: customer.crossBusinessData.crossBusinessDiscounts
    };
  }

  /**
   * Update analytics
   */
  private updateAnalytics(
    session: CrossBusinessVoiceSession,
    result: DanishVoiceOutput,
    processingTime: number
  ): void {
    session.analytics.processingTime += processingTime;

    // Update global analytics
    this.analytics.averageProcessingTime =
      (this.analytics.averageProcessingTime + processingTime) / 2;

    this.analytics.crossBusinessInteractions += session.crossBusinessInteractions.length;
  }

  /**
   * Find session by ID
   */
  private findSession(sessionId: string): CrossBusinessVoiceSession | null {
    if (this.currentSession?.id === sessionId) {
      return this.currentSession;
    }
    return null;
  }

  /**
   * End current session
   */
  endSession(sessionId?: string): CrossBusinessVoiceSession | null {
    const session = sessionId ? this.findSession(sessionId) : this.currentSession;
    if (!session) {
      return null;
    }

    session.endTime = new Date();

    // Calculate customer satisfaction (simplified)
    if (session.analytics.totalTurns > 0) {
      session.analytics.customerSatisfaction = Math.min(5,
        Math.max(1, 5 - (session.analytics.businessSwitches * 0.5))
      );

      this.analytics.customerSatisfaction =
        (this.analytics.customerSatisfaction + session.analytics.customerSatisfaction) / 2;
    }

    logger.info(`🏁 Ended session: ${session.id}`, {
      totalTurns: session.analytics.totalTurns,
      businessSwitches: session.analytics.businessSwitches,
      crossSellingAttempts: session.analytics.crossSellingAttempts,
      customerSatisfaction: session.analytics.customerSatisfaction
    });

    if (sessionId === this.currentSession?.id) {
      this.currentSession = null;
    }

    return session;
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): any {
    return {
      ...this.analytics,
      activeSessions: this.currentSession ? 1 : 0,
      totalCustomers: this.customerDatabase.size
    };
  }

  /**
   * Get customer by ID
   */
  getCustomer(customerId: string): CrossBusinessCustomer | undefined {
    return this.customerDatabase.get(customerId);
  }

  /**
   * Update customer preferences
   */
  updateCustomerPreferences(
    customerId: string,
    preferences: Partial<CrossBusinessCustomer['preferences']>
  ): boolean {
    const customer = this.customerDatabase.get(customerId);
    if (!customer) {
      return false;
    }

    customer.preferences = { ...customer.preferences, ...preferences };
    logger.info(`👤 Updated preferences for customer: ${customerId}`);
    return true;
  }
}
