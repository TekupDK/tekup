import { VoiceResponse } from './types/voice.types';
export declare class GeminiLiveService {
    private client;
    private session;
    private currentTenant;
    private tenantSettings;
    private isConnected;
    constructor(apiKey: string);
    connect(tenant: string, tenantSettings: any): Promise<void>;
    private generateTenantSpecificInstruction;
    processVoiceCommand(audioInput: Buffer): Promise<VoiceResponse>;
    disconnect(): Promise<void>;
    isSessionActive(): boolean;
    getCurrentTenant(): string;
}
//# sourceMappingURL=gemini-live.service.d.ts.map