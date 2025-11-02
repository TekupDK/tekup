import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Streamdown } from "streamdown";
import EmailActions from "./EmailActions";

interface EmailThreadViewProps {
  threadId: string;
  onReply?: (message: any) => void;
  onForward?: (message: any) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onLabelChange?: () => void;
}

export default function EmailThreadView({
  threadId,
  onReply,
  onForward,
  onArchive,
  onDelete,
  onLabelChange,
}: EmailThreadViewProps) {
  const { data: thread, isLoading } = trpc.inbox.email.getThread.useQuery({
    threadId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!thread || !thread.messages || thread.messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Ingen beskeder i denne tråd</p>
      </div>
    );
  }

  // Sort messages by date (oldest first)
  const sortedMessages = [...thread.messages].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateA - dateB;
  });

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {sortedMessages.map((message, index) => {
          const isLast = index === sortedMessages.length - 1;
          const messageDate = message.date
            ? new Date(message.date)
            : new Date();

          return (
            <Card key={message.id || index} className="p-4">
              {/* Message Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{message.from || "Ukendt"}</p>
                    {isLast && (
                      <Badge variant="secondary" className="text-xs">
                        Nyeste
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Til: {message.to || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(messageDate, "PPP 'kl.' p", { locale: da })}
                  </p>
                </div>

                {/* Actions for the last message */}
                {isLast && (
                  <EmailActions
                    message={message}
                    threadId={threadId}
                    onReply={onReply}
                    onForward={onForward}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onLabelChange={onLabelChange}
                  />
                )}
              </div>

              {/* Subject */}
              {message.subject && (
                <div className="mb-3">
                  <p className="font-medium">{message.subject}</p>
                </div>
              )}

              {/* Message Body */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {message.body ? (
                  <Streamdown>{message.body}</Streamdown>
                ) : (
                  <p className="text-muted-foreground">Ingen indhold</p>
                )}
              </div>

              {!isLast && <Separator className="mt-4" />}
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

