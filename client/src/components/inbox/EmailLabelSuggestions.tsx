import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LabelSuggestion {
  label: string;
  confidence: number;
  reason?: string;
}

interface EmailLabelSuggestionsProps {
  emailId: number;
  /** Current labels on the email */
  currentLabels?: string[];
  /** Callback when label is applied */
  onLabelApplied?: (label: string) => void;
  /** Optional: Show as collapsed initially */
  collapsed?: boolean;
  /** Optional: Custom styling */
  className?: string;
  /** Optional: Preloaded label suggestions from parent */
  suggestions?: LabelSuggestion[];
  /** Optional: Timestamp when suggestions were generated */
  generatedAt?: string;
}

/**
 * EmailLabelSuggestions Component
 *
 * Displays AI-powered label suggestions with:
 * - Confidence scoring (>85% = high confidence)
 * - Auto-apply button for high confidence labels
 * - Manual selection for lower confidence suggestions
 * - Emoji indicators for label categories
 * - Subtle, non-intrusive design
 */
export default function EmailLabelSuggestions({
  emailId,
  currentLabels = [],
  onLabelApplied,
  collapsed = false,
  className = "",
}: EmailLabelSuggestionsProps) {
  const [expanded, setExpanded] = useState(!collapsed);
  const [appliedLabels, setAppliedLabels] = useState<Set<string>>(
    new Set(currentLabels)
  );

  // Fetch label suggestions (cached or generate new)
  const {
    data: suggestionsData,
    isLoading,
    error,
    refetch,
  } = (trpc.inbox as any).getLabelSuggestions.useQuery(
    { emailId },
    {
      enabled: expanded,
      retry: 1,
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    }
  );

  // Manual generation mutation
  const generateMutation = (
    trpc.inbox as any
  ).generateLabelSuggestions.useMutation({
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success("AI mærkater genereret!");
        refetch();
      } else {
        toast.error("Kunne ikke generere mærkater", {
          description: data.reason || "Prøv igen senere.",
        });
      }
    },
    onError: (error: any) => {
      toast.error("Fejl ved generering", {
        description: error.message,
      });
    },
  });

  // Apply label mutation
  const applyLabelMutation = (trpc.inbox as any).applyLabel.useMutation({
    onSuccess: (data: any, variables: any) => {
      if (data.success) {
        setAppliedLabels(prev => new Set(prev).add(variables.label));
        toast.success(`Mærkat "${variables.label}" tilføjet!`);
        if (onLabelApplied) {
          onLabelApplied(variables.label);
        }
      } else {
        toast.error("Kunne ikke tilføje mærkat", {
          description: data.error || "Prøv igen.",
        });
      }
    },
    onError: (error: any) => {
      toast.error("Fejl ved tilføjelse af mærkat", {
        description: error.message,
      });
    },
  });

  // Handle apply label
  const handleApplyLabel = (label: string, confidence: number) => {
    applyLabelMutation.mutate({ emailId, label, confidence });
  };

  // Handle auto-apply all high confidence labels
  const handleAutoApplyAll = () => {
    if (!suggestionsData?.suggestions) return;

    const highConfidenceLabels = suggestionsData.suggestions.filter(
      (s: LabelSuggestion) =>
        s.confidence >= 0.85 && !appliedLabels.has(s.label)
    );

    if (highConfidenceLabels.length === 0) {
      toast.info("Ingen høj-confidence mærkater at tilføje.");
      return;
    }

    // Apply all high confidence labels
    highConfidenceLabels.forEach((suggestion: LabelSuggestion) => {
      handleApplyLabel(suggestion.label, suggestion.confidence);
    });

    toast.success(
      `${highConfidenceLabels.length} mærkat${highConfidenceLabels.length > 1 ? "er" : ""} tilføjet!`
    );
  };

  // Handle toggle
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Get emoji for label category
  const getLabelEmoji = (label: string): string => {
    const lower = label.toLowerCase();
    if (lower.includes("lead") || lower.includes("potentiel")) return "🟢";
    if (lower.includes("booking") || lower.includes("aftale")) return "🔵";
    if (
      lower.includes("finance") ||
      lower.includes("økonomi") ||
      lower.includes("faktura")
    )
      return "🟡";
    if (lower.includes("support") || lower.includes("hjælp")) return "🔴";
    if (lower.includes("newsletter") || lower.includes("nyhedsbrev"))
      return "🟣";
    return "🏷️";
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85)
      return "bg-green-500/10 text-green-700 border-green-500/20";
    if (confidence >= 0.7)
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    return "bg-gray-500/10 text-gray-700 border-gray-500/20";
  };

  // Don't render if collapsed and not expanded
  if (collapsed && !expanded) {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Vis AI mærkater"
      >
        <Sparkles className="h-3 w-3" />
        <span>Vis AI mærkater</span>
      </button>
    );
  }

  // Loading state
  if (isLoading || generateMutation.isPending) {
    return (
      <div className={`flex items-start gap-2 mt-2 ${className}`}>
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground mt-0.5 animate-pulse" />
        <div className="flex-1 flex gap-2">
          <div className="h-6 bg-muted/50 rounded-full animate-pulse w-20" />
          <div className="h-6 bg-muted/50 rounded-full animate-pulse w-24" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !suggestionsData?.success) {
    return (
      <div className={`flex items-start gap-2 mt-2 ${className}`}>
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5" />
        <p className="text-xs text-muted-foreground/70 italic">
          {suggestionsData?.reason || "Kunne ikke hente AI mærkater"}
        </p>
      </div>
    );
  }

  const { suggestions, generatedAt, cached } = suggestionsData;

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Filter out already applied labels
  const availableSuggestions = suggestions.filter(
    (s: LabelSuggestion) => !appliedLabels.has(s.label)
  );

  const highConfidenceCount = availableSuggestions.filter(
    (s: LabelSuggestion) => s.confidence >= 0.85
  ).length;

  if (availableSuggestions.length === 0) {
    return (
      <div className={`flex items-start gap-2 mt-2 ${className}`}>
        <Check className="h-3.5 w-3.5 text-green-600 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Alle AI mærkater anvendt
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 mt-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-xs font-medium text-muted-foreground">
            AI Mærkater
          </span>
          {cached && generatedAt && (
            <span className="text-[10px] text-muted-foreground/50 italic">
              (cached)
            </span>
          )}
        </div>
        {highConfidenceCount > 0 && (
          <Button
            onClick={handleAutoApplyAll}
            disabled={applyLabelMutation.isPending}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Auto-anvend ({highConfidenceCount})
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {availableSuggestions.map((suggestion: LabelSuggestion) => {
          const isApplying =
            applyLabelMutation.isPending &&
            applyLabelMutation.variables?.label === suggestion.label;

          return (
            <Badge
              key={suggestion.label}
              variant="outline"
              className={`flex items-center gap-1.5 pl-2 pr-1 py-1 cursor-pointer hover:bg-primary/5 transition-colors ${getConfidenceColor(suggestion.confidence)}`}
              onClick={() =>
                handleApplyLabel(suggestion.label, suggestion.confidence)
              }
              title={
                suggestion.reason
                  ? `${suggestion.reason} (${Math.round(suggestion.confidence * 100)}% confidence)`
                  : `${Math.round(suggestion.confidence * 100)}% confidence`
              }
            >
              <span className="text-xs">{getLabelEmoji(suggestion.label)}</span>
              <span className="text-xs font-medium">{suggestion.label}</span>
              <span className="text-[10px] opacity-60">
                {Math.round(suggestion.confidence * 100)}%
              </span>
              {isApplying ? (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-1" />
              ) : (
                <Check className="h-3 w-3 opacity-50 hover:opacity-100 ml-1" />
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
