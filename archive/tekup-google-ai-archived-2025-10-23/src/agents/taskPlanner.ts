import { nanoid } from "nanoid";
import type {
    AssistantIntent,
    ChatSessionContext,
    ClassifiedIntent,
    LeadInformation,
    PlannedTask,
    PricingEstimate,
} from "../types";

export interface TaskPlannerInput {
    intent: ClassifiedIntent;
    message: string;
    context: ChatSessionContext;
    lead?: LeadInformation;
}

export class TaskPlanner {
    /**
     * Backward compatible helper used by tests to plan using just the intent and a minimal context
     */
    planForIntent(intent: AssistantIntent, opts: { email?: string; subject?: string; from?: string; timestamp?: string } = {}): PlannedTask[] {
        const classified: ClassifiedIntent = { intent, confidence: 0.8, rationale: "test-helper" };
        const context = { userId: "test", channel: "web", locale: "da-DK" } as const;

        const lead: LeadInformation = {
            source: opts.from,
            email: opts.from,
        };

        return this.plan({ intent: classified, message: opts.email ?? "", context, lead });
    }
    plan(input: TaskPlannerInput): PlannedTask[] {
        switch (input.intent.intent) {
            case "email.lead":
                return this.planLeadEmail(input);
            case "email.complaint":
                return this.planComplaintResponse(input);
            case "calendar.booking":
                return this.planCalendarBooking(input);
            case "calendar.cancellation":
                return this.planCalendarCancellation(input);
            case "analytics.overview":
                return this.planAnalyticsSummary(input.intent.intent, input.message);
            case "greeting":
                return this.planAnalyticsSummary("greeting", input.message);
            case "help":
                return this.planAnalyticsSummary("help", input.message);
            case "automation.rule":
                return this.planAutomationUpdate();
            default:
                return [this.createNoOpTask("Intent ikke genkendt")];
        }
    }

    private planLeadEmail(input: TaskPlannerInput): PlannedTask[] {
        const lead = input.lead ?? {};
        const pricing = this.estimatePricing(lead);

        const tasks: PlannedTask[] = [
            // Price estimation task for downstream consumers/tests
            {
                id: nanoid(),
                type: "lead.estimate_price",
                provider: "llm",
                priority: "high",
                blocking: false,
                payload: {
                    lead,
                    pricing,
                },
            },
            {
                id: nanoid(),
                type: "email.compose",
                provider: "gmail",
                priority: "high",
                blocking: false,
                payload: {
                    lead,
                    pricing,
                    context: input.context,
                },
            },
            {
                id: nanoid(),
                type: "memory.update",
                provider: "memory",
                priority: "normal",
                blocking: false,
                payload: {
                    lead,
                    pricing,
                },
            },
        ];

        // Lead source rules: parse or create customer tasks depending on from/source
        const from = input.lead?.source || input.lead?.email || "";
        if (from.includes("leadmail.no") || from.includes("adhelp.dk")) {
            tasks.unshift({
                id: nanoid(),
                type: "lead.parse",
                provider: "llm",
                priority: "normal",
                blocking: false,
                payload: { emailBody: input.message },
            });

            tasks.push({
                id: nanoid(),
                type: "customer.create",
                provider: "system",
                priority: "normal",
                blocking: false,
                payload: { from },
            });
        }

        // Always include duplicate check task early in plan for safety
        tasks.unshift({
            id: nanoid(),
            type: "customer.duplicate_check",
            provider: "system",
            priority: "high",
            blocking: false,
            payload: { email: lead.email },
        });

        return tasks;
    }

    private planComplaintResponse(input: TaskPlannerInput): PlannedTask[] {
        return [
            {
                id: nanoid(),
                type: "email.resolveComplaint",
                provider: "gmail",
                priority: "high",
                blocking: true,
                payload: {
                    originalMessage: input.message,
                    context: input.context,
                    lead: input.lead,
                },
            },
        ];
    }

    private planCalendarBooking(input: TaskPlannerInput): PlannedTask[] {
        const pricing = input.lead ? this.estimatePricing(input.lead) : undefined;

        return [
            {
                id: nanoid(),
                type: "calendar.book",
                provider: "calendar",
                priority: "high",
                blocking: true,
                payload: {
                    context: input.context,
                    lead: input.lead,
                    durationMinutes: pricing ? Math.max(60, Math.round(pricing.estimatedHours * 60)) : 60,
                },
            },
        ];
    }

    private planCalendarCancellation(input: TaskPlannerInput): PlannedTask[] {
        const pricing = input.lead ? this.estimatePricing(input.lead) : undefined;

        return [
            {
                id: nanoid(),
                type: "calendar.reschedule",
                provider: "calendar",
                priority: "normal",
                blocking: true,
                payload: {
                    context: input.context,
                    reason: input.message,
                    lead: input.lead,
                    preferredDates: input.lead?.preferredDates,
                    durationMinutes: pricing ? Math.max(60, Math.round(pricing.estimatedHours * 60)) : 60,
                },
            },
        ];
    }

    private planAnalyticsSummary(intent: AssistantIntent, message?: string): PlannedTask[] {
        return [
            {
                id: nanoid(),
                type: "analytics.generate",
                provider: "analytics",
                priority: "low",
                blocking: false,
                payload: {
                    intent: intent as string,
                    userMessage: message || ""
                },
            },
        ];
    }

    private planAutomationUpdate(): PlannedTask[] {
        return [
            {
                id: nanoid(),
                type: "automation.updateRule",
                provider: "automation",
                priority: "normal",
                blocking: false,
                payload: {
                    note: "Gennemgå og opdater automationsregler baseret på seneste læringer",
                },
            },
        ];
    }

    private estimatePricing(lead: LeadInformation): PricingEstimate {
        const hourlyRate = 349;
        const baseHours = Math.max(lead.squareMeters ? lead.squareMeters / 35 : 2, 2);
        const complexityFactor = lead.rooms ? Math.min(lead.rooms / 3, 1.5) : 1;
        const estimatedHours = Number.parseFloat((baseHours * complexityFactor).toFixed(1));
        const subtotal = Number.parseFloat((estimatedHours * hourlyRate).toFixed(2));
        const vatRate = 0.25;
        const total = Number.parseFloat((subtotal * (1 + vatRate)).toFixed(2));

        return {
            hourlyRate,
            estimatedHours,
            subtotal,
            vatRate,
            total,
            notes: "Estimat baseret på 349 kr/time og opgavens størrelse",
        };
    }

    private createNoOpTask(reason: string): PlannedTask {
        return {
            id: nanoid(),
            type: "noop",
            provider: "system",
            priority: "low",
            blocking: false,
            payload: { reason },
        };
    }
}
