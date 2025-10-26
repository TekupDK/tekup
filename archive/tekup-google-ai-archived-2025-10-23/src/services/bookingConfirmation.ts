import type { ParsedLead } from "./leadParser";
import { EmailResponseGenerator } from "./emailResponseGenerator";
import { getLLMProvider } from "../llm/providerFactory";
import { logger } from "../logger";

/**
 * Booking confirmation details
 */
export interface BookingConfirmationInput {
    lead: ParsedLead;
    eventId: string;
    start: string; // ISO 8601 date string
    end: string; // ISO 8601 date string
    location?: string;
    htmlLink?: string;
    durationMinutes: number;
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(
    input: BookingConfirmationInput
): Promise<{ subject: string; body: string; sent: boolean }> {
    const { lead, start, end, location, htmlLink, durationMinutes } = input;

    logger.info(
        {
            leadEmail: lead.email,
            eventStart: start,
            durationMinutes,
        },
        "Preparing booking confirmation email"
    );

    // Uses configured LLM provider (LLM_PROVIDER env var)
    const llmProvider = getLLMProvider();
    const generator = new EmailResponseGenerator(llmProvider ?? undefined);

    // Format dates in Danish
    const formatter = new Intl.DateTimeFormat("da-DK", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Europe/Copenhagen",
    });

    const startDate = new Date(start);
    const endDate = new Date(end);

    const additionalContext = `
**BEKRÆFTET BOOKING:**

📅 **Dato & Tidspunkt:**
${formatter.format(startDate)} - ${formatter.format(endDate)}

🏠 **Adresse:**
${location || lead.address || "Ikke oplyst"}

⏱️ **Varighed:**
${durationMinutes} minutter (ca. ${Math.round(durationMinutes / 60 * 10) / 10} timer)

🔗 **Google Calendar Link:**
${htmlLink || "Ikke tilgængelig"}

**OPGAVE:**
Generer en venlig bekræftelsesmail der:
1. Bekræfter bookingen med ovenstående detaljer
2. Giver information om hvad kunden kan forvente
3. Inkluderer kontaktinfo hvis de har spørgsmål: +45 22 65 02 26, info@rendetalje.dk
4. Afslutter professionelt med "Vi glæder os til at rengøre for dig!"

**VIGTIGE PUNKTER:**
- Brug dansk sprog
- Vær entusiastisk men professionel
- Inkluder alle booking-detaljer tydeligt
- Oplys at de kan ændre/aflyse ved at kontakte os
- Tilføj Google Calendar link så de kan tilføje til deres kalender
`;

    try {
        const response = await generator.generateResponse({
            lead,
            responseType: "bekræftelse",
            additionalContext,
        });

        logger.info(
            {
                leadEmail: lead.email,
                subject: response.subject,
            },
            "Booking confirmation email generated"
        );

        // In production, this would actually send the email via Gmail API
        // For now, we just return the generated content
        return {
            subject: response.subject,
            body: response.body,
            sent: false, // Set to true when actually sending via Gmail
        };
    } catch (err) {
        logger.error(
            { err, leadEmail: lead.email },
            "Failed to generate booking confirmation email"
        );
        throw err;
    }
}

/**
 * Send booking reschedule notification
 */
export async function sendRescheduleNotification(
    input: BookingConfirmationInput & { originalStart: string; reason?: string }
): Promise<{ subject: string; body: string; sent: boolean }> {
    const { lead, originalStart, start, end, location, htmlLink, durationMinutes, reason } = input;

    logger.info(
        {
            leadEmail: lead.email,
            originalStart,
            newStart: start,
        },
        "Preparing reschedule notification email"
    );

    // Uses configured LLM provider (LLM_PROVIDER env var)
    const llmProvider = getLLMProvider();
    const generator = new EmailResponseGenerator(llmProvider ?? undefined);

    const formatter = new Intl.DateTimeFormat("da-DK", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Europe/Copenhagen",
    });

    const originalDate = new Date(originalStart);
    const newStartDate = new Date(start);
    const newEndDate = new Date(end);

    const additionalContext = `
**ÆNDRET BOOKING:**

⚠️ **Original tidspunkt:**
${formatter.format(originalDate)}
${reason ? `\nÅrsag til ændring: ${reason}` : ""}

✅ **Nyt tidspunkt:**
${formatter.format(newStartDate)} - ${formatter.format(newEndDate)}

🏠 **Adresse:**
${location || lead.address || "Ikke oplyst"}

⏱️ **Varighed:**
${durationMinutes} minutter (ca. ${Math.round(durationMinutes / 60 * 10) / 10} timer)

🔗 **Google Calendar Link:**
${htmlLink || "Ikke tilgængelig"}

**OPGAVE:**
Generer en venlig email der:
1. Informerer om ændringen af booking
2. Undskylder for ulejligheden
3. Bekræfter det nye tidspunkt tydeligt
4. Giver mulighed for at kontakte os hvis tidspunktet ikke passer: +45 22 65 02 26
5. Afslutter positivt

**VIGTIGE PUNKTER:**
- Brug dansk sprog
- Vær forståelsesfuld og imødekommende
- Fremhæv det nye tidspunkt tydeligt
- Gør det nemt at kontakte os
`;

    try {
        const response = await generator.generateResponse({
            lead,
            responseType: "bekræftelse",
            additionalContext,
        });

        logger.info(
            {
                leadEmail: lead.email,
                subject: response.subject,
            },
            "Reschedule notification email generated"
        );

        return {
            subject: response.subject,
            body: response.body,
            sent: false,
        };
    } catch (err) {
        logger.error(
            { err, leadEmail: lead.email },
            "Failed to generate reschedule notification email"
        );
        throw err;
    }
}

/**
 * Send booking cancellation confirmation
 */
export async function sendCancellationConfirmation(
    lead: ParsedLead,
    cancelledStart: string,
    reason?: string
): Promise<{ subject: string; body: string; sent: boolean }> {
    logger.info(
        {
            leadEmail: lead.email,
            cancelledStart,
        },
        "Preparing cancellation confirmation email"
    );

    // Uses configured LLM provider (LLM_PROVIDER env var)
    const llmProvider = getLLMProvider();
    const generator = new EmailResponseGenerator(llmProvider ?? undefined);

    const formatter = new Intl.DateTimeFormat("da-DK", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Europe/Copenhagen",
    });

    const cancelledDate = new Date(cancelledStart);

    const additionalContext = `
**AFLYST BOOKING:**

❌ **Aflyst tidspunkt:**
${formatter.format(cancelledDate)}
${reason ? `\nÅrsag: ${reason}` : ""}

**OPGAVE:**
Generer en venlig email der:
1. Bekræfter aflysningen
2. Udtrykker forståelse
3. Inviterer til at booke igen når det passer bedre
4. Giver kontaktinfo: +45 22 65 02 26, info@rendetalje.dk
5. Afslutter positivt med "Vi håber at se dig igen snart!"

**VIGTIGE PUNKTER:**
- Brug dansk sprog
- Vær forståelsesfuld og positiv
- Gør det nemt at booke igen
- Ingen pres, bare venlig afslutning
`;

    try {
        const response = await generator.generateResponse({
            lead,
            responseType: "bekræftelse",
            additionalContext,
        });

        logger.info(
            {
                leadEmail: lead.email,
                subject: response.subject,
            },
            "Cancellation confirmation email generated"
        );

        return {
            subject: response.subject,
            body: response.body,
            sent: false,
        };
    } catch (err) {
        logger.error(
            { err, leadEmail: lead.email },
            "Failed to generate cancellation confirmation email"
        );
        throw err;
    }
}
