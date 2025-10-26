import type { ChatMessage, ClassifiedIntent, AssistantIntent } from "../types";
import type { LLMProvider } from "../llm/llmProvider";
import { SYSTEM_PROMPT } from "../llm/promptTemplates";

const KEYWORD_INTENTS: Array<{ intent: AssistantIntent; keywords: RegExp[] }> = [
    {
        intent: "greeting" as AssistantIntent,
        keywords: [
            /^hej$/i,
            /^hallo$/i,
            /^goddag$/i,
            /^hey$/i,
            /^hi$/i,
            /^hello$/i,
            /hej\s+(der|friday)/i,
            /godmorgen/i,
            /godaften/i,
        ],
    },
    {
        intent: "help" as AssistantIntent,
        keywords: [
            /hjælp/i,
            /help/i,
            /hvad\s+kan/i,
            /hvordan/i,
            /kan\s+du/i,
            /hvad\s+laver/i,
        ],
    },
    {
        intent: "analytics.overview",
        keywords: [
            /vis.*lead/i,
            /seneste.*lead/i,
            /nye.*lead/i,
            /lead.*status/i,
            /liste.*lead/i,
            /show.*lead/i,
            /analyse/i,
            /statistik/i,
            /dashboard/i,
            /overblik/i,
            /performance/i,
        ],
    },
    {
        intent: "email.lead",
        keywords: [
            /tilbud/i,
            /lead/i,
            /kvadrat/i,
            /pris/i,
            /estimate/i,
            /quote/i,
            /forespørg/i, // e.g. "Forespørgsel om rengøring"
            /forespoerg/i, // fallback without diacritics
        ],
    },
    {
        intent: "email.complaint",
        keywords: [/klage/i, /utilfreds/i, /reklamation/i, /fejl/i, /problem/i],
    },
    {
        intent: "calendar.booking",
        keywords: [
            /book/i,
            /kalender/i,
            /tidspunkt/i,
            /appointment/i,
            /schedule/i,
            /find.*tid/i,
            /ledig.*tid/i,
            /møde/i,
        ],
    },
    {
        intent: "calendar.cancellation",
        keywords: [/aflys/i, /flyt/i, /reschedule/i, /cancel/i],
    },
    {
        intent: "automation.rule",
        keywords: [/workflow/i, /automatiser/i, /regel/i, /label/i, /system/i],
    },
    {
        intent: "email.response",
        keywords: [
            /send.*email/i,
            /besvar.*email/i,
            /email.*besked/i,
            /tilbud.*email/i,
            /f\u00f8lg.*op/i,
            /opfølgning/i,
            /email.*skabelon/i,
            /auto.*response/i,
        ],
    },
    {
        intent: "calendar.booking",
        keywords: [
            /book/i,
            /kalender/i,
            /tidspunkt/i,
            /appointment/i,
            /schedule/i,
            /find.*tid/i,
            /ledig.*tid/i,
            /møde/i,
            /aftale/i,
            /reserver/i,
            /tid.*slot/i,
        ],
    },
    {
        intent: "calendar.availability",
        keywords: [
            /ledig.*tid/i,
            /tilgængelig/i,
            /frit.*tid/i,
            /når.*ledig/i,
            /kan.*booke/i,
            /availability/i,
            /check.*tid/i,
        ],
    },
    {
        intent: "calendar.reschedule",
        keywords: [/flyt/i, /ændr.*tid/i, /reschedule/i, /flytte.*møde/i, /ændre.*aftale/i],
    },
];

export interface IntentClassifierOptions {
    llm?: LLMProvider;
    threshold?: number;
}

export class IntentClassifier {
    private readonly llm?: LLMProvider;
    private readonly threshold: number;

    constructor(options?: IntentClassifierOptions) {
        this.llm = options?.llm;
        this.threshold = options?.threshold ?? 0.6;
    }

    async classify(
        latestMessage: string,
        history: ChatMessage[] = []
    ): Promise<ClassifiedIntent> {
        const heuristic = this.classifyHeuristically(latestMessage);
        if (heuristic.confidence >= this.threshold || !this.llm) {
            return heuristic;
        }

        const llmResult = await this.classifyWithLlm(latestMessage, history);
        return llmResult ?? heuristic;
    }

    private classifyHeuristically(message: string): ClassifiedIntent {
        const lower = message.toLowerCase();
        for (const { intent, keywords } of KEYWORD_INTENTS) {
            if (keywords.some((regex) => regex.test(lower))) {
                return {
                    intent,
                    confidence: 0.75,
                    rationale: `Matched keyword for intent ${intent}`,
                };
            }
        }

        return {
            intent: "unknown",
            confidence: 0.25,
            rationale: "No keyword match; defaulting to unknown",
        };
    }

    private async classifyWithLlm(
        message: string,
        history: ChatMessage[]
    ): Promise<ClassifiedIntent | null> {
        if (!this.llm) {
            return null;
        }

        const prompt = `Du skal svare med et JSON-objekt med felterne intent (en af: email.lead, email.followup, email.complaint, calendar.booking, calendar.cancellation, analytics.overview, automation.rule, unknown) og rationale (kort forklaring).`;

        const completion = await this.llm.completeChat(
            [
                { role: "system", content: SYSTEM_PROMPT },
                ...history.map((item) => ({ role: item.role, content: item.content })),
                { role: "user", content: `${prompt}\n\nTekst: ${message}` },
            ]
        );

        try {
            const parsed = JSON.parse(completion) as { intent?: AssistantIntent; rationale?: string };
            if (!parsed.intent) {
                throw new Error("Intent missing");
            }

            return {
                intent: parsed.intent,
                confidence: 0.85,
                rationale: parsed.rationale ?? "LLM klassificering",
            };
        } catch (error) {
            return {
                intent: "unknown",
                confidence: 0.3,
                rationale: `LLM classification failed: ${String(error)}`,
            };
        }
    }
}
