import { trpc } from "@/lib/trpc";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EmailAISummaryProps {
  emailId: number;
  /** Optional: Preloaded summary from email list */
  summary?: string;
  generatedAt?: string;
  /** Optional: Show as collapsed initially with expand button */
  collapsed?: boolean;
  /** Optional: Custom styling */
  className?: string;
}

/**
 * EmailAISummary Component
 *
 * Displays AI-generated email summaries with:
 * - Preloaded data from email list (no API call needed)
 * - Fallback to API if data not preloaded
 * - Permanent caching (email content never changes)
 * - Skeleton loader during generation
 * - Error handling with retry button
 * - Subtle, non-intrusive design (Shortwave-inspired)
 */
export default function EmailAISummary({
  emailId,
  summary: preloadedSummary,
  generatedAt: preloadedGeneratedAt,
  collapsed = false,
  className = "",
}: EmailAISummaryProps) {
  const [expanded, setExpanded] = useState(!collapsed);
  const [showRetry, setShowRetry] = useState(false);

  // Only fetch from API if data not preloaded
  const shouldFetch = expanded && !preloadedSummary;

  // Fetch summary (cached or generate new) - only if not preloaded
  const {
    data: summaryData,
    isLoading,
    error,
    refetch,
  } = (trpc.inbox as any).getEmailSummary.useQuery(
    { emailId },
    {
      enabled: shouldFetch, // Only load when expanded AND not preloaded
      retry: 1, // Retry once on failure
      staleTime: Infinity, // Permanent cache
    }
  );

  // Use preloaded data or fetched data
  const summary = preloadedSummary || summaryData?.summary;
  const generatedAt = preloadedGeneratedAt || summaryData?.generatedAt;
  const isCached = summaryData?.cached ?? (preloadedSummary ? true : false);

  // Manual summary generation mutation
  const generateMutation = (trpc.inbox as any).generateEmailSummary.useMutation(
    {
      onSuccess: (data: any) => {
        if (data.success && data.summary) {
          toast.success("AI resumé genereret!", {
            description: "Email resumé er nu tilgængelig.",
          });
          refetch(); // Refresh to show new summary
          setShowRetry(false);
        } else {
          toast.error("Kunne ikke generere resumé", {
            description: data.reason || "Prøv venligst igen senere.",
          });
          setShowRetry(true);
        }
      },
      onError: (error: any) => {
        toast.error("Fejl ved generering af resumé", {
          description: error.message || "Prøv venligst igen.",
        });
        setShowRetry(true);
      },
    }
  );

  // Handle manual retry
  const handleRetry = () => {
    setShowRetry(false);
    generateMutation.mutate({ emailId });
  };

  // Handle toggle for collapsed mode
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Don't render if collapsed and not expanded
  if (collapsed && !expanded) {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Vis AI resumé"
      >
        <Sparkles className="h-3 w-3" />
        <span>Vis AI resumé</span>
      </button>
    );
  }

  // Loading state - skeleton loader
  if (isLoading || generateMutation.isPending) {
    return (
      <div className={`flex items-start gap-2 mt-1.5 ${className}`}>
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground mt-0.5 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-muted/50 rounded animate-pulse w-full" />
          <div className="h-3 bg-muted/50 rounded animate-pulse w-4/5" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || (shouldFetch && summaryData && !summaryData?.success)) {
    return (
      <div className={`flex items-start gap-2 mt-1.5 ${className}`}>
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5" />
        <div className="flex-1 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/70 italic">
            {summaryData?.reason || "Kunne ikke hente AI resumé"}
          </p>
          {showRetry && (
            <button
              onClick={handleRetry}
              className="text-xs text-primary hover:underline"
              aria-label="Prøv igen"
            >
              Prøv igen
            </button>
          )}
        </div>
      </div>
    );
  }

  // No summary available
  if (!summary) {
    return null; // No summary available (e.g., email too short, newsletter, spam)
  }

  return (
    <div className={`flex items-start gap-2 mt-1.5 ${className}`}>
      <Sparkles
        className="h-3.5 w-3.5 text-primary/70 mt-0.5"
        aria-label="AI-genereret resumé"
      />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {summary}
        </p>
        {isCached && generatedAt && (
          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
            Cached •{" "}
            {new Date(generatedAt).toLocaleDateString("da-DK", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      {collapsed && (
        <button
          onClick={handleToggle}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
          aria-label="Skjul AI resumé"
        >
          Skjul
        </button>
      )}
    </div>
  );
}
