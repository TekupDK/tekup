/**
 * Migration Script: Gmail API → Database
 *
 * This script migrates existing emails from Gmail API to our database
 * so that Phase 0 features work with existing data.
 */

import { createHash } from "crypto";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { emails, emailThreads } from "../../drizzle/schema";
import { getDb } from "../db";
import { enrichEmailFromSources } from "../email-enrichment";
import { getGmailThread, searchGmailThreads } from "../google-api";

// Load environment variables from .env.supabase if available, otherwise .env
dotenv.config({ path: ".env.supabase" });
dotenv.config(); // Fallback to .env

interface MigrationStats {
  threadsProcessed: number;
  emailsInserted: number;
  threadsCreated: number;
  errors: string[];
  enriched: number;
}

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
 * Migrate a single Gmail thread to database
 */
async function migrateThread(
  threadId: string,
  userId: number,
  db: any
): Promise<{ emailsInserted: number; threadCreated: boolean; error?: string }> {
  try {
    // Get full thread from Gmail API (direkte Google API, ikke MCP)
    const thread = await getGmailThread(threadId);
    if (!thread || !thread.messages || thread.messages.length === 0) {
      return {
        emailsInserted: 0,
        threadCreated: false,
        error: "No messages in thread",
      };
    }

    // Generate threadKey from first message
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
      .where(eq(emailThreads.gmailThreadId, threadId))
      .limit(1)
      .execute();

    if (existingThread) {
      emailThreadId = existingThread.id;
      console.log(
        `[Migrate] Thread ${threadId} already exists, using existing thread ID ${emailThreadId}`
      );
    } else {
      // Create email thread
      const threadResult = await db
        .insert(emailThreads)
        .values({
          userId,
          gmailThreadId: threadId,
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
      console.log(
        `[Migrate] Created thread ${emailThreadId} for Gmail thread ${threadId}`
      );
    }

    // Insert each message as an email
    let emailsInserted = 0;
    for (const message of thread.messages) {
      // Check if email already exists
      const providerId = `gmail-${message.id}`;
      const [existingEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.providerId, providerId))
        .limit(1)
        .execute();

      if (existingEmail) {
        console.log(`[Migrate] Email ${providerId} already exists, skipping`);
        continue;
      }

      // Insert email
      const emailResult = await db
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

      const emailId = emailResult[0].id;
      emailsInserted++;

      // Run enrichment asynchronously (don't await to speed up migration)
      enrichEmailFromSources(emailId, db).catch(error => {
        console.error(
          `[Migrate] Enrichment failed for email ${emailId}:`,
          error
        );
      });

      console.log(`[Migrate] Inserted email ${emailId} (${providerId})`);
    }

    return { emailsInserted, threadCreated: !existingThread };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Migrate] Error migrating thread ${threadId}:`, errorMsg);
    return { emailsInserted: 0, threadCreated: false, error: errorMsg };
  }
}

/**
 * Main migration function
 */
export async function migrateGmailToDatabase(
  userId: number = 1,
  maxThreads: number = 50
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    threadsProcessed: 0,
    emailsInserted: 0,
    threadsCreated: 0,
    errors: [],
    enriched: 0,
  };

  console.log(
    `\n🚀 Starting Gmail → Database migration (max ${maxThreads} threads)...\n`
  );

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Ensure search_path is set for this connection
  // (getDb should handle this, but double-check for script execution)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    const schema = url.searchParams.get("schema");
    if (schema) {
      // Execute raw SQL to set search_path
      const client = (db as any).client || (db as any)._;
      if (client && typeof client.unsafe === "function") {
        await client.unsafe(`SET search_path TO "${schema}"`);
      }
    }
  }

  try {
    // Fetch threads from Gmail API (direkte Google API, ikke MCP)
    console.log("📧 Fetching threads from Gmail API (direkte)...");
    const threads = await searchGmailThreads({
      query: "in:inbox",
      maxResults: maxThreads,
    });
    console.log(`✅ Found ${threads.length} threads\n`);

    if (threads.length === 0) {
      console.log("⚠️  No threads found in Gmail inbox");
      return stats;
    }

    // Migrate each thread
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      console.log(
        `\n[${i + 1}/${threads.length}] Migrating thread: ${thread.id}`
      );

      const result = await migrateThread(thread.id, userId, db);

      stats.threadsProcessed++;
      stats.emailsInserted += result.emailsInserted;
      if (result.threadCreated) {
        stats.threadsCreated++;
      }
      if (result.error) {
        stats.errors.push(`Thread ${thread.id}: ${result.error}`);
      }

      // Small delay to avoid rate limits
      if (i < threads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log("\n✅ Migration complete!\n");
    console.log("📊 Statistics:");
    console.log(`   Threads processed: ${stats.threadsProcessed}`);
    console.log(`   Threads created: ${stats.threadsCreated}`);
    console.log(`   Emails inserted: ${stats.emailsInserted}`);
    console.log(`   Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n⚠️  Errors encountered:");
      stats.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (stats.errors.length > 5) {
        console.log(`   ... and ${stats.errors.length - 5} more`);
      }
    }

    return stats;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run if called directly
const mainModuleUrl = import.meta.url;
const scriptPath = process.argv[1] || "";
const isMainModule =
  mainModuleUrl.includes("migrate-gmail-to-database") ||
  scriptPath.includes("migrate-gmail-to-database");

if (isMainModule || process.argv.length > 2) {
  const userId = parseInt(process.argv[2] || "1") || 1;
  const maxThreads = parseInt(process.argv[3] || "50") || 50;

  console.log(
    `\n🚀 Starting migration with userId=${userId}, maxThreads=${maxThreads}\n`
  );

  migrateGmailToDatabase(userId, maxThreads)
    .then(stats => {
      console.log("\n✅ Migration script completed");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n❌ Migration script failed:", error);
      process.exit(1);
    });
}
