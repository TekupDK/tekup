import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { format, parseISO } from "date-fns";
import { da } from "date-fns/locale";
import { Archive, ArrowRight, Clock, Mail, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SafeStreamdown } from "../SafeStreamdown";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  onReply?: (replyTo: any) => void;
  onForward?: (forwardFrom: any) => void;
  onOpenFull?: () => void;
}

export default function EmailPreviewModal({
  open,
  onOpenChange,
  threadId,
  onReply,
  onForward,
  onOpenFull,
}: EmailPreviewModalProps) {
  const { data: thread, isLoading } = trpc.inbox.email.getThread.useQuery(
    { threadId },
    { enabled: open && !!threadId }
  );

  const utils = trpc.useUtils();

  const archiveMutation = trpc.inbox.email.archive.useMutation({
    onSuccess: () => {
      toast.success("Email arkiveret");
      onOpenChange(false);
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Kunne ikke arkivere: ${error.message}`);
    },
  });

  const deleteMutation = trpc.inbox.email.delete.useMutation({
    onSuccess: () => {
      toast.success("Email slettet");
      onOpenChange(false);
      utils.inbox.email.list.invalidate();
    },
    onError: error => {
      toast.error(`Kunne ikke slette: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Henter email...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!thread || !thread.messages || thread.messages.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Email ikke fundet
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Kunne ikke indlæse email. Prøv igen.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const latestMessage = thread.messages[thread.messages.length - 1];
  const hasMultipleMessages = thread.messages.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80vw] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate text-lg font-semibold">
            {latestMessage.subject || thread.subject || "Ingen emne"}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>Fra: {latestMessage.from}</span>
            {hasMultipleMessages && (
              <span className="text-xs text-muted-foreground">
                ({thread.messages.length} beskeder)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4">
            {/* Email Metadata */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b">
              <div className="flex items-center gap-4">
                <span>Til: {latestMessage.to || "N/A"}</span>
                <span>
                  {format(parseISO(latestMessage.date), "PPP 'kl.' HH:mm", {
                    locale: da,
                  })}
                </span>
              </div>
            </div>

            {/* Email Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <SafeStreamdown content={latestMessage.body || thread.snippet} />
            </div>

            {/* Show thread info if multiple messages */}
            {hasMultipleMessages && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Denne tråd indeholder {thread.messages.length} beskeder. Klik
                  "Åbn fuld view" for at se hele tråden.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions - Fixed at bottom */}
        <div className="flex items-center justify-between pt-4 border-t gap-2 shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onReply) {
                  onReply({
                    threadId: thread.id,
                    messageId: latestMessage.id,
                    from: latestMessage.from,
                    subject: latestMessage.subject || thread.subject,
                    body: latestMessage.body,
                  });
                  onOpenChange(false);
                }
              }}
            >
              <Reply className="w-4 h-4 mr-2" />
              Svar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onForward) {
                  onForward({
                    subject: latestMessage.subject || thread.subject,
                    body: latestMessage.body,
                  });
                  onOpenChange(false);
                }
              }}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Videresend
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => archiveMutation.mutate({ threadId })}
              disabled={archiveMutation.isPending}
            >
              <Archive className="w-4 h-4 mr-2" />
              Arkiver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => deleteMutation.mutate({ threadId })}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Slet
            </Button>
            {onOpenFull && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onOpenFull();
                  onOpenChange(false);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Åbn fuld view
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
