/**
 * Email Gateway Service
 * 
 * Centralized email sending gateway with:
 * - Approval requirements
 * - Dry-run mode enforcement
 * - Quality validation
 * - Rate limiting
 * - Comprehensive logging
 * 
 * ALL email sending should go through this gateway.
 */

import { logger } from "../logger";
import { isLiveMode } from "../config";
import { sendGenericEmail } from "./gmailService";

/**
 * Email quality validation result
 */
interface EmailQualityCheck {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Email send request
 */
export interface EmailSendRequest {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    source: string;           // Which service is sending (e.g., "leadMonitor", "followUp")
    requireApproval?: boolean; // Whether approval is required
    approvedBy?: string;       // Who approved (if applicable)
}

/**
 * Email send result
 */
export interface EmailSendResult {
    success: boolean;
    sent: boolean;
    blocked: boolean;
    reason?: string;
    messageId?: string;
    qualityCheck?: EmailQualityCheck;
}

/**
 * Rate limiting tracker
 */
const rateLimits = new Map<string, { count: number; windowStart: Date }>();

/**
 * Validate email quality
 * 
 * Checks for:
 * - Placeholders ([Ukendt], [X], [Y])
 * - Invalid times (outside business hours)
 * - Missing critical information
 * 
 * @param request Email request to validate
 * @returns Quality check result
 */
function validateEmailQuality(request: EmailSendRequest): EmailQualityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for placeholders
    const placeholderPattern = /\[(?:Ukendt|X|Y|navn|adresse)\]/gi;
    const placeholders = request.body.match(placeholderPattern);
    if (placeholders && placeholders.length > 0) {
        errors.push(`Indeholder placeholders: ${placeholders.join(", ")}`);
    }

    // Check for after-hours times
    const afterHoursPattern = /kl\.\s*(1[8-9]|2[0-3]|0[0-7]):[0-5][0-9]/g;
    const afterHoursTimes = request.body.match(afterHoursPattern);
    if (afterHoursTimes && afterHoursTimes.length > 0) {
        errors.push(`Indeholder tider uden for åbningstid: ${afterHoursTimes.join(", ")}`);
    }

    // Check for missing recipient name
    if (!request.body.includes("Hej ") || request.body.includes("Hej !")) {
        warnings.push("Email mangler modtagers navn");
    }

    // Check for very short body
    if (request.body.length < 100) {
        warnings.push("Email er meget kort (< 100 tegn)");
    }

    // Check subject line
    if (!request.subject || request.subject.length < 5) {
        errors.push("Emne-linje er tom eller for kort");
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Check rate limit for email sending
 * 
 * Limits:
 * - Max 10 emails per 5 minutes per source
 * - Max 50 emails per hour total
 * 
 * @param source Source service name
 * @returns True if within rate limit
 */
function checkRateLimit(source: string): boolean {
    const now = new Date();
    const windowMinutes = 5;
    const maxPerWindow = 10;

    // Get or create rate limit tracker
    let tracker = rateLimits.get(source);
    if (!tracker || (now.getTime() - tracker.windowStart.getTime()) > windowMinutes * 60 * 1000) {
        tracker = { count: 0, windowStart: now };
        rateLimits.set(source, tracker);
    }

    // Check limit
    if (tracker.count >= maxPerWindow) {
        logger.warn(
            { source, count: tracker.count, windowStart: tracker.windowStart },
            "🚫 Rate limit exceeded"
        );
        return false;
    }

    // Increment counter
    tracker.count++;
    return true;
}

/**
 * Send email through gateway
 * 
 * This is the ONLY function that should be used to send emails.
 * 
 * @param request Email send request
 * @returns Send result
 */
export async function sendEmailThroughGateway(
    request: EmailSendRequest
): Promise<EmailSendResult> {
    logger.info(
        {
            to: request.to,
            source: request.source,
            requireApproval: request.requireApproval,
            isLiveMode,
        },
        "📬 Email send request received"
    );

    // 1. Check if in live mode
    if (!isLiveMode) {
        logger.info(
            { to: request.to, source: request.source },
            "[DRY-RUN] Would send email"
        );
        return {
            success: true,
            sent: false,
            blocked: false,
            reason: "Dry-run mode - email not sent",
        };
    }

    // 2. Check approval requirement
    if (request.requireApproval && !request.approvedBy) {
        logger.warn(
            { to: request.to, source: request.source },
            "🚫 Email blocked - approval required"
        );
        return {
            success: false,
            sent: false,
            blocked: true,
            reason: "Approval required but not provided",
        };
    }

    // 3. Validate email quality
    const qualityCheck = validateEmailQuality(request);
    if (!qualityCheck.isValid) {
        logger.error(
            { to: request.to, source: request.source, errors: qualityCheck.errors },
            "🚫 Email blocked - quality validation failed"
        );
        return {
            success: false,
            sent: false,
            blocked: true,
            reason: `Quality validation failed: ${qualityCheck.errors.join("; ")}`,
            qualityCheck,
        };
    }

    // Log warnings (but don't block)
    if (qualityCheck.warnings.length > 0) {
        logger.warn(
            { to: request.to, source: request.source, warnings: qualityCheck.warnings },
            "⚠️ Email quality warnings"
        );
    }

    // 4. Check rate limit
    if (!checkRateLimit(request.source)) {
        logger.error(
            { to: request.to, source: request.source },
            "🚫 Email blocked - rate limit exceeded"
        );
        return {
            success: false,
            sent: false,
            blocked: true,
            reason: "Rate limit exceeded (max 10 emails per 5 minutes)",
        };
    }

    // 5. Send email
    try {
        await sendGenericEmail({
            to: request.to,
            subject: request.subject,
            body: request.body,
            threadId: request.threadId,
        });

        logger.info(
            { to: request.to, source: request.source },
            "✅ Email sent successfully"
        );

        return {
            success: true,
            sent: true,
            blocked: false,
            qualityCheck,
        };
    } catch (error) {
        logger.error(
            { error, to: request.to, source: request.source },
            "❌ Email send failed"
        );
        return {
            success: false,
            sent: false,
            blocked: false,
            reason: error instanceof Error ? error.message : "Unknown error",
            qualityCheck,
        };
    }
}

/**
 * Clear rate limit for a source (for testing)
 */
export function clearRateLimitForSource(source: string): void {
    rateLimits.delete(source);
    logger.info({ source }, "Rate limit cleared");
}

/**
 * Get rate limit status for a source
 */
export function getRateLimitStatus(source: string): {
    count: number;
    windowStart: Date | null;
    remaining: number;
} {
    const tracker = rateLimits.get(source);
    const maxPerWindow = 10;

    if (!tracker) {
        return {
            count: 0,
            windowStart: null,
            remaining: maxPerWindow,
        };
    }

    return {
        count: tracker.count,
        windowStart: tracker.windowStart,
        remaining: Math.max(0, maxPerWindow - tracker.count),
    };
}
