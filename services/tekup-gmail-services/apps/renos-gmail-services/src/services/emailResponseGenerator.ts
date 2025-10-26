import type { ParsedLead } from "./leadParser";
import type { LLMProvider } from "../llm/llmProvider";
import { requireLLMProvider } from "../llm/providerFactory";
import { logger } from "../logger";
import { findNextAvailableSlot } from "./calendarService";
import { checkDuplicateCustomer, checkExistingQuotes, type DuplicateCheckResult, type QuoteCheckResult } from "./duplicateDetectionService";
import { estimateCleaningJob, type PriceEstimate } from "./pricingService";
import { validateQuoteCompleteness, formatValidationReport } from "../validation/quoteValidation";
import { analyzeEmailForConflict } from "./conflictDetectionService";
import type { ConflictDetectionResult } from "../types/conflict";
import { escalateToJonas } from "./escalationService";
import { applyLabelToThread } from "./labelService";
// import { validateQuote, type _QuoteValidationResult } from "../tools/validateQuote";

/**
 * Email response template context
 */
export interface EmailResponseContext {
    lead: ParsedLead;
    responseType: "tilbud" | "bekræftelse" | "follow-up" | "info";
    additionalContext?: string;
    includeBookingSlots?: boolean; // New: Include available booking times in email
    bookingDuration?: number; // Duration in minutes for suggested booking slots
    originalEmailText?: string; // KRITISK: Original email text for conflict detection
    leadId?: string; // Database lead ID for escalation tracking
    threadId?: string; // Email thread ID for escalation
}

/**
 * Generated email response
 */
export interface GeneratedEmailResponse {
    subject: string;
    body: string;
    to: string;
    cc?: string[];
    replyToThreadId?: string;
    duplicateCheck?: DuplicateCheckResult; // KRITISK: Duplicate detection result (general customer)
    quoteCheck?: QuoteCheckResult; // KRITISK: Specific quote detection result
    shouldSend?: boolean; // KRITISK: Whether this email should actually be sent
    warnings?: string[]; // Any warnings about sending this email
    // Compatibility fields for legacy tests/usages
    estimatedPrice?: { min?: number; max?: number };
    toEmail?: string;
    shouldCreateNewEmail?: boolean;
}

/**
 * Email response generator using configurable LLM provider
 * 
 * Supports OpenAI, Gemini, and Ollama based on LLM_PROVIDER config.
 * Now unified with Friday AI's LLM configuration for consistency.
 */
export class EmailResponseGenerator {
    private llm: LLMProvider | null;

    /**
     * @param llmProvider - Optional LLM provider (defaults to configured provider via LLM_PROVIDER env var)
     */
    constructor(llmProvider?: LLMProvider) {
        // Use injected provider or lazy-load on first use to avoid startup crashes
        this.llm = llmProvider ?? null;

        logger.info("EmailResponseGenerator initialized (LLM will be loaded on first use)");
    }

    /**
     * Get LLM provider, lazy-loading if needed
     */
    private getLLM(): LLMProvider {
        if (!this.llm) {
            this.llm = requireLLMProvider();
        }
        return this.llm;
    }

    /**
     * Generate an email response for a lead
     * 
     * KRITISK REGEL fra MEMORY_4, MEMORY_8:
     * "TJEK ALTID først om vi allerede har sendt tilbud til kunden 
     * før jeg skriver nye tilbud - undgå dobbelt-tilbud!"
     */
    async generateResponse(
        context: EmailResponseContext
    ): Promise<GeneratedEmailResponse> {
        const {
            lead,
            responseType,
            additionalContext,
            includeBookingSlots,
            bookingDuration,
            originalEmailText,
            leadId,
            threadId
        } = context;

        logger.info(
            {
                leadId: lead.emailId,
                name: lead.name,
                responseType,
                includeBookingSlots,
            },
            "Generating email response"
        );

        // ⚠️ KRITISK: Check for duplicate quotes BEFORE generating email
        let duplicateCheck: DuplicateCheckResult | undefined;
        let quoteCheck: QuoteCheckResult | undefined;
        let conflictResult: ConflictDetectionResult | undefined;
        const warnings: string[] = [];
        let shouldSend = true;

        if (lead.email && responseType === "tilbud") {
            // FIRST: Check for existing quotes (more specific than general duplicate)
            logger.info({ customerEmail: lead.email }, "🔍 Checking for existing quotes...");

            quoteCheck = await checkExistingQuotes(lead.email);

            if (quoteCheck.action === "STOP") {
                logger.warn(
                    {
                        customerEmail: lead.email,
                        daysSince: quoteCheck.daysSinceQuote,
                        lastQuoteDate: quoteCheck.lastQuoteDate,
                        recommendation: quoteCheck.recommendation
                    },
                    "🚫 EXISTING QUOTE DETECTED - BLOCKING duplicate quote"
                );
                shouldSend = false;
                warnings.push(
                    "🚫 EKSISTERENDE TILBUD DETEKTERET",
                    quoteCheck.recommendation,
                    `Sidste tilbud: ${quoteCheck.lastQuoteDate?.toLocaleDateString("da-DK")}`,
                    `Thread ID: ${quoteCheck.threadId}`,
                    "Svar i eksisterende tråd eller vent 7+ dage"
                );
            } else if (quoteCheck.action === "WARN") {
                logger.warn(
                    {
                        customerEmail: lead.email,
                        daysSince: quoteCheck.daysSinceQuote,
                        lastQuoteDate: quoteCheck.lastQuoteDate
                    },
                    "⚠️ Previous quote found - review recommended"
                );
                warnings.push(
                    "⚠️ TIDLIGERE TILBUD FUNDET",
                    quoteCheck.recommendation,
                    `Sidste tilbud: ${quoteCheck.lastQuoteDate?.toLocaleDateString("da-DK")}`,
                    "Tjek om dette er opfølgning eller ny forespørgsel"
                );
                // Allow generation but flag for manual review
            } else {
                logger.info(
                    { customerEmail: lead.email },
                    "✅ No existing quotes found - safe to proceed"
                );
            }

            // SECOND: Check general customer duplicate (for additional context)
            if (quoteCheck.action !== "STOP") {
                duplicateCheck = await checkDuplicateCustomer(lead.email);

                if (duplicateCheck.isDuplicate && duplicateCheck.customer) {
                    logger.info(
                        {
                            customerId: duplicateCheck.customer.id,
                            totalBookings: duplicateCheck.customer.totalBookings,
                            lastContact: duplicateCheck.customer.lastContact
                        },
                        "ℹ️ Existing customer found (but no recent quote)"
                    );

                    // Add info but don't block
                    if (duplicateCheck.customer.totalBookings > 0) {
                        warnings.push(
                            `ℹ️ EKSISTERENDE KUNDE: ${duplicateCheck.customer.totalBookings} tidligere bookinger`,
                            `Sidste kontakt: ${duplicateCheck.customer.lastContact?.toLocaleDateString("da-DK") || "Ukendt"}`
                        );
                    }
                }
            }
        }

        // 🚨 KRITISK: Check for conflicts in original email
        if (originalEmailText) {
            logger.info({ customerEmail: lead.email }, "🔍 Analyzing email for conflicts...");

            conflictResult = analyzeEmailForConflict(originalEmailText);

            if (conflictResult.hasConflict) {
                logger.warn(
                    {
                        severity: conflictResult.severity,
                        score: conflictResult.score,
                        keywordCount: conflictResult.matchedKeywords.length,
                    },
                    `⚠️ CONFLICT DETECTED: ${conflictResult.severity.toUpperCase()}`
                );

                if (conflictResult.autoEscalate) {
                    // Auto-escalate critical/high severity to Jonas
                    logger.error(
                        {
                            leadId: leadId || "unknown",
                            severity: conflictResult.severity,
                            score: conflictResult.score,
                        },
                        "🚨 AUTO-ESCALATING to Jonas - conflict too severe for AI"
                    );

                    // Escalate to Jonas immediately
                    await escalateToJonas(
                        leadId || "unknown",
                        threadId || lead.threadId || "",
                        lead.email || "",
                        conflictResult,
                        "system"
                    );

                    // Block AI auto-response completely
                    shouldSend = false;
                    warnings.push(
                        `🚨 KONFLIKT DETEKTERET - Eskaleret til Jonas`,
                        `Alvorlighed: ${conflictResult.severity.toUpperCase()}`,
                        `Score: ${conflictResult.score}`,
                        `Kræver manuel gennemgang før svar sendes`
                    );
                } else {
                    // Medium/low severity - flag for approval but allow generation
                    logger.warn(
                        {
                            severity: conflictResult.severity,
                            score: conflictResult.score,
                        },
                        "⚠️ Conflict detected - requires manual approval"
                    );

                    warnings.push(
                        `⚠️ KONFLIKT: ${conflictResult.severity} alvorlighed (score: ${conflictResult.score})`,
                        `Kræver godkendelse før afsendelse`
                    );

                    // Require manual approval
                    shouldSend = false;
                }
            } else {
                logger.info(
                    { customerEmail: lead.email },
                    "✅ No conflicts detected - safe to proceed"
                );
            }
        }

        // Fetch available booking slots if requested
        let bookingSlotsContext = "";
        if (includeBookingSlots) {
            bookingSlotsContext = await this.getBookingSlotsContext(
                bookingDuration || 120, // Default 2 hours
                3 // Number of slots to suggest
            );
        }

        const prompt = this.buildPrompt(
            lead,
            responseType,
            additionalContext,
            bookingSlotsContext
        );

        try {
            const llm = this.getLLM();
            const content = await llm.completeChat(
                [
                    {
                        role: "system",
                        content: this.getSystemPrompt(),
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                {
                    model: "gemini-2.0-flash-exp",
                    temperature: 0.7,
                    maxTokens: 800,
                }
            );

            const parsed = this.parseEmailResponse(content);

            // Try compute estimated price for compatibility (min/max)
            let estimatedPrice: { min?: number; max?: number } | undefined;
            try {
                if (lead.squareMeters && lead.taskType && responseType === "tilbud") {
                    const sqm = typeof lead.squareMeters === "string"
                        ? Number.parseFloat(lead.squareMeters)
                        : lead.squareMeters;
                    const priceEstimate: PriceEstimate = estimateCleaningJob(sqm, lead.taskType);
                    estimatedPrice = { min: priceEstimate.priceMin, max: priceEstimate.priceMax };
                }
            } catch {
                // ignore price estimation errors for compatibility
            }

            const result: GeneratedEmailResponse = {
                subject: parsed.subject || this.generateDefaultSubject(lead, responseType),
                body: parsed.body || content,
                to: lead.email || "",
                replyToThreadId: lead.threadId,
                duplicateCheck, // Include duplicate check result (general customer)
                quoteCheck, // Include quote check result (specific quote detection)
                shouldSend, // KRITISK: Flag whether to actually send
                warnings: warnings.length > 0 ? warnings : undefined,
                // Legacy compatibility
                estimatedPrice,
                toEmail: lead.email || undefined,
                shouldCreateNewEmail: undefined,
            };

            // ✅ VALIDATE quote completeness for tilbud emails
            if (responseType === "tilbud" && result.body) {
                const validation = validateQuoteCompleteness(result.body);

                if (!validation.valid) {
                    logger.warn(
                        {
                            leadId: lead.emailId,
                            errors: validation.errors,
                            warnings: validation.warnings
                        },
                        "❌ QUOTE VALIDATION FAILED"
                    );

                    // Add validation errors to warnings
                    const validationReport = formatValidationReport(validation);
                    warnings.push("📋 TILBUD MANGLER INFO:\n" + validationReport);
                    result.warnings = warnings;

                    // 🔧 AUTO-FIX: If price estimate is available, inject missing elements
                    if (validation.errors.length > 0 && lead.squareMeters && lead.taskType) {
                        try {
                            const sqm = typeof lead.squareMeters === "string"
                                ? parseFloat(lead.squareMeters)
                                : lead.squareMeters;
                            const priceEstimate: PriceEstimate = estimateCleaningJob(sqm, lead.taskType);

                            result.body = this.injectMissingQuoteElements(
                                result.body,
                                priceEstimate,
                                validation
                            );

                            // Re-validate after injection
                            const revalidation = validateQuoteCompleteness(result.body);
                            if (revalidation.valid) {
                                logger.info("✅ Auto-fixed quote with missing elements");
                            } else {
                                result.shouldSend = false;
                                warnings.push("🚫 Kan ikke sende - tilbud er ikke komplet!");
                            }
                        } catch (error) {
                            logger.error({ error }, "Failed to auto-fix quote");
                            result.shouldSend = false;
                            warnings.push("🚫 Kan ikke sende - tilbud er ikke komplet!");
                        }
                    } else {
                        result.shouldSend = false;
                        warnings.push("🚫 Kan ikke sende - tilbud er ikke komplet!");
                    }
                } else if (validation.warnings.length > 0) {
                    logger.info(
                        { warnings: validation.warnings },
                        "⚠️ Quote has minor warnings"
                    );
                }
            }

            logger.info(
                {
                    leadId: lead.emailId,
                    subject: result.subject,
                    hasBookingSlots: includeBookingSlots,
                    shouldSend,
                    hasDuplicateWarnings: warnings.length > 0,
                },
                "Email response generated successfully"
            );

            return result;
        } catch (err) {
            logger.error(
                { err, leadId: lead.emailId },
                "Failed to generate email response"
            );
            throw err;
        }
    }

    /**
     * Generate a quick response for common scenarios
     */
    async generateQuickResponse(
        lead: ParsedLead,
        template: "moving" | "regular" | "quote-request",
        includeBookingSlots: boolean = true
    ): Promise<GeneratedEmailResponse> {
        const responseType = this.getResponseTypeFromTemplate(template);
        const additionalContext = this.getTemplateContext(template, lead);

        // Determine booking duration based on template
        let bookingDuration = 120; // Default 2 hours
        if (template === "moving") {
            bookingDuration = 240; // 4 hours for moving
        } else if (template === "regular") {
            bookingDuration = 150; // 2.5 hours for regular cleaning
        }

        return this.generateResponse({
            lead,
            responseType,
            additionalContext,
            includeBookingSlots,
            bookingDuration,
        });
    }

    /**
     * Build the prompt for the LLM
     * 
     * UPDATED: Includes automatic price calculation from MEMORY_1, MEMORY_14
     */
    private buildPrompt(
        lead: ParsedLead,
        responseType: string,
        additionalContext?: string,
        bookingSlotsContext?: string
    ): string {
        const parts: string[] = [];

        parts.push("**LEAD INFORMATION:**");
        parts.push(`- Navn: ${lead.name || "Ikke oplyst"}`);
        parts.push(`- Email: ${lead.email || "Ikke oplyst"}`);
        parts.push(`- Telefon: ${lead.phone || "Ikke oplyst"}`);
        parts.push(`- Adresse: ${lead.address || "Ikke oplyst"}`);
        parts.push(`- Boligtype: ${lead.propertyType || "Ikke oplyst"}`);
        if (lead.squareMeters) {
            parts.push(`- Størrelse: ${lead.squareMeters} m²`);
        }
        if (lead.rooms) {
            parts.push(`- Værelser: ${lead.rooms}`);
        }
        parts.push(`- Behov: ${lead.taskType || "Ikke oplyst"}`);
        parts.push(`- Kilde: ${lead.source}`);
        parts.push("");

        // 💰 AUTOMATIC PRICE CALCULATION
        if (lead.squareMeters && lead.taskType && responseType === "tilbud") {
            try {
                const sqm = typeof lead.squareMeters === "string"
                    ? parseFloat(lead.squareMeters)
                    : lead.squareMeters;

                const priceEstimate: PriceEstimate = estimateCleaningJob(sqm, lead.taskType);

                parts.push("**PRISESTIMAT (BRUG PRÆCIS DETTE I TILBUDDET):**");
                parts.push(`- Opgave: ${priceEstimate.taskType}`);
                parts.push(`- Størrelse: ${priceEstimate.sqm}m²`);
                parts.push(`- Medarbejdere: ${priceEstimate.workers} personer`);
                parts.push(`- Estimeret tid: ${priceEstimate.hoursOnSite} timer på stedet`);
                parts.push(`- Arbejdstimer total: ${priceEstimate.workHoursTotal} timer (${priceEstimate.workers} × ${priceEstimate.hoursOnSite})`);
                parts.push(`- Timepris: ${priceEstimate.hourlyRate}kr/time/person inkl. moms`);
                parts.push(`- Pris: ca.${priceEstimate.priceMin.toLocaleString("da-DK")}-${priceEstimate.priceMax.toLocaleString("da-DK")}kr inkl. moms`);
                parts.push("");
                parts.push("🚨 KRITISK - INKLUDER ALLE DISSE I EMAILEN:");
                parts.push(`✅ Skriv "${priceEstimate.workers} personer" eller "${priceEstimate.workers} medarbejdere"`);
                parts.push(`✅ Skriv "${priceEstimate.hoursOnSite} timer på stedet"`);
                parts.push(`✅ Skriv "${priceEstimate.workHoursTotal} arbejdstimer total" eller "${priceEstimate.workHoursTotal} arbejdstimer"`);
                parts.push(`✅ Skriv "349kr" eller "349kr/time/person"`);
                parts.push(`✅ Skriv "Du betaler kun faktisk tidsforbrug"`);
                parts.push(`✅ Skriv "Vi ringer ved +1 time overskridelse" eller "kontakter vi dig ved +1 time ekstra"`);
                parts.push("");

                if (priceEstimate.warnings && priceEstimate.warnings.length > 0) {
                    parts.push("**ADVARSLER (intern info - nævn IKKE i email):**");
                    for (const warning of priceEstimate.warnings) {
                        parts.push(`  ${warning}`);
                    }
                    parts.push("");
                }
            } catch (error) {
                logger.error({ error, lead }, "Failed to calculate price estimate");
            }
        }

        parts.push("**OPGAVE:**");
        parts.push(`Generer en ${responseType} email til ${lead.name || "kunden"}.`);
        parts.push("");

        if (additionalContext) {
            parts.push("**EKSTRA KONTEKST:**");
            parts.push(additionalContext);
            parts.push("");
        }

        if (bookingSlotsContext) {
            parts.push("**LEDIGE TIDSPUNKTER:**");
            parts.push(bookingSlotsContext);
            parts.push("Inkluder disse ledige tidspunkter i emailen på en naturlig måde.");
            parts.push("Inviter kunden til at vælge et tidspunkt eller foreslå et alternativ.");
            parts.push("");
        }

        parts.push("**FORMAT:**");
        parts.push("SUBJECT: [Skriv emnet her]");
        parts.push("");
        parts.push("BODY:");
        parts.push("[Skriv email-indholdet her]");
        parts.push("");
        parts.push("**VIGTIGE RETNINGSLINJER:**");
        parts.push("- Brug dansk sprog");
        parts.push("- Vær professionel men venlig");
        parts.push("- Inkluder relevante detaljer fra lead-informationen");
        parts.push("- Afslut med kontaktoplysninger: +45 22 65 02 26, info@rendetalje.dk");
        parts.push("- Brug Rendetalje.dk som virksomhedsnavn");
        parts.push("- Hvis du giver tilbud, vær specifik om pris og tidsestimat");

        return parts.join("\n");
    }

    /**
     * Get system prompt for email generation
     */
    private getSystemPrompt(): string {
        return `Du er en professionel kundeservicemedarbejder hos Rendetalje.dk, 
et rengøringsfirma i Aarhus-området. Din opgave er at generere venlige, 
professionelle og hjælpsomme email-svar til kunder og leads.

Rendetalje.dk tilbyder:
- Fast rengøring (ugentlig/14-dages interval)
- Flytterengøring
- Erhvervsrengøring
- Vinduespudsning

VIGTIGT - BRUG ALTID DENNE PRISMODEL:
- 349 kr/time/person inkl. moms
- Personer × Timer på stedet = Arbejdstimer total
- Eksempel: 2 personer i 4 timer = 8 arbejdstimer = 2.792kr
- Minimum booking: 2 timer
- ALDRIG nævn gamle priser (250-300kr) - de er forkerte!

💡 PRICING STRATEGI (konkurrencedygtig):
- For små jobs (<60m²): Fremhæv MINIMUM prisen først (priceMin)
- For store jobs (>80m²): Vis intervallet priceMin-priceMax
- ALTID forklar: "Du betaler kun faktisk tidsforbrug"
- EKSEMPEL (56m²): "ca. 1.400-2.100kr" IKKE bare "2.100kr"

Kontaktinfo:
- Telefon: +45 22 65 02 26
- Email: info@rendetalje.dk
- Hjemmeside: www.rendetalje.dk
- MobilePay: 71759
- Bank: 6695-2002056146

📋 STANDARDISERET TILBUDSFORMAT (BRUG PRÆCIS DETTE TIL ALLE TILBUD):

Hej [navn]!

Tak for din henvendelse om [opgavetype].

📏 **Bolig**: [X]m² med [Y] værelser/rum
👥 **Medarbejdere**: [Z] personer
⏱️ **Estimeret tid**: [A] timer på stedet
⏱️ **Arbejdstimer total**: [B] arbejdstimer ([Z] personer × [A] timer)
💰 **Pris**: 349kr/time/person = ca.[min]-[max]kr inkl. moms

📅 **Ledige tider**: [konkrete datoer fra kalender hvis tilgængelig]

💡 **Du betaler kun faktisk tidsforbrug**
Estimatet er vejledende. Hvis opgaven tager længere tid, betaler du kun for den faktiske tid brugt.

📞 **Vi ringer ved +1 time overskridelse**
Hvis opgaven tager mere end 1 time ekstra over estimatet, ringer vi til dig inden vi fortsætter.

Lyder det godt? Svar gerne med din foretrukne dato, så booker jeg det i kalenderen.

Mvh,
Jonas - Rendetalje.dk

---

🚨 KRITISKE REGLER (OVERHOLD PRÆCIST I ALLE TILBUD):

1. ✅ SKAL VISE "arbejdstimer total" (IKKE kun timer på stedet)
   - RIGTIGT: "2 personer × 4 timer = 8 arbejdstimer total"
   - FORKERT: "4 timer på stedet" (mangler "arbejdstimer total"!)
   - Brug PRÆCIS ordene "arbejdstimer" eller "arbejdstimer total"
   
2. ✅ SKAL ANGIVE antal "personer" eller "medarbejdere"
   - RIGTIGT: "2 personer" eller "2 medarbejdere"
   - FORKERT: At udelade antal personer (dette = Cecilie inkasso!)
   
3. ✅ SKAL NÆVNE "+1 time" overskridelse reglen
   - RIGTIGT: "+1 time" eller "1 time ekstra" eller "1 time over"
   - FORKERT: "+3-5 timer" eller helt udeladt
   
4. ✅ SKAL LOVE at "ringer" eller "kontakter" ved overskridelse
   - RIGTIGT: "ringer vi til dig" eller "kontakter vi dig"
   - FORKERT: At ikke nævne at vi kontakter kunden
   
5. ✅ SKAL FORKLARE "kun faktisk" tidsforbrug
   - RIGTIGT: "Du betaler kun faktisk tidsforbrug"
   - Forebygger konflikter som Cecilie/Amalie-situationerne
   
6. ✅ SKAL BRUGE korrekt pris: "349kr" eller "349" (IKKE gamle priser)
   - RIGTIGT: "349kr/time/person"
   - FORKERT: "300kr" eller "250-300kr"
   
7. ✅ HVIS pricing info er tilgængelig i prompten - BRUG DEN PRÆCIST
   - Lav ikke dine egne beregninger
   
8. ✅ TILBYD konkrete tidspunkter hvis kalenderinfo er tilgængelig

🚨 **HVIS VIGTIG INFO MANGLER:**

Hvis PRISESTIMAT ikke er i prompten, betyder det at m² eller opgavetype mangler:
- ALDRIG brug placeholders som [Ukendt], [X], [Y] i emailen til kunden
- ALDRIG gæt eller udregn priser selv - det fører til fejl
- I STEDET: Spørg venligt om manglende info og forklar at vi skal bruge det for at give præcist tilbud

Eksempel ved manglende data:
"Hej [navn]! Tak for din henvendelse. For at give dig et præcist tilbud, har jeg brug for: 
- Boligens størrelse i m² 
- Antal værelser 
Så sender jeg et konkret tilbud med pris og ledige tider. Mvh, Jonas"

Brug emoji sparsomt (3-5 er ok i et tilbud).`;
    }

    /**
     * Parse the LLM response into subject and body
     */
    private parseEmailResponse(content: string): {
        subject: string | null;
        body: string | null;
    } {
        const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
        const bodyMatch = content.match(/BODY:\s*(.+)/is);

        let subject = subjectMatch ? subjectMatch[1].trim() : null;
        let body = bodyMatch ? bodyMatch[1].trim() : null;

        // Clean up subject - remove quotes if present
        if (subject) {
            subject = subject.replace(/^["']|["']$/g, "");
        }

        return { subject, body };
    }

    /**
     * Generate a default subject line
     */
    private generateDefaultSubject(lead: ParsedLead, responseType: string): string {
        const name = lead.name || "kunde";

        switch (responseType) {
            case "tilbud":
                return `Tilbud på ${lead.taskType || "rengøring"} - ${name}`;
            case "bekræftelse":
                return `Bekræftelse af din henvendelse - ${name}`;
            case "follow-up":
                return `Opfølgning på din henvendelse om rengøring`;
            case "info":
                return `Yderligere information om vores rengøringsydelser`;
            default:
                return `Din henvendelse til Rendetalje.dk`;
        }
    }

    /**
     * Get response type from template name
     */
    private getResponseTypeFromTemplate(
        template: "moving" | "regular" | "quote-request"
    ): "tilbud" | "bekræftelse" | "follow-up" | "info" {
        switch (template) {
            case "moving":
                return "tilbud";
            case "regular":
                return "tilbud";
            case "quote-request":
                return "tilbud";
            default:
                return "info";
        }
    }

    /**
     * Get available booking slots context for email
     * @param durationMinutes - Duration of booking in minutes
     * @param numberOfSlots - Number of alternative slots to find (default 3)
     * @returns Formatted string with available booking times in Danish
     */
    private async getBookingSlotsContext(
        durationMinutes: number,
        numberOfSlots: number = 3
    ): Promise<string> {
        try {
            const slots: Array<{ start: string; end: string }> = [];
            let searchStart = new Date();

            // Find multiple available slots
            for (let i = 0; i < numberOfSlots; i++) {
                const slot = await findNextAvailableSlot(
                    "primary",
                    durationMinutes,
                    searchStart,
                    14 // Search within 14 days
                );

                if (!slot) {
                    logger.warn(
                        { slotsFound: slots.length, requested: numberOfSlots },
                        "Could not find all requested booking slots"
                    );
                    break;
                }

                slots.push(slot);

                // Move search start to after this slot to find next available time
                searchStart = new Date(slot.end);
                searchStart.setMinutes(searchStart.getMinutes() + 60); // Add 1 hour buffer
            }

            if (slots.length === 0) {
                logger.warn("No available booking slots found");
                return "Ingen ledige tidspunkter tilgængelige i øjeblikket. Vi kontakter dig for at finde en passende tid.";
            }

            // Format slots in Danish
            const formatter = new Intl.DateTimeFormat("da-DK", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Copenhagen",
            });

            const formattedSlots = slots.map((slot, index) => {
                const startDate = new Date(slot.start);
                const formattedDate = formatter.format(startDate);
                // Capitalize first letter
                return `${index + 1}. ${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)}`;
            });

            logger.info(
                { slotsFound: slots.length, durationMinutes },
                "Found available booking slots"
            );

            return `Vi har ledige tidspunkter:\n${formattedSlots.join("\n")}`;
        } catch (err) {
            logger.error({ err }, "Failed to fetch booking slots");
            return ""; // Return empty string on error - email can still be generated without slots
        }
    }

    /**
     * Inject missing critical quote elements into email body
     * 
     * This is a fallback to ensure all validation rules are met
     * even if LLM doesn't follow instructions perfectly
     */
    private injectMissingQuoteElements(
        originalBody: string,
        priceEstimate: PriceEstimate,
        validation: ReturnType<typeof validateQuoteCompleteness>
    ): string {
        let body = originalBody;

        // Build missing elements section
        const missingParts: string[] = [];

        // Check what's missing and add it
        if (validation.errors.some(e => e.includes("arbejdstimer"))) {
            missingParts.push(`⏱️ Arbejdstimer total: ${priceEstimate.workHoursTotal} arbejdstimer (${priceEstimate.workers} personer × ${priceEstimate.hoursOnSite} timer)`);
        }

        if (validation.errors.some(e => e.includes("personer") || e.includes("medarbejdere"))) {
            missingParts.push(`👥 Medarbejdere: ${priceEstimate.workers} personer`);
        }

        if (validation.errors.some(e => e.includes("+1"))) {
            missingParts.push(`\n📞 **Vi ringer ved +1 time overskridelse**`);
            missingParts.push(`Hvis opgaven tager mere end 1 time ekstra over estimatet, ringer vi til dig inden vi fortsætter.`);
        }

        if (validation.errors.some(e => e.includes("ringer") || e.includes("kontakter"))) {
            missingParts.push(`\n📞 Vi kontakter dig ved eventuelle ændringer.`);
        }

        if (validation.errors.some(e => e.includes("faktisk"))) {
            missingParts.push(`\n💡 **Du betaler kun faktisk tidsforbrug**`);
            missingParts.push(`Estimatet er vejledende. Hvis opgaven tager længere tid, betaler du kun for den faktiske tid brugt.`);
        }

        if (validation.errors.some(e => e.includes("349"))) {
            missingParts.push(`💰 Timepris: 349kr/time/person inkl. moms`);
        }

        // Inject missing parts before signature
        if (missingParts.length > 0) {
            const signature = /Mvh,?\s*\n.*Rendetalje/i;
            const injectedSection = "\n\n" + missingParts.join("\n") + "\n";

            if (signature.test(body)) {
                body = body.replace(signature, injectedSection + "\nMvh,\nJonas - Rendetalje.dk");
            } else {
                // Append to end if no signature found
                body += injectedSection;
            }
        }

        return body;
    }

    /**
     * Get template-specific context
     */
    private getTemplateContext(
        template: "moving" | "regular" | "quote-request",
        lead: ParsedLead
    ): string {
        switch (template) {
            case "moving":
                return `Dette er en flytterengøring. 
Giv et konkret tilbud baseret på boligens størrelse (${lead.squareMeters || "150"} m²).
Typisk pris: 300 kr/time, estimeret 4-6 timer for en villa.
Inkluder information om hvad der er inkluderet i flytterengøringen.`;

            case "regular":
                return `Dette er en henvendelse om fast rengøring.
Giv et tilbud på ugentlig eller 14-dages rengøring.
Typisk pris: 250-300 kr/time, 2-3 timer per besøg.
Spørg om ønsket frekvens og hvilke områder der skal rengøres.`;

            case "quote-request":
                return `Kunden ønsker et uforpligtende tilbud.
Giv en prisindikation baseret på de oplyste detaljer.
Inviter til en gratis besigtigelse hvis nødvendigt.`;

            default:
                return "";
        }
    }
}

// Provide a default singleton for convenience and backward compatibility in tests/tools
export const emailResponseGenerator = new EmailResponseGenerator();

/**
 * Apply appropriate label after email action
 * 
 * Workflow labels based on action:
 * - Quote sent → "quote_sent"
 * - Booking confirmed → "booked"
 * - Follow-up needed → "follow_up_needed"
 * - Job completed → "completed"
 * 
 * @param threadId - Gmail thread ID
 * @param action - Type of action performed
 * @param reason - Optional reason for logging
 * @returns True if label applied successfully
 */
export async function applyEmailActionLabel(
    threadId: string | undefined,
    action: "quote_sent" | "booked" | "follow_up_needed" | "completed",
    reason?: string
): Promise<boolean> {
    if (!threadId) {
        logger.warn({ action }, "⚠️ Cannot apply label - no thread ID provided");
        return false;
    }

    try {
        logger.info(
            { threadId, action, reason },
            `🏷️ Applying ${action} label after email action`
        );

        const result = await applyLabelToThread(
            threadId,
            action,
            reason || `Email action: ${action}`
        );

        if (result.success) {
            logger.info(
                {
                    threadId,
                    action,
                    labelName: result.labelName,
                    labelId: result.labelId
                },
                `✅ Label applied successfully: ${action}`
            );
            return true;
        } else {
            logger.warn(
                { threadId, action, error: result.error },
                `⚠️ Failed to apply label: ${result.error}`
            );
            return false;
        }
    } catch (error) {
        logger.error(
            { threadId, action, error },
            "❌ Error applying email action label"
        );
        return false;
    }
}
