import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '../logging/logger';
const logger = createLogger('packages-shared-src-voice-gemi');
export class GeminiLiveService {
    client;
    session;
    currentTenant = '';
    tenantSettings = {};
    isConnected = false;
    constructor(apiKey) {
        this.client = new GoogleGenerativeAI(apiKey);
    }
    async connect(tenant, tenantSettings) {
        try {
            this.currentTenant = tenant;
            this.tenantSettings = tenantSettings;
            const config = {
                model: "models/gemini-2.5-flash-preview-native-audio-dialog",
                response_modalities: ["AUDIO"],
                system_instruction: this.generateTenantSpecificInstruction(tenant, tenantSettings),
                speech_config: {
                    voice_config: {
                        prebuilt_voice_config: { voice_name: "Zephyr" }
                    }
                },
                context_window_compression: {
                    trigger_tokens: 25600,
                    sliding_window: { target_tokens: 12800 }
                }
            };
            this.session = await this.client.aio.live.connect(config);
            this.isConnected = true;
            logger.info(`✅ Gemini Live session started for tenant: ${tenant}`);
        }
        catch (error) {
            logger.error('❌ Fejl ved start af Gemini Live session: ' + String(error));
            throw error;
        }
    }
    generateTenantSpecificInstruction(tenant, settings) {
        const brandName = settings.brand_display_name || tenant;
        const primaryColor = settings.theme_primary_color || '#7c3aed';
        return `Du er TekUp Voice Agent - en dansk AI-assistent der arbejder for ${brandName}.

VIGTIGT:
- Du arbejder for tenant: ${tenant}
- Brand navn: ${brandName}
- Svar ALTID på dansk
- Brug en professionel men venlig tone
- Vær præcis og hjælpsom
- Forklar ting på en letforståelig måde

TENANT-SPECIFIKKE OPLYSNINGER:
- Du kan kun se og arbejde med data fra ${tenant}
- Alle dine handlinger er isoleret til denne tenant
- Du kender til tenant's specifikke workflows og behov

TILGÆNGELIGE FUNKTIONER:
- Lead management (kun for ${tenant})
- Compliance checks (kun for ${tenant})
- Backup og archiving (kun for ${tenant})
- Søgning og analytics (kun for ${tenant})

HUSK: Du arbejder kun med data fra ${tenant} og kan ikke se data fra andre tenants.`;
    }
    async processVoiceCommand(audioInput) {
        if (!this.isConnected) {
            throw new Error('Gemini Live session ikke forbundet');
        }
        try {
            // Send audio til Gemini
            await this.session.send_realtime_input({
                audio: {
                    data: audioInput,
                    mime_type: "audio/pcm;rate=16000"
                }
            });
            // Modtag svar
            let responseText = '';
            let responseAudio = null;
            for await (const response of this.session.receive()) {
                if (response.text) {
                    responseText += response.text;
                }
                if (response.data) {
                    responseAudio = Buffer.from(response.data);
                }
            }
            return {
                success: true,
                data: {
                    text: responseText,
                    audio: responseAudio
                },
                tenant: this.currentTenant,
                timestamp: new Date()
            };
        }
        catch (error) {
            logger.error('❌ Fejl ved voice command processing: ' + String(error));
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                tenant: this.currentTenant,
                timestamp: new Date()
            };
        }
    }
    async disconnect() {
        if (this.session) {
            await this.session.close();
            this.session = null;
            this.isConnected = false;
            logger.info('🔌 Gemini Live session lukket');
        }
    }
    isSessionActive() {
        return this.isConnected;
    }
    getCurrentTenant() {
        return this.currentTenant;
    }
}
//# sourceMappingURL=gemini-live.service.js.map