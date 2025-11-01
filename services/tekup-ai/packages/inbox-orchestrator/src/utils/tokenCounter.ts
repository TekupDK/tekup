/**
 * Token Counter Utilities for Friday AI
 *
 * Estimates token count for prompts and responses.
 * Rough estimation: ~4 characters = 1 token (conservative estimate for English/Danish mixed content)
 */

/**
 * Estimate token count from text
 * Uses conservative estimate: 1 token ≈ 4 characters
 * For Gemini: More accurate for mixed language content
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;

  // Conservative estimate: Danish text uses more tokens than English
  // Using 3.5 chars per token for mixed Danish/English content
  const charsPerToken = 3.5;
  return Math.ceil(text.length / charsPerToken);
}

/**
 * Count tokens in a prompt structure
 */
export function countPromptTokens(prompt: string): number {
  return estimateTokens(prompt);
}

/**
 * Calculate total tokens for a request (prompt + response)
 */
export function calculateTotalTokens(prompt: string, response: string): number {
  return estimateTokens(prompt) + estimateTokens(response);
}

/**
 * Estimate cost (DKK) based on token usage
 * Gemini Pro pricing (approximate):
 * - Input: ~0.00005 DKK per 1K tokens
 * - Output: ~0.00015 DKK per 1K tokens
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number
): number {
  const inputCostPer1K = 0.00005;
  const outputCostPer1K = 0.00015;

  const inputCost = (inputTokens / 1000) * inputCostPer1K;
  const outputCost = (outputTokens / 1000) * outputCostPer1K;

  return inputCost + outputCost;
}

/**
 * Check if prompt exceeds recommended limits
 */
export function validatePromptSize(
  prompt: string,
  maxTokens: number = 4000
): {
  valid: boolean;
  tokens: number;
  warning?: string;
} {
  const tokens = estimateTokens(prompt);

  if (tokens > maxTokens) {
    return {
      valid: false,
      tokens,
      warning: `Prompt exceeds ${maxTokens} tokens (${tokens}). Consider reducing context.`,
    };
  }

  if (tokens > maxTokens * 0.8) {
    return {
      valid: true,
      tokens,
      warning: `Prompt is close to limit (${tokens}/${maxTokens} tokens).`,
    };
  }

  return {
    valid: true,
    tokens,
  };
}
