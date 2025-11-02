export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // OpenAI API - Direct integration (no Manus)
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  // Optional: Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  // Google Workspace
  googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? "",
  googleImpersonatedUser:
    process.env.GOOGLE_IMPERSONATED_USER ?? "info@rendetalje.dk",
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID ?? "",
  // Billy.dk
  billyApiKey: process.env.BILLY_API_KEY ?? "",
  billyOrganizationId: process.env.BILLY_ORGANIZATION_ID ?? "",
};
