/**
 * Calendar Tab - Utility Functions
 * Extracted to reduce main file size and improve performance
 */

export const parseEventType = (event: any): string => {
  const text = [event?.summary, event?.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("flytterengør") || text.includes("flytterengor"))
    return "flytterengøring";
  if (text.includes("hovedrengør") || text.includes("hovedrengor"))
    return "hovedrengøring";
  if (text.includes("ugentlig")) return "ugentlig";
  if (text.includes("fast rengør") || text.includes("fast rengor"))
    return "fast";
  if (text.includes("månedlig")) return "månedlig";
  if (text.includes("post-renovering")) return "post-renovering";
  if (text.includes("vinduer") || text.includes("window")) return "vinduer";

  return "standard";
};

export const getEventColor = (event: any): string => {
  const type = parseEventType(event);
  const summary = event?.summary?.toLowerCase() || "";

  // Check if completed/cancelled
  if (
    summary.includes("✅") ||
    summary.includes("udført") ||
    summary.includes("færdig")
  ) {
    return "bg-gray-500/70"; // Grey for completed
  }
  if (
    summary.includes("❌") ||
    summary.includes("aflyst") ||
    summary.includes("cancelled")
  ) {
    return "bg-gray-400/60"; // Light grey for cancelled
  }

  // Color by type
  switch (type) {
    case "flytterengøring":
      return "bg-red-600/80"; // Red
    case "hovedrengøring":
      return "bg-purple-600/80"; // Purple
    case "ugentlig":
      return "bg-green-600/80"; // Green
    case "fast":
      return "bg-blue-600/80"; // Blue
    case "månedlig":
      return "bg-indigo-600/80"; // Indigo
    case "post-renovering":
      return "bg-orange-600/80"; // Orange
    case "vinduer":
      return "bg-cyan-600/80"; // Cyan
    default:
      return "bg-primary/80"; // Default blue
  }
};

export const parseTeamInfo = (event: any): string | null => {
  const desc = event?.description || "";
  const summary = event?.summary || "";

  // Try to parse "Team X" or team member names from description
  const teamMatch = desc.match(
    /Team\s*[:#]?\s*(\d+|[A-Z][a-zæøå]+(?:\s+[A-Z][a-zæøå]+)?)/i
  );
  if (teamMatch) return teamMatch[1];

  // Try to parse from summary (e.g., "Team 2 (Souha + Mandi)")
  const summaryTeamMatch = summary.match(/Team\s*[:#]?\s*(\d+)/i);
  if (summaryTeamMatch) return summaryTeamMatch[1];

  // Try to parse team members in parentheses
  const membersMatch = summary.match(/\(([^)]+)\)/);
  if (membersMatch) {
    const members = membersMatch[1];
    if (members.includes("+") || members.includes("&")) {
      return members
        .split(/[+&]/)
        .map((m: string) => m.trim().split(" ")[0])
        .join("+");
    }
  }

  return null;
};

export const parseCustomerEmail = (event: any): string | null => {
  const desc = event?.description || "";

  // Try to parse email from description
  const emailMatch = desc.match(
    /(?:mailto:|href="|>)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  if (emailMatch) return emailMatch[1];

  // Try to parse from "Kontakt:" section
  const contactMatch = desc.match(
    /Kontakt:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );
  if (contactMatch) return contactMatch[1];

  return null;
};

export const parseEstimate = (
  event: any
): { hours?: string; price?: string; size?: string; team?: string } | null => {
  const desc = event?.description || "";

  // Try to parse ESTIMAT section
  const estimatMatch = desc.match(/ESTIMAT[:\s]*([\s\S]*?)(?=\n\n|$)/i);
  if (!estimatMatch) return null;

  const estimatText = estimatMatch[1];
  const result: any = {};

  // Parse various fields
  const hoursMatch = estimatText.match(/(\d+(?:[.,]\d+)?)\s*timer/i);
  if (hoursMatch) result.hours = hoursMatch[1].replace(",", ".");

  const priceMatch = estimatText.match(/(\d+(?:[.,]\d+)?)\s*kr/i);
  if (priceMatch) result.price = priceMatch[1].replace(",", ".");

  const sizeMatch = estimatText.match(/(\d+)\s*m[²2]/i);
  if (sizeMatch) result.size = sizeMatch[1];

  const teamMatch = estimatText.match(/Team\s*[:#]?\s*(\d+)/i);
  if (teamMatch) result.team = teamMatch[1];

  return Object.keys(result).length > 0 ? result : null;
};

/**
 * Format date for display
 */
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("da-DK", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format time for display
 */
export const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculate duration between two dates in hours
 */
export const calculateDuration = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
};

/**
 * Get event type badge label
 */
export const getEventTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    flytterengøring: "Flytte",
    hovedrengøring: "Hoved",
    ugentlig: "Ugentlig",
    fast: "Fast",
    månedlig: "Månedlig",
    "post-renovering": "Post-Ren",
    vinduer: "Vinduer",
    standard: "Standard",
  };
  return labels[type] || type;
};
