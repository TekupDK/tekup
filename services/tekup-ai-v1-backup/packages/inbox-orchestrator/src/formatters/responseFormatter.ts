/**
 * Response Formatter for Friday AI
 *
 * Centralized formatting functions with token-aware formatting.
 * Enables consistent structure across all responses.
 */

import { estimateTokens } from "../utils/tokenCounter";
import {
  formatAvailableSlots,
  formatBookingConfirmation,
  formatCalendarTasks,
  formatLeadSummary,
  formatNextSteps,
  formatQuote,
} from "./responseTemplates";

/**
 * Format response with token awareness
 * Automatically shortens if approaching token limits
 */
export function formatResponse(
  sections: Array<{ type: string; content: string; priority?: number }>,
  maxTokens?: number
): string {
  const sortedSections = sections.sort(
    (a, b) => (b.priority || 0) - (a.priority || 0)
  );

  let output = "";
  let totalTokens = 0;

  for (const section of sortedSections) {
    const sectionTokens = estimateTokens(section.content);

    if (maxTokens && totalTokens + sectionTokens > maxTokens) {
      // Skip lower priority sections if we're approaching limit
      if (section.priority && section.priority < 5) {
        continue;
      }
      // Truncate if necessary
      const remainingTokens = maxTokens - totalTokens;
      const maxChars = remainingTokens * 3.5; // Approximate chars per token
      output += section.content.substring(0, maxChars) + "...\n";
      break;
    }

    output += section.content + "\n\n";
    totalTokens += sectionTokens;
  }

  return output.trim();
}

/**
 * Re-export template functions for convenience
 */
export {
  formatAvailableSlots,
  formatBookingConfirmation,
  formatCalendarTasks,
  formatLeadSummary,
  formatNextSteps,
  formatQuote,
};
