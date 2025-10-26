export interface VoiceSettings {
    id: string;
    provider: 'twilio' | 'deepgram' | 'custom';
    apiKey: string;
    apiSecret: string;
    defaultVoice: string;
    language: string;
}
export interface VoiceCommand {
    id: string;
    command: string;
    description: string;
    handler: string;
    enabled: boolean;
}
//# sourceMappingURL=types.d.ts.map