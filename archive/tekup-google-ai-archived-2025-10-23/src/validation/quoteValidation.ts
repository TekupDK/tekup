/**
 * Quote Validation Service
 * 
 * Ensures all quotes contain critical information to prevent conflicts.
 * Based on learnings from MEMORY_5 (Cecilie/Amalie conflicts).
 * 
 * CRITICAL RULE from MEMORY_5:
 * "Ring til BESTILLER ved +1t overskridelse (IKKE +3-5t!)"
 */

import { logger } from "../logger";

export interface QuoteValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    missingElements: string[];
}

export interface QuoteValidationRequirement {
    keyword: string | string[]; // Can be single keyword or alternatives
    reason: string;
    severity: "error" | "warning";
    category: "pricing" | "communication" | "format";
}

/**
 * MANDATORY elements for ALL quotes
 * Based on Cecilie/Amalie learnings (MEMORY_5, MEMORY_11, MEMORY_14)
 */
const REQUIRED_QUOTE_ELEMENTS: QuoteValidationRequirement[] = [
    {
        keyword: ["arbejdstimer", "arbejdstimer total"],
        reason: "Skal vise TOTAL arbejdstimer (personer × timer), ikke kun timer på stedet",
        severity: "error",
        category: "pricing"
    },
    {
        keyword: ["personer", "medarbejdere"],
        reason: "Skal angive antal medarbejdere - mangler dette = Cecilie inkasso situation",
        severity: "error",
        category: "pricing"
    },
    {
        keyword: ["+1 time", "+1 timer", "1 time ekstra", "1 time over"],
        reason: "Skal angive +1t overtids-regel (IKKE +3-5t!)",
        severity: "error",
        category: "communication"
    },
    {
        keyword: ["ringer", "kontakter", "ringer vi"],
        reason: "Skal love at ringe/kontakte ved overskridelse",
        severity: "error",
        category: "communication"
    },
    {
        keyword: ["kun faktisk", "faktisk tidsforbrug", "faktisk tid"],
        reason: "Skal forklare betaling for faktisk tidsforbrug",
        severity: "error",
        category: "communication"
    },
    {
        keyword: ["349", "349kr"],
        reason: "Skal bruge korrekt timepris (349kr, ikke gamle priser)",
        severity: "error",
        category: "pricing"
    },
    {
        keyword: ["m²", "m2", "kvadratmeter"],
        reason: "Skal angive boligens størrelse",
        severity: "warning",
        category: "format"
    }
];

/**
 * Forbidden patterns that indicate wrong information
 */
const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
    {
        pattern: /\+[3-5]\s*timer?/i,
        reason: "FORKERT: Må IKKE sige +3-5 timer! Skal være +1 time!"
    },
    {
        pattern: /250[-\s]?300\s*kr/i,
        reason: "FORKERT: Gamle priser (250-300kr) - skal bruge 349kr!"
    },
    {
        pattern: /300\s*kr\/time/i,
        reason: "FORKERT: Gammel pris (300kr) - skal bruge 349kr!"
    }
];

/**
 * Validate a quote email body for completeness
 * 
 * @param quoteBody - The email body text
 * @returns Validation result with errors, warnings, and missing elements
 */
export function validateQuoteCompleteness(quoteBody: string): QuoteValidationResult {
    const lowerBody = quoteBody.toLowerCase();
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingElements: string[] = [];

    // Check for required elements
    for (const requirement of REQUIRED_QUOTE_ELEMENTS) {
        const keywords = Array.isArray(requirement.keyword)
            ? requirement.keyword
            : [requirement.keyword];

        const found = keywords.some(keyword => lowerBody.includes(keyword.toLowerCase()));

        if (!found) {
            const message = `❌ ${requirement.reason}`;

            if (requirement.severity === "error") {
                errors.push(message);
                missingElements.push(requirement.category);
            } else {
                warnings.push(message);
            }
        }
    }

    // Check for forbidden patterns
    for (const forbidden of FORBIDDEN_PATTERNS) {
        if (forbidden.pattern.test(quoteBody)) {
            errors.push(`🚫 ${forbidden.reason}`);
        }
    }

    // Log validation result
    if (errors.length > 0) {
        logger.warn(
            {
                errors,
                warnings,
                missingElements,
                bodyPreview: quoteBody.substring(0, 100)
            },
            "❌ Quote validation FAILED"
        );
    } else if (warnings.length > 0) {
        logger.info(
            { warnings, bodyPreview: quoteBody.substring(0, 100) },
            "⚠️ Quote has warnings"
        );
    } else {
        logger.info({ bodyPreview: quoteBody.substring(0, 100) }, "✅ Quote validation PASSED");
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        missingElements: Array.from(new Set(missingElements))
    };
}

/**
 * Generate a validation report for display
 */
export function formatValidationReport(result: QuoteValidationResult): string {
    if (result.valid && result.warnings.length === 0) {
        return "✅ Tilbud er komplet og klar til afsendelse";
    }

    const lines: string[] = [];

    if (!result.valid) {
        lines.push("❌ TILBUD ER IKKE KOMPLET - KAN FØRE TIL CECILIE/AMALIE SITUATION!");
        lines.push("");
        lines.push("MANGLER:");
        for (const error of result.errors) {
            lines.push(`  ${error}`);
        }
    }

    if (result.warnings.length > 0) {
        lines.push("");
        lines.push("⚠️ ADVARSLER:");
        for (const warning of result.warnings) {
            lines.push(`  ${warning}`);
        }
    }

    return lines.join("\n");
}

/**
 * Check if quote contains work hours calculation
 * (persons × hours = total work hours)
 */
export function hasWorkHoursCalculation(quoteBody: string): boolean {
    // Look for patterns like:
    // "2 personer, 4 timer = 8 arbejdstimer"
    // "2 × 4 = 8 arbejdstimer"
    const pattern = /(\d+)\s*[×x]\s*(\d+)\s*=\s*(\d+)\s*arbejdstimer/i;
    return pattern.test(quoteBody);
}

/**
 * Extract price range from quote
 */
export function extractPriceRange(quoteBody: string): { min: number; max: number } | null {
    // Look for patterns like:
    // "ca.2.792-3.490kr"
    // "2792-3490 kr"
    const pattern = /ca\.?\s*(\d{1,3}(?:[.,]\d{3})*)\s*-\s*(\d{1,3}(?:[.,]\d{3})*)\s*kr/i;
    const match = quoteBody.match(pattern);

    if (match) {
        const min = parseInt(match[1].replace(/[.,]/g, ""), 10);
        const max = parseInt(match[2].replace(/[.,]/g, ""), 10);
        return { min, max };
    }

    return null;
}

/**
 * Validate that price calculation is correct
 * (349kr × work hours = price)
 */
export function validatePriceCalculation(
    workers: number,
    hoursOnSite: number,
    priceMin: number,
    priceMax: number
): boolean {
    const HOURLY_RATE = 349;
    const workHoursTotal = workers * hoursOnSite;

    const expectedMin = workHoursTotal * HOURLY_RATE;
    const expectedMax = (workHoursTotal + workers) * HOURLY_RATE; // +1 hour buffer

    // Allow 10% margin for rounding
    const minValid = Math.abs(priceMin - expectedMin) < expectedMin * 0.1;
    const maxValid = Math.abs(priceMax - expectedMax) < expectedMax * 0.1;

    return minValid && maxValid;
}
