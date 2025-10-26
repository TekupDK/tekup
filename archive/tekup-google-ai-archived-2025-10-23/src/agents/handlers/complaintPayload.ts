import { z } from "zod";

export const ComplaintLeadSchema = z.object({
    name: z.string().default("kunde"),
    email: z.string().email().default("info@rendetalje.dk"),
});

export const ComplaintPayloadSchema = z
    .object({
        subject: z.string().default("Opfølgning på din henvendelse hos Rendetalje.dk"),
        lead: ComplaintLeadSchema.default(ComplaintLeadSchema.parse({})),
        originalMessage: z.string().default(""),
    })
    .default({
        subject: "Opfølgning på din henvendelse hos Rendetalje.dk",
        lead: ComplaintLeadSchema.parse({}),
        originalMessage: "",
    });

export type ComplaintPayload = z.infer<typeof ComplaintPayloadSchema>;

export function parseComplaintPayload(raw: unknown): ComplaintPayload {
    return ComplaintPayloadSchema.parse(raw ?? {});
}
