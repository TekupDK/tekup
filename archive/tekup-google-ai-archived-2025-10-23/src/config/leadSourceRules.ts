/**
 * Lead Source Rules Configuration
 * 
 * KRITISK REGEL fra MEMORY_4, MEMORY_16:
 * Different lead sources require different email handling strategies
 * 
 * Rengøring.nu (Leadmail.no): ALDRIG svar direkte - forwarding virker ikke!
 * Rengøring Aarhus (Leadpoint.dk): Svar normalt - forwarding virker
 * AdHelp: ALDRIG til mw@/sp@adhelp.dk - kun til kundens direkte email
 */

export type LeadSourceAction =
    | "REPLY_NORMALLY"           // Reply to lead email as normal
    | "CREATE_NEW_EMAIL"          // Create NEW email to customer (don't reply to lead source)
    | "REPLY_WITH_WARNING";       // Reply but log warning for manual review

export interface LeadSourceRule {
    source: string;
    identifier: string[];         // Email patterns or subject patterns to match
    canReplyDirect: boolean;      // Can we reply to the lead email directly?
    action: LeadSourceAction;
    replyTo?: "CUSTOMER_EMAIL_ONLY" | "LEAD_EMAIL" | "BOTH";
    blacklist?: string[];         // Email addresses to NEVER send to
    reason: string;               // Why this rule exists (for logging)
    instruction: string;          // Human-readable instruction
    volume?: {                    // Optional: Lead volume stats
        perMonth?: number;
        cost?: string;
    };
}

/**
 * Lead source rules configuration
 * 
 * Based on real Rendetalje.dk lead sources and lessons learned
 */
export const LEAD_SOURCE_RULES: Record<string, LeadSourceRule> = {
    /**
     * Rengøring.nu via Leadmail.no
     * 
     * KRITISK: Leadmail.no forwarding system DOES NOT forward replies!
     * Replying to @leadmail.no = black hole
     * 
     * MUST extract customer email from lead body and create NEW email
     */
    "rengoring.nu": {
        source: "rengoring.nu",
        identifier: [
            "@leadmail.no",
            "rengoring.nu",
            "rengøring.nu",
            "leadmail",
        ],
        canReplyDirect: false,
        action: "CREATE_NEW_EMAIL",
        replyTo: "CUSTOMER_EMAIL_ONLY",
        reason: "Leadmail.no forwarding system does not forward replies to customer",
        instruction: `
🚫 DO NOT reply to @leadmail.no email!

CORRECT PROCESS:
1. Extract customer's actual email from lead body
2. CREATE NEW email thread to customer's email
3. Reference original lead in subject/body if needed

WRONG: Reply to noreply@leadmail.no
RIGHT: Send NEW email to kunde@example.com
    `.trim(),
        volume: {
            perMonth: 20 - 30, // Randers area
            cost: "750kr/5. lead",
        },
    },

    /**
     * Rengøring Aarhus via Leadpoint.dk
     * 
     * This lead aggregator DOES forward replies properly
     * Safe to reply normally
     */
    "rengoring-aarhus": {
        source: "rengoring-aarhus",
        identifier: [
            "@leadpoint.dk",
            "rengoring-aarhus",
            "rengøring-aarhus",
            "leadpoint",
        ],
        canReplyDirect: true,
        action: "REPLY_NORMALLY",
        replyTo: "LEAD_EMAIL",
        reason: "Leadpoint.dk properly forwards replies to customers",
        instruction: `
✅ Safe to reply normally to Leadpoint.dk leads

PROCESS:
1. Reply to lead email as usual
2. Leadpoint.dk automatically forwards to customer
3. Customer sees reply seamlessly
    `.trim(),
        volume: {
            perMonth: 80 - 90, // Aarhus + Randers combined
            cost: "750kr/5. lead, erhverv=750kr/stk",
        },
    },

    /**
     * AdHelp lead aggregator
     * 
     * KRITISK: mw@adhelp.dk and sp@adhelp.dk are aggregator emails
     * These do NOT forward to customers!
     * 
     * MUST extract customer email and send directly
     */
    "adhelp": {
        source: "adhelp",
        identifier: [
            "@adhelp.dk",
            "adhelp",
        ],
        canReplyDirect: false,
        action: "CREATE_NEW_EMAIL",
        replyTo: "CUSTOMER_EMAIL_ONLY",
        blacklist: [
            "mw@adhelp.dk",
            "sp@adhelp.dk",
            "@adhelp.dk", // Never send to ANY @adhelp.dk address
        ],
        reason: "AdHelp is aggregator - emails to @adhelp.dk NOT forwarded to customers",
        instruction: `
🚫 NEVER send email to @adhelp.dk addresses!

BLACKLIST:
- mw@adhelp.dk
- sp@adhelp.dk
- ANY @adhelp.dk address

CORRECT PROCESS:
1. Extract customer's actual email from lead body
2. CREATE NEW email thread to customer's email
3. DO NOT reply to or CC @adhelp.dk addresses
    `.trim(),
    },

    /**
     * Unknown/Default rule
     * 
     * For lead sources we haven't configured yet
     * Reply normally but log warning for manual review
     */
    "unknown": {
        source: "unknown",
        identifier: [],
        canReplyDirect: true,
        action: "REPLY_WITH_WARNING",
        replyTo: "LEAD_EMAIL",
        reason: "Unknown lead source - requires manual verification",
        instruction: `
⚠️ UNKNOWN LEAD SOURCE - MANUAL REVIEW REQUIRED

This lead source is not in our configuration.
Email will be sent normally, but please:
1. Verify lead source forwards replies properly
2. Add configuration rule if this is recurring source
3. Extract customer email if forwarding doesn't work
    `.trim(),
    },
};

/**
 * Determine lead source rule from email address or subject
 * 
 * @param fromEmail - Email address the lead came from
 * @param subject - Optional: Subject line (may contain source info)
 * @returns LeadSourceRule to apply
 */
export function getLeadSourceRule(fromEmail: string, subject?: string): LeadSourceRule {
    const emailLower = fromEmail.toLowerCase();
    const subjectLower = subject?.toLowerCase() || "";

    // Check each configured rule
    for (const [_sourceKey, rule] of Object.entries(LEAD_SOURCE_RULES)) {
        if (rule.source === "unknown") continue; // Skip default rule in iteration

        // Check if email or subject matches any identifier
        const matches = rule.identifier.some((id) => {
            const idLower = id.toLowerCase();
            return emailLower.includes(idLower) || subjectLower.includes(idLower);
        });

        if (matches) {
            return rule;
        }
    }

    // No match found - return unknown/default rule
    return LEAD_SOURCE_RULES.unknown;
}

/**
 * Check if an email address is blacklisted for a given source
 * 
 * @param email - Email address to check
 * @param rule - Lead source rule to check against
 * @returns true if email is blacklisted
 */
export function isEmailBlacklisted(email: string, rule: LeadSourceRule): boolean {
    if (!rule.blacklist || rule.blacklist.length === 0) {
        return false;
    }

    const emailLower = email.toLowerCase();
    return rule.blacklist.some((pattern) => {
        const patternLower = pattern.toLowerCase();

        // Check for exact match or domain match
        return emailLower === patternLower || emailLower.includes(patternLower);
    });
}

/**
 * Extract customer email from lead body
 * 
 * Lead aggregators usually include customer's actual email in the body
 * Common formats:
 * - "Email: customer@example.com"
 * - "Kontakt: customer@example.com"
 * - "customer@example.com" (standalone)
 * 
 * @param body - Lead email body text
 * @returns Extracted email or null if not found
 */
export function extractCustomerEmail(body: string): string | null {
    // Common email pattern
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    // Find all emails in body
    const emails = body.match(emailRegex);

    if (!emails || emails.length === 0) {
        return null;
    }

    // Filter out common system emails
    const systemDomains = [
        "leadmail.no",
        "adhelp.dk",
        "leadpoint.dk",
        "noreply",
        "no-reply",
    ];

    const customerEmails = emails.filter((email) => {
        const emailLower = email.toLowerCase();
        return !systemDomains.some((domain) => emailLower.includes(domain));
    });

    if (customerEmails.length === 0) {
        return null;
    }

    // Return first customer email found
    return customerEmails[0];
}

/**
 * Validate that we have customer email before creating new email
 * 
 * @param rule - Lead source rule
 * @param customerEmail - Extracted customer email
 * @returns Validation result with error message if invalid
 */
export function validateCustomerEmail(
    rule: LeadSourceRule,
    customerEmail: string | null
): { valid: boolean; error?: string } {
    if (rule.action !== "CREATE_NEW_EMAIL") {
        return { valid: true }; // Not required for other actions
    }

    if (!customerEmail) {
        return {
            valid: false,
            error: `Cannot create new email - no customer email found in lead body. Source: ${rule.source}`,
        };
    }

    if (isEmailBlacklisted(customerEmail, rule)) {
        return {
            valid: false,
            error: `Customer email ${customerEmail} is blacklisted for source ${rule.source}`,
        };
    }

    return { valid: true };
}

/**
 * Format lead source rule for display/logging
 * 
 * @param rule - Lead source rule to format
 * @returns Formatted string for display
 */
export function formatLeadSourceRule(rule: LeadSourceRule): string {
    const parts: string[] = [];

    parts.push(`📌 Lead Source: ${rule.source}`);
    parts.push(`📧 Can Reply Direct: ${rule.canReplyDirect ? "✅ YES" : "🚫 NO"}`);
    parts.push(`🎯 Action: ${rule.action}`);

    if (rule.replyTo) {
        parts.push(`📬 Reply To: ${rule.replyTo}`);
    }

    if (rule.blacklist && rule.blacklist.length > 0) {
        parts.push(`🚫 Blacklist: ${rule.blacklist.join(", ")}`);
    }

    parts.push(`📝 Reason: ${rule.reason}`);
    parts.push("");
    parts.push(rule.instruction);

    if (rule.volume) {
        parts.push("");
        parts.push("📊 Volume Stats:");
        if (rule.volume.perMonth) {
            parts.push(`   Per Month: ${rule.volume.perMonth}`);
        }
        if (rule.volume.cost) {
            parts.push(`   Cost: ${rule.volume.cost}`);
        }
    }

    return parts.join("\n");
}
