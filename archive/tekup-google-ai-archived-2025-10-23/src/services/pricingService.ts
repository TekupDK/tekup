/**
 * Pricing Service
 * 
 * KRITISK REGEL fra MEMORY_1, MEMORY_14:
 * - Timepris: 349 kr/time inkl. moms
 * - Beregning: Personer × Timer = Arbejdstimer × 349kr
 * - Format: "2 personer, 3 timer = 6 arbejdstimer = 2.094 kr"
 * - Estimater baseret på m² og opgavetype
 * 
 * Fra MEMORY_15 (Market Intelligence):
 * - Ideal: >80m² komplekse opgaver
 * - Undgå: <50m² simple opgaver (for dyr vs konkurrence)
 */

import { logger } from "../logger";

/**
 * Standard hourly rate including VAT
 */
export const HOURLY_RATE = 349; // kr inkl. moms

/**
 * Price estimate for a cleaning job
 */
export interface PriceEstimate {
    sqm: number;
    taskType: string;
    workers: number;              // Number of workers
    hoursOnSite: number;          // Hours each worker will be on site
    workHoursTotal: number;       // Total work hours (workers × hoursOnSite)
    priceMin: number;             // Minimum price estimate
    priceMax: number;             // Maximum price estimate (with +1h buffer)
    priceFormatted: string;       // Human-readable format
    hourlyRate: number;           // Current hourly rate
    marketFit: "ideal" | "good" | "marginal" | "poor"; // Market positioning
    warnings?: string[];          // Any warnings about this quote
}

/**
 * Task type definitions with estimated cleaning speeds
 * Speed = m² per hour per person
 */
const TASK_TYPES = {
    flytterengøring: {
        keywords: ["flytte", "moving", "flytterengøring"],
        speed: 20, // m² per hour per person
        description: "Flytterengøring",
    },
    dybderengøring: {
        keywords: ["dybde", "deep", "grundig", "stor"],
        speed: 15, // m² per hour per person
        description: "Dybderengøring",
    },
    fast: {
        keywords: ["fast", "ugentlig", "weekly", "recurring", "løbende"],
        speed: 30, // m² per hour per person
        description: "Fast rengøring",
    },
    almindelig: {
        keywords: ["almindelig", "normal", "standard", "engangsgøring"],
        speed: 25, // m² per hour per person
        description: "Almindelig rengøring",
    },
    erhverv: {
        keywords: ["erhverv", "kontor", "office", "business", "commercial"],
        speed: 35, // m² per hour per person
        description: "Erhvervsrengøring",
    },
    vindue: {
        keywords: ["vindue", "window", "vinduespolering"],
        speed: 100, // m² per hour per person (fast task)
        description: "Vinduespudsning",
    },
};

/**
 * Determine task type from description
 * 
 * @param taskDescription - Task description from lead
 * @returns Matching task type config
 */
function determineTaskType(taskDescription: string) {
    const lowerDesc = taskDescription.toLowerCase();

    for (const [key, config] of Object.entries(TASK_TYPES)) {
        if (config.keywords.some((keyword) => lowerDesc.includes(keyword))) {
            return { key, ...config };
        }
    }

    // Default to almindelig
    return { key: "almindelig", ...TASK_TYPES.almindelig };
}

/**
 * Determine number of workers based on size and task type
 * 
 * Business logic:
 * - Small (<60m²): 1 person
 * - Medium (60-100m²): 2 persons
 * - Large (>100m²): 2 persons
 * - Flytterengøring: Always 2 persons if >50m²
 * 
 * @param sqm - Square meters
 * @param taskTypeKey - Task type key
 * @returns Number of workers
 */
function determineWorkers(sqm: number, taskTypeKey: string): number {
    // Flytterengøring usually needs 2 persons
    if (taskTypeKey === "flytterengøring" && sqm > 50) {
        return 2;
    }

    // General rules
    if (sqm < 60) return 1;
    if (sqm <= 100) return 2;
    return 2; // Could be 3 for very large, but 2 is standard
}

/**
 * Estimate cleaning job price
 * 
 * @param sqm - Square meters to clean
 * @param taskDescription - Description of cleaning task
 * @returns Price estimate with all details
 */
export function estimateCleaningJob(
    sqm: number,
    taskDescription: string
): PriceEstimate {
    // Validate inputs
    if (sqm <= 0 || sqm > 1000) {
        logger.warn({ sqm }, "Unusual square meter value");
    }

    // Determine task type
    const taskType = determineTaskType(taskDescription);

    // Determine number of workers
    const workers = determineWorkers(sqm, taskType.key);

    // Calculate hours based on speed
    // Hours = sqm / (speed × workers)
    let hoursOnSite = sqm / (taskType.speed * workers);

    // Round up to nearest 0.5 hour
    hoursOnSite = Math.ceil(hoursOnSite * 2) / 2;

    // Minimum 2 hours per job
    hoursOnSite = Math.max(hoursOnSite, 2);

    // Calculate total work hours
    const workHoursTotal = workers * hoursOnSite;

    // Calculate price range
    // Min: Exact estimated work hours
    // Max: Estimated + 1 hour buffer per worker
    const priceMin = workHoursTotal * HOURLY_RATE;
    const priceMax = (workHoursTotal + workers) * HOURLY_RATE;

    // Format nicely
    const priceFormatted = `${workers} personer, ${hoursOnSite} timer = ${workHoursTotal} arbejdstimer = ca.${priceMin.toLocaleString("da-DK")}-${priceMax.toLocaleString("da-DK")}kr inkl. moms`;

    // Determine market fit (fra MEMORY_15)
    let marketFit: "ideal" | "good" | "marginal" | "poor";
    const warnings: string[] = [];

    if (sqm >= 80 && taskType.key !== "almindelig") {
        marketFit = "ideal"; // Large complex jobs
    } else if (sqm >= 60) {
        marketFit = "good"; // Medium sized
    } else if (sqm >= 50) {
        marketFit = "marginal"; // Small but acceptable
        warnings.push("⚠️ Small job - consider suggesting recurring service");
    } else {
        marketFit = "poor"; // Too small, not profitable
        warnings.push("⚠️ Very small job - may be too expensive vs competition");
        warnings.push("💡 Suggest: Package deal or recurring service for better value");
    }

    // Additional warnings for specific cases
    if (taskType.key === "vindue" && sqm < 100) {
        warnings.push("⚠️ Vinduespudsning: Minimum pris gælder");
    }

    if (taskType.key === "erhverv" && priceMax > 10000) {
        warnings.push("⚠️ Large erhverv job - consider custom quote");
    }

    const estimate: PriceEstimate = {
        sqm,
        taskType: taskType.description,
        workers,
        hoursOnSite,
        workHoursTotal,
        priceMin,
        priceMax,
        priceFormatted,
        hourlyRate: HOURLY_RATE,
        marketFit,
        warnings: warnings.length > 0 ? warnings : undefined,
    };

    logger.debug(
        {
            sqm,
            taskType: taskType.description,
            workers,
            hoursOnSite,
            workHoursTotal,
            priceRange: `${priceMin}-${priceMax}`,
            marketFit,
        },
        "💰 Price estimate calculated"
    );

    return estimate;
}

/**
 * Format price estimate for display
 * 
 * @param estimate - Price estimate to format
 * @param includeWarnings - Include warnings in output
 * @returns Formatted string
 */
export function formatPriceEstimate(
    estimate: PriceEstimate,
    includeWarnings: boolean = true
): string {
    const parts: string[] = [];

    parts.push(`💰 PRISESTIMAT - ${estimate.taskType}`);
    parts.push("");
    parts.push(`📏 Størrelse: ${estimate.sqm}m²`);
    parts.push(`👥 Medarbejdere: ${estimate.workers} personer`);
    parts.push(`⏱️  Estimeret tid: ${estimate.hoursOnSite} timer på stedet`);
    parts.push(`💼 Arbejdstimer total: ${estimate.workHoursTotal} timer`);
    parts.push(`💵 Timepris: ${estimate.hourlyRate}kr/time/person inkl. moms`);
    parts.push("");
    parts.push(`💰 PRIS: ca.${estimate.priceMin.toLocaleString("da-DK")}-${estimate.priceMax.toLocaleString("da-DK")}kr`);
    parts.push("");
    parts.push(`📊 Market fit: ${estimate.marketFit}`);

    if (includeWarnings && estimate.warnings && estimate.warnings.length > 0) {
        parts.push("");
        parts.push("⚠️  ADVARSLER:");
        for (const warning of estimate.warnings) {
            parts.push(`   ${warning}`);
        }
    }

    return parts.join("\n");
}

/**
 * Compare two price estimates
 * 
 * Useful for showing value of recurring vs one-time service
 * 
 * @param estimate1 - First estimate
 * @param estimate2 - Second estimate
 * @returns Comparison text
 */
export function comparePriceEstimates(
    estimate1: PriceEstimate,
    estimate2: PriceEstimate
): string {
    const diff = estimate2.priceMin - estimate1.priceMin;
    const diffPercent = ((diff / estimate1.priceMin) * 100).toFixed(1);

    const parts: string[] = [];

    parts.push(`📊 PRISSAMMENLIGNING`);
    parts.push("");
    parts.push(`1️⃣ ${estimate1.taskType}: ${estimate1.priceMin.toLocaleString("da-DK")}-${estimate1.priceMax.toLocaleString("da-DK")}kr`);
    parts.push(`2️⃣ ${estimate2.taskType}: ${estimate2.priceMin.toLocaleString("da-DK")}-${estimate2.priceMax.toLocaleString("da-DK")}kr`);
    parts.push("");

    if (diff > 0) {
        parts.push(`📈 Forskel: +${Math.abs(diff).toLocaleString("da-DK")}kr (${diffPercent}% dyrere)`);
    } else if (diff < 0) {
        parts.push(`📉 Forskel: -${Math.abs(diff).toLocaleString("da-DK")}kr (${Math.abs(parseFloat(diffPercent))}% billigere)`);
    } else {
        parts.push(`✅ Samme pris`);
    }

    return parts.join("\n");
}

/**
 * Calculate monthly cost for recurring service
 * 
 * @param estimate - Base price estimate
 * @param frequency - Times per month
 * @returns Monthly cost
 */
export function calculateMonthlyCost(
    estimate: PriceEstimate,
    frequency: number
): {
    monthlyCost: number;
    monthlyCostFormatted: string;
    pricePerVisit: number;
    frequency: number;
} {
    const pricePerVisit = (estimate.priceMin + estimate.priceMax) / 2; // Average
    const monthlyCost = pricePerVisit * frequency;

    return {
        monthlyCost,
        monthlyCostFormatted: `${monthlyCost.toLocaleString("da-DK")}kr/måned (${frequency}x gange)`,
        pricePerVisit: Math.round(pricePerVisit),
        frequency,
    };
}
