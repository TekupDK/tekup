import { ACTION_LABELS, RISK_COLORS, RISK_LABELS, type PendingAction } from "@/components/ActionApprovalModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuggestionsBarProps {
  suggestions: PendingAction[];
  onApprove: (suggestion: PendingAction) => void;
  className?: string;
}

export function SuggestionsBar({
  suggestions,
  onApprove,
  className,
}: SuggestionsBarProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Anbefalede handlinger
        </h3>
        <Badge variant="outline" className="text-xs">
          Friday foreslår
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {suggestions.map(suggestion => {
          const label = ACTION_LABELS[suggestion.type] ?? suggestion.type;
          const riskClass = RISK_COLORS[suggestion.riskLevel];
          const riskLabel = RISK_LABELS[suggestion.riskLevel];

          return (
            <div
              key={suggestion.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card/70 px-4 py-3 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{label}</span>
                  <Badge variant="outline" className={cn("text-xs", riskClass)}>
                    {riskLabel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {suggestion.impact}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(suggestion)}
                >
                  Godkend
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SuggestionsBar;
