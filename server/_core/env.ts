export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // OpenRouter (Gemma 3 27B FREE) - Primary LLM
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterModel: process.env.OPENROUTER_MODEL ?? "google/gemma-3-27b-it:free",
  // Fallback: Ollama for local development
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "",
  ollamaModel: process.env.OLLAMA_MODEL ?? "gemma3:9b",
  // Legacy API keys (disabled)
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // Forge (internal) API for images, data, notifications
  forgeApiUrl: process.env.FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? "",
  // Google Workspace
  googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "",
  googleImpersonatedUser:
    process.env.GOOGLE_IMPERSONATED_USER ?? "info@rendetalje.dk",
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
  // Billy.dk
  billyApiKey: process.env.BILLY_API_KEY ?? "",
  billyOrganizationId: process.env.BILLY_ORGANIZATION_ID ?? "",
  // Inbound email webhook/server integration
  INBOUND_STORAGE_PATH: process.env.INBOUND_STORAGE_PATH ?? "",
  INBOUND_EMAIL_WEBHOOK_SECRET: process.env.INBOUND_EMAIL_WEBHOOK_SECRET ?? "",
};

// Validate required environment variables
function validateEnv() {
  const required = [
    "JWT_SECRET",
    "OWNER_OPEN_ID",
    "DATABASE_URL",
    "VITE_APP_ID",
  ];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(
      `⚠️ [ENV] Missing required environment variables: ${missing.join(", ")}`
    );
    console.warn("📄 Copy env.template.txt to .env and fill in your values");
  }
}

// Run validation on module load
validateEnv();
