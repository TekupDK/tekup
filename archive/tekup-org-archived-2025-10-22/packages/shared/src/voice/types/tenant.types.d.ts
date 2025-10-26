export interface TenantSettings {
    id: string;
    name: string;
    brand_display_name?: string;
    theme_primary_color?: string;
    theme_primary_color_rgb?: string;
    domain?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface TenantContext {
    currentTenant: string;
    tenantSettings: TenantSettings;
    tenantApiKey: string;
    allowedTenants: string[];
    isTenantActive: boolean;
}
export interface TenantSwitchRequest {
    fromTenant: string;
    toTenant: string;
    userId: string;
    timestamp: Date;
}
import { VoiceCommand, VoiceSettings } from '../types';
export interface TenantVoiceConfig {
    tenantId: string;
    voiceSettings: VoiceSettings;
    allowedFunctions: string[];
    customCommands: VoiceCommand[];
    branding: {
        welcomeMessage: string;
        systemPrompt: string;
        voicePersonality: string;
    };
}
//# sourceMappingURL=tenant.types.d.ts.map