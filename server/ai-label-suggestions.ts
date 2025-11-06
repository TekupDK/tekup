/**
 * AI Label Suggestions Service
 * Intelligently suggests email labels with confidence scores using Friday AI (Gemma 3 27B)
 *
 * Features:
 * - 5 label categories: Lead, Booking, Finance, Support, Newsletter
 * - Confidence scoring (0-100%)
 * - Auto-apply labels >85% confidence
 * - Manual review for <85% confidence
 * - Caches results in database (24-hour TTL)
 *
 * Cost: FREE (uses OpenRouter Gemma 3 27B free tier)
 */

import { and, eq } from "drizzle-orm";
import { emailsInFridayAi } from "../drizzle/schema";
import { invokeLLM, type Message } from "./_core/llm";
import { getDb } from "./db";
import { logger } from "./logger";

// Permanent cache - email content never changes, so cache indefinitely
// Only regenerate if manually requested or if suggestions are missing
const CACHE_TTL_HOURS = Infinity;
const HIGH_CONFIDENCE_THRESHOLD = 85;

export type LabelCategory =
  | "Lead"
  | "Booking"
  | "Finance"
  | "Support"
  | "Newsletter";

export interface LabelSuggestion {
  label: LabelCategory;
  confidence: number; // 0-100
  emoji: string;
  reasoning: string;
}

export interface LabelSuggestionsResult {
  suggestions: LabelSuggestion[];
  generatedAt: string;
  cached: boolean;
  autoApplied: LabelCategory[]; // Labels that were auto-applied (>85% confidence)
}

/**
 * Check if cached suggestions are still valid
 */
function isCacheValid(generatedAt: string | null): boolean {
  if (!generatedAt) return false;

  const cacheTime = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

  return hoursDiff < CACHE_TTL_HOURS;
}

/**
 * Get emoji for label category
 */
function getLabelEmoji(label: LabelCategory): string {
  const emojiMap: Record<LabelCategory, string> = {
    Lead: "🟢",
    Booking: "🔵",
    Finance: "🟡",
    Support: "🔴",
    Newsletter: "🟣",
  };
  return emojiMap[label];
}

/**
 * Generate label suggestions using Friday AI (Gemma 3 27B)
 */
async function generateLabelSuggestions(
  emailSubject: string,
  emailBody: string,
  fromEmail: string
): Promise<LabelSuggestion[]> {
  try {
    // Prepare prompt for Friday AI with structured output
    const messages: Message[] = [
      {
        role: "system",
        content: `Du er Friday, en AI assistent der kategoriserer emails for en dansk virksomhed (rendetalje.dk - rengøring og vedligeholdelse).

Analyser emailen og foreslå relevante labels med confidence score (0-100%):

**Label Kategorier:**
- Lead 🟢: Nye kunder, forespørgsler, potentielle leads
- Booking 🔵: Kalenderaftaler, tidsbestilling, møder
- Finance 🟡: Fakturaer, betalinger, økonomi, Billy.dk
- Support 🔴: Problemer, klager, supporthenvendelser
- Newsletter 🟣: Nyhedsbreve, marketing, automatiske emails

**Retningslinjer:**
- Confidence >85%: Auto-apply (meget sikker)
- Confidence 70-85%: Foreslå til manual review
- Confidence <70%: Ikke relevant nok

Returner JSON array med objekter:
{
  "label": "Lead" | "Booking" | "Finance" | "Support" | "Newsletter",
  "confidence": 0-100,
  "reasoning": "Kort begrundelse på dansk"
}`,
      },
      {
        role: "user",
        content: `Analyser denne email:

Fra: ${fromEmail}
Emne: ${emailSubject}

${emailBody.slice(0, 1500)}

Returner JSON array med label suggestions.`,
      },
    ];

    // Call Friday AI (Gemma 3 27B) with JSON mode
    const response = await invokeLLM({
      messages,
      maxTokens: 500,
      responseFormat: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response from AI");
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Sometimes AI returns array directly, sometimes wrapped in object
      logger.warn(
        "Failed to parse AI response as JSON, trying to extract array"
      );
      // Try to extract array from text
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Could not extract label suggestions from AI response");
      }
    }

    // Handle both array and object responses
    const suggestionsArray = Array.isArray(parsed)
      ? parsed
      : parsed.suggestions || [];

    // Validate and transform suggestions
    const suggestions: LabelSuggestion[] = suggestionsArray
      .filter((s: any) => {
        const validLabels: LabelCategory[] = [
          "Lead",
          "Booking",
          "Finance",
          "Support",
          "Newsletter",
        ];
        return (
          s.label &&
          validLabels.includes(s.label) &&
          typeof s.confidence === "number" &&
          s.confidence >= 0 &&
          s.confidence <= 100
        );
      })
      .map((s: any) => ({
        label: s.label as LabelCategory,
        confidence: Math.round(s.confidence),
        emoji: getLabelEmoji(s.label),
        reasoning: s.reasoning || "Ingen begrundelse",
      }))
      .sort(
        (a: LabelSuggestion, b: LabelSuggestion) => b.confidence - a.confidence
      ); // Sort by confidence (highest first)

    logger.info(
      `Generated ${suggestions.length} label suggestions with avg confidence ${
        suggestions.reduce((sum, s) => sum + s.confidence, 0) /
          suggestions.length || 0
      }%`
    );

    return suggestions;
  } catch (error) {
    logger.error(`Failed to generate label suggestions: ${error}`);
    throw new Error("Failed to generate label suggestions");
  }
}

/**
 * Get or generate label suggestions for an email
 */
export async function getEmailLabelSuggestions(
  emailId: number,
  userId: number
): Promise<LabelSuggestionsResult> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Fetch email from database
    const [email] = await db
      .select({
        id: emailsInFridayAi.id,
        subject: emailsInFridayAi.subject,
        body: emailsInFridayAi.body,
        text: emailsInFridayAi.text,
        fromEmail: emailsInFridayAi.fromEmail,
        labels: emailsInFridayAi.labels,
        aiLabelSuggestions: emailsInFridayAi.aiLabelSuggestions,
        aiLabelsGeneratedAt: emailsInFridayAi.aiLabelsGeneratedAt,
      })
      .from(emailsInFridayAi)
      .where(
        and(
          eq(emailsInFridayAi.id, emailId),
          eq(emailsInFridayAi.userId, userId)
        )
      )
      .limit(1);

    if (!email) {
      throw new Error("Email not found");
    }

    // Check for valid cached suggestions
    if (email.aiLabelSuggestions && isCacheValid(email.aiLabelsGeneratedAt)) {
      logger.debug(`Using cached label suggestions for emailId=${emailId}`);
      const cached = email.aiLabelSuggestions as any;
      return {
        suggestions: Array.isArray(cached) ? cached : cached.suggestions || [],
        generatedAt: email.aiLabelsGeneratedAt!,
        cached: true,
        autoApplied: [],
      };
    }

    // Generate new suggestions
    const emailBody = email.body || email.text || "";
    if (!emailBody || emailBody.trim().length === 0) {
      logger.debug(
        `Skipping label suggestions for emailId=${emailId}: No body text`
      );
      return {
        suggestions: [],
        generatedAt: new Date().toISOString(),
        cached: false,
        autoApplied: [],
      };
    }

    const suggestions = await generateLabelSuggestions(
      email.subject || "Ingen emne",
      emailBody,
      email.fromEmail || "unknown@example.com"
    );

    const now = new Date().toISOString();

    // Update database with new suggestions
    await db
      .update(emailsInFridayAi)
      .set({
        aiLabelSuggestions: suggestions,
        aiLabelsGeneratedAt: now,
      })
      .where(eq(emailsInFridayAi.id, emailId));

    logger.info(
      `Label suggestions generated and cached for emailId=${emailId}: ${suggestions.length} suggestions`
    );

    return {
      suggestions,
      generatedAt: now,
      cached: false,
      autoApplied: [],
    };
  } catch (error) {
    logger.error(
      `Failed to get label suggestions for emailId=${emailId}: ${error}`
    );
    throw error;
  }
}

/**
 * Apply a suggested label to an email
 * Updates the email's labels field and tracks the application
 */
export async function applyLabelSuggestion(
  emailId: number,
  userId: number,
  label: LabelCategory,
  confidence: number
): Promise<{ success: boolean; currentLabels: string[] }> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Fetch current email labels
    const [email] = await db
      .select({
        id: emailsInFridayAi.id,
        labels: emailsInFridayAi.labels,
      })
      .from(emailsInFridayAi)
      .where(
        and(
          eq(emailsInFridayAi.id, emailId),
          eq(emailsInFridayAi.userId, userId)
        )
      )
      .limit(1);

    if (!email) {
      throw new Error("Email not found");
    }

    // Parse existing labels (stored as text in DB)
    const currentLabelsStr = email.labels || "";
    const currentLabels = currentLabelsStr
      .split(",")
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Add new label if not already present
    if (!currentLabels.includes(label)) {
      currentLabels.push(label);

      // Update database
      await db
        .update(emailsInFridayAi)
        .set({
          labels: currentLabels.join(", "),
        })
        .where(eq(emailsInFridayAi.id, emailId));

      logger.info(
        `Applied label "${label}" to emailId=${emailId} (confidence: ${confidence}%)`
      );
    } else {
      logger.debug(`Label "${label}" already applied to emailId=${emailId}`);
    }

    return {
      success: true,
      currentLabels,
    };
  } catch (error) {
    logger.error(
      `Failed to apply label suggestion for emailId=${emailId}: ${error}`
    );
    throw error;
  }
}

/**
 * Auto-apply high-confidence labels (>85%)
 * Returns list of applied labels
 */
export async function autoApplyHighConfidenceLabels(
  emailId: number,
  userId: number,
  suggestions: LabelSuggestion[]
): Promise<LabelCategory[]> {
  const appliedLabels: LabelCategory[] = [];

  for (const suggestion of suggestions) {
    if (suggestion.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
      try {
        await applyLabelSuggestion(
          emailId,
          userId,
          suggestion.label,
          suggestion.confidence
        );
        appliedLabels.push(suggestion.label);
      } catch (error) {
        logger.error(
          `Failed to auto-apply label "${suggestion.label}" to emailId=${emailId}: ${error}`
        );
      }
    }
  }

  if (appliedLabels.length > 0) {
    logger.info(
      `Auto-applied ${appliedLabels.length} high-confidence labels to emailId=${emailId}: ${appliedLabels.join(", ")}`
    );
  }

  return appliedLabels;
}

/**
 * Batch generate label suggestions for multiple emails
 * Processes in parallel with rate limiting
 */
export async function batchGenerateLabelSuggestions(
  emailIds: number[],
  userId: number,
  options: {
    maxConcurrent?: number;
    skipCached?: boolean;
    autoApply?: boolean;
  } = {}
): Promise<{
  results: Array<{
    emailId: number;
    success: boolean;
    suggestions?: LabelSuggestion[];
    autoApplied?: LabelCategory[];
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
    autoApplied: number;
    totalDurationMs?: number;
    avgDurationMs?: number;
  };
}> {
  const { maxConcurrent = 5, skipCached = true, autoApply = false } = options;

  logger.info(
    `Starting batch label suggestions for ${emailIds.length} emails (maxConcurrent=${maxConcurrent}, skipCached=${skipCached}, autoApply=${autoApply})`
  );

  const results: Array<{
    emailId: number;
    success: boolean;
    suggestions?: LabelSuggestion[];
    autoApplied?: LabelCategory[];
    error?: string;
  }> = [];

  const summary = {
    total: emailIds.length,
    successful: 0,
    failed: 0,
    cached: 0,
    autoApplied: 0,
  };

  const batchStart = Date.now();

  // Process emails in batches to respect rate limits
  for (let i = 0; i < emailIds.length; i += maxConcurrent) {
    const batch = emailIds.slice(i, i + maxConcurrent);

    const batchResults = await Promise.allSettled(
      batch.map(async emailId => {
        try {
          const result = await getEmailLabelSuggestions(emailId, userId);

          if (result.cached && skipCached) {
            return {
              emailId,
              success: true,
              suggestions: result.suggestions,
              cached: true,
            };
          }

          // Auto-apply high-confidence labels if requested
          let autoApplied: LabelCategory[] = [];
          if (autoApply && result.suggestions.length > 0) {
            autoApplied = await autoApplyHighConfidenceLabels(
              emailId,
              userId,
              result.suggestions
            );
          }

          return {
            emailId,
            success: true,
            suggestions: result.suggestions,
            autoApplied: autoApply ? autoApplied : undefined,
            cached: result.cached,
          };
        } catch (error) {
          return {
            emailId,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    // Process batch results
    batchResults.forEach(result => {
      if (result.status === "fulfilled") {
        results.push(result.value);
        if (result.value.success) {
          summary.successful++;
          if (result.value.cached) {
            summary.cached++;
          }
          if (result.value.autoApplied && result.value.autoApplied.length > 0) {
            summary.autoApplied += result.value.autoApplied.length;
          }
        } else {
          summary.failed++;
        }
      } else {
        summary.failed++;
        results.push({
          emailId: batch[batchResults.indexOf(result)],
          success: false,
          error: result.reason?.message || String(result.reason),
        });
      }
    });
  }

  logger.info(
    `Batch label suggestions completed: ${summary.successful}/${summary.total} successful (${summary.cached} cached, ${summary.autoApplied} auto-applied)`
  );

  const totalDurationMs = Date.now() - batchStart;
  const avgDurationMs =
    summary.successful > 0 ? totalDurationMs / summary.successful : 0;
  return { results, summary: { ...summary, totalDurationMs, avgDurationMs } };
}
