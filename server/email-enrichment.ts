/**
 * Email Enrichment Pipeline
 *
 * Enriches incoming emails with customer data, lead source detection,
 * and auto-labeling without using Gmail API.
 */

import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  customerProfiles,
  emailPipelineState,
  emails,
  emailThreads,
} from "../drizzle/schema";
import { searchCustomerByEmail } from "./billy";
import { getDb } from "./db";
import { addLabelToThread } from "./gmail-labels";
import { detectLeadSource } from "./lead-source-detector";

/**
 * Enrich email with customer data, lead source, and auto-labeling
 */
export async function enrichEmailFromSources(
  emailId: number,
  db?: PostgresJsDatabase<any>
): Promise<void> {
  try {
    const database = db || (await getDb());
    if (!database) {
      throw new Error("Database connection not available");
    }

    // Get email record
    const [email] = await database
      .select()
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1)
      .execute();

    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    // 1. Billy contactPersons lookup
    let customerId: number | null = null;
    try {
      if (!email.fromEmail) {
        console.warn("[EmailEnrichment] No fromEmail, skipping Billy lookup");
        return;
      }

      const customer = await searchCustomerByEmail(email.fromEmail);
      if (customer) {
        // Find or create customer profile
        const [existingProfile] = await database
          .select()
          .from(customerProfiles)
          .where(eq(customerProfiles.email, email.fromEmail))
          .limit(1)
          .execute();

        if (existingProfile) {
          customerId = existingProfile.id;
        } else {
          // Create customer profile
          const profileResult = await database
            .insert(customerProfiles)
            .values({
              userId: email.userId,
              email: email.fromEmail,
              name: customer.name || null,
              phone: customer.phone || null,
              billyCustomerId: customer.id || null,
            })
            .returning();

          customerId = profileResult[0].id;
        }

        // Update email with customerId
        await database
          .update(emails)
          .set({ customerId })
          .where(eq(emails.id, emailId))
          .execute();
      }
    } catch (error) {
      console.error(
        `[EmailEnrichment] Billy lookup failed for ${email.fromEmail}:`,
        error
      );
      // Continue even if Billy lookup fails
    }

    // 2. Detect lead source
    const source = detectLeadSource({
      from: email.fromEmail || "",
      to: email.toEmail || "",
      subject: email.subject || "",
      body: email.text || email.html || "",
    });

    // 3. Determine if this is a new lead (not a reply)
    const isNewLead =
      !email.subject?.toLowerCase().startsWith("re:") &&
      !email.subject?.toLowerCase().startsWith("fwd:") &&
      !email.subject?.toLowerCase().startsWith("fw:");

    // 4. Update or create pipeline state
    if (email.threadKey) {
      const [existingState] = await database
        .select()
        .from(emailPipelineState)
        .where(eq(emailPipelineState.threadId, email.threadKey))
        .limit(1)
        .execute();

      if (existingState) {
        // Pipeline state exists - no need to update (source/leadId not in schema)
        console.log(
          `[EmailEnrichment] Pipeline state exists for ${email.threadKey}`
        );
      } else {
        // Create new pipeline state
        await database
          .insert(emailPipelineState)
          .values({
            userId: email.userId,
            threadId: email.threadKey,
            stage: isNewLead ? "needs_action" : "needs_action",
          })
          .execute();
      }
    }

    // 5. Auto-label "Needs Action" for new leads
    if (isNewLead && email.emailThreadId) {
      try {
        // Get thread's gmailThreadId
        const [thread] = await database
          .select()
          .from(emailThreads)
          .where(eq(emailThreads.id, email.emailThreadId))
          .limit(1)
          .execute();

        if (thread && thread.gmailThreadId) {
          // Add "Needs Action" label via Gmail API (labels are still managed via Gmail)
          await addLabelToThread(thread.gmailThreadId, "Needs Action").catch(
            error => {
              console.error(
                `[EmailEnrichment] Failed to add label to thread ${thread.gmailThreadId}:`,
                error
              );
            }
          );
        }
      } catch (error) {
        console.error(
          `[EmailEnrichment] Failed to auto-label email ${emailId}:`,
          error
        );
      }
    }

    // 6. Auto-apply source label if detected
    if (source && email.emailThreadId) {
      try {
        const [thread] = await database
          .select()
          .from(emailThreads)
          .where(eq(emailThreads.id, email.emailThreadId))
          .limit(1)
          .execute();

        if (thread && thread.gmailThreadId) {
          // Map source to label name
          const labelMap: Record<string, string> = {
            rengoring_nu: "Rengøring.nu",
            rengoring_aarhus: "Rengøring Århus",
            adhelp: "AdHelp",
          };

          const labelName = labelMap[source];
          if (labelName) {
            await addLabelToThread(thread.gmailThreadId, labelName).catch(
              error => {
                console.error(
                  `[EmailEnrichment] Failed to add source label ${labelName}:`,
                  error
                );
              }
            );
          }
        }
      } catch (error) {
        console.error(
          `[EmailEnrichment] Failed to add source label for email ${emailId}:`,
          error
        );
      }
    }

    console.log(
      `[EmailEnrichment] ✅ Enriched email ${emailId}: customer=${customerId}, source=${source}, isNewLead=${isNewLead}`
    );
  } catch (error) {
    console.error(
      `[EmailEnrichment] ❌ Failed to enrich email ${emailId}:`,
      error
    );
    throw error;
  }
}
