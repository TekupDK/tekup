'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useConversations } from '@/hooks/useConversations';
import { useChatStore } from '@/store/chatStore';
import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { conversations, isLoading, createConversation } = useConversations();
  const { currentConversationId, setCurrentConversationId } = useChatStore();

  useEffect(() => {
    // If there are conversations but none selected, select the first one
    if (conversations.length > 0 && !currentConversationId) {
      const firstConversation = conversations[0];
      setCurrentConversationId(firstConversation.id);
      router.push(`/chat/${firstConversation.id}`);
    }
    // If no conversations exist, create a new one
    else if (conversations.length === 0 && !isLoading) {
      createNewConversation();
    }
  }, [conversations, currentConversationId, isLoading]);

  const createNewConversation = async () => {
    try {
      const newConversation = await createConversation('New Chat');
      setCurrentConversationId(newConversation.id);
      router.push(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ChatInterface />;
}
