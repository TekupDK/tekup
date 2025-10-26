export interface ServiceKeys {
    FLOW_API_URL?: string;
    FLOW_API_KEY?: string;
    LEAD_API_URL?: string;
    LEAD_API_KEY?: string;
    CRM_API_URL?: string;
    CRM_API_KEY?: string;
    VOICE_API_URL?: string;
    VOICE_API_KEY?: string;
    AGENTROOMS_API_URL?: string;
    AGENTROOMS_API_KEY?: string;
    INBOX_API_URL?: string;
    INBOX_API_KEY?: string;
}
export interface AIKeys {
    GEMINI_API_KEY?: string;
    GEMINI_MODEL?: string;
    GEMINI_TEMPERATURE?: string;
    GEMINI_MAX_TOKENS?: string;
    ANTHROPIC_API_KEY?: string;
    CLAUDE_API_KEY?: string;
}
export declare function getServiceKeys(): ServiceKeys;
export declare function getAIKeys(): AIKeys;
export declare function requireEnv(key: string): string;
export declare function optionalEnv(key: string, fallback?: string): string | undefined;
//# sourceMappingURL=env.d.ts.map