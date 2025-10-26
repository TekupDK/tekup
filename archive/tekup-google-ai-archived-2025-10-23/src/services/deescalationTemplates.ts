/**
 * De-escalation Templates
 * 
 * Professional response templates for different conflict severity levels
 */

import { ConflictSeverity } from "../types/conflict";

/**
 * Generate de-escalation response based on severity
 * 
 * @param customerName Customer name
 * @param severity Conflict severity
 * @param context Additional context (issue description)
 * @returns Email subject and body
 */
export function generateDeescalationResponse(
    customerName: string,
    severity: ConflictSeverity,
    context?: string
): { subject: string; body: string } {
    switch (severity) {
        case "critical":
            return generateCriticalResponse(customerName);
        case "high":
            return generateHighSeverityResponse(customerName, context);
        case "medium":
            return generateMediumSeverityResponse(customerName, context);
        case "low":
            return generateLowSeverityResponse(customerName, context);
        default:
            return generateStandardResponse(customerName);
    }
}

/**
 * CRITICAL severity - Immediate escalation, no AI response
 */
function generateCriticalResponse(customerName: string): {
    subject: string;
    body: string;
} {
    return {
        subject: "Re: Din henvendelse - Kontakt fra Jonas",
        body: `
Kære ${customerName},

Jeg har modtaget din besked, og jeg forstår, at situationen er alvorlig.

Jonas, vores indehaver, vil kontakte dig personligt inden for de næste timer for at få løst dette.

Du vil høre fra ham meget snart.

Med venlig hilsen,
Rendetalje
Jonas kontakt: jonas@rendetalje.dk | +45 XX XX XX XX

---
⚠️ BEMÆRK: Dette svar SKAL godkendes af Jonas før afsendelse.
        `.trim(),
    };
}

/**
 * HIGH severity - Apologetic with Jonas contact
 */
function generateHighSeverityResponse(
    customerName: string,
    context?: string
): { subject: string; body: string } {
    return {
        subject: "Re: Undskyldning og løsning",
        body: `
Kære ${customerName},

Jeg er virkelig ked af den situation, du beskriver${context ? `: ${context}` : ""}.

Det er ikke den oplevelse, vi ønsker at give vores kunder, og jeg forstår fuldt ud din frustration.

For at sikre, at dette bliver løst på bedst mulig måde, vil jeg bede vores indehaver, Jonas, kontakte dig direkte. Han har fuld indsigt i situationen og kan træffe beslutninger om, hvordan vi bedst kompenserer for ulejligheden.

Du kan også kontakte Jonas direkte på:
📧 jonas@rendetalje.dk
📞 +45 XX XX XX XX

Vi sætter stor pris på din forståelse og vil gøre alt, hvad vi kan, for at rette op på dette.

Med venlig hilsen,
Rendetalje

---
⚠️ BEMÆRK: Dette svar kræver godkendelse før afsendelse.
        `.trim(),
    };
}

/**
 * MEDIUM severity - Apologetic with solution offer
 */
function generateMediumSeverityResponse(
    customerName: string,
    context?: string
): { subject: string; body: string } {
    return {
        subject: "Re: Vi beklager - lad os finde en løsning",
        body: `
Hej ${customerName},

Tak for din besked${context ? ` vedrørende ${context}` : ""}.

Jeg beklager meget, at du har haft denne oplevelse. Det er ikke op til vores standard, og jeg kan godt forstå din skuffelse.

Jeg vil meget gerne høre mere om, hvad der præcis gik galt, så vi kan finde den bedste løsning for dig.

Vil du have tid til en kort samtale? Alternativt er du velkommen til at beskrive situationen mere detaljeret, så vi kan komme videre med det samme.

Vi sætter stor pris på din feedback og vil gerne gøre det rigtigt.

Med venlig hilsen,
Rendetalje

---
⚠️ BEMÆRK: Dette svar kræver godkendelse før afsendelse.
        `.trim(),
    };
}

/**
 * LOW severity - Empathetic acknowledgment
 */
function generateLowSeverityResponse(
    customerName: string,
    context?: string
): { subject: string; body: string } {
    return {
        subject: "Re: Din henvendelse",
        body: `
Hej ${customerName},

Tak for din besked${context ? ` om ${context}` : ""}.

Jeg kan godt forstå din bekymring, og jeg vil gerne hjælpe med at få dette løst for dig.

Kan du fortælle mig lidt mere om, hvad der præcis ikke lever op til dine forventninger? Så finder vi sammen den bedste løsning.

Jeg er her for at hjælpe, og vi vil gøre vores bedste for at sikre din tilfredshed.

Med venlig hilsen,
Rendetalje

---
⚠️ BEMÆRK: Dette svar kræver godkendelse før afsendelse.
        `.trim(),
    };
}

/**
 * Standard response (no conflict)
 */
function generateStandardResponse(customerName: string): {
    subject: string;
    body: string;
} {
    return {
        subject: "Re: Din henvendelse",
        body: `
Hej ${customerName},

Tak for din besked.

Hvordan kan jeg hjælpe dig bedst?

Med venlig hilsen,
Rendetalje
        `.trim(),
    };
}

/**
 * Generate escalation summary for Jonas
 */
export function generateEscalationSummary(
    customerName: string,
    customerEmail: string,
    severity: ConflictSeverity,
    matchedKeywords: string[],
    emailSnippet: string
): string {
    return `
═══════════════════════════════════════
🚨 KONFLIKT ESKALERING
═══════════════════════════════════════

Kunde:          ${customerName} (${customerEmail})
Alvorlighed:    ${severity.toUpperCase()}
Nøgleord:       ${matchedKeywords.join(", ")}

Uddrag fra email:
"${emailSnippet}"

Anbefalede handlinger:
${getActionRecommendations(severity)}

═══════════════════════════════════════
    `.trim();
}

/**
 * Get action recommendations based on severity
 */
function getActionRecommendations(severity: ConflictSeverity): string {
    switch (severity) {
        case "critical":
            return "• Ring OMGÅENDE til kunden\n• Involver evt. advokat\n• Dokumentér ALT";
        case "high":
            return "• Ring til kunden indenfor 2 timer\n• Tilbyd kompensation\n• Følg op skriftligt";
        case "medium":
            return "• Svar inden for 4 timer\n• Anerkend problemet\n• Tilbyd løsning";
        case "low":
            return "• Svar inden for 24 timer\n• Vær lyttende\n• Tilbyd hjælp";
        default:
            return "• Håndter som standard henvendelse";
    }
}

/**
 * Check if response requires manual approval
 */
export function requiresManualApproval(severity: ConflictSeverity): boolean {
    return severity !== "none";
}

/**
 * Check if should auto-escalate to Jonas
 */
export function shouldAutoEscalate(severity: ConflictSeverity): boolean {
    return severity === "critical" || severity === "high";
}
