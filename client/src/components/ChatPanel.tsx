import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useEmailContext } from "@/contexts/EmailContext";
import { useActionSuggestions } from "@/hooks/useActionSuggestions";
import { trpc } from "@/lib/trpc";
import { Bot, Cog, Info, Mic, Paperclip, Plus, Send } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ActionApprovalModal, type PendingAction } from "./ActionApprovalModal";
import { SafeStreamdown } from "./SafeStreamdown";
import { SuggestionsBar } from "./SuggestionsBar";

type ChatModel = "gemma-3-27b-free";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

function ChatPanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<ChatModel>("gemma-3-27b-free");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("auto-approve-low-risk") === "true"
      : false
  );

  // Get email context for Shortwave-style tracking
  const emailContext = useEmailContext();

  const { data: conversations, refetch: refetchConversations } =
    trpc.chat.list.useQuery(undefined, {
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch on window focus
    });

  useEffect(() => {
    if (!selectedConversationId && conversations && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);
  const conversationId = selectedConversationId ?? 0;
  const { data: conversationData, refetch: refetchMessages } =
    trpc.chat.get.useQuery(
      { conversationId },
      {
        enabled: selectedConversationId !== null,
        staleTime: 10000, // Cache for 10 seconds
        refetchOnWindowFocus: false,
      }
    );

  // Poll for title updates when conversation has no title
  useEffect(() => {
    if (!conversationData?.conversation || !selectedConversationId) return;

    const needsTitleUpdate =
      !conversationData.conversation.title ||
      conversationData.conversation.title === "New Conversation";
    if (!needsTitleUpdate) return;

    // Limit polling to prevent infinite loops - max 10 polls (30 seconds)
    let pollCount = 0;
    const maxPolls = 10;

    const interval = setInterval(() => {
      pollCount++;
      if (pollCount >= maxPolls) {
        clearInterval(interval);
        return;
      }

      // Only refetch if still mounted and conversation selected
      if (selectedConversationId) {
        refetchMessages().catch(err => {
          console.error("[ChatPanel] Error refetching messages:", err);
        });
        refetchConversations().catch(err => {
          console.error("[ChatPanel] Error refetching conversations:", err);
        });
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [
    conversationData?.conversation,
    selectedConversationId,
    refetchMessages,
    refetchConversations,
  ]);

  const createConversation = trpc.chat.create.useMutation({
    onSuccess: data => {
      setSelectedConversationId(data.id);
      refetchConversations();
    },
  });

  // TRPC utils for imperative queries
  const utils = trpc.useUtils();

  // Helper: resolve selected Gmail thread IDs to internal email IDs
  const resolveSelectedEmailIds = useCallback(async () => {
    try {
      const selectedThreads = Array.from(emailContext.state.selectedThreads);
      if (!selectedThreads || selectedThreads.length === 0)
        return [] as number[];
      const ids = await utils.inbox.email.mapThreadsToEmailIds.fetch({
        threadIds: selectedThreads,
      });
      return Array.isArray(ids) ? (ids as number[]) : [];
    } catch (err) {
      console.warn("[ChatPanel] Failed to resolve selected email IDs:", err);
      return [] as number[];
    }
  }, [emailContext.state.selectedThreads]);

  const executeAction = trpc.chat.executeAction.useMutation({
    onSuccess: data => {
      refetchMessages();
      setPendingAction(null);
      setShowApprovalModal(false);
      const message = (data as any)?.actionResult?.message;
      toast.success(message || "Handling udført!");
    },
    onError: error => {
      toast.error("Kunne ikke udføre handling: " + error.message);
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: async data => {
      // Refetch messages to get updated conversation
      refetchMessages().catch(err => {
        console.error("[ChatPanel] Error refetching messages:", err);
      });
      setInputMessage("");

      // Check if there's a pending action
      if (data.pendingAction) {
        // Check if user has auto-approve enabled for this action type
        const autoApproveKey = `auto-approve-${data.pendingAction.type}`;
        const perActionEnabled =
          localStorage.getItem(autoApproveKey) === "true";
        const shouldAutoApprove =
          data.pendingAction.riskLevel === "low" &&
          (autoApproveLowRisk || perActionEnabled);

        if (shouldAutoApprove && selectedConversationId) {
          // Auto-approve if enabled
          console.log(
            `[ChatPanel] Auto-approving action: ${data.pendingAction.type}`
          );
          let actionParams = data.pendingAction.params || {};
          // Inject selected email IDs for inbox AI actions when not provided
          if (
            (data.pendingAction.type === "ai_generate_summaries" ||
              data.pendingAction.type === "ai_suggest_labels") &&
            (!actionParams.emailIds || actionParams.emailIds.length === 0)
          ) {
            const emailIds = await resolveSelectedEmailIds();
            const selectedCount = emailContext.state.selectedThreads.size;
            if (selectedCount > 0) {
              if (emailIds.length > 0) {
                toast.info(`Bruger dine ${emailIds.length} valgte mails`);
              } else {
                toast.info(
                  `Kunne ikke matche de valgte (${selectedCount}); bruger seneste 25`
                );
              }
            } else {
              toast.info("Ingen mails valgt; bruger seneste 25");
            }
            if (emailIds.length > 0) {
              actionParams = { ...actionParams, emailIds };
            }
          }

          executeAction.mutate({
            conversationId: selectedConversationId,
            actionId: data.pendingAction.id,
            actionType: data.pendingAction.type,
            actionParams,
          });
        } else {
          // Show approval modal
          setPendingAction(data.pendingAction);
          setShowApprovalModal(true);
        }
      }
    },
    onError: error => {
      const errorMessage = error.message || "Ukendt fejl opstod";
      toast.error("Friday kunne ikke sende besked: " + errorMessage);
      console.error("[ChatPanel] Send message error:", error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    // Build context from email state (Shortwave-style)
    // Filter out undefined/null values to avoid sending invalid data
    const rawContext = {
      page: window.location.pathname.includes("/inbox")
        ? "email-tab"
        : undefined,
      selectedThreads: Array.from(
        emailContext.state.selectedThreads
      ) as string[],
      openThreadId: emailContext.state.openThreadId || undefined,
      folder: emailContext.state.folder,
      viewMode: emailContext.state.viewMode,
      selectedLabels: emailContext.state.selectedLabels,
      searchQuery: emailContext.state.searchQuery || undefined,
      openDrafts: emailContext.state.openDrafts || undefined,
      previewThreadId: emailContext.state.previewThreadId || undefined,
    };

    // Clean context: remove undefined/null values and empty arrays
    const context = Object.fromEntries(
      Object.entries(rawContext).filter(([_, value]) => {
        if (value === undefined || value === null) return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
    );

    if (!selectedConversationId) {
      // Create new conversation first
      createConversation.mutate(
        { title: inputMessage.slice(0, 50) },
        {
          onSuccess: data => {
            sendMessage.mutate({
              conversationId: data.id,
              content: inputMessage,
              model: selectedModel,
              context: Object.keys(context).length > 0 ? context : undefined,
            });
          },
          onError: error => {
            toast.error("Friday kunne ikke oprette samtale: " + error.message);
          },
        }
      );
    } else {
      sendMessage.mutate({
        conversationId: selectedConversationId,
        content: inputMessage,
        model: selectedModel,
        context: Object.keys(context).length > 0 ? context : undefined,
      });
    }
  }, [
    inputMessage,
    selectedConversationId,
    selectedModel,
    createConversation,
    sendMessage,
    emailContext.state,
  ]);

  const handleApproveAction = useCallback(
    async (alwaysApprove: boolean) => {
      if (!pendingAction || !selectedConversationId) return;

      // Store "always approve" preference if enabled
      if (alwaysApprove) {
        console.log(
          `[Action Approval] User enabled auto-approve for: ${pendingAction.type}`
        );
        // Store in localStorage (can be migrated to user preferences later)
        try {
          localStorage.setItem(`auto-approve-${pendingAction.type}`, "true");
        } catch (error) {
          console.warn(
            "[ChatPanel] Failed to store auto-approve preference:",
            error
          );
        }
      }

      let actionParams = pendingAction.params || {};
      // Inject selected email IDs for inbox AI actions when not provided
      if (
        (pendingAction.type === "ai_generate_summaries" ||
          pendingAction.type === "ai_suggest_labels") &&
        (!actionParams.emailIds || actionParams.emailIds.length === 0)
      ) {
        const emailIds = await resolveSelectedEmailIds();
        const selectedCount = emailContext.state.selectedThreads.size;
        if (selectedCount > 0) {
          if (emailIds.length > 0) {
            toast.info(`Bruger dine ${emailIds.length} valgte mails`);
          } else {
            toast.info(
              `Kunne ikke matche de valgte (${selectedCount}); bruger seneste 25`
            );
          }
        } else {
          toast.info("Ingen mails valgt; bruger seneste 25");
        }
        if (emailIds.length > 0) {
          actionParams = { ...actionParams, emailIds };
        }
      }

      executeAction.mutate({
        conversationId: selectedConversationId,
        actionId: pendingAction.id,
        actionType: pendingAction.type,
        actionParams,
      });
    },
    [
      pendingAction,
      selectedConversationId,
      executeAction,
      resolveSelectedEmailIds,
    ]
  );

  const handleRejectAction = useCallback(() => {
    setPendingAction(null);
    setShowApprovalModal(false);
    toast.info("Handling afvist");
  }, []);

  const handleVoiceInput = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Friday: Stemmeinput understøttes ikke i denne browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "da-DK"; // Danish language

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      toast.error("Friday: Stemmegenkendelse fejl - " + event.error);
      setIsRecording(false);
    };

    recognition.start();
  }, []);

  // Lightweight client-only suggestions (gated by feature flag)
  const {
    suggestions,
    loading: isSuggestionsLoading,
    refresh: refreshSuggestions,
  } = useActionSuggestions({
    conversationId: selectedConversationId,
  });

  return (
    <>
      <div className="h-full flex">
        {/* Conversation List Sidebar - Hidden on mobile */}
        <div className="hidden sm:flex w-48 md:w-64 border-r border-border flex-col shrink-0 bg-muted/10">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h2 className="text-sm font-semibold">Samtaler</h2>
                <p className="text-xs text-muted-foreground">
                  {conversations?.length || 0} samtaler
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                createConversation.mutate({ title: "New Conversation" })
              }
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Ny samtale
            </Button>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations && conversations.length > 0 ? (
                conversations.map(conv => {
                  const isSelected = selectedConversationId === conv.id;
                  const formattedTitle =
                    conv.title && conv.title !== "New Conversation"
                      ? conv.title
                      : `Ny samtale ${new Date(conv.createdAt).toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}`;
                  const formattedDate = new Date(
                    conv.updatedAt
                  ).toLocaleDateString("da-DK", {
                    day: "2-digit",
                    month: "short",
                  });

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`group w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-accent/60 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Bot
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isSelected
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {conv.title && conv.title !== "New Conversation" ? (
                              conv.title
                            ) : (
                              <span
                                className={
                                  isSelected
                                    ? "opacity-90"
                                    : "text-muted-foreground italic"
                                }
                              >
                                {formattedTitle}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${isSelected ? "opacity-80" : "opacity-60"}`}
                          >
                            {formattedDate}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Bot className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ingen samtaler endnu
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klik "Ny samtale" for at starte
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer with Model Info */}
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <Bot className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Friday AI</p>
                <p className="text-muted-foreground">Powered by Gemma 3 27B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {selectedConversationId ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span className="text-lg font-semibold">Friday</span>
                  <Badge variant="secondary" className="gap-1.5 ml-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Aktiv
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Cog className="w-4 h-4" />
                        Indstillinger
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>
                        Friday Indstillinger
                      </DropdownMenuLabel>
                      <div className="px-2 py-2">
                        <div className="flex items-center justify-between p-2 rounded-md border bg-background">
                          <div>
                            <p className="text-sm font-medium">
                              Auto-godkend lave risici
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Godkend automatisk handlinger med lav risiko.
                            </p>
                          </div>
                          <Switch
                            checked={autoApproveLowRisk}
                            onCheckedChange={checked => {
                              setAutoApproveLowRisk(checked);
                              try {
                                localStorage.setItem(
                                  "auto-approve-low-risk",
                                  checked ? "true" : "false"
                                );
                              } catch {}
                            }}
                          />
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled className="opacity-70">
                        <Info className="w-4 h-4 mr-2" />
                        Brugeren kan også vælge auto-godkend per handlingstype
                        via modal.
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-3 sm:p-6"
                ref={scrollRef}
              >
                <div className="space-y-6 max-w-3xl mx-auto">
                  {conversationData?.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "system"
                              ? "bg-muted/50 text-muted-foreground text-xs border border-border"
                              : "bg-muted border border-border"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <SafeStreamdown content={message.content} />
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {sendMessage.isPending && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-muted border border-border rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions (feature-flagged) */}
              <div className="px-3 sm:px-6">
                <SuggestionsBar
                  suggestions={suggestions}
                  isLoading={isSuggestionsLoading}
                  onRefresh={refreshSuggestions}
                  onApprove={s => {
                    setPendingAction(s);
                    setShowApprovalModal(true);
                  }}
                />
              </div>

              {/* Input Area */}
              <div className="sticky bottom-0 z-50 bg-background border-t border-border p-3 sm:p-4 backdrop-blur supports-backdrop-filter:backdrop-blur">
                <div className="max-w-3xl mx-auto space-y-2">
                  {/* Email Context Badges - Only show if there's context */}
                  {(emailContext.state.folder ||
                    emailContext.state.viewMode ||
                    (emailContext.state.selectedLabels &&
                      emailContext.state.selectedLabels.length > 0) ||
                    emailContext.state.selectedThreads.size > 0) && (
                    <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                      {emailContext.state.folder && (
                        <Badge variant="secondary">
                          Mappe: {emailContext.state.folder}
                        </Badge>
                      )}
                      {emailContext.state.viewMode && (
                        <Badge variant="secondary">
                          Visning: {emailContext.state.viewMode}
                        </Badge>
                      )}
                      {emailContext.state.selectedLabels &&
                        emailContext.state.selectedLabels.length > 0 && (
                          <Badge variant="secondary">
                            Labels: {emailContext.state.selectedLabels.length}
                          </Badge>
                        )}
                      {emailContext.state.selectedThreads.size > 0 && (
                        <Badge variant="secondary">
                          Valgte mails:{" "}
                          {emailContext.state.selectedThreads.size}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        toast.info("Fil-upload understøttes snart")
                      }
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      onKeyDown={e =>
                        e.key === "Enter" && !e.shiftKey && handleSendMessage()
                      }
                      placeholder="Skriv til Friday..."
                      className="flex-1"
                    />
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      onClick={handleVoiceInput}
                      className="shrink-0"
                    >
                      <Mic
                        className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`}
                      />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessage.isPending}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <div className="text-6xl">💬</div>
                <p className="text-lg">
                  Select a conversation or start a new chat
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Approval Modal */}
      <ActionApprovalModal
        action={pendingAction}
        open={showApprovalModal}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
      />
    </>
  );
}

export default memo(ChatPanel);
