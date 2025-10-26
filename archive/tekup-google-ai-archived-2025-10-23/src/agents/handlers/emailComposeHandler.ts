import { z } from "zod";
import { sendOfferEmail, searchThreads } from "../../services/gmailService";
import { logger } from "../../logger";
import type { TaskHandler, ExecutionAction } from "./types";

const defaultLead = {
    name: "kunde",
    email: "kunde@example.com",
    address: "Ukendt",
    squareMeters: "?",
    taskType: "Generel rengøring",
} as const;

const defaultPricing = {
    estimatedHours: "2",
    hourlyRate: "349",
    total: "0",
} as const;

const LeadSchema = z.object({
    name: z.string().default(defaultLead.name),
    email: z.string().email().default(defaultLead.email),
    address: z.string().default(defaultLead.address),
    squareMeters: z.coerce.string().default(defaultLead.squareMeters),
    taskType: z.string().default(defaultLead.taskType),
});

const PricingSchema = z.object({
    estimatedHours: z.coerce.string().default(defaultPricing.estimatedHours),
    hourlyRate: z.coerce.string().default(defaultPricing.hourlyRate),
    total: z.coerce.string().default(defaultPricing.total),
});

const OfferPayloadSchema = z
    .object({
        subject: z.string().default("✨ Tilbud fra Rendetalje.dk"),
        lead: LeadSchema.default(defaultLead),
        pricing: PricingSchema.default(defaultPricing),
    })
    .default({
        subject: "✨ Tilbud fra Rendetalje.dk",
        lead: defaultLead,
        pricing: defaultPricing,
    });

export const handleEmailCompose: TaskHandler = async (task) => {
    const { lead, pricing, subject } = OfferPayloadSchema.parse(task.payload ?? {});

    const toAddress = lead.email;

    let threadId: string | undefined;
    try {
        const threads = await searchThreads({ query: `to:${toAddress} subject:${subject}`, maxResults: 1 });
        threadId = threads[0]?.id ?? undefined;
    } catch (error) {
        logger.warn({ err: error, to: toAddress, subject }, "Failed to lookup existing Gmail threads");
    }

    const body = `Hej ${lead.name} 👋<br/><br/>Tak for din henvendelse til Rendetalje.dk. Her er dit skræddersyede tilbud:<br/>• Adresse: ${lead.address}<br/>• Areal: ${lead.squareMeters} m²<br/>• Opgave: ${lead.taskType}<br/><br/>Forventet tid: ${pricing.estimatedHours} timer<br/>Timepris: ${pricing.hourlyRate} kr<br/>Samlet pris inkl. moms: ${pricing.total} kr<br/><br/>Svar gerne på denne mail, så booker vi et tidspunkt der passer dig.✨<br/><br/>De bedste hilsner<br/>Rendetalje.dk`;

    const summary = await sendOfferEmail({
        to: toAddress,
        subject,
        body,
        threadId,
    });

    const detail = threadId
        ? `Tilbud opdateret i eksisterende tråd (${threadId})`
        : `Tilbud klar til ${summary.to}`;

    return {
        taskId: task.id,
        provider: task.provider,
        status: summary.dryRun ? "queued" : "success",
        detail,
    } satisfies ExecutionAction;
};
