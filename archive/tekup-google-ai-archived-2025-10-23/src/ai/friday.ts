/**
 * 🤖 Friday AI - RenOS Intelligent Assistant
 * 
 * Friday er en professionel dansk rengøringsassistent der hjælper med:
 * - Lead håndtering og opfølgning
 * - Booking og kalender styring
 * - Kunde information og historik
 * - Tilbud og prisberegning
 * - Generel hjælp og vejledning
 * 
 * Personlighed: Venlig, professionel, kompetent, dansk
 */

import type { ChatMessage } from "../types";
import { getRecentLeads } from "../services/leadMonitor";
import { getAutoResponseService } from "../services/emailAutoResponseService";
import {
    findNextAvailableSlot,
    listUpcomingEvents
} from "../services/calendarService";
import { logger } from "../logger";
import type { LLMProvider } from "../llm/llmProvider";
import {
    getCurrentDateTime,
    formatDateTimeDanish,
    addDays,
    type CurrentDateTime
} from "../services/dateTimeService";

export interface FridayContext {
    intent?: string;
    confidence?: number;
    userMessage: string;
    history: ChatMessage[];
}

export interface FridayResponse {
    message: string;
    suggestions?: string[];
    data?: unknown;
}

/**
 * Friday AI System Prompt - Definerer personlighed og adfærd
 * Bruges til LLM integration for naturlig samtale
 */
export const FRIDAY_SYSTEM_PROMPT = `Du er Friday, en professionel dansk AI-assistent for Rendetalje - en rengøringsfirma.

🎯 DIN ROLLE:
- Hjælpe med leads, bookinger, kunder og tilbud
- Besvare spørgsmål om RenOS systemet
- Guide brugeren til de rigtige funktioner
- Være venlig, professionel og hjælpsom

💬 DIN KOMMUNIKATIONSSTIL:
- Brug dansk sprog naturligt og korrekt
- Vær kortfattet og præcis (max 3-4 linjer for simple svar)
- Brug emojis sparsomt og professionelt (📧 📅 👤 💰 ✅)
- Vær positiv og løsningsorienteret
- Undgå robotagtig eller for formel tone
- Tilpas dit svar til konteksten - vær mere detaljeret når det er nødvendigt
- Brug personlige henvendelser og vær imødekommende

📊 HVAD DU KAN HJÆLPE MED:
1. **Leads** - Vis seneste leads, søg i leads, lead statistik, lead opfølgning
2. **Email Auto-Response** - Se ventende emails, godkend/afvis, send automatiske svar
3. **Kalender & Booking** - Find ledige tider, book møder, tjek tilgængelighed, flyt aftaler
4. **Kunder** - Søg kunder, vis kunde historik, kunde information, kunde kommunikation
5. **Tilbud** - Lav tilbud, send tilbud, tilbuds historik, prisberegning
6. **Statistik** - Dashboard, omsætning, performance metrics, trends
7. **Generel hjælp** - Vejledning, tips, forklaring af funktioner, troubleshooting

🧠 INTELLIGENT ADFÆRD:
- Husk tidligere samtaler og byg på dem
- Foreslå proaktive handlinger baseret på data
- Giv kontekstuelle råd og anbefalinger
- Identificer mønstre og trends i data
- Tilbyd relevante follow-up spørgsmål

❌ HVAD DU IKKE KAN:
- Ændre priser eller kontraktvilkår
- Få adgang til andre firmers data
- Lave betalinger eller transaktioner
- Slette kunde data uden godkendelse

🎨 FORMATERING:
- Brug **fed** til vigtige nøgleord
- Brug lister med • for flere punkter
- Brug numre (1. 2. 3.) for trin-for-trin guides
- Brug line breaks for læsbarhed
- Brug tabeller for strukturerede data når relevant

💡 PROAKTIVE FORSLAG:
- Hvis du ser mønstre i data, påpeg dem
- Foreslå optimeringsmuligheder
- Giv tips til bedre workflow
- Påmind om vigtige opgaver eller deadlines

VIGTIG: Hvis brugeren spørger om noget du ikke kan hjælpe med, vær ærlig og suggest hvad du KAN hjælpe med i stedet. Vær altid løsningsorienteret og hjælpsom.`;

/**
 * Friday AI - Håndterer naturlige samtaler og returnerer intelligente svar
 */
export class FridayAI {
    private llm?: LLMProvider;

    constructor(llmProvider?: LLMProvider) {
        this.llm = llmProvider;
        if (llmProvider) {
            logger.info("Friday AI initialized with LLM provider");
        } else {
            logger.warn("Friday AI initialized without LLM - using heuristic responses");
        }
    }

    /**
     * Main entry point - responds to user messages
     */
    async respond(context: FridayContext): Promise<FridayResponse> {
        try {
            // Use LLM if available, otherwise fall back to heuristics
            if (this.llm) {
                return await this.respondWithLLM(context);
            } else {
                return await this.respondWithHeuristics(context);
            }
        } catch (error) {
            logger.error({ error }, "Friday AI response failed");
            return {
                message: "Beklager, jeg har tekniske problemer lige nu. Prøv venligst igen om lidt. 🤖",
                suggestions: ["Prøv igen", "Kontakt support", "Se hjælp"]
            };
        }
    }

    /**
     * Respond using LLM for natural conversation
     */
    private async respondWithLLM(context: FridayContext): Promise<FridayResponse> {
        if (!this.llm) {
            return this.respondWithHeuristics(context);
        }

        try {
            // Build enriched context with current data
            const enrichedContext = await this.buildEnrichedContext(context.intent);
            const conversationContext = this.getConversationContext(context.history);
            const currentTime = getCurrentDateTime();
            const timeContext = this.buildTimeContext(currentTime);

            // Build comprehensive context for better AI responses
            const systemPrompt = `${FRIDAY_SYSTEM_PROMPT}

📊 AKTUEL KONTEKST:
${timeContext}

${enrichedContext}

💬 SAMTALE HISTORIK:
${conversationContext}

🎯 BRUGERENS INTENT: ${context.intent || 'ukendt'} (confidence: ${context.confidence || 0})

VIGTIG: Brug ovenstående kontekst til at give et intelligent, relevant og hjælpsomt svar. Hvis du kan se mønstre eller trends i dataene, så nævn dem. Vær proaktiv med forslag og anbefalinger.`;

            const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
                { role: "system", content: systemPrompt }
            ];

            // Add recent conversation history for better context
            const recentHistory = context.history.slice(-6); // Last 6 messages for context
            for (const msg of recentHistory) {
                if (msg.role === "user" || msg.role === "assistant") {
                    messages.push({
                        role: msg.role,
                        content: msg.content,
                    });
                }
            }

            // Add current user message
            messages.push({
                role: "user",
                content: context.userMessage,
            });

            const response = await this.llm.completeChat(messages, {
                temperature: 0.7,
                maxTokens: 800,
            });

            return {
                message: response,
                suggestions: this.generateSuggestions(context.intent),
            };
        } catch (error) {
            logger.error({ error }, "LLM response failed, falling back to heuristics");
            return this.respondWithHeuristics(context);
        }
    }

    /**
     * Fallback heuristic responses when LLM is not available
     */
    private async respondWithHeuristics(context: FridayContext): Promise<FridayResponse> {
        const { intent, userMessage, history } = context;

        try {
            switch (intent) {
                case "lead":
                    return this.handleLeadQuery(userMessage);
                case "email":
                    return this.handleEmailResponse(userMessage);
                case "booking":
                    return this.handleBookingQuery(userMessage);
                case "availability":
                    return await this.handleAvailabilityQuery(userMessage);
                case "reschedule":
                    return this.handleRescheduleQuery(userMessage);
                case "greeting":
                    return this.handleGreeting(userMessage);
                case "help":
                    return this.handleHelpRequest(userMessage);
                case "analytics":
                    return this.handleAnalyticsQuery(userMessage);
                default:
                    return this.handleUnknownIntent(userMessage, history);
            }
        } catch (error) {
            logger.error({ error }, "Heuristic response failed");
            return {
                message: "Beklager, jeg kunne ikke forstå din forespørgsel. Kan du prøve at omformulere? 🤔",
                suggestions: ["Vis leads", "Book møde", "Se kalender", "Hjælp"]
            };
        }
    }

    /**
     * Build enriched context with current system data
     */
    private async buildEnrichedContext(intent?: string): Promise<string> {
        const contexts: string[] = [];

        try {
            // Add lead information if relevant
            if (!intent || intent === "lead" || intent === "analytics") {
                try {
                    const recentLeads = getRecentLeads(5);
                    if (recentLeads.length > 0) {
                        contexts.push(`📋 SENESTE LEADS (${recentLeads.length}):
${recentLeads.map(lead => `• ${lead.name ?? "Ukendt"} - ${lead.source} (${lead.taskType ?? "N/A"})`).join('\n')}`);
                    }
                } catch {
                    logger.warn("Could not fetch recent leads for context");
                }
            }

            // Add calendar information if relevant
            if (!intent || intent === "booking" || intent === "availability") {
                try {
                    const upcomingEvents = await listUpcomingEvents({ maxResults: 3 });
                    if (upcomingEvents.length > 0) {
                        contexts.push(`📅 KOMMENDE AFTALER (${upcomingEvents.length}):
${upcomingEvents.map(event => `• ${event.summary ?? "Uden titel"} - ${formatDateTimeDanish(new Date(event.start))}`).join('\n')}`);
                    }
                } catch {
                    logger.warn("Could not fetch calendar events for context");
                }
            }

            // Add email information if relevant
            if (!intent || intent === "email") {
                try {
                    const autoResponseService = getAutoResponseService();
                    const pendingResponses = autoResponseService.getPendingResponses();
                    if (pendingResponses.length > 0) {
                        contexts.push(`📧 VENTENDE EMAILS (${pendingResponses.length}):
${pendingResponses.slice(0, 3).map(item => `• Til: ${item.response.to} - ${item.response.subject}`).join('\n')}`);
                    }
                } catch {
                    logger.warn("Could not fetch pending emails for context");
                }
            }

        } catch (_error) {
            logger.error({ error: _error }, "Failed to build enriched context");
        }

        return contexts.length > 0 ? contexts.join('\n\n') : "Ingen aktuel data tilgængelig.";
    }

    /**
     * Generate contextual suggestions based on intent
     */
    private generateSuggestions(intent?: string): string[] {
        switch (intent) {
            case "lead":
                return ["Vis alle leads", "Opret nyt lead", "Lead statistik"];
            case "email":
                return ["Se ventende emails", "Send auto-svar", "Email indstillinger"];
            case "booking":
                return ["Book nyt møde", "Se kalender", "Find ledig tid"];
            case "analytics":
                return ["Dashboard", "Månedlig rapport", "Lead konvertering"];
            default:
                return ["Vis leads", "Book møde", "Se kalender", "Hjælp"];
        }
    }

    /**
     * Handle analytics and dashboard queries
     */
    private handleAnalyticsQuery(message: string): FridayResponse {
        if (message.toLowerCase().includes("dashboard") || message.toLowerCase().includes("statistik")) {
            return {
                message: "📊 **Dashboard og Statistik**\n\nHer kan du se:\n• Lead konvertering og trends\n• Månedlig omsætning\n• Booking statistik\n• Performance metrics\n\nHvad vil du gerne se nærmere på?",
                suggestions: ["Lead statistik", "Omsætning", "Booking trends", "Performance"]
            };
        }

        return {
            message: "📈 Jeg kan hjælpe med forskellige analyser og rapporter. Hvad vil du gerne vide om din forretning?",
            suggestions: ["Dashboard", "Lead statistik", "Omsætning", "Trends"]
        };
    }

    /**
     * Handle lead-related queries
     */
    private getLeadsResponse(): FridayResponse {
        return {
            message: "📋 **Lead Oversigt**\n\nJeg kan hjælpe dig med:\n• Se seneste leads\n• Søge i leads\n• Lead statistik\n• Opfølgning på leads\n\nHvad vil du gerne gøre?",
            suggestions: ["Vis seneste leads", "Søg leads", "Lead statistik", "Opfølgning"],
            data: {
                action: "show_leads",
                filters: {}
            }
        };
    }

    private handleLeadQuery(_message: string): FridayResponse {
        return this.getLeadsResponse();
    }

    /**
     * Handle email auto-response queries
     */
    private handleEmailResponse(message: string): FridayResponse {
        if (message.toLowerCase().includes("godkend") || message.toLowerCase().includes("afvis")) {
            return {
                message: "📧 **Email Godkendelse**\n\nJeg kan hjælpe dig med at:\n• Se ventende emails\n• Godkende auto-svar\n• Afvise emails\n• Ændre email indstillinger\n\nHvad vil du gerne gøre?",
                suggestions: ["Se ventende emails", "Godkend alle", "Email indstillinger"]
            };
        }

        return {
            message: "📧 **Email Auto-Response**\n\nJeg kan hjælpe med:\n• Ventende emails der skal godkendes\n• Automatiske svar til kunder\n• Email indstillinger og regler\n\nHvad har du brug for hjælp til?",
            suggestions: ["Ventende emails", "Auto-svar", "Email regler", "Indstillinger"]
        };
    }

    /**
     * Handle booking queries
     */
    private handleBookingQuery(_message: string): FridayResponse {
        return {
            message: "📅 **Booking & Kalender**\n\nJeg kan hjælpe med:\n• Book nye møder\n• Se kalender oversigt\n• Finde ledige tider\n• Flytte aftaler\n\nHvad vil du gerne gøre?",
            suggestions: ["Book møde", "Se kalender", "Find ledig tid", "Flyt aftale"]
        };
    }

    /**
     * Handle availability queries with actual calendar integration
     */
    private async handleAvailabilityQuery(message: string): Promise<FridayResponse> {
        try {
            if (message.toLowerCase().includes("i morgen")) {
                return await this.findTomorrowAvailability();
            }

            if (message.toLowerCase().includes("eftermiddag")) {
                return await this.findAfternoonAvailability();
            }

            // Default availability check
            const DEFAULT_CALENDAR_ID = 'primary';
            const DEFAULT_DURATION = 120; // 2 hours
            const nextSlot = await findNextAvailableSlot(DEFAULT_CALENDAR_ID, DEFAULT_DURATION);
            if (nextSlot) {
                return {
                    message: `⏰ **Næste ledige tid:**\n\n📅 ${formatDateTimeDanish(new Date(nextSlot.start))}\n\nSkal jeg booke denne tid til dig?`,
                    suggestions: ["Book denne tid", "Find anden tid", "Se hele kalender"]
                };
            }

            return {
                message: "📅 Jeg tjekker kalenderen for ledige tider...\n\nHvornår har du brug for en aftale?",
                suggestions: ["I morgen", "Denne uge", "Næste uge", "Eftermiddag"]
            };
        } catch (error) {
            logger.error({ error }, "Failed to check availability");
            return {
                message: "📅 Beklager, jeg kunne ikke tjekke kalenderen lige nu. Prøv venligst igen.",
                suggestions: ["Prøv igen", "Se kalender", "Kontakt support"]
            };
        }
    }

    /**
     * Handle reschedule queries
     */
    private handleRescheduleQuery(_message: string): FridayResponse {
        return {
            message: "🔄 **Flyt Aftale**\n\nFor at flytte en aftale har jeg brug for:\n• Hvilken aftale skal flyttes?\n• Hvornår skal den flyttes til?\n\nKan du give mig disse oplysninger?",
            suggestions: ["Se kommende aftaler", "Find ny tid", "Annuller aftale"]
        };
    }

    /**
     * Handle greeting messages
     */
    private handleGreeting(_message: string): FridayResponse {
        const greetings = [
            "Hej! 👋 Jeg er Friday, din AI-assistent. Hvordan kan jeg hjælpe dig i dag?",
            "Goddag! 😊 Hvad kan jeg hjælpe dig med?",
            "Hej der! 🤖 Jeg er klar til at hjælpe. Hvad skal vi arbejde med?",
        ];

        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

        return {
            message: randomGreeting,
            suggestions: ["Vis leads", "Book møde", "Se emails", "Dashboard"]
        };
    }

    /**
     * Handle help requests
     */
    private handleHelpRequest(_message: string): FridayResponse {
        return {
            message: "🆘 **Hjælp & Vejledning**\n\nJeg kan hjælpe dig med:\n• **Leads** - Håndtering og opfølgning\n• **Booking** - Kalender og aftaler\n• **Emails** - Auto-svar og godkendelse\n• **Statistik** - Dashboard og rapporter\n\nHvad vil du gerne lære mere om?",
            suggestions: ["Lead hjælp", "Booking hjælp", "Email hjælp", "Dashboard hjælp"]
        };
    }

    /**
     * Find availability for tomorrow
     */
    private async findTomorrowAvailability(): Promise<FridayResponse> {
        try {
            const tomorrow = addDays(new Date(), 1);
            const DEFAULT_CALENDAR_ID = 'primary';
            const DEFAULT_DURATION = 120;
            const nextSlot = await findNextAvailableSlot(DEFAULT_CALENDAR_ID, DEFAULT_DURATION, tomorrow);

            if (nextSlot) {
                return {
                    message: `📅 **Ledig tid i morgen:**\n\n⏰ ${formatDateTimeDanish(new Date(nextSlot.start))}\n\nDenne tid er ledig. Skal jeg booke den?`,
                    suggestions: ["Book denne tid", "Find anden tid", "Se hele dagen"]
                };
            } else {
                return {
                    message: "📅 **I morgen ser desværre fyldt ud.**\n\nJeg kan tjekke andre dage for dig. Hvornår passer det dig?",
                    suggestions: ["Overmorgen", "Denne uge", "Næste uge", "Se kalender"]
                };
            }
        } catch (error) {
            logger.error({ error }, "Failed to find tomorrow availability");
            return {
                message: "📅 Beklager, jeg kunne ikke tjekke morgendagens kalender. Prøv venligst igen.",
                suggestions: ["Prøv igen", "Se kalender", "Book manuelt"]
            };
        }
    }

    /**
     * Find afternoon availability
     */
    private async findAfternoonAvailability(): Promise<FridayResponse> {
        try {
            // Look for slots after 12:00
            const today = new Date();
            const afternoonStart = new Date(today);
            afternoonStart.setHours(12, 0, 0, 0);

            const DEFAULT_CALENDAR_ID = 'primary';
            const DEFAULT_DURATION = 120;
            const nextSlot = await findNextAvailableSlot(DEFAULT_CALENDAR_ID, DEFAULT_DURATION, afternoonStart);

            if (nextSlot && new Date(nextSlot.start).getHours() >= 12) {
                return {
                    message: `🌅 **Ledig eftermiddagstid:**\n\n⏰ ${formatDateTimeDanish(new Date(nextSlot.start))}\n\nDenne eftermiddagstid er ledig. Skal jeg booke den?`,
                    suggestions: ["Book denne tid", "Find senere tid", "Se hele eftermiddag"]
                };
            } else {
                return {
                    message: "🌅 **Ingen ledige eftermiddagstider i dag.**\n\nJeg kan tjekke i morgen eller andre dage. Hvad foretrækker du?",
                    suggestions: ["I morgen eftermiddag", "Næste dag", "Se kalender", "Formiddag"]
                };
            }
        } catch (error) {
            logger.error({ error }, "Failed to find afternoon availability");
            return {
                message: "📅 Beklager, jeg kunne ikke tjekke eftermiddagstider. Prøv venligst igen.",
                suggestions: ["Prøv igen", "Se kalender", "Book manuelt"]
            };
        }
    }

    /**
     * Get conversation context from chat history
     */
    private getConversationContext(history: ChatMessage[]): string {
        if (!history || history.length === 0) {
            return "Ingen tidligere samtale.";
        }

        const recentMessages = history.slice(-4); // Last 4 messages for context
        const contextLines = recentMessages.map(msg => {
            const role = msg.role === "user" ? "Bruger" : "Friday";
            const content = msg.content.length > 100
                ? msg.content.substring(0, 100) + "..."
                : msg.content;
            return `${role}: ${content}`;
        });

        return contextLines.join('\n');
    }

    /**
     * Check if the query is related to date/time
     */
    private isDateTimeRelated(userMessage: string, intent?: string): boolean {
        const timeKeywords = [
            'i dag', 'i morgen', 'i går', 'denne uge', 'næste uge', 'næste måned',
            'formiddag', 'eftermiddag', 'aften', 'morgen', 'aften',
            'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag',
            'januar', 'februar', 'marts', 'april', 'maj', 'juni',
            'juli', 'august', 'september', 'oktober', 'november', 'december',
            'kl', 'klokken', 'tid', 'time', 'minut', 'sekund'
        ];

        const message = userMessage.toLowerCase();
        const hasTimeKeywords = timeKeywords.some(keyword => message.includes(keyword));
        const isTimeIntent = intent === 'availability' || intent === 'booking' || intent === 'reschedule';

        return hasTimeKeywords || isTimeIntent;
    }

    /**
     * Build time context for better AI responses
     */
    private buildTimeContext(currentTime: CurrentDateTime): string {
        const { date, time, dayOfWeek, dayOfWeekEn } = currentTime;

        // Determine if weekend based on day name
        const isWeekend = dayOfWeekEn === 'Saturday' || dayOfWeekEn === 'Sunday';
        // Determine if business hours (9-17 on weekdays)
        const hour = parseInt(time.split(':')[0]);
        const isBusinessHours = !isWeekend && hour >= 9 && hour < 17;

        let context = `📅 **AKTUEL TID:**
• Dato: ${formatDateTimeDanish(new Date(date))}
• Tid: ${time}
• Dag: ${dayOfWeek}`;

        if (isWeekend) {
            context += "\n• Status: Weekend";
        } else if (isBusinessHours) {
            context += "\n• Status: Arbejdstid";
        } else {
            context += "\n• Status: Uden for arbejdstid";
        }

        return context;
    }

    /**
     * Handle unknown intents with intelligent fallback
     */
    private handleUnknownIntent(message: string, history: ChatMessage[]): FridayResponse {
        // Analyze message for keywords to provide better suggestions
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('lead') || lowerMessage.includes('kunde')) {
            return this.getLeadsResponse();
        }

        if (lowerMessage.includes('email') || lowerMessage.includes('mail')) {
            return this.handleEmailResponse(message);
        }

        if (lowerMessage.includes('kalender') || lowerMessage.includes('møde') || lowerMessage.includes('aftale')) {
            return this.handleBookingQuery(message);
        }

        if (lowerMessage.includes('hjælp') || lowerMessage.includes('help')) {
            return this.handleHelpRequest(message);
        }

        // Check conversation context for better understanding
        const hasRecentContext = history.length > 0;
        const contextHint = hasRecentContext
            ? "Baseret på vores samtale, "
            : "";

        return {
            message: `🤔 ${contextHint}Jeg er ikke helt sikker på, hvad du mener.\n\nJeg kan hjælpe med:\n• **Leads** og kunde håndtering\n• **Booking** og kalender\n• **Emails** og auto-svar\n• **Statistik** og rapporter\n\nHvad vil du gerne arbejde med?`,
            suggestions: ["Vis leads", "Book møde", "Se emails", "Dashboard", "Hjælp"]
        };
    }
}

/**
 * Export singleton instance
 */
export const fridayAI = new FridayAI();
