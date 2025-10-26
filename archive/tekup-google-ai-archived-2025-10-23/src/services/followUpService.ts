/**
 * Follow-up Service
 * 
 * Automatic follow-up emails after 3-5 days if no customer response.
 * Tracks attempts and prevents over-communication.
 * 
 * WORKFLOW:
 * Quote sent → Wait 5 days → Follow-up 1 → Wait 5 days → Follow-up 2 → Wait 5 days → Follow-up 3 → Give up
 */

import { logger } from "../logger";
import { prisma } from "./databaseService";
import { getThreadsByLabel, applyLabelToThread } from "./labelService";
// import { sendGenericEmail, listRecentMessages } from "./gmailService"; // DISABLED - not sending auto follow-ups
import { listRecentMessages } from "./gmailService";
import { getCurrentDateTime, getDaysDifference } from "./dateTimeService";
import { isFollowUpEnabled } from "../config"; // ⚠️ SAFETY: Check env flag before sending
import type {
    FollowUpResult,
    LeadNeedingFollowUp,
} from "../types/followUp";
import {
    FOLLOW_UP_SCHEDULE,
    MAX_FOLLOW_UP_ATTEMPTS,
} from "../types/followUp";

/**
 * Find all leads needing follow-up
 * 
 * Searches for leads with "quote_sent" or "awaiting_response" labels
 * that haven't received a response within the follow-up window.
 * 
 * @returns Array of leads needing follow-up
 */
export async function findLeadsNeedingFollowUp(): Promise<LeadNeedingFollowUp[]> {
    logger.info("🔍 Searching for leads needing follow-up...");

    const currentTime = getCurrentDateTime();
    const leadsNeedingFollowUp: LeadNeedingFollowUp[] = [];

    try {
        // Get threads with "awaiting_response" label
        const awaitingThreads = await getThreadsByLabel("awaiting_response");

        logger.info(
            { threadCount: awaitingThreads.length },
            "Found threads awaiting response"
        );

        // Check each thread
        for (const threadId of awaitingThreads) {
            try {
                // Get lead from database
                const lead = await prisma.lead.findFirst({
                    where: { emailThreadId: threadId },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        emailThreadId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                if (!lead || !lead.email) {
                    logger.warn({ threadId }, "Lead not found or missing email");
                    continue;
                }

                // Get thread messages to find last email date
                const messages = await listRecentMessages({ maxResults: 50 });
                const threadMessages = messages.filter((m) => m.threadId === threadId);

                if (threadMessages.length === 0) {
                    logger.warn({ threadId }, "No messages found in thread");
                    continue;
                }

                // Find last email sent by us (not from customer)
                const lastOutgoingMessage = threadMessages
                    .filter((m) => m.from?.includes("@rendetalje.dk"))
                    .sort((a, b) => {
                        const dateA = a.internalDate ? parseInt(a.internalDate) : 0;
                        const dateB = b.internalDate ? parseInt(b.internalDate) : 0;
                        return dateB - dateA;
                    })[0];

                if (!lastOutgoingMessage || !lastOutgoingMessage.internalDate) {
                    logger.warn({ threadId }, "No outgoing messages found");
                    continue;
                }

                const lastEmailDate = new Date(parseInt(lastOutgoingMessage.internalDate));
                const daysSinceLastEmail = getDaysDifference(
                    new Date(currentTime.timestamp),
                    lastEmailDate
                );

                // TODO: Add followUpAttempts to Lead schema
                const followUpAttempts = 0; // Placeholder until schema updated

                // Determine if follow-up is needed
                const nextAttempt = followUpAttempts + 1;
                const schedule = FOLLOW_UP_SCHEDULE[followUpAttempts];

                if (!schedule) {
                    // Max attempts reached
                    logger.info(
                        { leadId: lead.id, followUpAttempts },
                        "Max follow-up attempts reached"
                    );
                    continue;
                }

                const shouldFollowUp = daysSinceLastEmail >= schedule.daysAfterLastEmail;

                if (shouldFollowUp) {
                    leadsNeedingFollowUp.push({
                        leadId: lead.id,
                        emailThreadId: threadId,
                        customerEmail: lead.email,
                        customerName: lead.name || "kunde",
                        daysSinceLastEmail,
                        followUpAttempts,
                        lastEmailDate: lastEmailDate,
                        nextAttemptNumber: nextAttempt as 1 | 2 | 3,
                        shouldFollowUp: true,
                        reason: `${daysSinceLastEmail} dage siden sidste email (≥${schedule.daysAfterLastEmail} dage)`,
                    });
                }
            } catch (error) {
                logger.error({ error, threadId }, "Error checking thread for follow-up");
            }
        }

        logger.info(
            { totalLeads: leadsNeedingFollowUp.length },
            "✅ Found leads needing follow-up"
        );

        return leadsNeedingFollowUp;
    } catch (error) {
        logger.error({ error }, "Error finding leads needing follow-up");
        return [];
    }
}

/**
 * Generate follow-up email content
 * 
 * @param lead - Lead needing follow-up
 * @param attemptNumber - Which follow-up attempt (1, 2, or 3)
 * @returns Email subject and body
 */
export function generateFollowUpEmail(
    lead: LeadNeedingFollowUp,
    attemptNumber: 1 | 2 | 3
): { subject: string; body: string } {
    const config = FOLLOW_UP_SCHEDULE[attemptNumber - 1];

    const templates = {
        friendly_reminder: {
            subject: `Re: Tilbud på rengøring`,
            body: `Hej ${lead.customerName}!

Jeg følger lige op på mit tilbud fra for et par dage siden.

Har du haft tid til at kigge på det? 😊

Hvis du har spørgsmål eller gerne vil høre mere, er du meget velkommen til at skrive tilbage eller ringe på +45 22 65 02 26.

Vi har stadig ledige tider i næste uge, hvis du er interesseret.

Med venlig hilsen,
Jonas - Rendetalje.dk
📧 info@rendetalje.dk
📞 +45 22 65 02 26`,
        },
        value_add: {
            subject: `Re: Fleksible tider til rengøring?`,
            body: `Hej ${lead.customerName}!

Jeg tænkte jeg ville følge op på mit tidligere tilbud.

Vi er meget fleksible med tidspunkter og kan ofte tilbyde:
• Weekendaftaler
• Aften-booking efter kl. 16
• Hurtig opstart (næste dag muligt)

Har du behov for en anden dato end jeg nævnte i mit tilbud?

Du er også velkommen til at ringe hvis det er nemmere: +45 22 65 02 26

Med venlig hilsen,
Jonas - Rendetalje.dk
📧 info@rendetalje.dk`,
        },
        final_check: {
            subject: `Re: Sidste opfølgning - rengøring`,
            body: `Hej ${lead.customerName}!

Dette er min sidste opfølgning vedrørende rengøring.

Jeg forstår selvfølgelig hvis du har valgt en anden løsning eller har ændret planer - det er helt ok! 😊

Hvis du stadig er interesseret, er du meget velkommen til at kontakte mig:
📞 +45 22 65 02 26
📧 info@rendetalje.dk

Ellers ønsker jeg dig alt godt.

Med venlig hilsen,
Jonas - Rendetalje.dk`,
        },
    };

    const template = templates[config.template];

    return {
        subject: template.subject,
        body: template.body,
    };
}

/**
 * Send follow-up email to a lead
 * 
 * @param lead - Lead to follow up with
 * @returns Follow-up result
 */
export async function sendFollowUp(lead: LeadNeedingFollowUp): Promise<FollowUpResult> {
    logger.info(
        {
            leadId: lead.leadId,
            customerEmail: lead.customerEmail,
            attemptNumber: lead.nextAttemptNumber,
        },
        "📧 Sending follow-up email"
    );

    try {
        // Check if we've exceeded max attempts
        if (lead.followUpAttempts >= MAX_FOLLOW_UP_ATTEMPTS) {
            logger.warn(
                { leadId: lead.leadId, attempts: lead.followUpAttempts },
                "Max follow-up attempts reached - not sending"
            );

            // Move to "follow_up_needed" for manual review
            await applyLabelToThread(
                lead.emailThreadId,
                "follow_up_needed",
                "Max auto follow-ups reached"
            );

            return {
                leadId: lead.leadId,
                customerEmail: lead.customerEmail,
                attemptNumber: lead.nextAttemptNumber,
                sent: false,
                error: "Max attempts reached",
            };
        }

        // Generate follow-up email
        const attemptNumber = lead.nextAttemptNumber as 1 | 2 | 3;
        // const { subject, body } = generateFollowUpEmail(lead, attemptNumber); // DISABLED - not generating emails

        // ❌ DISABLED: Auto-send follow-up emails
        // TODO: Re-enable after implementing approval workflow
        // SAFETY: This was sending automatic follow-ups without any approval
        logger.warn(
            { leadId: lead.leadId, attemptNumber },
            "Follow-up email SKIPPED (auto-send disabled for safety)"
        );

        // Return without sending
        return {
            leadId: lead.leadId,
            customerEmail: lead.customerEmail,
            attemptNumber: lead.nextAttemptNumber,
            sent: false,
            error: "Auto-send disabled for safety - requires manual approval",
        };

        /*
        // Send email - DISABLED
        await sendGenericEmail({
            to: lead.customerEmail,
            subject,
            body,
            threadId: lead.emailThreadId, // Reply to existing thread
        });
        */

        // Update database
        // TODO: Add followUpAttempts and lastFollowUpDate to schema
        await prisma.lead.update({
            where: { id: lead.leadId },
            data: {
                updatedAt: new Date(),
            },
        });

        // Calculate next follow-up date
        const nextSchedule = FOLLOW_UP_SCHEDULE[lead.nextAttemptNumber];
        const nextFollowUpDate = nextSchedule
            ? new Date(Date.now() + nextSchedule.daysAfterLastEmail * 24 * 60 * 60 * 1000)
            : undefined;

        logger.info(
            {
                leadId: lead.leadId,
                attemptNumber: lead.nextAttemptNumber,
                nextFollowUpDate,
            },
            "✅ Follow-up sent successfully"
        );

        return {
            leadId: lead.leadId,
            customerEmail: lead.customerEmail,
            attemptNumber: lead.nextAttemptNumber,
            sent: true,
            nextFollowUpDate,
        };
    } catch (error) {
        logger.error(
            { error, leadId: lead.leadId },
            "❌ Error sending follow-up"
        );

        return {
            leadId: lead.leadId,
            customerEmail: lead.customerEmail,
            attemptNumber: lead.nextAttemptNumber,
            sent: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Send follow-ups to all leads needing them
 * 
 * @param dryRun - If true, only log what would be sent (don't actually send)
 * @returns Array of follow-up results
 */
export async function sendAllFollowUps(dryRun: boolean = false): Promise<FollowUpResult[]> {
    logger.info({ dryRun }, "🚀 Starting follow-up batch send");

    const leadsNeedingFollowUp = await findLeadsNeedingFollowUp();

    if (leadsNeedingFollowUp.length === 0) {
        logger.info("No leads need follow-up at this time");
        return [];
    }

    logger.info(
        { totalLeads: leadsNeedingFollowUp.length, dryRun },
        "Sending follow-ups to leads"
    );

    const results: FollowUpResult[] = [];

    for (const lead of leadsNeedingFollowUp) {
        if (dryRun) {
            logger.info(
                {
                    leadId: lead.leadId,
                    customerEmail: lead.customerEmail,
                    attemptNumber: lead.nextAttemptNumber,
                },
                "🧪 DRY RUN: Would send follow-up"
            );

            results.push({
                leadId: lead.leadId,
                customerEmail: lead.customerEmail,
                attemptNumber: lead.nextAttemptNumber,
                sent: false,
                error: "Dry run - not sent",
            });
        } else {
            const result = await sendFollowUp(lead);
            results.push(result);

            // Small delay between sends
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    const successCount = results.filter((r) => r.sent).length;
    const failCount = results.filter((r) => !r.sent).length;

    logger.info(
        { total: results.length, success: successCount, failed: failCount },
        "✅ Follow-up batch complete"
    );

    return results;
}

/**
 * Get follow-up statistics
 * 
 * @returns Statistics about follow-ups
 */
export async function getFollowUpStatistics(): Promise<{
    awaitingResponse: number;
    needsFollowUp: number;
    attempt1: number;
    attempt2: number;
    attempt3: number;
    maxAttemptsReached: number;
}> {
    const leadsAwaitingResponse = await prisma.lead.count({
        where: {
            status: { in: ["quote-sent", "awaiting-response"] },
        },
    });

    const leadsNeedingFollowUp = await findLeadsNeedingFollowUp();

    const attempt1 = leadsNeedingFollowUp.filter((l) => l.nextAttemptNumber === 1).length;
    const attempt2 = leadsNeedingFollowUp.filter((l) => l.nextAttemptNumber === 2).length;
    const attempt3 = leadsNeedingFollowUp.filter((l) => l.nextAttemptNumber === 3).length;

    // TODO: Add followUpAttempts to schema for accurate tracking
    const maxAttemptsReached = 0;

    return {
        awaitingResponse: leadsAwaitingResponse,
        needsFollowUp: leadsNeedingFollowUp.length,
        attempt1,
        attempt2,
        attempt3,
        maxAttemptsReached,
    };
}
