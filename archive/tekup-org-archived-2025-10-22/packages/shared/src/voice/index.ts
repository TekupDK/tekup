// Core Voice Services
export { GeminiLiveService } from './gemini-live.service';
export { TenantAwareVoiceService } from './tenant-aware.service';
export { GeminiLiveIntegrationService } from './gemini-live-integration.service';

// Danish Voice Services
export { DanishVoiceProcessorService } from './danish-voice-processor.service';
export { CrossBusinessVoiceService } from './cross-business-voice.service';

// Types
export * from './types/voice.types';
export * from './types/tenant.types';

// Functions
export * from './functions/tekup-functions';

// Commands
export * from './commands/danish-commands';

// Danish Language Configuration
export * from './danish-language-model.config';

// Business Voice Workflows
export * from './workflows/business-voice-workflows';

// Re-export commonly used types
export type { VoiceResponse, ConversationTurn, VoiceSession, AudioConfig } from './types/voice.types';
export type {
  TenantSettings,
  TenantContext,
  TenantSwitchRequest,
  TenantVoiceConfig,
} from './types/tenant.types';
export type { DanishVoiceCommand } from './commands/danish-commands';

// Gemini Live types
export type {
  GeminiLiveConfig,
  VoiceInput,
  VoiceOutput,
  VoiceContext,
  CommandIntent
} from './gemini-live-integration.service';

// Danish Voice types
export type {
  DanishLanguageModelConfig,
  DanishBusinessVocabulary,
  DanishRegionalAccent
} from './danish-language-model.config';

// Cross-Business types
export type {
  CrossBusinessCustomer,
  CrossBusinessVoiceSession,
  CrossBusinessRecommendation
} from './cross-business-voice.service';
