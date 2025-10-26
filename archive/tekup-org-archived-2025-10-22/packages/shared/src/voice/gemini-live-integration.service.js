import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '../logging/logger';
const logger = createLogger('packages-shared-src-voice-gemi');
export class GeminiLiveIntegrationService {
    genAI;
    config;
    model;
    constructor(config) {
        this.config = config;
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: config.model,
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxTokens,
            },
        });
    }
    /**
     * Process real-time voice input
     */
    async processVoiceInput(input, context) {
        try {
            logger.info('🎤 Processing voice input with Gemini Live...');
            // Convert audio to text using Gemini's audio capabilities
            const audioPart = {
                inlineData: {
                    data: this.arrayBufferToBase64(input.audio),
                    mimeType: input.mimeType,
                },
            };
            // Create conversation context
            const conversation = this.model.startChat({
                history: this.buildConversationHistory(context),
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens,
                },
            });
            // Process audio input
            const result = await conversation.sendMessage([
                audioPart,
                this.buildSystemPrompt(context),
            ]);
            const response = await result.response;
            const text = response.text();
            // Extract command intent from response
            const intent = await this.extractCommandIntent(text, context);
            return {
                text,
                confidence: intent.confidence,
                language: context.userPreferences.language,
            };
        }
        catch (error) {
            logger.error('Gemini Live voice processing failed: ' + String(error));
            throw new Error(`Voice processing failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Extract command intent from natural language
     */
    async extractCommandIntent(text, context) {
        try {
            const prompt = `
        Analyze the following voice input and extract the command intent.

        Voice Input: "${text}"
        Tenant Context: ${context.tenantId}
        Available Commands: create_lead, get_leads, search_leads, get_metrics, start_backup, compliance_check

        Extract:
        1. Command name
        2. Parameters (if any)
        3. Confidence level (0-1)
        4. Named entities

        Respond in JSON format:
        {
          "command": "command_name",
          "parameters": {"param1": "value1"},
          "confidence": 0.95,
          "entities": [
            {"type": "person", "value": "John Doe", "confidence": 0.9},
            {"type": "company", "value": "ABC Corp", "confidence": 0.8}
          ]
        }
      `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text();
            // Parse JSON response
            const intent = JSON.parse(jsonText);
            // Validate command
            if (!this.isValidCommand(intent.command)) {
                intent.command = 'unknown';
                intent.confidence = 0.1;
            }
            return intent;
        }
        catch (error) {
            logger.error('Command intent extraction failed: ' + String(error));
            return {
                command: 'unknown',
                parameters: {},
                confidence: 0.1,
                entities: [],
            };
        }
    }
    /**
     * Generate natural language response
     */
    async generateVoiceResponse(commandResult, context) {
        try {
            const prompt = `
        Generate a natural, conversational response in ${context.userPreferences.language} for the following command result:

        Command: ${commandResult.command}
        Result: ${JSON.stringify(commandResult.data)}
        Success: ${commandResult.success}

        Make the response:
        1. Natural and conversational
        2. Informative about what was accomplished
        3. Suggest next steps if applicable
        4. Friendly and professional

        Response:
      `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }
        catch (error) {
            logger.error('Response generation failed: ' + String(error));
            return 'Jeg har udført din forespørgsel. Er der andet jeg kan hjælpe med?';
        }
    }
    /**
     * Process text input (fallback for non-voice)
     */
    async processTextInput(text, context) {
        try {
            logger.info('📝 Processing text input with Gemini...');
            const prompt = `
        Analyze the following text input and extract the command intent.

        Text Input: "${text}"
        Tenant Context: ${context.tenantId}
        Available Commands: create_lead, get_leads, search_leads, get_metrics, start_backup, compliance_check

        Extract:
        1. Command name
        2. Parameters (if any)
        3. Confidence level (0-1)
        4. Named entities

        Respond in JSON format:
        {
          "command": "command_name",
          "parameters": {"param1": "value1"},
          "confidence": 0.95,
          "entities": [
            {"type": "person", "value": "John Doe", "confidence": 0.9},
            {"type": "company", "value": "ABC Corp", "confidence": 0.8}
          ]
        }
      `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const jsonText = response.text();
            const intent = JSON.parse(jsonText);
            if (!this.isValidCommand(intent.command)) {
                intent.command = 'unknown';
                intent.confidence = 0.1;
            }
            return intent;
        }
        catch (error) {
            logger.error('Text processing failed: ' + String(error));
            return {
                command: 'unknown',
                parameters: {},
                confidence: 0.1,
                entities: [],
            };
        }
    }
    /**
     * Generate conversation suggestions
     */
    async generateSuggestions(context, maxSuggestions = 3) {
        try {
            const prompt = `
        Based on the conversation context, suggest ${maxSuggestions} natural voice commands the user might want to try next.

        Conversation History: ${JSON.stringify(context.conversationHistory.slice(-3))}
        Tenant: ${context.tenantId}

        Generate natural, conversational suggestions in ${context.userPreferences.language}:
        1. Make them sound natural and helpful
        2. Base them on the conversation context
        3. Include common business tasks

        Suggestions:
      `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Parse suggestions (assuming they're numbered or bulleted)
            const suggestions = text
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line) => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
                .slice(0, maxSuggestions);
            return suggestions;
        }
        catch (error) {
            logger.error('Suggestion generation failed: ' + String(error));
            return [
                'Hent mine leads',
                'Opret en ny lead',
                'Vis metrics for denne måned',
            ];
        }
    }
    /**
     * Build conversation history for context
     */
    buildConversationHistory(context) {
        return context.conversationHistory.slice(-10).map(turn => ({
            role: turn.role,
            parts: [turn.content],
        }));
    }
    /**
     * Build system prompt for context
     */
    buildSystemPrompt(context) {
        return `
      Du er TekUp Voice Assistant, en AI-assistent der hjælper med lead management og business operations.

      Kontekst:
      - Tenant: ${context.tenantId}
      - Sprog: ${context.userPreferences.language}
      - Bruger: ${context.userId || 'Ukendt'}

      Du kan:
      - Oprette og administrere leads
      - Hente business metrics
      - Starte backup processer
      - Køre compliance checks
      - Søge efter information

      Vær venlig, professionel og hjælpsom. Svar på ${context.userPreferences.language}.
    `;
    }
    /**
     * Validate command name
     */
    isValidCommand(command) {
        const validCommands = [
            'create_lead',
            'get_leads',
            'search_leads',
            'get_metrics',
            'start_backup',
            'compliance_check',
            'unknown',
        ];
        return validCommands.includes(command);
    }
    /**
     * Convert ArrayBuffer to Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    /**
     * Update conversation history
     */
    updateConversationHistory(context, role, content) {
        context.conversationHistory.push({
            role,
            content,
            timestamp: new Date(),
        });
        // Keep only last 20 turns
        if (context.conversationHistory.length > 20) {
            context.conversationHistory = context.conversationHistory.slice(-20);
        }
    }
    /**
     * Get service status
     */
    async getServiceStatus() {
        try {
            // Test API connection
            await this.model.generateContent('test');
            return {
                status: 'healthy',
                model: this.config.model,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                model: this.config.model,
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
            };
        }
    }
}
//# sourceMappingURL=gemini-live-integration.service.js.map