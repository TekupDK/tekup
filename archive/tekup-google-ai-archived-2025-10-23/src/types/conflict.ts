/**
 * Conflict Detection Types
 * 
 * Defines severity levels, keywords, and detection results for customer conflicts
 */

/**
 * Conflict severity levels
 */
export type ConflictSeverity = "none" | "low" | "medium" | "high" | "critical";

/**
 * Conflict keywords by severity level (Danish)
 */
export interface ConflictKeywords {
    severity: ConflictSeverity;
    keywords: string[];
    weight: number; // Score weight for this severity
}

/**
 * Conflict keyword categories
 */
export const CONFLICT_KEYWORDS: ConflictKeywords[] = [
    {
        severity: "critical",
        weight: 100,
        keywords: [
            "inkasso",
            "inkassosag",
            "advokat",
            "politianmeldelse",
            "politianmeldt",
            "sagsøge",
            "sagsøger",
            "retssag",
            "bedrageri",
            "forbrugerombudsmand",
            "anmeldelse til politiet",
        ],
    },
    {
        severity: "high",
        weight: 50,
        keywords: [
            "klage",
            "klager",
            "utilfreds",
            "utilfredse",
            "chikane",
            "uacceptabelt",
            "uacceptabel",
            "skandaløst",
            "skandaløs",
            "svindel",
            "svindler",
            "fup",
            "kriminelt",
            "kriminel",
            "respektløs",
            "uforskammet",
            "uduelig",
            "inkompetent",
            "horribelt",
            "katastrofe",
        ],
    },
    {
        severity: "medium",
        weight: 25,
        keywords: [
            "skuffet",
            "skuffende",
            "frustreret",
            "frustrerende",
            "irriteret",
            "irriterende",
            "pinligt",
            "pinlig",
            "dårlig service",
            "ringe service",
            "uprofessionelt",
            "uprofessionel",
            "ubehageligt",
            "ked af det",
            "sur",
            "vred",
            "arrig",
            "utilfredsstillende",
        ],
    },
    {
        severity: "low",
        weight: 10,
        keywords: [
            "uheldigt",
            "uheldig",
            "ærgerligt",
            "ærgerlig",
            "ikke tilfreds",
            "ikke særlig tilfreds",
            "lidt skuffet",
            "mindre tilfreds",
            "havde forventet",
            "forventede mere",
            "kunne være bedre",
        ],
    },
];

/**
 * Matched keyword with context
 */
export interface MatchedKeyword {
    keyword: string;
    severity: ConflictSeverity;
    context: string; // Surrounding text (50 chars before/after)
    position: number; // Position in text
}

/**
 * Conflict detection result
 */
export interface ConflictDetectionResult {
    hasConflict: boolean;
    severity: ConflictSeverity;
    score: number; // Weighted conflict score
    matchedKeywords: MatchedKeyword[];
    recommendedAction: "monitor" | "respond_carefully" | "escalate_to_human" | "escalate_to_jonas";
    requiresApproval: boolean; // AI responses need manual approval
    autoEscalate: boolean; // Auto-escalate to Jonas
}

/**
 * Escalation notification data
 */
export interface EscalationNotification {
    leadId: string;
    customerEmail: string;
    customerName?: string;
    threadId: string;
    severity: ConflictSeverity;
    conflictScore: number;
    matchedKeywords: string[];
    emailSnippet: string;
    escalatedAt: Date;
    escalatedBy: "system" | "manual";
    notificationSent: boolean;
    jonasNotified: boolean;
}

/**
 * De-escalation template configuration
 */
export interface DeescalationTemplate {
    severity: ConflictSeverity;
    tone: "empathetic" | "apologetic" | "professional" | "urgent";
    includeJonasContact: boolean;
    offerCompensation: boolean;
    requiresApproval: boolean;
}

/**
 * De-escalation templates by severity
 */
export const DEESCALATION_TEMPLATES: Record<ConflictSeverity, DeescalationTemplate> = {
    none: {
        severity: "none",
        tone: "professional",
        includeJonasContact: false,
        offerCompensation: false,
        requiresApproval: false,
    },
    low: {
        severity: "low",
        tone: "empathetic",
        includeJonasContact: false,
        offerCompensation: false,
        requiresApproval: true,
    },
    medium: {
        severity: "medium",
        tone: "apologetic",
        includeJonasContact: false,
        offerCompensation: false,
        requiresApproval: true,
    },
    high: {
        severity: "high",
        tone: "apologetic",
        includeJonasContact: true,
        offerCompensation: true,
        requiresApproval: true,
    },
    critical: {
        severity: "critical",
        tone: "urgent",
        includeJonasContact: true,
        offerCompensation: false, // Don't admit fault in critical cases
        requiresApproval: true, // ALWAYS requires approval
    },
};

/**
 * Conflict statistics
 */
export interface ConflictStatistics {
    totalConflicts: number;
    bySeverity: Record<ConflictSeverity, number>;
    escalatedToJonas: number;
    resolved: number;
    pending: number;
    averageResolutionTime: number; // In hours
}
