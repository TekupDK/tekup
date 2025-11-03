import { useEffect, useMemo, useState } from "react";
import { isFeatureEnabled } from "@/lib/featureFlags";
import type { PendingAction } from "@/components/ActionApprovalModal";

export type ActionSuggestion = PendingAction;

interface UseActionSuggestionsResult {
  suggestions: ActionSuggestion[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Minimal, client-only suggestions.
 * MVP behavior:
 * - Disabled unless FRIDAY_ACTION_SUGGESTIONS flag is enabled.
 * - Returns 0–2 safe suggestions with static preview/impact.
 * - Can be replaced later to call server endpoints.
 */
export function useActionSuggestions(context: {
  conversationId?: number | null;
}): UseActionSuggestionsResult {
  const enabled = isFeatureEnabled("FRIDAY_ACTION_SUGGESTIONS", false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Generate deterministic suggestions for MVP
  const suggestions = useMemo<ActionSuggestion[]>(() => {
    if (!enabled) return [];

    const base: ActionSuggestion[] = [
      {
        id: "draft_reply",
        type: "create_task",
        params: { title: "Følg op på kunde", dueInDays: 2 },
        impact: "Opretter en opgave til opfølgning inden 2 dage",
        preview: "Titel: Følg op på kunde\nDeadline: +2 dage",
        riskLevel: "low",
      },
      {
        id: "book_meeting",
        type: "book_meeting",
        params: { title: "Tilbud – rengøring", durationMin: 30 },
        impact: "Opretter en kalenderaftale (30 min) som kladde",
        preview: "Titel: Tilbud – rengøring\nVarighed: 30 min",
        riskLevel: "medium",
      },
    ];

    // If no conversation selected, offer fewer
    if (!context.conversationId) {
      return base.slice(0, 1);
    }
    return base;
  }, [enabled, context.conversationId, tick]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const t = setTimeout(() => {
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [enabled, tick]);

  return {
    suggestions,
    loading,
    error,
    refresh: () => setTick(t => t + 1),
  };
}

