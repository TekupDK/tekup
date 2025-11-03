import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useEmailContext } from "@/contexts/EmailContext";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";
import { useRateLimit } from "@/hooks/useRateLimit";
import { throttle } from "@/lib/rateLimitUtils";
import { trpc } from "@/lib/trpc";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  Clock,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CustomerProfile from "../CustomerProfile";
import AdvancedEmailSearch from "./AdvancedEmailSearch";
import EmailComposer from "./EmailComposer";
import EmailPipelineView from "./EmailPipelineView";
import EmailPreviewModal from "./EmailPreviewModal";
import EmailSidebar from "./EmailSidebar";
import EmailThreadView from "./EmailThreadView";
import PipelineDashboard from "./PipelineDashboard";

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  internalDate?: number;
  body: string;
  snippet: string;
  unread: boolean;
  labels: string[];
  hasAttachment: boolean;
  sender: string;
}

export default function EmailTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<
    "inbox" | "sent" | "archive" | "starred"
  >("inbox");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<
    "compose" | "reply" | "forward"
  >("compose");
  const [composerReplyTo, setComposerReplyTo] = useState<any>(null);
  const [composerForwardFrom, setComposerForwardFrom] = useState<any>(null);
  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewThreadId, setPreviewThreadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "pipeline" | "dashboard">(
    "list"
  );
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [bulkActionPending, setBulkActionPending] = useState(false);

  // Rate limit handling
  const rateLimit = useRateLimit();
  const archiveThreadMutation = trpc.inbox.email.archive.useMutation();
  const deleteThreadMutation = trpc.inbox.email.delete.useMutation();

  // Shortwave-style context tracking
  const emailContext = useEmailContext();

  // Sync local state to EmailContext (for AI context tracking)
  useEffect(() => {
    emailContext.updateState({
      folder: selectedFolder,
      viewMode,
      selectedLabels,
      searchQuery,
      openThreadId: selectedThreadId,
      previewThreadId,
      openDrafts: composerOpen ? 1 : 0,
      selectedThreads: selectedEmails,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedFolder,
    viewMode,
    selectedLabels,
    searchQuery,
    selectedThreadId,
    previewThreadId,
    composerOpen,
    selectedEmails,
    // NOTE: emailContext is NOT in deps to avoid infinite loop
  ]);

  // Build query based on folder and labels
  const buildQuery = () => {
    let query = "";
    if (selectedFolder === "inbox") query = "in:inbox";
    else if (selectedFolder === "sent") query = "in:sent";
    else if (selectedFolder === "archive") query = "-in:inbox";
    else if (selectedFolder === "starred") query = "is:starred";

    // Add label filters
    if (selectedLabels.length > 0) {
      const labelQuery = selectedLabels
        .map(label => `label:${label}`)
        .join(" ");
      query = query ? `${query} ${labelQuery}` : labelQuery;
    }

    // Add search query
    if (searchQuery.trim()) {
      query = query ? `${query} ${searchQuery}` : searchQuery;
    }

    return query || "in:inbox";
  };

  const {
    data: emails,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = trpc.inbox.email.list.useQuery(
    {
      maxResults: 50,
      query: buildQuery(),
    },
    {
      // Disable automatic polling - use adaptive polling instead
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      // Use intelligent retry strategy (handled globally, but override for rate limits)
      retry: (failureCount, error) => {
        if (rateLimit.isRateLimitError(error)) {
          return false; // Don't retry rate limit errors
        }
        return failureCount < 2; // Max 2 retries for other errors (global handles delay)
      },
      enabled: !rateLimit.isRateLimited, // Disable query when rate limited
    }
  );

  // Adaptive polling based on user activity
  useAdaptivePolling({
    baseInterval: 90000, // 90 seconds base
    minInterval: 45000, // 45 seconds when active (emails need to be fresher)
    maxInterval: 300000, // 5 minutes when inactive
    inactivityThreshold: 60000, // 1 minute to consider inactive
    pauseOnHidden: true,
    enabled: !rateLimit.isRateLimited && !isLoading,
    onPoll: async () => {
      if (!rateLimit.isRateLimited) {
        await refetch();
      }
    },
  });

  // Handle rate limit errors
  useEffect(() => {
    if (error && rateLimit.isRateLimitError(error)) {
      rateLimit.handleRateLimitError(error);
    }
  }, [error, rateLimit]);

  // Throttled refetch to prevent spam
  const throttledRefetch = useMemo(
    () =>
      throttle(() => {
        if (!rateLimit.isRateLimited) {
          refetch();
        } else {
          toast.warning(
            `Rate limit aktiveret. Prøv igen om ${rateLimit.getRetryAfterText() || "et øjeblik"}.`
          );
        }
      }, 2000), // Throttle to max 1 request per 2 seconds
    [refetch, rateLimit]
  );

  // Transform GmailThread[] to flat message list for display
  const emailMessages = useMemo<EmailMessage[]>(() => {
    if (!emails) return [];

    return emails.flatMap((thread: any): EmailMessage[] => {
      if (!thread.messages || thread.messages.length === 0) {
        return [
          {
            id: thread.id,
            threadId: thread.id,
            subject: thread.subject || "No Subject",
            from: thread.from || "",
            to: "",
            date: new Date().toISOString(),
            body: thread.snippet || "",
            snippet: thread.snippet || "",
            unread: thread.unread || false,
            labels: thread.labels || [],
            hasAttachment: false,
            sender: thread.from || "",
          },
        ];
      }

      const lastMessage = thread.messages[thread.messages.length - 1];
      return [
        {
          id: lastMessage.id || thread.id,
          threadId: thread.id,
          subject: lastMessage.subject || thread.subject || "No Subject",
          from: lastMessage.from || thread.from || "",
          to: lastMessage.to || "",
          date: lastMessage.date || new Date().toISOString(),
          internalDate: lastMessage.date
            ? new Date(lastMessage.date).getTime()
            : Date.now(),
          body: lastMessage.body || "",
          snippet: thread.snippet || lastMessage.body?.substring(0, 100) || "",
          unread: thread.unread || false,
          labels: thread.labels || [],
          hasAttachment: false,
          sender: lastMessage.from || thread.from || "",
        },
      ];
    });
  }, [emails]);

  // Group emails by time period
  const groupedEmails = useMemo(() => {
    if (!emailMessages || emailMessages.length === 0)
      return { TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups: Record<string, EmailMessage[]> = {
      TODAY: [],
      YESTERDAY: [],
      LAST_7_DAYS: [],
    };

    emailMessages.forEach((email: EmailMessage) => {
      const emailDate = new Date(
        email.internalDate ? new Date(email.internalDate) : email.date
      );

      if (emailDate >= today) {
        groups.TODAY.push(email);
      } else if (emailDate >= yesterday) {
        groups.YESTERDAY.push(email);
      } else if (emailDate >= last7Days) {
        groups.LAST_7_DAYS.push(email);
      }
    });

    return groups;
  }, [emailMessages]);

  // Create flat list for virtualizer (includes section headers)
  const virtualizedItems = useMemo(() => {
    const items: Array<{ type: "section" | "email"; data: any }> = [];

    Object.entries(groupedEmails).forEach(([section, sectionEmails]) => {
      if (sectionEmails.length === 0) return;

      // Add section header
      items.push({
        type: "section",
        data: {
          title: section.replace(/_/g, " "),
          count: sectionEmails.length,
        },
      });

      // Add emails
      sectionEmails.forEach(email => {
        items.push({ type: "email", data: email });
      });
    });

    return items;
  }, [groupedEmails]);

  // Virtualizer setup
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: virtualizedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: index => {
      const item = virtualizedItems[index];
      return item?.type === "section" ? 40 : 100; // Section header: 40px, Email: 100px
    },
    overscan: 5,
  });

  const handleLabelToggle = (labelName: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelName)
        ? prev.filter(l => l !== labelName)
        : [...prev, labelName]
    );
  };

  const handleReply = (message: any) => {
    setComposerMode("reply");
    setComposerReplyTo({
      threadId: selectedThreadId || "",
      messageId: message.id,
      to: message.from,
      subject: message.subject,
      body: message.body,
    });
    setComposerOpen(true);
  };

  const handleForward = (message: any) => {
    setComposerMode("forward");
    setComposerForwardFrom({
      subject: message.subject,
      body: message.body,
    });
    setComposerOpen(true);
  };

  const handleComposeNew = () => {
    setComposerMode("compose");
    setComposerReplyTo(null);
    setComposerForwardFrom(null);
    setComposerOpen(true);
  };

  const handleArchive = () => {
    setSelectedThreadId(null);
    if (!rateLimit.isRateLimited) {
      throttledRefetch();
    }
  };

  const handleDelete = () => {
    setSelectedThreadId(null);
    if (!rateLimit.isRateLimited) {
      throttledRefetch();
    }
  };

  const utils = trpc.useUtils();
  const handleBulkArchive = async () => {
    if (selectedEmails.size === 0 || bulkActionPending) {
      return;
    }
    setBulkActionPending(true);
    const threadIds = Array.from(selectedEmails);
    let successCount = 0;

    for (const threadId of threadIds) {
      try {
        await archiveThreadMutation.mutateAsync({ threadId });
        successCount += 1;
      } catch (error) {
        console.error("[EmailTab] Bulk archive failed", { threadId, error });
      }
    }

    await Promise.all([
      utils.inbox.email.list.invalidate(),
      utils.inbox.email.getPipelineStates.invalidate(),
    ]);

    setSelectedEmails(new Set());
    setBulkActionPending(false);

    if (successCount === threadIds.length) {
      toast.success(`${successCount} emails arkiveret`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} emails arkiveret, ${threadIds.length - successCount} mislykkedes`
      );
    } else {
      toast.error("Kunne ikke arkivere emails");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0 || bulkActionPending) {
      return;
    }
    setBulkActionPending(true);
    const threadIds = Array.from(selectedEmails);
    let successCount = 0;

    for (const threadId of threadIds) {
      try {
        await deleteThreadMutation.mutateAsync({ threadId });
        successCount += 1;
      } catch (error) {
        console.error("[EmailTab] Bulk delete failed", { threadId, error });
      }
    }

    await Promise.all([
      utils.inbox.email.list.invalidate(),
      utils.inbox.email.getPipelineStates.invalidate(),
    ]);

    setSelectedEmails(new Set());
    setBulkActionPending(false);

    if (successCount === threadIds.length) {
      toast.success(`${successCount} emails slettet`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} emails slettet, ${threadIds.length - successCount} mislykkedes`
      );
    } else {
      toast.error("Kunne ikke slette emails");
    }
  };

  const createLeadMutation = trpc.inbox.email.createLeadFromEmail.useMutation();

  const handleSenderClick = async (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Extract email address from "Name <email>" format
    const emailMatch = email.match(/<(.+)>/);
    const emailAddress = emailMatch ? emailMatch[1] : email;
    const emailName = emailMatch
      ? email.match(/^(.+?)\s*</)?.[1]?.trim()
      : undefined;

    // Try to find related lead using utils, create if missing
    try {
      const result = await utils.inbox.email.getRelatedLead.fetch({
        email: emailAddress,
        createIfMissing: true, // Automatically create lead/customer if not found
      });
      if (result?.id) {
        setSelectedLeadId(result.id);
        setCustomerProfileOpen(true);
        // Refresh leads list if a new lead was created
        utils.inbox.leads.list.invalidate();
      } else {
        // Try to create lead manually
        try {
          const createResult = await createLeadMutation.mutateAsync({
            email: emailAddress,
            name: emailName,
            source: "email",
          });
          if (createResult.created) {
            setSelectedLeadId(createResult.lead.id);
            setCustomerProfileOpen(true);
            utils.inbox.leads.list.invalidate();
            toast.success("Lead oprettet automatisk fra email");
          }
        } catch (createError) {
          toast.error("Kunne ikke oprette lead");
        }
      }
    } catch (error) {
      toast.error("Kunne ikke finde eller oprette kunde");
    }
  };

  // If thread is selected, show detail view
  if (selectedThreadId) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="flex items-center gap-2 pb-4 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedThreadId(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
        </div>

        {/* Thread View */}
        <div className="flex-1 overflow-hidden">
          <EmailThreadView
            threadId={selectedThreadId}
            onReply={handleReply}
            onForward={handleForward}
            onArchive={handleArchive}
            onDelete={handleDelete}
          />
        </div>

        {/* Composer */}
        <EmailComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          mode={composerMode}
          replyTo={composerReplyTo}
          forwardFrom={composerForwardFrom}
        />
      </div>
    );
  }

  // Main list view with sidebar
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 shrink-0">
        <EmailSidebar
          selectedFolder={selectedFolder}
          onFolderChange={setSelectedFolder}
          selectedLabels={selectedLabels}
          onLabelToggle={handleLabelToggle}
          onCompose={handleComposeNew}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="flex gap-2 items-center p-4 border-b bg-background">
          <AdvancedEmailSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={throttledRefetch}
            placeholder="Søg emails, kontakter, labels..."
          />
          {/* View Toggle */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("list");
                setSelectedEmails(new Set());
              }}
              className="h-8"
            >
              Liste
            </Button>
            <Button
              variant={viewMode === "pipeline" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("pipeline");
                setSelectedEmails(new Set());
              }}
              className="h-8"
            >
              Pipeline
            </Button>
            <Button
              variant={viewMode === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setViewMode("dashboard");
                setSelectedEmails(new Set());
              }}
              className="h-8"
            >
              Dashboard
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={throttledRefetch}
            disabled={isFetching || rateLimit.isRateLimited}
            title={
              rateLimit.isRateLimited
                ? `Rate limit aktiveret. Prøv igen om ${rateLimit.getRetryAfterText() || "et øjeblik"}.`
                : "Opdater emails"
            }
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          {rateLimit.isRateLimited && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              <span>Rate limit: {rateLimit.getRetryAfterText()}</span>
            </div>
          )}
          {isFetching && !rateLimit.isRateLimited && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Syncer...
            </span>
          )}
        </div>

        {/* Email List, Pipeline View, or Dashboard */}
        <div className="flex-1 overflow-hidden p-4">
          {viewMode === "dashboard" ? (
            <PipelineDashboard />
          ) : viewMode === "pipeline" ? (
            <EmailPipelineView
              emails={emailMessages}
              onEmailClick={email => {
                setSelectedThreadId(email.threadId);
              }}
            />
          ) : (
            <div className="overflow-y-auto overflow-x-hidden h-full" ref={parentRef}>
              {/* Bulk Actions Bar */}
              {selectedEmails.size > 0 && (
                <div className="mb-4 p-3 bg-primary/10 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedEmails.size} email
                      {selectedEmails.size !== 1 ? "s" : ""} valgt
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkArchive}
                      disabled={bulkActionPending}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Arkivér
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                      disabled={bulkActionPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedEmails(new Set())}
                      disabled={bulkActionPending}
                    >
                      Annuller
                    </Button>
                  </div>
                </div>
              )}
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-muted/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Mail className="w-12 h-12 mb-3 text-muted-foreground opacity-50" />
                  <p className="text-lg font-semibold mb-2">
                    {rateLimit.isRateLimitError(error)
                      ? "Rate limit nået"
                      : "Kunne ikke hente emails"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    {rateLimit.isRateLimitError(error) ? (
                      <>
                        For mange requests til Gmail API.
                        {rateLimit.getRetryAfterText() && (
                          <span className="block mt-2 font-medium text-foreground">
                            Prøv igen om {rateLimit.getRetryAfterText()}
                          </span>
                        )}
                      </>
                    ) : (
                      error?.message ||
                      "Der opstod en fejl ved hentning af emails."
                    )}
                  </p>
                  <Button
                    onClick={throttledRefetch}
                    variant="outline"
                    disabled={rateLimit.isRateLimited || isFetching}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {rateLimit.isRateLimited ? "Venter..." : "Prøv igen"}
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map(virtualRow => {
                    const item = virtualizedItems[virtualRow.index];
                    if (!item) return null;

                    if (item.type === "section") {
                      const { title, count } = item.data;
                      return (
                        <div
                          key={`section-${title}`}
                          data-index={virtualRow.index}
                          ref={virtualizer.measureElement}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="mb-2"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <ChevronDown className="w-4 h-4" />
                            {title}
                            <Badge variant="secondary" className="ml-auto">
                              {count}
                            </Badge>
                          </div>
                        </div>
                      );
                    }

                    const email = item.data as EmailMessage;
                    return (
                      <div
                        key={email.id}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="mb-2 ml-6"
                      >
                        <Card
                          className={`w-full p-4 hover:bg-accent/50 cursor-pointer transition-colors ${
                            selectedEmails.has(email.threadId)
                              ? "ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={e => {
                            // Toggle selection on checkbox click, open email otherwise
                            const checkbox = (e.target as HTMLElement).closest(
                              '[type="checkbox"]'
                            );
                            if (checkbox) {
                              e.stopPropagation();
                              setSelectedEmails(prev => {
                                const next = new Set(prev);
                                if (next.has(email.threadId)) {
                                  next.delete(email.threadId);
                                } else {
                                  next.add(email.threadId);
                                }
                                return next;
                              });
                            } else {
                              setSelectedThreadId(email.threadId);
                            }
                          }}
                          onDoubleClick={() => {
                            setPreviewThreadId(email.threadId);
                            setPreviewModalOpen(true);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedEmails.has(email.threadId)}
                                onCheckedChange={checked => {
                                  setSelectedEmails(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(email.threadId);
                                    } else {
                                      next.delete(email.threadId);
                                    }
                                    return next;
                                  });
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={e =>
                                    handleSenderClick(
                                      email.from || email.sender,
                                      e
                                    )
                                  }
                                  className="font-medium truncate hover:underline"
                                >
                                  {email.from || email.sender}
                                </button>
                                {email.unread && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Needs Action
                                  </Badge>
                                )}
                                {email.labels?.map(label => (
                                  <Badge
                                    key={label}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm font-medium truncate mb-1">
                                {email.subject}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {email.snippet}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(
                                  email.internalDate || email.date
                                ).toLocaleTimeString("da-DK", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {email.hasAttachment && (
                                <Badge variant="outline" className="text-xs">
                                  📎
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}

              {emailMessages &&
                emailMessages.length === 0 &&
                !isLoading &&
                !isError && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-lg font-semibold mb-2">
                      Ingen emails fundet
                    </p>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                      {buildQuery() !== "in:inbox"
                        ? "Prøv at ændre dine filtre eller søg efter noget andet."
                        : "Din indbakke ser ud til at være tom. Nye emails vil blive vist her automatisk."}
                    </p>
                    <Button
                      onClick={throttledRefetch}
                      size="sm"
                      disabled={rateLimit.isRateLimited}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Opdater
                    </Button>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <EmailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        mode={composerMode}
        replyTo={composerReplyTo}
        forwardFrom={composerForwardFrom}
      />

      {/* Customer Profile */}
      {selectedLeadId !== null && (
        <CustomerProfile
          leadId={selectedLeadId}
          open={customerProfileOpen}
          onClose={() => {
            setCustomerProfileOpen(false);
            setSelectedLeadId(null);
          }}
        />
      )}

      {/* Email Preview Modal */}
      {previewThreadId !== null && (
        <EmailPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          threadId={previewThreadId}
          onReply={replyToData => {
            setComposerMode("reply");
            setComposerReplyTo(replyToData);
            setComposerForwardFrom(null);
            setComposerOpen(true);
          }}
          onForward={forwardFromData => {
            setComposerMode("forward");
            setComposerReplyTo(null);
            setComposerForwardFrom(forwardFromData);
            setComposerOpen(true);
          }}
          onOpenFull={() => {
            setSelectedThreadId(previewThreadId);
          }}
        />
      )}
    </div>
  );
}
