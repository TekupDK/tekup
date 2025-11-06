import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEmailContext } from "@/contexts/EmailContext";
import {
  AlertTriangle,
  Archive,
  Calendar,
  Clock,
  FileCheck,
  FileText,
  Mail,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

export interface PendingAction {
  id: string;
  type:
    | "create_lead"
    | "create_task"
    | "book_meeting"
    | "create_invoice"
    | "search_gmail"
    | "request_flytter_photos"
    | "job_completion"
    | "send_email"
    | "delete_email"
    | "archive_email"
    | "snooze_email"
    | "mark_email_done"
    | "ai_generate_summaries"
    | "ai_suggest_labels"
    | "update_calendar_event"
    | "delete_calendar_event"
    | "check_calendar_conflicts";
  params: Record<string, any>;
  impact: string;
  preview: string;
  riskLevel: "low" | "medium" | "high";
}

interface ActionApprovalModalProps {
  action: PendingAction | null;
  open: boolean;
  onApprove: (alwaysApprove: boolean) => void;
  onReject: () => void;
}

export const ACTION_ICONS = {
  create_lead: UserPlus,
  create_task: Plus,
  book_meeting: Calendar,
  create_invoice: FileText,
  search_gmail: Mail,
  request_flytter_photos: AlertTriangle,
  job_completion: FileCheck,
  send_email: Send,
  delete_email: Trash2,
  archive_email: Archive,
  snooze_email: Clock,
  mark_email_done: FileCheck,
  ai_generate_summaries: Sparkles,
  ai_suggest_labels: Sparkles,
  update_calendar_event: Calendar,
  delete_calendar_event: Trash2,
  check_calendar_conflicts: AlertTriangle,
};

export const ACTION_LABELS = {
  create_lead: "Opret Lead",
  create_task: "Opret Opgave",
  book_meeting: "Book Kalenderaftale",
  create_invoice: "Opret Faktura",
  search_gmail: "Søg i Gmail",
  request_flytter_photos: "Anmod om Billeder",
  job_completion: "Afslut Job",
  send_email: "Send E-mail",
  delete_email: "Slet E-mail",
  archive_email: "Arkiver E-mail",
  snooze_email: "Udsæt E-mail",
  mark_email_done: "Marker E-mail som Færdig",
  ai_generate_summaries: "AI: Generér Resuméer",
  ai_suggest_labels: "AI: Foreslå Labels",
  update_calendar_event: "Rediger Kalender Booking",
  delete_calendar_event: "Slet Kalender Booking",
  check_calendar_conflicts: "Tjek Kalender Konflikter",
};

export const RISK_COLORS = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

export const RISK_LABELS = {
  low: "Lav risiko",
  medium: "Mellem risiko",
  high: "Høj risiko",
};

export function ActionApprovalModal({
  action,
  open,
  onApprove,
  onReject,
}: ActionApprovalModalProps) {
  const [alwaysApprove, setAlwaysApprove] = useState(false);
  const emailContext = useEmailContext();
  const selectedCount = emailContext.state.selectedThreads.size;

  // Keyboard shortcuts: Cmd/Ctrl+Enter to approve, Escape to reject
  useEffect(() => {
    if (!open || !action) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter = Approve
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onApprove(alwaysApprove);
      }
      // Escape = Reject
      if (e.key === "Escape") {
        e.preventDefault();
        onReject();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, action, onApprove, onReject, alwaysApprove]);

  if (!action) return null;

  const Icon = ACTION_ICONS[action.type];
  const label = ACTION_LABELS[action.type];
  const riskColor = RISK_COLORS[action.riskLevel];
  const riskLabel = RISK_LABELS[action.riskLevel];

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">
                Godkend Handling
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Friday foreslår følgende handling baseret på din besked
              </AlertDialogDescription>
            </div>
            <Badge variant="outline" className={riskColor}>
              {riskLabel}
            </Badge>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Handlingstype
            </Label>
            <p className="text-base mt-1">{label}</p>
            {/* Selection hint for inbox AI actions */}
            {(action.type === "ai_generate_summaries" ||
              action.type === "ai_suggest_labels") && (
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCount > 0
                  ? `Du har ${selectedCount} tråd(e) valgt – de bruges ved godkendelse (ellers seneste 25).`
                  : "Ingen tråde valgt – seneste 25 i Indbakken bruges."}
              </p>
            )}
          </div>

          {/* Impact */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Påvirkning
            </Label>
            <p className="text-sm text-gray-600 mt-1">{action.impact}</p>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Forhåndsvisning
            </Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{action.preview}</p>
            </div>
          </div>

          {/* Parameters */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Detaljer
            </Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto">
                {JSON.stringify(action.params, null, 2)}
              </pre>
            </div>
          </div>

          {/* Always Approve Option */}
          {action.riskLevel === "low" && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="always-approve"
                checked={alwaysApprove}
                onCheckedChange={checked =>
                  setAlwaysApprove(checked as boolean)
                }
              />
              <Label
                htmlFor="always-approve"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Godkend altid denne type handling automatisk (kun for lav
                risiko)
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <div className="text-xs text-muted-foreground sm:mr-auto">
            <kbd className="px-2 py-1 bg-muted rounded border text-xs">Esc</kbd>{" "}
            for at afvise
            {" · "}
            <kbd className="px-2 py-1 bg-muted rounded border text-xs">
              Ctrl+Enter
            </kbd>{" "}
            for at godkende
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel onClick={onReject}>Afvis</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onApprove(alwaysApprove)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Godkend og Udfør
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
