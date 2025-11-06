import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Loader2, X } from "lucide-react";
import { useState } from "react";
import { SafeStreamdown } from "../SafeStreamdown";

interface AIChatSidebarPrototypeProps {
  emailContext: {
    threadId: string;
    subject: string;
    from: string;
    body: string;
  };
  onClose: () => void;
}

export function AIChatSidebarPrototype({
  emailContext,
  onClose,
}: AIChatSidebarPrototypeProps) {
  const [summary, setSummary] = useState("");

  const summarizeEmail = trpc.chat.summarizeEmail.useMutation({
    onSuccess: data => {
      // Handle both string and array formats
      const summaryText =
        typeof data.summary === "string"
          ? data.summary
          : Array.isArray(data.summary)
            ? JSON.stringify(data.summary)
            : "No summary available";
      setSummary(summaryText);
    },
    onError: error => {
      setSummary(`❌ Error: ${error.message}`);
    },
  });

  const handleSummarize = () => {
    setSummary(""); // Reset
    summarizeEmail.mutate({
      threadId: emailContext.threadId,
      subject: emailContext.subject,
      from: emailContext.from,
      body: emailContext.body,
    });
  };

  return (
    <div className="w-80 border-l border-border bg-background h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Email Info */}
        <Card className="p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Analyzing:</p>
          <p className="text-sm font-medium truncate">{emailContext.subject}</p>
          <p className="text-xs text-muted-foreground truncate mt-1">
            From: {emailContext.from}
          </p>
        </Card>

        {/* Summarize Button */}
        <Button
          onClick={handleSummarize}
          disabled={summarizeEmail.isPending}
          className="w-full"
        >
          {summarizeEmail.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Summarize Email
            </>
          )}
        </Button>

        {/* Summary Display */}
        {summary && (
          <Card className="p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <SafeStreamdown content={summary} />
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Prototype - Phase 0 Spike
        </p>
      </div>
    </div>
  );
}
