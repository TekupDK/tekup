import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Archive, Filter, Inbox, Mail, Send, Star } from "lucide-react";

interface EmailSidebarProps {
  selectedFolder: "inbox" | "sent" | "archive" | "starred";
  onFolderChange: (folder: "inbox" | "sent" | "archive" | "starred") => void;
  selectedLabels: string[];
  onLabelToggle: (labelName: string) => void;
  onCompose?: () => void;
}

export default function EmailSidebar({
  selectedFolder,
  onFolderChange,
  selectedLabels,
  onLabelToggle,
  onCompose,
}: EmailSidebarProps) {
  const { data: labels, isLoading: labelsLoading } =
    trpc.inbox.email.getLabels.useQuery(undefined, {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (fixed: cacheTime → gcTime)
      retry: false, // Don't retry on error - labels change rarely
    });

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
      <div className="p-4 border-b">
        <Button className="w-full" size="sm" onClick={onCompose}>
          <Mail className="w-4 h-4 mr-2" />
          Ny mail
        </Button>
      </div>

      <ScrollArea className="flex-1">
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
                          className="flex-1 text-sm cursor-pointer"
                        >
                          {label.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
