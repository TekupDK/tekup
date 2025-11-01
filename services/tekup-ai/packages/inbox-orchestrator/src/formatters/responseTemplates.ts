/**
 * Response Templates for Friday AI
 *
 * Shortwave.ai-inspired compact formatting.
 * Templates reduce AI generation tokens by 60-80% vs. full LLM generation.
 */

import type { Lead } from "../leadParser";

/**
 * Format lead summary in compact format (Shortwave.ai style)
 * BEFORE: Multi-line with emojis and detailed fields
 * AFTER: Single line per lead with essential info
 */
export function formatLeadSummary(leads: Lead[]): string {
  if (leads.length === 0) {
    return "Ingen nye leads.";
  }

  const lines = leads.slice(0, 10).map((lead, i) => {
    const parts = [
      `${i + 1}. ${lead.name || "Ukendt navn"}`,
      lead.type,
      lead.bolig.sqm > 0 ? `${lead.bolig.sqm}m²` : "",
      lead.priceEstimate?.formatted || lead.price || "",
      lead.contact.email || lead.contact.phone || "",
    ].filter(Boolean);

    return parts.join(" - ");
  });

  return `## Nye Leads (${leads.length})\n${lines.join("\n")}`;
}

/**
 * Format booking confirmation in minimal format
 */
export function formatBookingConfirmation(details: {
  date: string;
  time: string;
  customerName: string;
  serviceType: string;
}): string {
  return `✓ Booking: ${details.date} kl ${details.time} - ${details.customerName} (${details.serviceType})`;
}

/**
 * Format quote in structured but compact format
 */
export function formatQuote(quote: {
  customerName: string;
  serviceType: string;
  sqm: number;
  workers: number;
  hours: number;
  price: string;
  availableDates?: string[];
}): string {
  const lines = [
    `Hej ${quote.customerName},`,
    "",
    `📏 ${quote.sqm}m² • 👥 ${quote.workers} pers • ⏱️ ${quote.hours}t`,
    `💰 ${quote.price} inkl. moms`,
  ];

  if (quote.availableDates && quote.availableDates.length > 0) {
    lines.push(
      `📅 Ledige tider: ${quote.availableDates.slice(0, 3).join(", ")}`
    );
  }

  lines.push("", "Hvad siger du?", "", "Venlig hilsen,", "Rendetalje.dk");

  return lines.join("\n");
}

/**
 * Format calendar tasks in compact format
 */
export function formatCalendarTasks(
  events: Array<{
    summary: string;
    start: string;
    end: string;
    location?: string;
  }>
): string {
  if (events.length === 0) {
    return "Ingen opgaver planlagt.";
  }

  const now = new Date();
  const lines = events.map((event, i) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const startStr = startDate.toLocaleString("da-DK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let status = "";
    if (startDate <= now && now <= endDate) {
      status = " - PÅGÅR NU";
    } else if (startDate > now) {
      status = " - KOMMENDE";
    } else {
      status = " - AFSLUTTET";
    }

    const parts = [`${i + 1}. ${event.summary}`, startStr];
    if (event.location) parts.push(event.location);
    parts.push(status);

    return parts.join(" • ");
  });

  return `## Dagens Opgaver (${events.length})\n${lines.join("\n")}`;
}

/**
 * Format available booking slots
 */
export function formatAvailableSlots(
  occupiedSlots: Array<{
    start: string;
    end: string;
    summary: string;
  }>
): string {
  if (occupiedSlots.length === 0) {
    return "✅ Alle tider er ledige i næste 7 dage.";
  }

  const lines = occupiedSlots.slice(0, 10).map((slot) => {
    const startDate = new Date(slot.start);
    const startStr = startDate.toLocaleString("da-DK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endStr = new Date(slot.end).toLocaleTimeString("da-DK", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${startStr}-${endStr}: ${slot.summary}`;
  });

  return `⚠️ Optagne tider:\n${lines.join("\n")}\n\n✅ Tider udenfor disse perioder er ledige.`;
}

/**
 * Format next steps in compact list
 */
export function formatNextSteps(steps: string[]): string {
  if (steps.length === 0) {
    return "Ingen aktuelle action items.";
  }

  return `✅ Næste skridt:\n${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
}
