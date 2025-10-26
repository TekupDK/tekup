import { DanishVoiceInput, DanishVoiceOutput } from './danish-voice-processor.service';
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
export declare class CrossBusinessVoiceService {
    private voiceProcessors;
    private currentSession;
    private customerDatabase;
    private analytics;
    constructor();
    /**
     * Initialize voice processors for each business
     */
    private initializeVoiceProcessors;
    /**
     * Load customer database (in real implementation, this would connect to CRM)
     */
    private loadCustomerDatabase;
    /**
     * Start a new cross-business voice session
     */
    startSession(customerId?: string, initialBusiness?: 'foodtruck' | 'perfume' | 'construction' | 'unified'): CrossBusinessVoiceSession;
    /**
     * Process voice input with cross-business context awareness
     */
    processCrossBusinessVoice(input: DanishVoiceInput, sessionId?: string): Promise<DanishVoiceOutput & {
        crossBusinessFeatures: any;
    }>;
    /**
     * Determine business context from voice input
     */
    private determineBusinessContext;
    /**
     * Switch business context within a session
     */
    private switchBusinessContext;
    /**
     * Update session with new conversation turn
     */
    private updateSession;
    /**
     * Generate cross-business features and recommendations
     */
    private generateCrossBusinessFeatures;
    /**
     * Generate cross-selling recommendations
     */
    private generateCrossSellingRecommendations;
    /**
     * Get loyalty rewards for customer
     */
    private getLoyaltyRewards;
    /**
     * Get unified account information
     */
    private getUnifiedAccountInfo;
    /**
     * Update analytics
     */
    private updateAnalytics;
    /**
     * Find session by ID
     */
    private findSession;
    /**
     * End current session
     */
    endSession(sessionId?: string): CrossBusinessVoiceSession | null;
    /**
     * Get analytics summary
     */
    getAnalyticsSummary(): any;
    /**
     * Get customer by ID
     */
    getCustomer(customerId: string): CrossBusinessCustomer | undefined;
    /**
     * Update customer preferences
     */
    updateCustomerPreferences(customerId: string, preferences: Partial<CrossBusinessCustomer['preferences']>): boolean;
}
//# sourceMappingURL=cross-business-voice.service.d.ts.map