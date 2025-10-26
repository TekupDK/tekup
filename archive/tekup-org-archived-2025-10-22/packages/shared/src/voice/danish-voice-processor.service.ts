import {
  DanishLanguageModelConfig,
  DANISH_BUSINESS_VOCABULARY,
  DANISH_REGIONAL_ACCENTS,
  DANISH_VOICE_OPTIMIZATIONS
} from './danish-language-model.config';
import { BusinessVoiceWorkflow, getWorkflowsByPhrase } from './workflows/business-voice-workflows';
import { createLogger } from '../logging/logger';

const logger = createLogger('packages-shared-src-voice-dani');

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

export class DanishVoiceProcessorService {
  private config: DanishLanguageModelConfig;
  private context: DanishVoiceContext;
  private isOnline: boolean = true;

  constructor(
    businessType: 'foodtruck' | 'perfume' | 'construction' | 'unified',
    dialect: 'copenhagen' | 'jylland' | 'fyn' | 'bornholm' = 'copenhagen',
    formality: 'casual' | 'professional' | 'mixed' = 'mixed'
  ) {
    this.config = {
      language: 'da-DK',
      primaryDialect: dialect,
      formalityLevel: formality,
      businessType,
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
      maxResponseTime: 500,
      confidenceThreshold: 0.75,
      offlineCommands: [],
      requiresInternet: businessType === 'unified'
    };

    this.context = {
      currentBusiness: businessType,
      userPreferences: {
        language: 'da-DK',
        dialect,
        formality,
        voiceSpeed: 1.0,
        voicePitch: 1.0
      },
      conversationHistory: [],
      activeWorkflow: undefined
    };
  }

  /**
   * Process Danish voice input with business context awareness
   */
  async processDanishVoice(input: DanishVoiceInput): Promise<DanishVoiceOutput> {
    const startTime = Date.now();

    try {
      logger.info('🇩🇰 Processing Danish voice input...', {
        dialect: input.dialect || this.config.primaryDialect,
        businessContext: input.businessContext || this.context.currentBusiness,
        confidence: input.confidence
      });

      // Update context if new business context is provided
      if (input.businessContext && input.businessContext !== this.context.currentBusiness) {
        this.switchBusinessContext(input.businessContext);
      }

      // Process text input (if provided) or convert audio to text
      const processedText = input.text || await this.convertAudioToText(input.audio);

      // Analyze intent and extract entities
      const intentAnalysis = await this.analyzeDanishIntent(processedText, input.confidence);

      // Find appropriate business workflow
      const workflow = this.findBusinessWorkflow(processedText, intentAnalysis.intent);

      // Generate contextual response
      const response = await this.generateDanishResponse(
        intentAnalysis,
        workflow,
        input.confidence
      );

      // Update conversation history
      this.updateConversationHistory('user', processedText);
      this.updateConversationHistory('assistant', response);

      const processingTime = Date.now() - startTime;

      logger.info('✅ Danish voice processing completed', {
        processingTime,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        workflow: workflow?.id
      });

      return {
        text: processedText,
        confidence: intentAnalysis.confidence,
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        businessWorkflow: workflow,
        response,
        language: 'da-DK',
        processingTime,
        suggestions: this.generateSuggestions(intentAnalysis.intent, workflow)
      };

    } catch (error) {
      logger.error('❌ Danish voice processing failed: ' + String(error));

      return {
        text: input.text || 'Audio input',
        confidence: 0,
        intent: 'error',
        entities: [],
        response: this.getErrorResponse(error),
        language: 'da-DK',
        processingTime: Date.now() - startTime,
        suggestions: ['prøv igen', 'start forfra', 'hjælp']
      };
    }
  }

  /**
   * Convert audio to text using Danish language model
   */
  private async convertAudioToText(audio: ArrayBuffer): Promise<string> {
    // This would integrate with Google's Gemini Live or similar service
    // For now, we'll simulate the conversion
    logger.info('🎤 Converting audio to Danish text...');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return a placeholder - in real implementation this would use speech-to-text
    return 'simuleret dansk tale input';
  }

  /**
   * Analyze Danish intent with business context awareness
   */
  private async analyzeDanishIntent(
    text: string,
    confidence: number
  ): Promise<{
    intent: string;
    confidence: number;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
      danishValue?: string;
    }>;
  }> {
    const lowerText = text.toLowerCase();

    // Check for quick responses first
    if (this.isQuickResponse(lowerText)) {
      return {
        intent: 'quick_response',
        confidence: 0.95,
        entities: []
      };
    }

    // Analyze business-specific intents
    const businessIntent = this.analyzeBusinessIntent(lowerText);
    if (businessIntent) {
      return businessIntent;
    }

    // Analyze general Danish intents
    const generalIntent = this.analyzeGeneralDanishIntent(lowerText);

    return {
      intent: generalIntent.intent,
      confidence: Math.min(confidence, generalIntent.confidence),
      entities: generalIntent.entities
    };
  }

  /**
   * Check if input is a quick response that doesn't need complex processing
   */
  private isQuickResponse(text: string): boolean {
    const quickResponses = DANISH_VOICE_OPTIMIZATIONS.quickResponses;

    return (
      quickResponses.greetings.some(greeting => text.includes(greeting)) ||
      quickResponses.confirmations.some(confirmation => text.includes(confirmation)) ||
      quickResponses.acknowledgments.some(acknowledgment => text.includes(acknowledgment))
    );
  }

  /**
   * Analyze business-specific intents based on current business context
   */
  private analyzeBusinessIntent(text: string): {
    intent: string;
    confidence: number;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
      danishValue?: string;
    }>;
  } | null {
    const businessType = this.context.currentBusiness;
    const vocabulary = DANISH_BUSINESS_VOCABULARY[businessType as keyof typeof DANISH_BUSINESS_VOCABULARY];

    if (!vocabulary) return null;

    // Check for business-specific keywords
    const entities: Array<{
      type: string;
      value: string;
      confidence: number;
      danishValue?: string;
    }> = [];

    // Check menu items (for foodtruck)
    if (businessType === 'foodtruck') {
      const menuMatch = ('menu' in vocabulary) ? vocabulary.menu.find((item: string) => text.includes(item)) : undefined;
      if (menuMatch) {
        entities.push({
          type: 'menu_item',
          value: menuMatch,
          confidence: 0.9,
          danishValue: menuMatch
        });
      }
    }

    // Check brands (for perfume)
    if (businessType === 'perfume') {
      const brandMatch = ('brands' in vocabulary) ? vocabulary.brands.find((brand: string) => text.includes(brand)) : undefined;
      if (brandMatch) {
        entities.push({
          type: 'brand',
          value: brandMatch,
          confidence: 0.9,
          danishValue: brandMatch
        });
      }
    }

    // Check projects (for construction)
    if (businessType === 'construction') {
      const projectMatch = ('projects' in vocabulary) ? vocabulary.projects.find((project: string) => text.includes(project)) : undefined;
      if (projectMatch) {
        entities.push({
          type: 'project_type',
          value: projectMatch,
          confidence: 0.9,
          danishValue: projectMatch
        });
      }
    }

    // Determine intent based on business context and entities
    if (entities.length > 0) {
      return {
        intent: this.mapBusinessIntent(businessType, entities),
        confidence: 0.85,
        entities
      };
    }

    return null;
  }

  /**
   * Map business entities to intents
   */
  private mapBusinessIntent(
    businessType: string,
    entities: Array<{ type: string; value: string; confidence: number }>
  ): string {
    switch (businessType) {
      case 'foodtruck':
        if (entities.some(e => e.type === 'menu_item')) {
          return 'food_order';
        }
        return 'foodtruck_inquiry';

      case 'perfume':
        if (entities.some(e => e.type === 'brand')) {
          return 'perfume_inquiry';
        }
        return 'perfume_consultation';

      case 'construction':
        if (entities.some(e => e.type === 'project_type')) {
          return 'project_update';
        }
        return 'construction_inquiry';

      default:
        return 'general_inquiry';
    }
  }

  /**
   * Analyze general Danish intents
   */
  private analyzeGeneralDanishIntent(text: string): {
    intent: string;
    confidence: number;
    entities: Array<{
      type: string;
      value: string;
      confidence: number;
      danishValue?: string;
    }>;
  } {
    // Common Danish phrases and intents
    if (text.includes('hej') || text.includes('godmorgen') || text.includes('godaften')) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities: []
      };
    }

    if (text.includes('tak') || text.includes('mange tak')) {
      return {
        intent: 'gratitude',
        confidence: 0.9,
        entities: []
      };
    }

    if (text.includes('farvel') || text.includes('vi ses')) {
      return {
        intent: 'farewell',
        confidence: 0.9,
        entities: []
      };
    }

    if (text.includes('hjælp') || text.includes('hvad kan du')) {
      return {
        intent: 'help',
        confidence: 0.8,
        entities: []
      };
    }

    return {
      intent: 'unknown',
      confidence: 0.5,
      entities: []
    };
  }

  /**
   * Find appropriate business workflow based on input
   */
  private findBusinessWorkflow(text: string, intent: string): BusinessVoiceWorkflow | undefined {
    // First check if there's an active workflow
    if (this.context.activeWorkflow) {
      return getWorkflowsByPhrase(text)[0] || undefined;
    }

    // Find workflow based on text phrases
    const workflows = getWorkflowsByPhrase(text);
    if (workflows.length > 0) {
      return workflows[0];
    }

    // Find workflow based on intent
    const businessType = this.context.currentBusiness;
    const allWorkflows = getWorkflowsByPhrase('');

    return allWorkflows.find(workflow =>
      workflow.businessType === businessType &&
      this.intentMatchesWorkflow(intent, workflow)
    );
  }

  /**
   * Check if intent matches workflow
   */
  private intentMatchesWorkflow(intent: string, workflow: BusinessVoiceWorkflow): boolean {
    const intentMapping: Record<string, string[]> = {
      'food_order': ['foodtruck_order'],
      'foodtruck_inquiry': ['foodtruck_location'],
      'perfume_consultation': ['perfume_consultation'],
      'perfume_inquiry': ['perfume_inventory'],
      'project_update': ['construction_project_update'],
      'construction_inquiry': ['construction_scheduling']
    };

    const matchingWorkflows = intentMapping[intent] || [];
    return matchingWorkflows.includes(workflow.id);
  }

  /**
   * Generate contextual Danish response
   */
  private async generateDanishResponse(
    intentAnalysis: { intent: string; confidence: number; entities: any[] },
    workflow: BusinessVoiceWorkflow | undefined,
    confidence: number
  ): Promise<string> {
    // Check if we're offline and need to use offline responses
    if (!this.isOnline && this.config.requiresInternet) {
      return this.getOfflineResponse();
    }

    // Generate business-specific response
    if (workflow) {
      return this.generateBusinessResponse(workflow, intentAnalysis);
    }

    // Generate general response based on intent
    return this.generateGeneralResponse(intentAnalysis.intent, confidence);
  }

  /**
   * Generate business-specific response
   */
  private generateBusinessResponse(
    workflow: BusinessVoiceWorkflow,
    intentAnalysis: { intent: string; confidence: number; entities: any[] }
  ): string {
    const businessType = workflow.businessType;
    const businessContext = DANISH_VOICE_OPTIMIZATIONS.businessContext[businessType as keyof typeof DANISH_VOICE_OPTIMIZATIONS.businessContext];

    if (!businessContext) {
      return 'Jeg kan hjælpe dig med det. Hvad har du brug for?';
    }

    // Return appropriate greeting based on business context
    return businessContext.defaultGreeting;
  }

  /**
   * Generate general Danish response
   */
  private generateGeneralResponse(intent: string, confidence: number): string {
    const responses: Record<string, string> = {
      'greeting': 'Hej! Hvordan kan jeg hjælpe dig i dag?',
      'gratitude': 'Selv tak! Er der andet jeg kan hjælpe dig med?',
      'farewell': 'Farvel! Hav en god dag.',
      'help': 'Jeg kan hjælpe dig med forskellige ting. Hvad leder du efter?',
      'unknown': 'Undskyld, jeg forstod ikke helt. Kan du sige det igen?'
    };

    return responses[intent] || responses['unknown'];
  }

  /**
   * Generate contextual suggestions
   */
  private generateSuggestions(intent: string, workflow?: BusinessVoiceWorkflow): string[] {
    if (workflow) {
      const currentStep = workflow.steps.find(step => step.id === 'greeting');
      if (currentStep && currentStep.choices) {
        return currentStep.choices;
      }
    }

    // Default suggestions based on business type
    const businessType = this.context.currentBusiness;
    switch (businessType) {
      case 'foodtruck':
        return ['bestille mad', 'hvor står i', 'åbningstider', 'menu'];
      case 'perfume':
        return ['anbefaling', 'på lager', 'pris', 'rådgivning'];
      case 'construction':
        return ['projekt status', 'planlægning', 'pris', 'tidsplan'];
      default:
        return ['hjælp', 'start', 'stop'];
    }
  }

  /**
   * Get offline response when internet is not available
   */
  private getOfflineResponse(): string {
    const offlineMessages = DANISH_VOICE_OPTIMIZATIONS.errorHandling.offline;
    return offlineMessages[Math.floor(Math.random() * offlineMessages.length)];
  }

  /**
   * Get error response
   */
  private getErrorResponse(error: any): string {
    const errorMessages = DANISH_VOICE_OPTIMIZATIONS.errorHandling.misunderstood;
    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
  }

  /**
   * Switch business context
   */
  private switchBusinessContext(businessType: 'foodtruck' | 'perfume' | 'construction' | 'unified'): void {
    this.context.currentBusiness = businessType;
    this.config.businessType = businessType;

    logger.info(`🔄 Switched business context to: ${businessType}`);
  }

  /**
   * Update conversation history
   */
  private updateConversationHistory(role: 'user' | 'assistant', content: string): void {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
      businessContext: this.context.currentBusiness
    });

    // Keep only last 10 conversation turns
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
    }
  }

  /**
   * Set online/offline status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    logger.info(`🌐 Online status: ${isOnline ? 'Online' : 'Offline'}`);
  }

  /**
   * Get current context
   */
  getCurrentContext(): DanishVoiceContext {
    return { ...this.context };
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<DanishVoiceContext['userPreferences']>): void {
    this.context.userPreferences = { ...this.context.userPreferences, ...preferences };
    logger.info('👤 Updated user preferences:', preferences);
  }
}
