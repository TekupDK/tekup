import { TenantContext, TenantSettings } from './types/tenant.types';
import { VoiceResponse, VoiceCommand } from './types/voice.types';
import { isTenantAware } from './types/tenant-aware.interface';
export declare class TenantAwareVoiceService implements isTenantAware {
    private geminiService;
    private currentTenant;
    private tenantSettings;
    private tenantApiKey;
    private allowedTenants;
    private isActive;
    constructor(apiKey: string);
    initializeTenant(tenant: string): Promise<void>;
    switchTenant(newTenant: string, userId: string): Promise<void>;
    private loadTenantSettings;
    getTenantSettings(): TenantSettings | null;
    private getBrandName;
    private getPrimaryColor;
    private hexToRgb;
    executeVoiceCommand(command: VoiceCommand, parameters?: any): Promise<VoiceResponse>;
    getTenantContext(): TenantContext;
    getCurrentTenant(): string;
    isTenantActive(): boolean;
    getAllowedTenants(): string[];
    cleanup(): Promise<void>;
}
//# sourceMappingURL=tenant-aware.service.d.ts.map