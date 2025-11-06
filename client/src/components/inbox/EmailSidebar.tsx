import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  Clock,
  DollarSign,
  Filter,
  Inbox,
  Mail,
  Send,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";

interface EmailSidebarProps {
  selectedFolder: "inbox" | "sent" | "archive" | "starred";
  onFolderChange: (folder: "inbox" | "sent" | "archive" | "starred") => void;
  selectedLabels: string[];
  onLabelToggle: (labelName: string) => void;
  onCompose?: () => void;
  aiStatsToday?: {
    summariesCount: number;
    labelsCount: number;
    timeSaved: number;
    cost: number;
  };
}

export default function EmailSidebar({
  selectedFolder,
  onFolderChange,
  selectedLabels,
  onLabelToggle,
  onCompose,
  aiStatsToday,
}: EmailSidebarProps) {
  const { data: labels, isLoading: labelsLoading } =
    trpc.inbox.email.getLabels.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutter
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutter (fixed: cacheTime → gcTime)
      retry: false, // Don't retry on error - labels change rarely
    });

  // Get unread counts for folders and labels
  const { data: unreadCounts } = trpc.inbox.email.getUnreadCounts.useQuery(
    undefined,
    {
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes - fresher than labels
      gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
      retry: false,
    }
  );

  // Standard folders
  const folders = [
    { id: "inbox" as const, label: "Indbakke", icon: Inbox },
    { id: "sent" as const, label: "Sendte", icon: Send },
    { id: "archive" as const, label: "Arkiv", icon: Archive },
    { id: "starred" as const, label: "Stjernede", icon: Star },
  ];

  // Filter labels to only show standard Friday AI v2 labels
  const standardLabels =
    labels?.filter(label =>
      [
        "Leads",
        "Needs Reply",
        "Venter på svar",
        "I kalender",
        "Finance",
        "Afsluttet",
      ].includes(label.name)
    ) || [];

  // Other user labels
  const otherLabels =
    labels?.filter(
      label =>
        ![
          "Leads",
          "Needs Reply",
          "Venter på svar",
          "I kalender",
          "Finance",
          "Afsluttet",
          "INBOX",
          "SENT",
          "STARRED",
          "ARCHIVE",
        ].includes(label.name)
    ) || [];

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      {/* Compose Button */}
      <div className="p-4 border-b shrink-0">
        <Button className="w-full" size="sm" onClick={onCompose}>
          <Mail className="w-4 h-4 mr-2" />
          Ny mail
        </Button>
      </div>

      {/* AI Stats Card */}
      {aiStatsToday &&
        (aiStatsToday.summariesCount > 0 || aiStatsToday.labelsCount > 0) && (
          <div className="p-4 border-b shrink-0">
            <Card className="p-3 bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                  AI Aktivitet I Dag
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                {aiStatsToday.summariesCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Summaries
                    </span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {aiStatsToday.summariesCount}
                    </span>
                  </div>
                )}
                {aiStatsToday.labelsCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Labels
                    </span>
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      {aiStatsToday.labelsCount}
                    </span>
                  </div>
                )}
                {aiStatsToday.timeSaved > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Tid sparet
                    </span>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {Math.round(aiStatsToday.timeSaved)}m
                    </span>
                  </div>
                )}
                {aiStatsToday.cost > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t border-purple-200/50 dark:border-purple-700/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3" />
                      Pris i dag
                    </span>
                    <span className="font-medium text-xs text-muted-foreground">
                      ${aiStatsToday.cost.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 space-y-6">
          {/* Folders */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
              Mapper
            </h3>
            <div className="space-y-1">
              {folders.map(folder => {
                const Icon = folder.icon;
                const isSelected = selectedFolder === folder.id;
                const unreadCount = unreadCounts?.folders[folder.id] || 0;
                return (
                  <button
                    key={folder.id}
                    onClick={() => onFolderChange(folder.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{folder.label}</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Standard Labels */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2 flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Labels
            </h3>
            {labelsLoading ? (
              <div className="space-y-2 px-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : standardLabels.length > 0 ? (
              <div className="space-y-1">
                {standardLabels.map(label => {
                  const isChecked = selectedLabels.includes(label.name);
                  const unreadCount =
                    unreadCounts?.labels.find(l => l.labelId === label.id)
                      ?.unreadCount || 0;

                  // Color coding for labels
                  const getLabelColor = (name: string) => {
                    if (name === "Leads")
                      return "border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30";
                    if (name === "Needs Reply" || name === "Venter på svar")
                      return "border-red-500/50 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30";
                    if (name === "I kalender")
                      return "border-green-500/50 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/30";
                    if (name === "Finance")
                      return "border-yellow-500/50 text-yellow-600 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/30";
                    if (name === "Afsluttet")
                      return "border-gray-500/50 text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-950/30";
                    return "border-muted";
                  };

                  return (
                    <div
                      key={label.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        isChecked ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                    >
                      <Checkbox
                        id={`label-${label.id}`}
                        checked={isChecked}
                        onCheckedChange={() => onLabelToggle(label.name)}
                        className="h-4 w-4"
                      />
                      <label
                        htmlFor={`label-${label.id}`}
                        className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                      >
                        {/* Color dot indicator */}
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            label.name === "Leads"
                              ? "bg-blue-500"
                              : label.name === "Needs Reply" ||
                                  label.name === "Venter på svar"
                                ? "bg-red-500"
                                : label.name === "I kalender"
                                  ? "bg-green-500"
                                  : label.name === "Finance"
                                    ? "bg-yellow-500"
                                    : label.name === "Afsluttet"
                                      ? "bg-gray-500"
                                      : "bg-muted-foreground"
                          }`}
                        />
                        <span className="flex-1">{label.name}</span>
                        {unreadCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-xs"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-2 py-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Ingen labels fundet
                </p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  Labels vil vises her når de er oprettet i Gmail
                </p>
              </div>
            )}
          </div>

          {/* Other Labels (if any) */}
          {otherLabels.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">
                  Andre Labels
                </h3>
                <div className="space-y-1">
                  {otherLabels.slice(0, 10).map(label => {
                    const isChecked = selectedLabels.includes(label.name);
                    const unreadCount =
                      unreadCounts?.labels.find(l => l.labelId === label.id)
                        ?.unreadCount || 0;
                    return (
                      <div
                        key={label.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          id={`label-other-${label.id}`}
                          checked={isChecked}
                          onCheckedChange={() => onLabelToggle(label.name)}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`label-other-${label.id}`}
                          className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                        >
                          <span className="flex-1">{label.name}</span>
                          {unreadCount > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-xs"
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
