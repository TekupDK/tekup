export type AssistantIntent =
    | "email.lead"
    | "email.followup"
    | "email.complaint"
    | "email.response"
    | "calendar.booking"
    | "calendar.cancellation"
    | "calendar.availability"
    | "calendar.reschedule"
    | "analytics.overview"
    | "automation.rule"
    | "greeting"
    | "help"
    | "unknown";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
}

export interface ChatSessionContext {
    userId?: string;
    channel?: "mobile" | "tablet" | "desktop" | "web";
    locale?: string;
    history?: ChatMessage[];
}

export interface ClassifiedIntent {
    intent: AssistantIntent;
    confidence: number;
    rationale: string;
}

export interface PlannedTask<TPayload = Record<string, unknown>> {
    id: string;
    type:
    | "email.compose"
    | "email.send"
    | "email.followup"
    | "email.resolveComplaint"
    | "lead.estimate_price"
    | "lead.parse"
    | "calendar.book"
    | "calendar.availability"
    | "calendar.reschedule"
    | "customer.create"
    | "customer.duplicate_check"
    | "analytics.generate"
    | "automation.updateRule"
    | "memory.update"
    | "noop";
    provider: "gmail" | "calendar" | "analytics" | "llm" | "memory" | "system" | "automation";
    payload: TPayload;
    priority: "low" | "normal" | "high";
    blocking: boolean;
}

export interface ExecutionResult {
    summary: string;
    actions: Array<{
        taskId: string;
        provider: PlannedTask["provider"];
        status: "queued" | "skipped" | "success" | "failed";
        detail: string;
    }>;
    contextUpdates?: Record<string, unknown>;
}

export interface AssistantResponse {
    intent: ClassifiedIntent;
    plan: PlannedTask[];
    execution: ExecutionResult;
}

export interface LeadInformation {
    source?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    squareMeters?: number;
    rooms?: number;
    taskType?: string;
    preferredDates?: string[];
}

export interface PricingEstimate {
    hourlyRate: number;
    estimatedHours: number;
    subtotal: number;
    vatRate: number;
    total: number;
    notes?: string;
}
