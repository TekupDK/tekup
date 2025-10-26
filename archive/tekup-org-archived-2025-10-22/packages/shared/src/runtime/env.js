"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceKeys = getServiceKeys;
exports.getAIKeys = getAIKeys;
exports.requireEnv = requireEnv;
exports.optionalEnv = optionalEnv;
function getServiceKeys() {
    return {
        FLOW_API_URL: process.env.FLOW_API_URL,
        FLOW_API_KEY: process.env.FLOW_API_KEY,
        LEAD_API_URL: process.env.LEAD_API_URL,
        LEAD_API_KEY: process.env.LEAD_API_KEY,
        CRM_API_URL: process.env.CRM_API_URL,
        CRM_API_KEY: process.env.CRM_API_KEY,
        VOICE_API_URL: process.env.VOICE_API_URL,
        VOICE_API_KEY: process.env.VOICE_API_KEY,
        AGENTROOMS_API_URL: process.env.AGENTROOMS_API_URL,
        AGENTROOMS_API_KEY: process.env.AGENTROOMS_API_KEY,
        INBOX_API_URL: process.env.INBOX_API_URL,
        INBOX_API_KEY: process.env.INBOX_API_KEY,
    };
}
function getAIKeys() {
    return {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GEMINI_MODEL: process.env.GEMINI_MODEL,
        GEMINI_TEMPERATURE: process.env.GEMINI_TEMPERATURE,
        GEMINI_MAX_TOKENS: process.env.GEMINI_MAX_TOKENS,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
    };
}
function requireEnv(key) {
    const val = process.env[key];
    if (!val)
        throw new Error(`Missing required env: ${key}`);
    return val;
}
function optionalEnv(key, fallback) {
    return process.env[key] ?? fallback;
}
//# sourceMappingURL=env.js.map