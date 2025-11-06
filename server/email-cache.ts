/**
 * Email Caching Utilities
 *
 * Cache Gmail threads to database in background
 */

import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { emails, emailThreads } from "../drizzle/schema";
import type { GmailThread } from "./google-api";

/**
 * Generate threadKey from email metadata (same as webhook)
 */
function generateThreadKey(from: string, to: string, subject: string): string {
  const normalizedSubject = subject
    ? subject
        .replace(/^(re:|fwd?:|fw:)/i, "")
        .trim()
        .toLowerCase()
    : "";
  const key = `${from.toLowerCase()}:${to.toLowerCase()}:${normalizedSubject}`;
  return createHash("sha256").update(key).digest("hex").substring(0, 32);
}

/**
 * Cache Gmail threads to database (background job)
 */
export async function cacheEmailsToDatabase(
  threads: GmailThread[],
  userId: number,
  db: any
): Promise<void> {
  try {
    for (const thread of threads) {
      if (!thread.messages || thread.messages.length === 0) continue;

      const firstMessage = thread.messages[0];
      const threadKey = generateThreadKey(
        firstMessage.from || "",
        firstMessage.to || "",
        thread.subject || ""
      );

      // Check if thread already exists
      let emailThreadId: number | null = null;
      const [existingThread] = await db
        .select()
        .from(emailThreads)
        .where(eq(emailThreads.gmailThreadId, thread.id))
        .limit(1)
        .execute();

      if (existingThread) {
        emailThreadId = existingThread.id;
      } else {
        // Create email thread
        const threadResult = await db
          .insert(emailThreads)
          .values({
            userId,
            gmailThreadId: thread.id,
            subject: thread.subject || null,
            snippet: thread.snippet || null,
            labels: (thread.labels || []) as any,
            lastMessageAt: firstMessage.date
              ? new Date(firstMessage.date).toISOString()
              : new Date().toISOString(),
            isRead: !thread.unread,
          })
          .returning();

        emailThreadId = threadResult[0].id;
      }

      // Insert each message as an email
      for (const message of thread.messages) {
        const providerId = `gmail-${message.id}`;

        // Check if email already exists
        const [existingEmail] = await db
          .select()
          .from(emails)
          .where(eq(emails.providerId, providerId))
          .limit(1)
          .execute();

        if (existingEmail) {
          continue; // Skip if already exists
        }

        // Insert email
        await db
          .insert(emails)
          .values({
            userId,
            providerId,
            fromEmail: message.from || "",
            toEmail: message.to || "",
            subject: message.subject || thread.subject || null,
            text: message.body || null,
            html: null, // Gmail API doesn't provide HTML separately
            receivedAt: message.date
              ? new Date(message.date).toISOString()
              : new Date().toISOString(),
            threadKey,
            customerId: null, // Will be set by enrichment
            emailThreadId,
          })
          .returning();
      }
    }
  } catch (error) {
    console.error("[Email Cache] Error caching emails:", error);
    throw error;
  }
}
