import { sendGenericEmail } from "../../services/gmailService";
import type { ComplaintPayload } from "./complaintPayload";

const COMPLAINT_TEMPLATE = `Hej {name},<br/><br/>Vi beklager oplevelsen og tager ansvar for udfordringen. Sådan håndterer vi det:<br/>1. Fejlen er registreret hos teamet.<br/>2. Vi kontakter den ansvarlige leder for at forebygge gentagelse.<br/>3. Vi tilbyder kompensation i form af 15% rabat på næste besøg.<br/><br/>{quoted}Hvis der er flere detaljer vi skal kende, så svar gerne direkte på tråden.<br/><br/>De bedste hilsner<br/>Rendetalje.dk Support`;

export type ComplaintEmailSummary = Awaited<ReturnType<typeof sendGenericEmail>>;

export async function sendComplaintEmail(payload: ComplaintPayload, threadId: string | undefined) {
    const body = buildComplaintBody(payload.lead.name, payload.originalMessage);
    return sendGenericEmail({
        to: payload.lead.email,
        subject: payload.subject,
        body,
        threadId,
        fromName: "Rendetalje.dk Support",
    });
}

function buildComplaintBody(name: string, originalMessage: string): string {
    const quoted = originalMessage ? `<blockquote>${originalMessage}</blockquote>` : "";
    return COMPLAINT_TEMPLATE.replace("{name}", name).replace("{quoted}", quoted);
}
