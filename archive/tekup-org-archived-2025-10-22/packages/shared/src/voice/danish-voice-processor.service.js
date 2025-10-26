"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanishVoiceProcessorService = void 0;
const danish_language_model_config_1 = require("./danish-language-model.config");
const business_voice_workflows_1 = require("./workflows/business-voice-workflows");
const logger_1 = require("../logging/logger");
const logger = (0, logger_1.createLogger)('packages-shared-src-voice-dani');
class DanishVoiceProcessorService {
    config;
    context;
    isOnline = true;
    constructor(businessType, dialect = 'copenhagen', formality = 'mixed') {
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
    async processDanishVoice(input) {
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
            const response = await this.generateDanishResponse(intentAnalysis, workflow, input.confidence);
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
        }
        catch (error) {
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
    async convertAudioToText(audio) {
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
    async analyzeDanishIntent(text, confidence) {
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
    isQuickResponse(text) {
        const quickResponses = danish_language_model_config_1.DANISH_VOICE_OPTIMIZATIONS.quickResponses;
        return (quickResponses.greetings.some(greeting => text.includes(greeting)) ||
            quickResponses.confirmations.some(confirmation => text.includes(confirmation)) ||
            quickResponses.acknowledgments.some(acknowledgment => text.includes(acknowledgment)));
    }
    /**
     * Analyze business-specific intents based on current business context
     */
    analyzeBusinessIntent(text) {
        const businessType = this.context.currentBusiness;
        const vocabulary = danish_language_model_config_1.DANISH_BUSINESS_VOCABULARY[businessType];
        if (!vocabulary)
            return null;
        // Check for business-specific keywords
        const entities = [];
        // Check menu items (for foodtruck)
        if (businessType === 'foodtruck') {
            const menuMatch = ('menu' in vocabulary) ? vocabulary.menu.find((item) => text.includes(item)) : undefined;
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
            const brandMatch = ('brands' in vocabulary) ? vocabulary.brands.find((brand) => text.includes(brand)) : undefined;
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
            const projectMatch = ('projects' in vocabulary) ? vocabulary.projects.find((project) => text.includes(project)) : undefined;
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
    mapBusinessIntent(businessType, entities) {
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
    analyzeGeneralDanishIntent(text) {
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
    findBusinessWorkflow(text, intent) {
        // First check if there's an active workflow
        if (this.context.activeWorkflow) {
            return (0, business_voice_workflows_1.getWorkflowsByPhrase)(text)[0] || undefined;
        }
        // Find workflow based on text phrases
        const workflows = (0, business_voice_workflows_1.getWorkflowsByPhrase)(text);
        if (workflows.length > 0) {
            return workflows[0];
        }
        // Find workflow based on intent
        const businessType = this.context.currentBusiness;
        const allWorkflows = (0, business_voice_workflows_1.getWorkflowsByPhrase)('');
        return allWorkflows.find(workflow => workflow.businessType === businessType &&
            this.intentMatchesWorkflow(intent, workflow));
    }
    /**
     * Check if intent matches workflow
     */
    intentMatchesWorkflow(intent, workflow) {
        const intentMapping = {
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
    async generateDanishResponse(intentAnalysis, workflow, confidence) {
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
    generateBusinessResponse(workflow, intentAnalysis) {
        const businessType = workflow.businessType;
        const businessContext = danish_language_model_config_1.DANISH_VOICE_OPTIMIZATIONS.businessContext[businessType];
        if (!businessContext) {
            return 'Jeg kan hjælpe dig med det. Hvad har du brug for?';
        }
        // Return appropriate greeting based on business context
        return businessContext.defaultGreeting;
    }
    /**
     * Generate general Danish response
     */
    generateGeneralResponse(intent, confidence) {
        const responses = {
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
    generateSuggestions(intent, workflow) {
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
    getOfflineResponse() {
        const offlineMessages = danish_language_model_config_1.DANISH_VOICE_OPTIMIZATIONS.errorHandling.offline;
        return offlineMessages[Math.floor(Math.random() * offlineMessages.length)];
    }
    /**
     * Get error response
     */
    getErrorResponse(error) {
        const errorMessages = danish_language_model_config_1.DANISH_VOICE_OPTIMIZATIONS.errorHandling.misunderstood;
        return errorMessages[Math.floor(Math.random() * errorMessages.length)];
    }
    /**
     * Switch business context
     */
    switchBusinessContext(businessType) {
        this.context.currentBusiness = businessType;
        this.config.businessType = businessType;
        logger.info(`🔄 Switched business context to: ${businessType}`);
    }
    /**
     * Update conversation history
     */
    updateConversationHistory(role, content) {
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
    setOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        logger.info(`🌐 Online status: ${isOnline ? 'Online' : 'Offline'}`);
    }
    /**
     * Get current context
     */
    getCurrentContext() {
        return { ...this.context };
    }
    /**
     * Update user preferences
     */
    updateUserPreferences(preferences) {
        this.context.userPreferences = { ...this.context.userPreferences, ...preferences };
        logger.info('👤 Updated user preferences:', preferences);
    }
}
exports.DanishVoiceProcessorService = DanishVoiceProcessorService;
//# sourceMappingURL=danish-voice-processor.service.js.map