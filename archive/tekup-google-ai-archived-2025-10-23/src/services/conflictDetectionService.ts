/**
 * Conflict Detection Service
 * 
 * Analyzes emails for conflict indicators and determines appropriate escalation
 */

import { logger } from "../logger";
import {
    ConflictDetectionResult,
    ConflictSeverity,
    MatchedKeyword,
    CONFLICT_KEYWORDS,
} from "../types/conflict";

/**
 * Analyze email text for conflict indicators
 * 
 * @param emailText Email body text to analyze
 * @returns Conflict detection result with severity and recommendations
 */
export function analyzeEmailForConflict(emailText: string): ConflictDetectionResult {
    const normalizedText = emailText.toLowerCase();
    const matchedKeywords: MatchedKeyword[] = [];
    let totalScore = 0;

    // Search for keywords in each severity category
    for (const category of CONFLICT_KEYWORDS) {
        for (const keyword of category.keywords) {
            const keywordLower = keyword.toLowerCase();
            let position = normalizedText.indexOf(keywordLower);

            while (position !== -1) {
                // Extract context (50 chars before and after)
                const contextStart = Math.max(0, position - 50);
                const contextEnd = Math.min(emailText.length, position + keyword.length + 50);
                const context = emailText.substring(contextStart, contextEnd);

                matchedKeywords.push({
                    keyword,
                    severity: category.severity,
                    context: context.trim(),
                    position,
                });

                totalScore += category.weight;

                // Look for next occurrence
                position = normalizedText.indexOf(keywordLower, position + 1);
            }
        }
    }

    // Determine overall severity based on highest matched keyword
    let overallSeverity: ConflictSeverity = "none";
    if (matchedKeywords.length > 0) {
        const severities = matchedKeywords.map((m) => m.severity);
        if (severities.includes("critical")) overallSeverity = "critical";
        else if (severities.includes("high")) overallSeverity = "high";
        else if (severities.includes("medium")) overallSeverity = "medium";
        else if (severities.includes("low")) overallSeverity = "low";
    }

    // Determine recommended action
    const recommendedAction = getRecommendedAction(overallSeverity, totalScore);
    const requiresApproval = overallSeverity !== "none";
    const autoEscalate = overallSeverity === "critical" || overallSeverity === "high";

    const result: ConflictDetectionResult = {
        hasConflict: matchedKeywords.length > 0,
        severity: overallSeverity,
        score: totalScore,
        matchedKeywords,
        recommendedAction,
        requiresApproval,
        autoEscalate,
    };

    if (result.hasConflict) {
        logger.warn(
            {
                severity: overallSeverity,
                score: totalScore,
                keywordCount: matchedKeywords.length,
                keywords: matchedKeywords.map((m) => m.keyword),
            },
            "⚠️ Conflict detected in email"
        );
    }

    return result;
}

/**
 * Get recommended action based on severity and score
 */
function getRecommendedAction(
    severity: ConflictSeverity,
    score: number
): ConflictDetectionResult["recommendedAction"] {
    if (severity === "critical" || score >= 100) {
        return "escalate_to_jonas";
    }
    if (severity === "high" || score >= 50) {
        return "escalate_to_jonas";
    }
    if (severity === "medium" || score >= 25) {
        return "escalate_to_human";
    }
    if (severity === "low" || score >= 10) {
        return "respond_carefully";
    }
    return "monitor";
}

/**
 * Calculate conflict risk level (0-100)
 * 
 * @param result Conflict detection result
 * @returns Risk level percentage
 */
export function calculateConflictRisk(result: ConflictDetectionResult): number {
    const baseScore = result.score;
    const keywordMultiplier = Math.min(result.matchedKeywords.length * 5, 20); // Max +20%

    const riskScore = baseScore + keywordMultiplier;

    // Cap at 100
    return Math.min(riskScore, 100);
}

/**
 * Check if email should block AI auto-response
 * 
 * @param result Conflict detection result
 * @returns True if AI should not auto-respond
 */
export function shouldBlockAutoResponse(result: ConflictDetectionResult): boolean {
    return result.requiresApproval || result.autoEscalate;
}

/**
 * Get human-readable conflict summary
 * 
 * @param result Conflict detection result
 * @returns Formatted summary
 */
export function getConflictSummary(result: ConflictDetectionResult): string {
    if (!result.hasConflict) {
        return "✅ No conflict detected";
    }

    const emoji =
        result.severity === "critical"
            ? "🚨"
            : result.severity === "high"
                ? "⚠️"
                : result.severity === "medium"
                    ? "⚡"
                    : "💡";

    const uniqueKeywords = [...new Set(result.matchedKeywords.map((m) => m.keyword))];

    return `${emoji} ${result.severity.toUpperCase()} severity conflict (score: ${result.score})
Keywords: ${uniqueKeywords.join(", ")}
Action: ${result.recommendedAction.replace(/_/g, " ").toUpperCase()}`;
}

/**
 * Analyze multiple emails in batch
 * 
 * @param emails Array of email texts
 * @returns Array of conflict detection results
 */
export function analyzeEmailBatch(emails: string[]): ConflictDetectionResult[] {
    logger.info({ count: emails.length }, "🔍 Analyzing email batch for conflicts");

    const results = emails.map((email) => analyzeEmailForConflict(email));

    const conflictCount = results.filter((r) => r.hasConflict).length;
    const criticalCount = results.filter((r) => r.severity === "critical").length;

    logger.info(
        {
            total: emails.length,
            conflicts: conflictCount,
            critical: criticalCount,
        },
        "Batch analysis complete"
    );

    return results;
}

/**
 * Test conflict detection with sample texts
 * 
 * @returns Test results
 */
export function testConflictDetection(): {
    test: string;
    result: ConflictDetectionResult;
}[] {
    const testCases = [
        "Tak for tilbuddet, det ser fint ud!",
        "Jeg er lidt skuffet over prisen, men OK.",
        "Dette er helt uacceptabelt! Jeg er meget utilfreds.",
        "Jeg kontakter min advokat hvis ikke dette løses NU!",
        "Jeg sender jer en inkassosag hvis jeg ikke får pengene tilbage.",
    ];

    return testCases.map((test) => ({
        test,
        result: analyzeEmailForConflict(test),
    }));
}
