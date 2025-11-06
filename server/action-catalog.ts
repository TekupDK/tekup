import { z } from "zod";

/**
 * Action Catalog - Allowlist and validation schemas for all action types
 *
 * Purpose: Security and validation layer for action execution
 * - Define allowed actions with their risk levels
 * - Validate action parameters with zod schemas
 * - Rate limits and role requirements
 */

export type ActionRiskLevel = "low" | "medium" | "high";

export interface ActionCatalogEntry {
  type: string;
  label: string;
  riskLevel: ActionRiskLevel;
  requiresApproval: boolean;
  rateLimitPerHour: number;
  allowedRoles?: string[]; // undefined = all roles
  paramsSchema: z.ZodType<any>;
  description: string;
}

// Parameter schemas for each action type
const createLeadSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  dueInDays: z.number().int().min(0).max(365).optional(),
  dueInHours: z.number().int().min(0).max(8760).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

const bookMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  attendees: z.array(z.string().email()).optional(),
  description: z.string().optional(),
});

const createInvoiceSchema = z.object({
  threadId: z.string().optional(),
  amount: z.number().min(0).optional(),
  lines: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
      })
    )
    .optional(),
  dueInDays: z.number().int().min(0).max(365).optional(),
});

const searchGmailSchema = z.object({
  label: z.string().optional(),
  query: z.string().optional(),
  maxResults: z.number().int().min(1).max(100).optional(),
});

const requestFlytterPhotosSchema = z.object({
  threadId: z.string(),
  template: z.string().optional(),
  customerName: z.string().optional(),
});

const jobCompletionSchema = z.object({
  threadId: z.string(),
  jobType: z.string().optional(),
  customerName: z.string().optional(),
});

/**
 * Action Catalog - Allowlist of all permitted actions
 */
export const ACTION_CATALOG: Record<string, ActionCatalogEntry> = {
  create_lead: {
    type: "create_lead",
    label: "Opret Lead",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 50,
    paramsSchema: createLeadSchema,
    description: "Opretter et nyt lead i CRM systemet",
  },

  create_task: {
    type: "create_task",
    label: "Opret Opgave",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 100,
    paramsSchema: createTaskSchema,
    description: "Opretter en ny opgave til opfølgning",
  },

  book_meeting: {
    type: "book_meeting",
    label: "Book Kalenderaftale",
    riskLevel: "medium",
    requiresApproval: true,
    rateLimitPerHour: 20,
    paramsSchema: bookMeetingSchema,
    description: "Opretter en kalenderaftale (som kladde hvis ikke godkendt)",
  },

  create_invoice: {
    type: "create_invoice",
    label: "Opret Faktura",
    riskLevel: "high",
    requiresApproval: true,
    rateLimitPerHour: 10,
    paramsSchema: createInvoiceSchema,
    description: "Opretter en faktura i Billy regnskabssystem",
  },

  search_gmail: {
    type: "search_gmail",
    label: "Søg i Gmail",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 200,
    paramsSchema: searchGmailSchema,
    description: "Søger efter emails i Gmail baseret på query eller label",
  },

  request_flytter_photos: {
    type: "request_flytter_photos",
    label: "Anmod om Billeder",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 30,
    paramsSchema: requestFlytterPhotosSchema,
    description:
      "Sender automatisk email med anmodning om billeder til flytterengøring",
  },

  job_completion: {
    type: "job_completion",
    label: "Afslut Job",
    riskLevel: "medium",
    requiresApproval: true,
    rateLimitPerHour: 30,
    paramsSchema: jobCompletionSchema,
    description: "Markerer job som færdig og sender bekræftelse til kunde",
  },

  search_email: {
    type: "search_email",
    label: "Søg Email",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 200,
    paramsSchema: searchGmailSchema,
    description: "Søger i email tråde (alias for search_gmail)",
  },

  list_tasks: {
    type: "list_tasks",
    label: "Vis Opgaver",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 200,
    paramsSchema: z.object({}),
    description: "Henter liste over brugerens opgaver",
  },

  list_leads: {
    type: "list_leads",
    label: "Vis Leads",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 200,
    paramsSchema: z.object({
      status: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    description: "Henter liste over brugerens leads",
  },

  check_calendar: {
    type: "check_calendar",
    label: "Tjek Kalender",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 100,
    paramsSchema: z.object({}),
    description: "Tjekker kommende kalenderaftaler",
  },

  // Inbox AI tools
  ai_generate_summaries: {
    type: "ai_generate_summaries",
    label: "AI: Generér Resuméer",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 60,
    paramsSchema: z.object({
      emailIds: z.array(z.number()).optional(),
      maxConcurrent: z.number().int().min(1).max(10).optional(),
      skipCached: z.boolean().optional(),
    }),
    description:
      "Genererer AI-resuméer for valgte eller seneste emails. Hvis ingen emailIds angives, bruges de seneste 25 i Indbakken.",
  },
  ai_suggest_labels: {
    type: "ai_suggest_labels",
    label: "AI: Foreslå Labels",
    riskLevel: "low",
    requiresApproval: false,
    rateLimitPerHour: 60,
    paramsSchema: z.object({
      emailIds: z.array(z.number()).optional(),
      maxConcurrent: z.number().int().min(1).max(10).optional(),
      skipCached: z.boolean().optional(),
      autoApply: z.boolean().optional(),
    }),
    description:
      "Foreslår og (valgfrit) auto-anvender labels på valgte eller seneste emails. Hvis ingen emailIds angives, bruges de seneste 25 i Indbakken.",
  },
};

/**
 * Validate action type against catalog
 */
export function isActionAllowed(actionType: string): boolean {
  return actionType in ACTION_CATALOG;
}

/**
 * Get catalog entry for action type
 */
export function getActionCatalogEntry(
  actionType: string
): ActionCatalogEntry | null {
  return ACTION_CATALOG[actionType] || null;
}

/**
 * Validate action parameters against schema
 */
export function validateActionParams(
  actionType: string,
  params: unknown
): { success: true; data: any } | { success: false; error: string } {
  const entry = getActionCatalogEntry(actionType);
  if (!entry) {
    return { success: false, error: `Unknown action type: ${actionType}` };
  }

  const result = entry.paramsSchema.safeParse(params);
  if (!result.success) {
    return {
      success: false,
      error: `Invalid parameters: ${result.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Check if action requires approval based on risk level
 */
export function requiresApproval(actionType: string): boolean {
  const entry = getActionCatalogEntry(actionType);
  return entry?.requiresApproval ?? true; // Default to requiring approval for safety
}
