/**
 * AI Email Summary Service
 * Generates concise summaries for emails using Friday AI (Gemma 3 27B)
 *
 * Features:
 * - Smart summaries for emails >200 words
 * - Max 150 characters, professional tone
 * - Skips newsletters, spam, and automated emails
 * - Caches results in database (24-hour TTL)
 *
 * Cost: FREE (uses OpenRouter Gemma 3 27B free tier)
 */

import { and, eq } from "drizzle-orm";
import { emailsInFridayAi } from "../drizzle/schema";
import { invokeLLM, type Message } from "./_core/llm";
import { getDb } from "./db";
import { logger } from "./logger";

const SUMMARY_MIN_WORDS = 200;
const SUMMARY_MAX_CHARS = 150;
// Permanent cache - email content never changes, so cache indefinitely
// Only regenerate if manually requested or if summary is missing
const CACHE_TTL_HOURS = Infinity;

export interface EmailSummaryResult {
  summary: string;
  generatedAt: string;
  cached: boolean;
}

/**
 * Count words in text (simple approximation)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Check if email should be skipped for summarization
 */
function shouldSkipEmail(email: {
  body: string | null;
  text: string | null;
  fromEmail: string | null;
  subject: string | null;
  labels?: string | null;
}): boolean {
  // Use body or text field
  const emailBody = email.body || email.text || "";

  // Skip if no body text
  if (!emailBody || emailBody.trim().length === 0) {
    return true;
  }

  // Skip short emails
  if (countWords(emailBody) < SUMMARY_MIN_WORDS) {
    return true;
  }

  // Skip newsletters (common patterns)
  const lowerBody = emailBody.toLowerCase();
  const lowerSubject = email.subject?.toLowerCase() || "";
  const fromEmail = email.fromEmail?.toLowerCase() || "";

  const newsletterPatterns = [
    "unsubscribe",
    "nyhedsbrev",
    "newsletter",
    "no-reply",
    "noreply",
    "do-not-reply",
  ];

  if (
    newsletterPatterns.some(
      pattern =>
        lowerBody.includes(pattern) ||
        lowerSubject.includes(pattern) ||
        fromEmail.includes(pattern)
    )
  ) {
    return true;
  }

  // Skip if labeled as newsletter or spam (labels is stored as text in DB)
  const labelsStr = email.labels?.toLowerCase() || "";
  if (labelsStr.includes("newsletter") || labelsStr.includes("spam")) {
    return true;
  }

  return false;
}

/**
 * Check if cached summary is still valid
 */
function isCacheValid(generatedAt: string | null): boolean {
  if (!generatedAt) return false;

  const cacheTime = new Date(generatedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

  return hoursDiff < CACHE_TTL_HOURS;
}

/**
 * Generate email summary using Friday AI (Gemma 3 27B)
 */
async function generateSummary(
  emailBody: string,
  subject: string
): Promise<string> {
  try {
    // Prepare prompt for Friday AI
    const messages: Message[] = [
      {
        role: "system",
        content:
          "Du er Friday, en AI assistent der hjælper med at opsummere emails. Opret korte, præcise sammendrag på dansk i professionel tone. Max 150 tegn.",
      },
      {
        role: "user",
        content: `Opsummer denne email i maksimalt 150 tegn på dansk:

Emne: ${subject}

${emailBody.slice(0, 2000)}`, // Limit to first 2000 chars to save tokens
      },
    ];

    // Call Friday AI (Gemma 3 27B) via LLM infrastructure
    const response = await invokeLLM({
      messages,
      maxTokens: 100, // Summary should be short
    });

    const summary = response.choices[0]?.message?.content;

    if (typeof summary !== "string" || !summary.trim()) {
      throw new Error("Invalid summary response from AI");
    }

    // Truncate to max length if needed
    let finalSummary = summary.trim();
    if (finalSummary.length > SUMMARY_MAX_CHARS) {
      finalSummary = finalSummary.slice(0, SUMMARY_MAX_CHARS - 3) + "...";
    }

    logger.info(
      `Generated email summary: ${finalSummary.length} chars from ${countWords(emailBody)} words`
    );

    return finalSummary;
  } catch (error) {
    logger.error(`Failed to generate email summary: ${error}`);
    throw new Error("Failed to generate summary");
  }
}

/**
 * Get or generate email summary
 * Returns cached summary if available and valid, otherwise generates new one
 */
export async function getEmailSummary(
  emailId: number,
  userId: number
): Promise<EmailSummaryResult> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Fetch email from database
    const [email] = await db
      .select({
        id: emailsInFridayAi.id,
        body: emailsInFridayAi.body,
        text: emailsInFridayAi.text,
        subject: emailsInFridayAi.subject,
        fromEmail: emailsInFridayAi.fromEmail,
        labels: emailsInFridayAi.labels,
        aiSummary: emailsInFridayAi.aiSummary,
        aiSummaryGeneratedAt: emailsInFridayAi.aiSummaryGeneratedAt,
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

    // Check if we should skip this email
    if (shouldSkipEmail(email)) {
      logger.debug(
        `Skipping email summary generation for emailId=${emailId}: Email too short or newsletter`
      );
      return {
        summary: "",
        generatedAt: new Date().toISOString(),
        cached: false,
      };
    }

    // Check for valid cached summary
    if (email.aiSummary && isCacheValid(email.aiSummaryGeneratedAt)) {
      logger.debug(`Using cached email summary for emailId=${emailId}`);
      return {
        summary: email.aiSummary,
        generatedAt: email.aiSummaryGeneratedAt!,
        cached: true,
      };
    }

    // Generate new summary
    const emailBody = email.body || email.text || "";
    const summary = await generateSummary(
      emailBody,
      email.subject || "Ingen emne"
    );

    const now = new Date().toISOString();

    // Update database with new summary
    await db
      .update(emailsInFridayAi)
      .set({
        aiSummary: summary,
        aiSummaryGeneratedAt: now,
      })
      .where(eq(emailsInFridayAi.id, emailId));

    logger.info(
      `Email summary generated and cached for emailId=${emailId}: ${summary.length} chars`
    );

    return {
      summary,
      generatedAt: now,
      cached: false,
    };
  } catch (error) {
    logger.error(
      `Failed to get email summary for emailId=${emailId}: ${error}`
    );
    throw error;
  }
}

/**
 * Batch generate summaries for multiple emails
 * Useful for processing existing emails or bulk operations
 */
export async function batchGenerateSummaries(
  emailIds: number[],
  userId: number,
  options: {
    maxConcurrent?: number;
    skipCached?: boolean;
  } = {}
): Promise<{
  processed: number;
  skipped: number;
  errors: number;
  totalDurationMs?: number;
  avgDurationMs?: number;
}> {
  const { maxConcurrent = 5, skipCached = true } = options;

  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
  };

  const batchStart = Date.now();

  // Process in batches to avoid rate limits
  for (let i = 0; i < emailIds.length; i += maxConcurrent) {
    const batch = emailIds.slice(i, i + maxConcurrent);

    const promises = batch.map(async emailId => {
      try {
        const result = await getEmailSummary(emailId, userId);
        if (result.cached && skipCached) {
          results.skipped++;
        } else {
          results.processed++;
        }
      } catch (error) {
        logger.error(
          `Failed to generate summary in batch for emailId=${emailId}: ${error}`
        );
        results.errors++;
      }
    });

    await Promise.all(promises);

    // Rate limiting: Wait 1 second between batches
    if (i + maxConcurrent < emailIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info(
    `Batch summary generation complete: ${results.processed} processed, ${results.skipped} skipped, ${results.errors} errors (total: ${emailIds.length})`
  );

  const totalDurationMs = Date.now() - batchStart;
  const avgDurationMs =
    results.processed > 0 ? totalDurationMs / results.processed : 0;

  return { ...results, totalDurationMs, avgDurationMs };
}
