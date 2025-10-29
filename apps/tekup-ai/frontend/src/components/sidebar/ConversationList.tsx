'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationItem } from './ConversationItem';
import { useConversations } from '@/hooks/useConversations';
import { Loader2, MessageSquare } from 'lucide-react';

export function ConversationList() {
  const { conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start a new chat to begin
        </p>
      </div>
    );
  }

  // Group conversations by date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groupedConversations = {
    today: conversations.filter((c) => {
      const date = new Date(c.updatedAt);
      return date.toDateString() === today.toDateString();
    }),
    yesterday: conversations.filter((c) => {
      const date = new Date(c.updatedAt);
      return date.toDateString() === yesterday.toDateString();
    }),
    lastWeek: conversations.filter((c) => {
      const date = new Date(c.updatedAt);
      return date > lastWeek && date < yesterday;
    }),
    older: conversations.filter((c) => {
      const date = new Date(c.updatedAt);
      return date <= lastWeek;
    }),
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-6">
        {groupedConversations.today.length > 0 && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Today
            </h3>
            <div className="space-y-1">
              {groupedConversations.today.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}

        {groupedConversations.yesterday.length > 0 && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Yesterday
            </h3>
            <div className="space-y-1">
              {groupedConversations.yesterday.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}

        {groupedConversations.lastWeek.length > 0 && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Previous 7 Days
            </h3>
            <div className="space-y-1">
              {groupedConversations.lastWeek.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}

        {groupedConversations.older.length > 0 && (
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase">
              Older
            </h3>
            <div className="space-y-1">
              {groupedConversations.older.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
