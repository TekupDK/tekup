"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossBusinessVoiceService = exports.DanishVoiceProcessorService = exports.GeminiLiveIntegrationService = exports.TenantAwareVoiceService = exports.GeminiLiveService = void 0;
// Core Voice Services
var gemini_live_service_1 = require("./gemini-live.service");
Object.defineProperty(exports, "GeminiLiveService", { enumerable: true, get: function () { return gemini_live_service_1.GeminiLiveService; } });
var tenant_aware_service_1 = require("./tenant-aware.service");
Object.defineProperty(exports, "TenantAwareVoiceService", { enumerable: true, get: function () { return tenant_aware_service_1.TenantAwareVoiceService; } });
var gemini_live_integration_service_1 = require("./gemini-live-integration.service");
Object.defineProperty(exports, "GeminiLiveIntegrationService", { enumerable: true, get: function () { return gemini_live_integration_service_1.GeminiLiveIntegrationService; } });
// Danish Voice Services
var danish_voice_processor_service_1 = require("./danish-voice-processor.service");
Object.defineProperty(exports, "DanishVoiceProcessorService", { enumerable: true, get: function () { return danish_voice_processor_service_1.DanishVoiceProcessorService; } });
var cross_business_voice_service_1 = require("./cross-business-voice.service");
Object.defineProperty(exports, "CrossBusinessVoiceService", { enumerable: true, get: function () { return cross_business_voice_service_1.CrossBusinessVoiceService; } });
// Types
__exportStar(require("./types/voice.types"), exports);
__exportStar(require("./types/tenant.types"), exports);
// Functions
__exportStar(require("./functions/tekup-functions"), exports);
// Commands
__exportStar(require("./commands/danish-commands"), exports);
// Danish Language Configuration
__exportStar(require("./danish-language-model.config"), exports);
// Business Voice Workflows
__exportStar(require("./workflows/business-voice-workflows"), exports);
//# sourceMappingURL=index.js.map