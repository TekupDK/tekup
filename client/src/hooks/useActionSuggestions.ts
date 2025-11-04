import type { PendingAction } from "@/components/ActionApprovalModal";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export type ActionSuggestion = PendingAction;

interface UseActionSuggestionsResult {
  suggestions: ActionSuggestion[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Context-aware action suggestions powered by Gemini.
 * Behavior:
 * - Disabled unless FRIDAY_ACTION_SUGGESTIONS flag is enabled.
 * - Calls server endpoint to analyze conversation and generate relevant suggestions.
 * - Returns 0-3 AI-generated suggestions based on conversation context.
 */
export function useActionSuggestions(context: {
  conversationId?: number | null;
}): UseActionSuggestionsResult {
  const enabled = isFeatureEnabled("FRIDAY_ACTION_SUGGESTIONS", false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Call TRPC endpoint to get AI-powered suggestions
  const {
    data,
    isLoading,
    error: queryError,
  } = trpc.chat.getSuggestions.useQuery(
    {
      conversationId: context.conversationId || 0,
      maxSuggestions: 3,
    },
    {
      enabled: enabled && !!context.conversationId,
      refetchOnWindowFocus: false,
      staleTime: 30000, // Cache for 30 seconds
      retry: 1,
    }
  );

  return {
    suggestions:
      enabled && data?.suggestions
        ? data.suggestions.filter((s): s is PendingAction => s !== null)
        : [],
    loading: isLoading,
    error: queryError ? String(queryError) : null,
    refresh: () => setRefreshKey(k => k + 1),
  };
}
