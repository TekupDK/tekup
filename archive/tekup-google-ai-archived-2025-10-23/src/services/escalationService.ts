/**
 * Escalation Service
 * 
 * Handles escalation of conflicts to Jonas with notifications and tracking
 */

import { logger } from "../logger";
import { prisma } from "./databaseService";
import { sendGenericEmail } from "./gmailService";
import { applyLabelToThread } from "./labelService";
import {
    ConflictDetectionResult,
    EscalationNotification,
} from "../types/conflict";
import { isLiveMode, isEscalationEnabled } from "../config";

/**
 * Escalate conflict to Jonas
 * 
 * @param leadId Lead ID
 * @param threadId Gmail thread ID
 * @param customerEmail Customer email
 * @param conflictResult Conflict detection result
 * @param escalatedBy Who triggered escalation
 * @returns Escalation notification result
 */
export async function escalateToJonas(
    leadId: string,
    threadId: string,
    customerEmail: string,
    conflictResult: ConflictDetectionResult,
    escalatedBy: "system" | "manual" = "system"
): Promise<EscalationNotification> {
    logger.warn(
        {
            leadId,
            threadId,
            customerEmail,
            severity: conflictResult.severity,
            score: conflictResult.score,
        },
        "🚨 Escalating conflict to Jonas"
    );

    // Get lead details
    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { customer: true },
    });

    const customerName = lead?.name || lead?.customer?.name || "Kunde";

    // Apply "conflict" label to thread
    try {
        await applyLabelToThread(threadId, "conflict");
        logger.info({ threadId }, "Applied 'conflict' label to thread");
    } catch (error) {
        logger.error({ error, threadId }, "Failed to apply conflict label");
    }

    // Generate escalation notification
    const notification: EscalationNotification = {
        leadId,
        customerEmail,
        customerName,
        threadId,
        severity: conflictResult.severity,
        conflictScore: conflictResult.score,
        matchedKeywords: conflictResult.matchedKeywords.map((m) => m.keyword),
        emailSnippet: conflictResult.matchedKeywords[0]?.context || "",
        escalatedAt: new Date(),
        escalatedBy,
        notificationSent: false,
        jonasNotified: false,
    };

    // Send notification email to Jonas
    try {
        await sendEscalationNotification(notification);
        notification.notificationSent = true;
        notification.jonasNotified = true;
        logger.info({ leadId }, "✅ Escalation notification sent to Jonas");
    } catch (error) {
        logger.error({ error, leadId }, "Failed to send escalation notification");
    }

    // Track escalation in database
    try {
        await prisma.escalation.create({
            data: {
                leadId,
                customerEmail,
                customerName,
                threadId,
                severity: conflictResult.severity,
                conflictScore: conflictResult.score,
                matchedKeywords: conflictResult.matchedKeywords.map((k) => k.keyword),
                emailSnippet: conflictResult.matchedKeywords[0]?.context || "",
                escalatedBy,
                jonasNotified: notification.jonasNotified,
            },
        });
        logger.info({ leadId }, "Escalation tracked in database");
    } catch (error) {
        logger.error({ error, leadId }, "Failed to track escalation in database");
    }

    return notification;
}

/**
 * Send escalation notification email to Jonas
 */
async function sendEscalationNotification(
    notification: EscalationNotification
): Promise<void> {
    const severityEmoji =
        notification.severity === "critical"
            ? "🚨"
            : notification.severity === "high"
                ? "⚠️"
                : "⚡";

    const subject = `${severityEmoji} KONFLIKT: ${notification.customerName} - ${notification.severity.toUpperCase()}`;

    const body = `
Hej Jonas,

Der er registreret en ${notification.severity} konflikt med en kunde, som kræver din opmærksomhed.

═══════════════════════════════════════
📧 KUNDE INFORMATION
═══════════════════════════════════════

Navn:           ${notification.customerName}
Email:          ${notification.customerEmail}
Lead ID:        ${notification.leadId}
Thread ID:      ${notification.threadId}

═══════════════════════════════════════
⚠️  KONFLIKT DETALJER
═══════════════════════════════════════

Alvorlighed:    ${notification.severity.toUpperCase()}
Konflikt Score: ${notification.conflictScore}
Eskaleret af:   ${notification.escalatedBy === "system" ? "Automatisk system" : "Manuel"}
Tidspunkt:      ${notification.escalatedAt.toLocaleString("da-DK")}

Matchede nøgleord:
${notification.matchedKeywords.map((k) => `  • ${k}`).join("\n")}

═══════════════════════════════════════
📝 EMAIL UDDRAG
═══════════════════════════════════════

"${notification.emailSnippet}"

═══════════════════════════════════════
🎯 ANBEFALEDE HANDLINGER
═══════════════════════════════════════

${getEscalationRecommendations(notification.severity)}

═══════════════════════════════════════

Åbn Gmail for at se hele tråden og svare kunden.

Dette er en automatisk besked fra RenOS konflikt-system.

Med venlig hilsen,
RenOS AI Assistent
    `.trim();

    // Check if escalation emails are enabled
    if (!isEscalationEnabled()) {
        logger.warn(
            { subject, to: "jonas@rendetalje.dk" },
            "🚫 Escalation notification BLOCKED - ESCALATION_ENABLED=false"
        );
        return;
    }

    if (isLiveMode) {
        // Send to Jonas's email
        await sendGenericEmail({
            to: "jonas@rendetalje.dk", // TODO: Get from config
            subject,
            body,
            threadId: undefined, // New thread for notification
        });
    } else {
        logger.info(
            { subject, to: "jonas@rendetalje.dk" },
            "[DRY-RUN] Would send escalation notification"
        );
        logger.debug({ body }, "Escalation notification body");
    }
}

/**
 * Get escalation recommendations based on severity
 */
function getEscalationRecommendations(severity: string): string {
    const recommendations = {
        critical: `
🚨 KRITISK - HANDLING PÅKRÆVET OMGÅENDE:
  1. Ring til kunden inden for 1 time
  2. Få styr på situationen før den eskalerer yderligere
  3. Involver advokat hvis nødvendigt
  4. Dokumentér alt skriftligt
  5. SEND INGEN AI-GENEREREDE SVAR`,

        high: `
⚠️  HØJ PRIORITET - SVAR INDEN FOR 2 TIMER:
  1. Ring til kunden personligt
  2. Lyt til deres bekymringer
  3. Tilbyd løsning eller kompensation
  4. Følg op skriftligt efter samtale
  5. Overvej rabat eller gratis ekstra service`,

        medium: `
⚡ MODERAT - SVAR INDEN FOR 4 TIMER:
  1. Send personlig undskyldning
  2. Anerkend problemet
  3. Forklar hvad der gik galt
  4. Tilbyd løsning
  5. Følg op for at sikre tilfredshed`,

        low: `
💡 LAV - SVAR INDEN FOR 24 TIMER:
  1. Send venlig besked
  2. Adresser kundens bekymring
  3. Tilbyd at hjælpe
  4. Vær lyttende og imødekommende`,
    };

    return recommendations[severity as keyof typeof recommendations] || recommendations.low;
}

/**
 * Manually escalate a lead
 * 
 * @param leadId Lead ID to escalate
 * @returns Escalation notification
 */
export async function manuallyEscalateLead(leadId: string): Promise<EscalationNotification> {
    logger.info({ leadId }, "📤 Manual escalation requested");

    const lead = await prisma.lead.findUnique({
        where: { id: leadId },
    });

    if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
    }

    if (!lead.emailThreadId) {
        throw new Error(`Lead has no email thread: ${leadId}`);
    }

    // Create a manual conflict result
    const manualConflict: ConflictDetectionResult = {
        hasConflict: true,
        severity: "high",
        score: 50,
        matchedKeywords: [],
        recommendedAction: "escalate_to_jonas",
        requiresApproval: true,
        autoEscalate: true,
    };

    return escalateToJonas(
        leadId,
        lead.emailThreadId,
        lead.email,
        manualConflict,
        "manual"
    );
}

/**
 * Get all active conflicts
 * 
 * @returns Leads with conflict label
 */
export async function getActiveConflicts(): Promise<Array<{
    leadId: string;
    customerEmail: string;
    customerName?: string;
    threadId: string;
    status: string;
    createdAt: Date;
}>> {
    const leads = await prisma.lead.findMany({
        where: {
            status: "conflict",
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    return leads.map((lead) => ({
        leadId: lead.id,
        customerEmail: lead.email,
        customerName: lead.name || undefined,
        threadId: lead.emailThreadId || "",
        status: lead.status,
        createdAt: lead.createdAt,
    }));
}
