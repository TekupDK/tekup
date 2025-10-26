export interface DanishVoiceCommand {
    id: string;
    danishPhrase: string;
    englishPhrase: string;
    functionId: string;
    description: string;
    examples: string[];
    category: 'leads' | 'compliance' | 'backup' | 'search' | 'system' | 'navigation';
}
export declare const DANISH_VOICE_COMMANDS: DanishVoiceCommand[];
export declare const getCommandsByCategory: (category: string) => DanishVoiceCommand[];
export declare const getCommandsByFunction: (functionId: string) => DanishVoiceCommand[];
export declare const searchCommands: (query: string) => DanishVoiceCommand[];
export declare const getAllCommands: () => DanishVoiceCommand[];
//# sourceMappingURL=danish-commands.d.ts.map