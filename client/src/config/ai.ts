// Centralized AI config for client-side features (Email Tab, Inbox UI)

export const ACTIVE_AI_MODEL = "gemma-3-27b-free"; // OpenRouter free tier

// Estimated costs per email operation in USD
// Gemma 3 27B Free → $0.00
export const COST_PER_EMAIL = {
  summary: 0, // previously ~$0.00008 with Gemini Flash
  labelSuggestion: 0, // previously ~$0.00012 with Gemini Flash
  // For toolbar aggregate estimate, show per-email baseline if needed
  toolbarEstimatePerEmail: 0, // 0 for Gemma free
} as const;

export function formatEstimatedCost(amount: number): string {
  if (amount <= 0) return "free";
  if (amount < 0.001) return `~$${amount.toFixed(4)}`;
  return `~$${amount.toFixed(3)}`;
}
