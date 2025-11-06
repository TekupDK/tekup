import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COST_PER_EMAIL, formatEstimatedCost } from "@/config/ai";
import { useEmailContext } from "@/contexts/EmailContext";
import { useAdaptivePolling } from "@/hooks/useAdaptivePolling";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRateLimit } from "@/hooks/useRateLimit";
import { throttle } from "@/lib/rateLimitUtils";
import { trpc } from "@/lib/trpc";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  Keyboard,
  Mail,
  Paperclip,
  PenSquare,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import CustomerProfile from "../CustomerProfile";
import AdvancedEmailSearch from "./AdvancedEmailSearch";
import EmailAISummary from "./EmailAISummary";
import EmailComposer from "./EmailComposer";
import EmailLabelSuggestions from "./EmailLabelSuggestions";
import { EmailPipelineBoard } from "./EmailPipelineBoard";
import EmailPreviewModal from "./EmailPreviewModal";
import EmailRowActions from "./EmailRowActions";
import EmailSidebar from "./EmailSidebar";
import EmailThreadView from "./EmailThreadView";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import PipelineDashboard from "./PipelineDashboard";
import RateLimitBanner from "./RateLimitBanner";

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
  // PERFORMANCE: Store preview data for optimistic UI
  const [threadPreview, setThreadPreview] = useState<{
    subject: string;
    from: string;
    snippet: string;
    date: string;
  } | null>(null);
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

  // AI Features state
  const [showAIFeatures, setShowAIFeatures] = useState(true); // Toggle for showing AI summaries/labels
  const [bulkAIGenerating, setBulkAIGenerating] = useState(false);
  const [aiStatsToday, setAiStatsToday] = useState({
    summariesCount: 0,
    labelsCount: 0,
    timeSaved: 0, // in minutes
    cost: 0, // in dollars
  });

  // Keyboard navigation state
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
  const selectedEmailRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Rate limit handling
  const rateLimit = useRateLimit();
  const archiveThreadMutation = trpc.inbox.email.archive.useMutation();
  const deleteThreadMutation = trpc.inbox.email.delete.useMutation();
  const markReadMutation = trpc.inbox.email.markAsRead.useMutation();
  const markUnreadMutation = trpc.inbox.email.markAsUnread.useMutation();
  const starMutation = trpc.inbox.email.star.useMutation();

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

  // Extract meaningful error message from tRPC error
  const getErrorMessage = (error: any): string => {
    if (!error) return "Der opstod en uventet fejl.";

    // Check for JSON parse errors (HTML returned instead of JSON)
    if (
      error.message?.includes("JSON") ||
      error.message?.includes("Unexpected token")
    ) {
      return "Serverfejl: Modtog ugyldig response. Prøv at genindlæse siden.";
    }

    // Rate limit errors
    if (rateLimit.isRateLimitError(error)) {
      return "Gmail API rate limit nået. Vent venligst.";
    }

    // Return the error message if available
    return (
      error.message ||
      error.data?.message ||
      "Der opstod en fejl ved hentning af emails."
    );
  };

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
            hasAttachment: Boolean((thread as any).hasAttachments),
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
          hasAttachment: Boolean((thread as any).hasAttachments),
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
      // Precise estimates based on actual rendered heights
      return item?.type === "section" ? 46 : 118; // Section: 46px, Email card: 118px
    },
    overscan: 15, // Higher overscan for even smoother scrolling and better measurement
    measureElement: element => {
      // Ensure we measure the actual height including margins/padding
      return element?.getBoundingClientRect().height ?? 0;
    },
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
  // Server-driven AI model/cost config
  const { data: aiConfig } = trpc.system.aiConfig.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const unitCost = useMemo(() => {
    return {
      summary: aiConfig?.costPerEmail.summary ?? COST_PER_EMAIL.summary,
      labelSuggestion:
        aiConfig?.costPerEmail.labelSuggestion ??
        COST_PER_EMAIL.labelSuggestion,
      toolbarEstimatePerEmail:
        aiConfig?.costPerEmail.toolbarEstimatePerEmail ??
        COST_PER_EMAIL.toolbarEstimatePerEmail,
      modelLabel: (() => {
        const model = aiConfig?.model || "";
        const lower = model.toLowerCase();
        if (lower.includes("gemma") && lower.includes("free")) {
          return "Gemma 3 27B (FREE)";
        }
        return model || "Gemma 3 27B (FREE)";
      })(),
    } as const;
  }, [aiConfig]);

  // PERFORMANCE: Prefetch thread on hover for instant load when clicked
  const handleThreadHover = (threadId: string) => {
    // Prefetch the thread data into React Query cache
    utils.inbox.email.getThread.prefetch({ threadId });
  };

  // Get only email items (excluding section headers) for keyboard navigation
  const emailOnlyItems = useMemo(() => {
    return virtualizedItems.filter(item => item.type === "email");
  }, [virtualizedItems]);

  // Keyboard shortcut handlers
  const handleNextEmail = useCallback(() => {
    if (emailOnlyItems.length === 0) return;
    setSelectedEmailIndex(prev =>
      Math.min(prev + 1, emailOnlyItems.length - 1)
    );
  }, [emailOnlyItems.length]);

  const handlePreviousEmail = useCallback(() => {
    setSelectedEmailIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleReplyToSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    handleReply({
      id: email.id,
      from: email.from,
      subject: email.subject,
      body: email.body,
    });
  }, [emailOnlyItems, selectedEmailIndex]);

  const handleForwardSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    handleForward({
      subject: email.subject,
      body: email.body,
    });
  }, [emailOnlyItems, selectedEmailIndex]);

  const handleArchiveSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    archiveThreadMutation.mutate(
      { threadId: email.threadId },
      {
        onSuccess: () => {
          toast.success("Email arkiveret");
          throttledRefetch();
        },
      }
    );
  }, [
    emailOnlyItems,
    selectedEmailIndex,
    archiveThreadMutation,
    throttledRefetch,
  ]);

  const handleDeleteSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    deleteThreadMutation.mutate(
      { threadId: email.threadId },
      {
        onSuccess: () => {
          toast.success("Email flyttet til papirkurv");
          throttledRefetch();
        },
      }
    );
  }, [
    emailOnlyItems,
    selectedEmailIndex,
    deleteThreadMutation,
    throttledRefetch,
  ]);

  const handleMarkReadSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    markReadMutation.mutate(
      { messageId: email.id },
      {
        onSuccess: () => {
          toast.success("Markeret som læst");
          throttledRefetch();
        },
      }
    );
  }, [emailOnlyItems, selectedEmailIndex, markReadMutation, throttledRefetch]);

  const handleMarkUnreadSelected = useCallback(() => {
    if (emailOnlyItems.length === 0 || !emailOnlyItems[selectedEmailIndex])
      return;
    const email = emailOnlyItems[selectedEmailIndex].data as EmailMessage;
    markUnreadMutation.mutate(
      { messageId: email.id },
      {
        onSuccess: () => {
          toast.success("Markeret som ulæst");
          throttledRefetch();
        },
      }
    );
  }, [
    emailOnlyItems,
    selectedEmailIndex,
    markUnreadMutation,
    throttledRefetch,
  ]);

  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleCloseThread = useCallback(() => {
    if (selectedThreadId) {
      setSelectedThreadId(null);
    }
  }, [selectedThreadId]);

  const handleShowKeyboardHelp = useCallback(() => {
    setShowKeyboardHelp(true);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: "j",
        handler: handleNextEmail,
        description: "Næste email",
        category: "navigation",
      },
      {
        key: "k",
        handler: handlePreviousEmail,
        description: "Forrige email",
        category: "navigation",
      },
      {
        key: "r",
        handler: handleReplyToSelected,
        description: "Besvar email",
        category: "action",
      },
      {
        key: "f",
        handler: handleForwardSelected,
        description: "Videresend email",
        category: "action",
      },
      {
        key: "c",
        handler: handleComposeNew,
        description: "Ny email",
        category: "action",
      },
      {
        key: "e",
        handler: handleArchiveSelected,
        description: "Arkivér valgt email",
        category: "action",
      },
      {
        key: "Backspace",
        handler: handleDeleteSelected,
        description: "Slet valgt email",
        category: "action",
      },
      {
        key: "m",
        handler: handleMarkReadSelected,
        description: "Marker valgt som læst",
        category: "action",
      },
      {
        key: "u",
        handler: handleMarkUnreadSelected,
        description: "Marker valgt som ulæst",
        category: "action",
      },
      {
        key: "/",
        handler: handleFocusSearch,
        description: "Fokus søgning",
        category: "search",
      },
      {
        key: "Escape",
        handler: handleCloseThread,
        description: "Luk tråd",
        category: "modal",
      },
      {
        key: "?",
        handler: handleShowKeyboardHelp,
        description: "Vis keyboard genveje",
        category: "help",
      },
    ],
    viewMode === "list" && !composerOpen && !showKeyboardHelp // Only enable in list view and when composer/help is closed
  );

  // Auto-scroll selected email into view
  useEffect(() => {
    if (selectedEmailRef.current && emailOnlyItems.length > 0) {
      selectedEmailRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedEmailIndex, emailOnlyItems.length]);

  // Reset selected index when emails change
  useEffect(() => {
    setSelectedEmailIndex(0);
  }, [emailMessages]);

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

  const handleBulkMarkAsRead = async () => {
    if (selectedEmails.size === 0 || bulkActionPending) {
      return;
    }
    setBulkActionPending(true);

    // For bulk read/unread, we need to get the message IDs from selected thread IDs
    // We'll use the first message ID from each selected email in emailMessages
    const selectedEmailData = emailMessages.filter(email =>
      selectedEmails.has(email.threadId)
    );
    let successCount = 0;

    for (const email of selectedEmailData) {
      try {
        await markReadMutation.mutateAsync({ messageId: email.id });
        successCount += 1;
      } catch (error) {
        console.error("[EmailTab] Bulk mark read failed", {
          email: email.id,
          error,
        });
      }
    }

    await utils.inbox.email.list.invalidate();
    setSelectedEmails(new Set());
    setBulkActionPending(false);

    if (successCount === selectedEmailData.length) {
      toast.success(`${successCount} emails markeret som læst`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} emails markeret, ${selectedEmailData.length - successCount} mislykkedes`
      );
    } else {
      toast.error("Kunne ikke markere emails som læst");
    }
  };

  const handleBulkMarkAsUnread = async () => {
    if (selectedEmails.size === 0 || bulkActionPending) {
      return;
    }
    setBulkActionPending(true);

    const selectedEmailData = emailMessages.filter(email =>
      selectedEmails.has(email.threadId)
    );
    let successCount = 0;

    for (const email of selectedEmailData) {
      try {
        await markUnreadMutation.mutateAsync({ messageId: email.id });
        successCount += 1;
      } catch (error) {
        console.error("[EmailTab] Bulk mark unread failed", {
          email: email.id,
          error,
        });
      }
    }

    await utils.inbox.email.list.invalidate();
    setSelectedEmails(new Set());
    setBulkActionPending(false);

    if (successCount === selectedEmailData.length) {
      toast.success(`${successCount} emails markeret som ulæst`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} emails markeret, ${selectedEmailData.length - successCount} mislykkedes`
      );
    } else {
      toast.error("Kunne ikke markere emails som ulæst");
    }
  };

  const createLeadMutation = trpc.inbox.email.createLeadFromEmail.useMutation();

  // Bulk AI Actions
  const batchSummariesMutation =
    trpc.inbox.email.batchGenerateSummaries.useMutation();
  const batchLabelsMutation =
    trpc.inbox.email.batchGenerateLabelSuggestions.useMutation();
  const batchRemoveDbLabelsMutation = (
    trpc.inbox as any
  ).email.batchRemoveDbLabels.useMutation();

  // Track last auto-applied labels for undo
  const [lastAutoAppliedOps, setLastAutoAppliedOps] = useState<
    Array<{ emailId: number; label: string }>
  >([]);

  const handleGenerateAllSummaries = async () => {
    const visibleIds = emailMessages.map(email => parseInt(email.id, 10));

    if (visibleIds.length === 0) {
      toast.info("Ingen emails at generere summaries for");
      return;
    }

    const costValue = visibleIds.length * unitCost.summary;

    setBulkAIGenerating(true);
    toast.info(
      `Genererer summaries for ${visibleIds.length} emails... (Cost: ~${formatEstimatedCost(costValue)})`
    );

    try {
      const result = await batchSummariesMutation.mutateAsync({
        emailIds: visibleIds,
        maxConcurrent: 5,
        skipCached: true,
      });

      // Server returns { processed, skipped, errors }
      const processedCount = (result as any).processed ?? 0;
      const skippedCount = (result as any).skipped ?? 0;

      const avgMs = (result as any)?.avgDurationMs;
      const minutesPerEmail = avgMs && avgMs > 0 ? avgMs / 60000 : 0.5; // fallback ~30s/email
      setAiStatsToday(prev => ({
        ...prev,
        summariesCount: prev.summariesCount + processedCount,
        timeSaved: prev.timeSaved + processedCount * minutesPerEmail,
        cost: prev.cost + costValue,
      }));

      toast.success(
        `✅ Genereret ${processedCount} summaries${skippedCount > 0 ? ` (${skippedCount} fra cache)` : ""}`
      );
      throttledRefetch();
    } catch (error) {
      toast.error("Kunne ikke generere summaries");
      console.error("Batch summaries error:", error);
    } finally {
      setBulkAIGenerating(false);
    }
  };

  const handleGenerateAllLabels = async () => {
    const visibleIds = emailMessages.map(email => parseInt(email.id, 10));

    if (visibleIds.length === 0) {
      toast.info("Ingen emails at generere labels for");
      return;
    }

    const costValue = visibleIds.length * unitCost.labelSuggestion;

    setBulkAIGenerating(true);
    toast.info(
      `Genererer label forslag for ${visibleIds.length} emails... (Cost: ~${formatEstimatedCost(costValue)})`
    );

    try {
      const result = await batchLabelsMutation.mutateAsync({
        emailIds: visibleIds,
        maxConcurrent: 5,
        skipCached: true,
        autoApply: false,
      });

      const successCount = result.summary.successful;
      const cachedCount = result.summary.cached;

      const avgMs = (result as any)?.summary?.avgDurationMs;
      const minutesPerEmail = avgMs && avgMs > 0 ? avgMs / 60000 : 0.3; // fallback ~20s/email
      setAiStatsToday(prev => ({
        ...prev,
        labelsCount: prev.labelsCount + successCount,
        timeSaved: prev.timeSaved + successCount * minutesPerEmail,
        cost: prev.cost + costValue,
      }));

      toast.success(
        `✅ Genereret ${successCount} label forslag${cachedCount > 0 ? ` (${cachedCount} fra cache)` : ""}`
      );
      throttledRefetch();
    } catch (error) {
      toast.error("Kunne ikke generere label forslag");
      console.error("Batch labels error:", error);
    } finally {
      setBulkAIGenerating(false);
    }
  };

  const handleAutoApplyHighConfidenceLabels = async () => {
    const visibleIds = emailMessages.map(email => parseInt(email.id, 10));

    if (visibleIds.length === 0) {
      toast.info("Ingen emails at auto-anvende labels for");
      return;
    }

    const costValue = visibleIds.length * unitCost.labelSuggestion;

    setBulkAIGenerating(true);
    toast.info(
      `Auto-anvender høj-confidence labels for ${visibleIds.length} emails... (Cost: ~${formatEstimatedCost(costValue)})`
    );

    try {
      const result = await batchLabelsMutation.mutateAsync({
        emailIds: visibleIds,
        maxConcurrent: 5,
        skipCached: true,
        autoApply: true,
      });

      const successCount = result.summary.successful;
      const cachedCount = result.summary.cached;
      const autoAppliedCount = result.summary.autoApplied || 0;

      // Build undo ops from results
      const ops: Array<{ emailId: number; label: string }> = [];
      for (const r of result.results || []) {
        if (r.autoApplied && r.autoApplied.length > 0) {
          for (const label of r.autoApplied) {
            ops.push({ emailId: r.emailId, label });
          }
        }
      }
      setLastAutoAppliedOps(ops);

      const avgMs = (result as any)?.summary?.avgDurationMs;
      const minutesPerEmail = avgMs && avgMs > 0 ? avgMs / 60000 : 0.3;
      setAiStatsToday(prev => ({
        ...prev,
        labelsCount: prev.labelsCount + autoAppliedCount,
        timeSaved: prev.timeSaved + autoAppliedCount * minutesPerEmail,
        cost: prev.cost + costValue,
      }));

      throttledRefetch();

      toast.success(
        `✅ Auto-anvendt ${autoAppliedCount} labels${cachedCount > 0 ? ` (${cachedCount} fra cache)` : ""}`,
        {
          action: {
            label: "Fortryd",
            onClick: async () => {
              if (ops.length === 0) return;
              try {
                const res = await batchRemoveDbLabelsMutation.mutateAsync({
                  ops,
                });
                if (res.failed === 0) {
                  // Revert local stats
                  setAiStatsToday(prev => ({
                    ...prev,
                    labelsCount: Math.max(0, prev.labelsCount - ops.length),
                  }));
                  setLastAutoAppliedOps([]);
                  throttledRefetch();
                  toast.success(`Fortrydelse gennemført (${res.removed})`);
                } else {
                  toast.error(
                    `Kunne ikke fortryde nogle labels (${res.failed})`
                  );
                }
              } catch (e: any) {
                toast.error("Fejl ved fortrydelse", {
                  description: e?.message,
                });
              }
            },
          },
          duration: 6000,
        }
      );
    } catch (error) {
      toast.error("Kunne ikke auto-anvende labels");
      console.error("Batch labels auto-apply error:", error);
    } finally {
      setBulkAIGenerating(false);
    }
  };

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
      <div
        className="h-full flex flex-col overflow-hidden"
        data-testid="email-thread-view"
      >
        {/* Header with back button */}
        <div className="flex items-center gap-2 pb-4 border-b px-4 shrink-0">
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
        <div className="flex-1 overflow-hidden min-h-0">
          <EmailThreadView
            threadId={selectedThreadId}
            onReply={handleReply}
            onForward={handleForward}
            onArchive={handleArchive}
            onDelete={handleDelete}
            initialPreview={threadPreview || undefined}
          />
        </div>

        {/* Composer */}
        <EmailComposer
          open={composerOpen}
          onOpenChange={setComposerOpen}
          mode={composerMode}
          replyTo={composerReplyTo}
          forwardFrom={composerForwardFrom}
          data-testid="email-composer"
        />
      </div>
    );
  }

  // Main list view with sidebar
  return (
    <div className="h-full flex overflow-hidden">
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Compact Search & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center p-2 border-b bg-background shrink-0">
          <div className="flex-1 max-w-lg">
            <AdvancedEmailSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={throttledRefetch}
              placeholder="Søg emails, kontakter, labels..."
              inputRef={searchInputRef}
            />
          </div>
          <div className="flex gap-2 items-center">
            {/* View Toggle - More Compact */}
            <div className="flex gap-0.5 border rounded-md p-0.5">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setViewMode("list");
                  setSelectedEmails(new Set());
                }}
                className="h-7 px-2 text-xs"
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
                className="h-7 px-2 text-xs"
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
                className="h-7 px-2 text-xs"
              >
                Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleComposeNew}
                className="h-7 px-3 text-xs gap-1.5"
                title="Skriv ny email (c)"
              >
                <PenSquare className="w-3 h-3" />
                Skriv
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={throttledRefetch}
                disabled={isFetching || rateLimit.isRateLimited}
                className="h-7 w-7 shrink-0"
                title={
                  rateLimit.isRateLimited
                    ? `Rate limit aktiveret. Prøv igen om ${rateLimit.getRetryAfterText() || "et øjeblik"}.`
                    : "Opdater emails"
                }
              >
                <RefreshCw
                  className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>

              {/* AI Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 relative"
                    title="AI Tools"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showAIFeatures &&
                      (aiStatsToday.summariesCount > 0 ||
                        aiStatsToday.labelsCount > 0) && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                      )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>AI Features</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-normal text-muted-foreground">
                        Vis i emails
                      </span>
                      <Checkbox
                        checked={showAIFeatures}
                        onCheckedChange={checked =>
                          setShowAIFeatures(checked as boolean)
                        }
                      />
                    </label>
                  </DropdownMenuLabel>

                  {/* Stats */}
                  {(aiStatsToday.summariesCount > 0 ||
                    aiStatsToday.labelsCount > 0 ||
                    aiStatsToday.timeSaved > 0) && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-2 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Summaries idag:
                          </span>
                          <span className="font-medium">
                            {aiStatsToday.summariesCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Labels idag:
                          </span>
                          <span className="font-medium">
                            {aiStatsToday.labelsCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Tid sparet:
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {aiStatsToday.timeSaved.toFixed(1)} min
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    Batch Actions ({emailMessages.length} emails)
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={handleGenerateAllSummaries}
                    disabled={bulkAIGenerating || emailMessages.length === 0}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Summaries
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleGenerateAllLabels}
                    disabled={bulkAIGenerating || emailMessages.length === 0}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                    Suggest Labels
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleAutoApplyHighConfidenceLabels}
                    disabled={bulkAIGenerating || emailMessages.length === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Auto-apply High Confidence
                  </DropdownMenuItem>

                  {bulkAIGenerating && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>AI arbejder...</span>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleShowKeyboardHelp}
                className="h-7 w-7 shrink-0"
                title="Keyboard genveje (?)"
              >
                <Keyboard className="w-3 h-3" />
              </Button>
            </div>
            {isFetching && !rateLimit.isRateLimited && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Syncer...
              </span>
            )}
          </div>
        </div>

        {/* Rate Limit Banner */}
        {rateLimit.isRateLimited && (
          <RateLimitBanner
            retryAfter={rateLimit.retryAfter}
            onClear={rateLimit.clearRateLimit}
          />
        )}

        {/* Email List, Pipeline View, or Dashboard */}
        <div className="flex-1 overflow-hidden p-4 min-h-0">
          {viewMode === "dashboard" ? (
            <PipelineDashboard />
          ) : viewMode === "pipeline" ? (
            <EmailPipelineBoard
              onEmailClick={email => {
                // Open email in preview modal
                setPreviewThreadId(email.threadId);
                setPreviewModalOpen(true);
              }}
            />
          ) : (
            <div className="h-full flex flex-col overflow-hidden min-h-0">
              {/* Bulk Actions Bar */}
              {selectedEmails.size > 0 && (
                <div className="mb-3 p-2 bg-primary/10 border rounded-lg flex items-center justify-between shrink-0 overflow-hidden">
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
                      className="h-7 text-xs"
                    >
                      <Archive className="w-3 h-3 mr-1" />
                      Arkivér
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDelete}
                      disabled={bulkActionPending}
                      className="h-7 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Slet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkMarkAsRead}
                      disabled={bulkActionPending}
                      className="h-7 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Læst
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkMarkAsUnread}
                      disabled={bulkActionPending}
                      className="h-7 text-xs"
                    >
                      <Circle className="w-3 h-3 mr-1" />
                      Ulæst
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedEmails(new Set())}
                      disabled={bulkActionPending}
                      className="h-7 text-xs"
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
                    Fejl ved hentning af emails
                  </p>
                  <p className="text-sm text-muted-foreground mb-2 max-w-md">
                    {getErrorMessage(error)}
                  </p>
                  {rateLimit.isRateLimitError(error) &&
                    rateLimit.getRetryAfterText() && (
                      <p className="text-sm font-medium text-foreground mb-2">
                        Prøv igen om {rateLimit.getRetryAfterText()}
                      </p>
                    )}
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
                  className="flex-1 overflow-y-auto overflow-x-hidden relative"
                  ref={parentRef}
                >
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: "100%",
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
                              zIndex: 10, // Ensure sections stay above emails
                            }}
                            className="py-3 px-1 bg-background/95 backdrop-blur-sm border-b-2 border-border/50"
                          >
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <ChevronDown className="w-4 h-4 text-primary" />
                              {title}
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs font-medium"
                              >
                                {count}
                              </Badge>
                            </div>
                          </div>
                        );
                      }

                      const email = item.data as EmailMessage;
                      // Find this email's index in emailOnlyItems for keyboard navigation
                      const emailIndex = emailOnlyItems.findIndex(
                        e => e.type === "email" && e.data.id === email.id
                      );
                      const isKeyboardSelected =
                        emailIndex === selectedEmailIndex;

                      return (
                        <div
                          key={email.id}
                          data-index={virtualRow.index}
                          ref={node => {
                            virtualizer.measureElement(node);
                            // Set ref for keyboard selected email
                            if (isKeyboardSelected && node) {
                              (selectedEmailRef as any).current = node;
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            paddingLeft: "1.5rem",
                            paddingRight: "0.25rem",
                          }}
                          className="py-2"
                        >
                          <ContextMenu>
                            <ContextMenuTrigger asChild>
                              <Card
                                data-testid="email-card"
                                className={`group w-full p-4 hover:bg-accent/50 cursor-pointer transition-all ${
                                  selectedEmails.has(email.threadId)
                                    ? "ring-2 ring-primary"
                                    : ""
                                } ${
                                  isKeyboardSelected
                                    ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                    : ""
                                }`}
                                onMouseEnter={() => {
                                  // PERFORMANCE: Prefetch thread on hover for instant load
                                  handleThreadHover(email.threadId);
                                }}
                                onClick={e => {
                                  // Toggle selection on checkbox click, open email otherwise
                                  const checkbox = (
                                    e.target as HTMLElement
                                  ).closest('[type="checkbox"]');
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
                                    // PERFORMANCE: Set preview data for optimistic UI
                                    setThreadPreview({
                                      subject: email.subject,
                                      from: email.from,
                                      snippet: email.snippet,
                                      date: email.date,
                                    });
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
                                      checked={selectedEmails.has(
                                        email.threadId
                                      )}
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
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {email.snippet.length > 100
                                        ? `${email.snippet.substring(0, 100)}...`
                                        : email.snippet}
                                    </p>

                                    {/* AI Summary - below snippet (conditionally shown) */}
                                    {showAIFeatures && (
                                      <EmailAISummary
                                        emailId={parseInt(email.id, 10)}
                                        collapsed={false}
                                        className="mt-1"
                                      />
                                    )}

                                    {/* AI Label Suggestions - below summary (conditionally shown) */}
                                    {showAIFeatures && (
                                      <EmailLabelSuggestions
                                        emailId={parseInt(email.id, 10)}
                                        currentLabels={email.labels || []}
                                        onLabelApplied={label => {
                                          // Refresh emails to show updated labels
                                          throttledRefetch();
                                          // Update stats
                                          setAiStatsToday(prev => ({
                                            ...prev,
                                            labelsCount: prev.labelsCount + 1,
                                          }));
                                        }}
                                        collapsed={false}
                                        className="mt-1"
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      {new Date(
                                        email.internalDate || email.date
                                      ).toLocaleString("da-DK", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {(email as any).hasAttachment ||
                                    (email as any).hasAttachments ? (
                                      <div
                                        className="text-muted-foreground mt-0.5"
                                        title="Vedhæftet fil"
                                      >
                                        <Paperclip className="w-4 h-4" />
                                      </div>
                                    ) : null}
                                    {/* Row actions */}
                                    <div className="mt-1">
                                      <EmailRowActions
                                        email={{
                                          id: email.id,
                                          threadId: email.threadId,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </ContextMenuTrigger>
                            <ContextMenuContent
                              onClick={e => e.stopPropagation()}
                            >
                              <ContextMenuLabel>Handlinger</ContextMenuLabel>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() =>
                                  archiveThreadMutation.mutate(
                                    { threadId: email.threadId },
                                    {
                                      onSuccess: () => {
                                        toast.success("Email arkiveret");
                                        throttledRefetch();
                                      },
                                    }
                                  )
                                }
                              >
                                Arkivér
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() =>
                                  deleteThreadMutation.mutate(
                                    { threadId: email.threadId },
                                    {
                                      onSuccess: () => {
                                        toast.success(
                                          "Email flyttet til papirkurv"
                                        );
                                        throttledRefetch();
                                      },
                                    }
                                  )
                                }
                              >
                                Slet
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() =>
                                  markReadMutation.mutate(
                                    { messageId: email.id },
                                    { onSuccess: () => throttledRefetch() }
                                  )
                                }
                              >
                                Marker som læst
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() =>
                                  markUnreadMutation.mutate(
                                    { messageId: email.id },
                                    { onSuccess: () => throttledRefetch() }
                                  )
                                }
                              >
                                Marker som ulæst
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                onClick={() =>
                                  starMutation.mutate(
                                    { messageId: email.id },
                                    { onSuccess: () => throttledRefetch() }
                                  )
                                }
                              >
                                Stjernemarkér
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        </div>
                      );
                    })}
                  </div>

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

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}
