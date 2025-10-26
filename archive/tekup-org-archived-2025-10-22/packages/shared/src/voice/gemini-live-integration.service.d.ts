export interface GeminiLiveConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
}
export interface VoiceInput {
    audio: ArrayBuffer;
    mimeType: string;
    sampleRate: number;
    channels: number;
}
export interface VoiceOutput {
    text: string;
    audio?: ArrayBuffer;
    confidence: number;
    language: string;
}
export interface VoiceContext {
    tenantId: string;
    userId?: string;
    sessionId: string;
    conversationHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
    }>;
    userPreferences: {
        language: string;
        voiceSpeed: number;
        voicePitch: number;
    };
}
export interface CommandIntent {
    command: string;
    parameters: Record<string, any>;
    confidence: number;
    entities: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
}
export declare class GeminiLiveIntegrationService {
    private genAI;
    private config;
    private model;
    constructor(config: GeminiLiveConfig);
    /**
     * Process real-time voice input
     */
    processVoiceInput(input: VoiceInput, context: VoiceContext): Promise<VoiceOutput>;
    /**
     * Extract command intent from natural language
     */
    extractCommandIntent(text: string, context: VoiceContext): Promise<CommandIntent>;
    /**
     * Generate natural language response
     */
    generateVoiceResponse(commandResult: any, context: VoiceContext): Promise<string>;
    /**
     * Process text input (fallback for non-voice)
     */
    processTextInput(text: string, context: VoiceContext): Promise<CommandIntent>;
    /**
     * Generate conversation suggestions
     */
    generateSuggestions(context: VoiceContext, maxSuggestions?: number): Promise<string[]>;
    /**
     * Build conversation history for context
     */
    private buildConversationHistory;
    /**
     * Build system prompt for context
     */
    private buildSystemPrompt;
    /**
     * Validate command name
     */
    private isValidCommand;
    /**
     * Convert ArrayBuffer to Base64
     */
    private arrayBufferToBase64;
    /**
     * Update conversation history
     */
    updateConversationHistory(context: VoiceContext, role: 'user' | 'assistant', content: string): void;
    /**
     * Get service status
     */
    getServiceStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        model: string;
        temperature: number;
        maxTokens: number;
    }>;
}
//# sourceMappingURL=gemini-live-integration.service.d.ts.map