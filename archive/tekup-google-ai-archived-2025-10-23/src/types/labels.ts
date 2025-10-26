/**
 * Gmail Label Types & Workflow Definitions
 * 
 * WORKFLOW STATES:
 * new_lead → quote_sent → awaiting_response → [booked | lost] → completed
 */

/**
 * Lead status labels used for Gmail organization
 */
export type LeadStatusLabel =
    | "new_lead"              // Fresh lead, not yet processed
    | "quote_sent"            // Quote has been sent to customer
    | "awaiting_response"     // Waiting for customer reply
    | "follow_up_needed"      // Needs manual follow-up
    | "booked"                // Booking confirmed
    | "completed"             // Job completed
    | "lost"                  // Lost to competitor or customer declined
    | "conflict";             // Customer conflict requiring escalation

/**
 * Label metadata and configuration
 */
export interface LabelConfig {
    name: LeadStatusLabel;
    displayName: string;
    color: {
        textColor: string;    // Gmail API color
        backgroundColor: string;
    };
    description: string;
    nextStates: LeadStatusLabel[]; // Valid state transitions
}

/**
 * Label workflow configuration
 * Defines state machine for lead status progression
 */
export const LABEL_WORKFLOW: Record<LeadStatusLabel, LabelConfig> = {
    new_lead: {
        name: "new_lead",
        displayName: "🆕 Nyt Lead",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#4285f4", // Blue
        },
        description: "Fresh lead, not yet processed",
        nextStates: ["quote_sent", "lost"]
    },
    quote_sent: {
        name: "quote_sent",
        displayName: "💰 Tilbud Sendt",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#f4b400", // Orange
        },
        description: "Quote has been sent to customer",
        nextStates: ["awaiting_response", "booked", "lost"]
    },
    awaiting_response: {
        name: "awaiting_response",
        displayName: "⏳ Afventer Svar",
        color: {
            textColor: "#000000",
            backgroundColor: "#fbbc04", // Yellow
        },
        description: "Waiting for customer reply",
        nextStates: ["follow_up_needed", "booked", "lost"]
    },
    follow_up_needed: {
        name: "follow_up_needed",
        displayName: "📞 Skal Følges Op",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#ea4335", // Red
        },
        description: "Needs manual follow-up (no response after 5+ days)",
        nextStates: ["quote_sent", "booked", "lost"]
    },
    booked: {
        name: "booked",
        displayName: "✅ Booket",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#34a853", // Green
        },
        description: "Booking confirmed",
        nextStates: ["completed", "conflict"]
    },
    completed: {
        name: "completed",
        displayName: "🎉 Fuldført",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#0d652d", // Dark Green
        },
        description: "Job completed successfully",
        nextStates: [] // Terminal state
    },
    lost: {
        name: "lost",
        displayName: "❌ Tabt",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#5f6368", // Gray
        },
        description: "Lost to competitor or customer declined",
        nextStates: [] // Terminal state
    },
    conflict: {
        name: "conflict",
        displayName: "⚠️ Konflikt",
        color: {
            textColor: "#ffffff",
            backgroundColor: "#c5221f", // Dark Red
        },
        description: "Customer conflict requiring escalation",
        nextStates: ["completed", "lost"] // Resolve or give up
    }
};

/**
 * Get valid next states from current state
 */
export function getNextStates(currentState: LeadStatusLabel): LeadStatusLabel[] {
    return LABEL_WORKFLOW[currentState].nextStates;
}

/**
 * Check if state transition is valid
 */
export function isValidTransition(from: LeadStatusLabel, to: LeadStatusLabel): boolean {
    const validNextStates = LABEL_WORKFLOW[from].nextStates;
    return validNextStates.includes(to);
}

/**
 * Get label config by name
 */
export function getLabelConfig(label: LeadStatusLabel): LabelConfig {
    return LABEL_WORKFLOW[label];
}

/**
 * Get all label names
 */
export function getAllLabels(): LeadStatusLabel[] {
    return Object.keys(LABEL_WORKFLOW) as LeadStatusLabel[];
}
