import { listMemories, getHistory } from "../../services/memoryStore";
import { getRecentLeads } from "../../services/leadMonitor";
import { fridayAI } from "../../ai/friday";
import type { TaskHandler, ExecutionAction } from "./types";

type MemoryEntry = ReturnType<typeof listMemories>[number];

type PricingSnapshot = { total?: unknown } | undefined;
type LeadSnapshot = { name?: string | null } | undefined;

export const handleAnalytics: TaskHandler = async (task) => {
    // Extract user message, intent, and sessionId from payload
    const payload = task.payload as {
        userMessage?: string;
        intent?: string;
        sessionId?: string;
    } | undefined;
    const userMessage = payload?.userMessage ?? "";
    const intent = payload?.intent ?? "analytics.overview";
    const sessionId = payload?.sessionId;

    // Use Friday AI for intelligent response with conversation history
    const fridayResponse = await fridayAI.respond({
        intent,
        userMessage,
        history: [], // Will be loaded from memory store using sessionId
    });

    return {
        taskId: task.id,
        provider: task.provider,
        status: "success",
        detail: fridayResponse.message,
    } satisfies ExecutionAction;
};

function buildLeadsSummary(): string {
    const recentLeads = getRecentLeads(5);

    if (recentLeads.length === 0) {
        return "📭 Ingen leads fundet.\n\nDer er ingen leads i systemet endnu.";
    }

    let summary = `📧 Seneste Leads (${recentLeads.length})\n\n`;

    recentLeads.forEach((lead, index) => {
        const date = new Date(lead.receivedAt);
        const formattedDate = date.toLocaleDateString("da-DK", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("da-DK", {
            hour: "2-digit",
            minute: "2-digit",
        });

        summary += `${index + 1}. 👤 ${lead.name || "Ikke angivet"}\n`;
        if (lead.email) {
            summary += `   ✉️  ${lead.email}\n`;
        }
        if (lead.phone) {
            summary += `   📞 ${lead.phone}\n`;
        }
        if (lead.propertyType || lead.address) {
            const propertyInfo = [lead.propertyType, lead.address]
                .filter(Boolean)
                .join(" - ");
            summary += `   🏠 ${propertyInfo}\n`;
        }
        summary += `   📅 ${formattedDate}, ${formattedTime}\n`;
        summary += `   � Kilde: ${lead.source}\n\n`;
    });

    return summary.trim();
}

function buildAnalyticsSummary(): string {
    const leads = listMemories({ type: "lead" });
    const totalLeads = leads.length;
    const totalValue = leads.reduce((sum, record) => sum + extractPricingTotal(record), 0);
    const average = totalLeads === 0 ? 0 : roundToTwoDecimals(totalValue / totalLeads);
    const latestName = deriveLeadName(leads[0]);

    return `Leads i alt: ${totalLeads}. Gennemsnitlig tilbudsværdi: ${average} kr. Seneste lead: ${latestName}.`;
}

function extractPricingTotal(record: MemoryEntry): number {
    const pricing = record.content?.pricing as PricingSnapshot;
    const total = pricing?.total;
    return typeof total === "number" ? total : 0;
}

function deriveLeadName(record?: MemoryEntry): string {
    const lead = record?.content?.lead as LeadSnapshot;
    const name = lead?.name?.trim();
    if (!name || name.length === 0) {
        return "Ingen";
    }
    return name;
}

function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}
