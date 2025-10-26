import { BusinessVoiceWorkflow } from './workflows/business-voice-workflows';
export interface DanishVoiceInput {
    audio: ArrayBuffer;
    text?: string;
    confidence: number;
    dialect?: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm';
    businessContext?: 'foodtruck' | 'perfume' | 'construction' | 'unified';
    userId?: string;
    sessionId: string;
}
export interface DanishVoiceOutput {
    text: string;
    confidence: number;
    intent: string;
    entities: Array<{
        type: string;
        value: string;
        confidence: number;
        danishValue?: string;
    }>;
    businessWorkflow?: BusinessVoiceWorkflow;
    response: string;
    language: 'da-DK';
    processingTime: number;
    suggestions?: string[];
}
export interface DanishVoiceContext {
    currentBusiness: 'foodtruck' | 'perfume' | 'construction' | 'unified';
    userPreferences: {
        language: 'da-DK';
        dialect: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm';
        formality: 'casual' | 'professional' | 'mixed';
        voiceSpeed: number;
        voicePitch: number;
    };
    conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
        businessContext: string;
    }>;
    activeWorkflow?: {
        id: string;
        currentStep: string;
        data: Record<string, any>;
    };
}
export declare class DanishVoiceProcessorService {
    private config;
    private context;
    private isOnline;
    constructor(businessType: 'foodtruck' | 'perfume' | 'construction' | 'unified', dialect?: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm', formality?: 'casual' | 'professional' | 'mixed');
    /**
     * Process Danish voice input with business context awareness
     */
    processDanishVoice(input: DanishVoiceInput): Promise<DanishVoiceOutput>;
    /**
     * Convert audio to text using Danish language model
     */
    private convertAudioToText;
    /**
     * Analyze Danish intent with business context awareness
     */
    private analyzeDanishIntent;
    /**
     * Check if input is a quick response that doesn't need complex processing
     */
    private isQuickResponse;
    /**
     * Analyze business-specific intents based on current business context
     */
    private analyzeBusinessIntent;
    /**
     * Map business entities to intents
     */
    private mapBusinessIntent;
    /**
     * Analyze general Danish intents
     */
    private analyzeGeneralDanishIntent;
    /**
     * Find appropriate business workflow based on input
     */
    private findBusinessWorkflow;
    /**
     * Check if intent matches workflow
     */
    private intentMatchesWorkflow;
    /**
     * Generate contextual Danish response
     */
    private generateDanishResponse;
    /**
     * Generate business-specific response
     */
    private generateBusinessResponse;
    /**
     * Generate general Danish response
     */
    private generateGeneralResponse;
    /**
     * Generate contextual suggestions
     */
    private generateSuggestions;
    /**
     * Get offline response when internet is not available
     */
    private getOfflineResponse;
    /**
     * Get error response
     */
    private getErrorResponse;
    /**
     * Switch business context
     */
    private switchBusinessContext;
    /**
     * Update conversation history
     */
    private updateConversationHistory;
    /**
     * Set online/offline status
     */
    setOnlineStatus(isOnline: boolean): void;
    /**
     * Get current context
     */
    getCurrentContext(): DanishVoiceContext;
    /**
     * Update user preferences
     */
    updateUserPreferences(preferences: Partial<DanishVoiceContext['userPreferences']>): void;
}
//# sourceMappingURL=danish-voice-processor.service.d.ts.map