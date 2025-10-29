'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useChatStore } from '@/store/chatStore';
import { useConversations } from '@/hooks/useConversations';
import { Loader2 } from 'lucide-react';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { setCurrentConversationId } = useChatStore();
  const { conversations, isLoading } = useConversations();

  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, setCurrentConversationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
          <p className="text-muted-foreground">
            This conversation may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return <ChatInterface />;
}
