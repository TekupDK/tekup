/**
 * Follow-up Types & Configuration
 * 
 * Defines follow-up timing, templates, and tracking
 */

/**
 * Follow-up attempt configuration
 */
export interface FollowUpConfig {
    attemptNumber: 1 | 2 | 3;
    daysAfterLastEmail: number;
    template: "friendly_reminder" | "value_add" | "final_check";
    subject: string;
    tone: "friendly" | "professional" | "urgent";
}

/**
 * Follow-up schedule
 * 
 * After quote sent:
 * - Day 5: First follow-up (friendly reminder)
 * - Day 10: Second follow-up (value-add, offer flexibility)
 * - Day 15: Third follow-up (final check-in)
 * - After 3 attempts: Move to "follow_up_needed" or "lost"
 */
export const FOLLOW_UP_SCHEDULE: FollowUpConfig[] = [
    {
        attemptNumber: 1,
        daysAfterLastEmail: 5,
        template: "friendly_reminder",
        subject: "Re: Tilbud på rengøring",
        tone: "friendly",
    },
    {
        attemptNumber: 2,
        daysAfterLastEmail: 10,
        template: "value_add",
        subject: "Re: Fleksible tider til rengøring?",
        tone: "professional",
    },
    {
        attemptNumber: 3,
        daysAfterLastEmail: 15,
        template: "final_check",
        subject: "Re: Sidste opfølgning - rengøring",
        tone: "professional",
    },
];

/**
 * Max follow-up attempts before giving up
 */
export const MAX_FOLLOW_UP_ATTEMPTS = 3;

/**
 * Follow-up result
 */
export interface FollowUpResult {
    leadId: string;
    customerEmail: string;
    attemptNumber: number;
    sent: boolean;
    error?: string;
    nextFollowUpDate?: Date;
}

/**
 * Lead needing follow-up
 */
export interface LeadNeedingFollowUp {
    leadId: string;
    emailThreadId: string;
    customerEmail: string;
    customerName: string;
    daysSinceLastEmail: number;
    followUpAttempts: number;
    lastEmailDate: Date;
    nextAttemptNumber: number;
    shouldFollowUp: boolean; // Based on schedule
    reason: string; // Why follow-up is needed
}
