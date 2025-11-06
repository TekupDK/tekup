/**
 * Inbound Email Webhook Handler
 *
 * This endpoint receives parsed email data from the inbound-email SMTP server
 * and stores it in the database with enrichment.
 */

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { attachments, emails, emailThreads } from "../../drizzle/schema";
import { getDb } from "../db";
import { enrichEmailFromSources } from "../email-enrichment";

const ENV = process.env;
const STORAGE_PATH = ENV.INBOUND_STORAGE_PATH || "./storage/attachments";
const WEBHOOK_SECRET = ENV.INBOUND_EMAIL_WEBHOOK_SECRET;

/**
 * Generate threadKey from email headers for grouping
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
 * Store attachment to local filesystem
 */
async function storeAttachment(
  data: string,
  filename: string
): Promise<string> {
  // Ensure storage directory exists
  if (!existsSync(STORAGE_PATH)) {
    await mkdir(STORAGE_PATH, { recursive: true });
  }

  // Decode base64 data
  const buffer = Buffer.from(data, "base64");

  // Generate unique filename to avoid conflicts
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storageFilename = `${timestamp}_${safeFilename}`;
  const storagePath = join(STORAGE_PATH, storageFilename);

  // Write file
  await writeFile(storagePath, buffer);

  return storageFilename;
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) {
    // If no secret configured, skip verification (development mode)
    // Log warning in production
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[InboundEmail] ⚠️  WEBHOOK_SECRET not configured - skipping verification"
      );
    }
    return true;
  }

  // Get signature from header (standard format: "sha256=...")
  const signatureHeader = req.headers["x-webhook-signature"] as string;
  if (!signatureHeader) {
    console.error("[InboundEmail] Missing signature header");
    return false;
  }

  // Extract signature value (remove "sha256=" prefix if present)
  const signature = signatureHeader.replace(/^sha256=/, "");

  // Get raw request body as string
  // Note: Express json() middleware may have already parsed body
  // We need the raw body - for now, use stringified version
  // TODO: Consider using express.raw() middleware for webhook route
  const bodyString =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  // Calculate expected HMAC
  const expectedSignature = createHmac("sha256", WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("[InboundEmail] Signature length mismatch");
      return false;
    }

    const isEqual = timingSafeEqual(signatureBuffer, expectedBuffer);

    if (!isEqual) {
      console.error("[InboundEmail] Signature verification failed");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[InboundEmail] Error verifying signature:", error);
    return false;
  }
}

/**
 * Handle incoming email webhook from inbound-email server
 */
export async function handleInboundEmail(req: Request, res: Response) {
  console.log("[InboundEmail] Webhook called");
  console.log("[InboundEmail] Method:", req.method);
  console.log("[InboundEmail] Body type:", typeof req.body);
  console.log(
    "[InboundEmail] Body keys:",
    req.body ? Object.keys(req.body) : "no body"
  );

  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error("[InboundEmail] Webhook signature verification failed");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const body = req.body;
    console.log("[InboundEmail] Body:", JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.from || !body.to || !body.messageId) {
      console.error("[InboundEmail] Validation failed:", {
        hasFrom: !!body.from,
        hasTo: !!body.to,
        hasMessageId: !!body.messageId,
        bodyKeys: Object.keys(body || {}),
      });
      return res.status(400).json({
        error: "Missing required fields: from, to, messageId",
        received: {
          from: body?.from || null,
          to: body?.to || null,
          messageId: body?.messageId || null,
        },
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Extract email data
    const providerId = `inbound-${body.messageId}`;
    const threadKey = generateThreadKey(body.from, body.to, body.subject || "");

    // Get or create user (for now, use first user or default userId = 1)
    // TODO: Get userId from context or email account mapping
    const userId = 1; // This should be determined from email account

    // Insert email into database
    const emailResult = await db
      .insert(emails)
      .values({
        userId,
        providerId,
        fromEmail: body.from || "",
        toEmail: body.to || "",
        subject: body.subject || null,
        text: body.text || null,
        html: body.html || null,
        receivedAt: new Date(body.receivedAt || Date.now()).toISOString(),
        threadKey,
        customerId: null, // Will be set by enrichment
        emailThreadId: null, // Will be linked after enrichment
      })
      .returning();

    const emailId = emailResult[0].id;

    // Handle attachments
    const attachmentIds: number[] = [];
    if (body.attachments && Array.isArray(body.attachments)) {
      for (const attachment of body.attachments) {
        try {
          const storageKey = await storeAttachment(
            attachment.data,
            attachment.filename
          );

          const attachmentResult = await db
            .insert(attachments)
            .values({
              emailId,
              filename: attachment.filename,
              mimeType: attachment.contentType || null,
              size: attachment.size || null,
              // drizzle schema uses storageUrl (text)
              storageUrl: storageKey,
            })
            .returning();

          attachmentIds.push(attachmentResult[0].id);
        } catch (error) {
          console.error(
            `[InboundEmail] Failed to store attachment ${attachment.filename}:`,
            error
          );
          // Continue processing even if attachment fails
        }
      }
    }

    // Try to link to existing emailThread or create new one
    // This is a simplified version - full implementation would check threadKey
    let emailThreadId: number | null = null;
    if (threadKey) {
      // Check if thread exists by searching for emails with same threadKey
      const existingEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadKey, threadKey))
        .limit(1)
        .execute();

      if (existingEmails.length > 0 && existingEmails[0].emailThreadId) {
        emailThreadId = existingEmails[0].emailThreadId;
      } else {
        // Create new emailThread entry
        const threadResult = await db
          .insert(emailThreads)
          .values({
            userId,
            gmailThreadId: threadKey, // Using threadKey as gmailThreadId for now
            subject: body.subject || null,
            snippet: body.text?.substring(0, 200) || body.snippet || null,
            labels: [],
            lastMessageAt: new Date(
              body.receivedAt || Date.now()
            ).toISOString(),
            isRead: false,
          })
          .returning();

        emailThreadId = threadResult[0].id;
      }

      // Update email with threadId
      await db
        .update(emails)
        .set({ emailThreadId })
        .where(eq(emails.id, emailId))
        .execute();
    }

    // Run enrichment pipeline asynchronously (don't await)
    enrichEmailFromSources(emailId, db).catch(error => {
      console.error(
        `[InboundEmail] Enrichment failed for email ${emailId}:`,
        error
      );
    });

    return res.status(200).json({
      success: true,
      emailId,
      threadId: emailThreadId,
      attachmentCount: attachmentIds.length,
    });
  } catch (error) {
    console.error("[InboundEmail] Error processing email:", error);
    return res.status(500).json({
      error: "Failed to process email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
