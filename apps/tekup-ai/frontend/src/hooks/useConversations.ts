import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import { generateId } from '@/lib/utils';
import { useChatStore, type ChatState } from '@/store/chatStore';
import type { Conversation } from '@/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseConversationsResult {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  createConversation: (title?: string) => Promise<Conversation>;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => Promise<Conversation>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const buildFallbackConversation = (
  title = 'New Conversation'
): Conversation => {
  const now = new Date().toISOString();
  return {
    id: generateId('conversation'),
    title,
    createdAt: now,
    updatedAt: now,
    lastMessage: undefined,
  };
};

export function useConversations(): UseConversationsResult {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const conversations = useChatStore((state: ChatState) => state.conversations);
  const setConversations = useChatStore(
    (state: ChatState) => state.setConversations
  );
  const addConversation = useChatStore(
    (state: ChatState) => state.addConversation
  );
  const updateConversationInStore = useChatStore(
    (state: ChatState) => state.updateConversation
  );
  const removeConversation = useChatStore(
    (state: ChatState) => state.removeConversation
  );

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const remoteConversations = await api.conversations.list();
      setConversations(remoteConversations);
    } catch (err) {
      console.warn('Failed to fetch conversations, using fallback data:', err);
      setError(
        err instanceof ApiError ? err.message : 'Failed to fetch conversations'
      );

      if (conversations.length === 0) {
        const fallback = [
          {
            ...buildFallbackConversation('Welcome to TekupAI'),
            lastMessage:
              'This is a sample conversation to help you get started.',
          },
        ];
        setConversations(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversations.length, setConversations]);

  useEffect(() => {
    if (conversations.length === 0) {
      void fetchConversations();
    } else {
      setIsLoading(false);
    }
  }, [conversations.length, fetchConversations]);

  const createConversation = useCallback(
    async (title = 'New Conversation') => {
      setIsLoading(true);
      try {
        const conversation = await api.conversations.create({ title });
        addConversation(conversation);
        return conversation;
      } catch (err) {
        console.warn('Falling back to local conversation creation:', err);
        const conversation = buildFallbackConversation(title);
        addConversation(conversation);
        toast({
          title: 'Offline mode',
          description:
            'Conversation created locally. Data will sync when the API is available.',
        });
        return conversation;
      } finally {
        setIsLoading(false);
      }
    },
    [addConversation, toast]
  );

  const updateConversation = useCallback(
    async (conversationId: string, updates: Partial<Conversation>) => {
      try {
        const updated = await api.conversations.update(conversationId, updates);
        updateConversationInStore(conversationId, updated);
        return updated;
      } catch (err) {
        console.warn(
          'Failed to update conversation remotely, applying local changes:',
          err
        );
        updateConversationInStore(conversationId, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        toast({
          title: 'Changes saved locally',
          description:
            'Unable to reach the server. Conversation updated locally.',
        });
        return {
          ...buildFallbackConversation(),
          id: conversationId,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    [toast, updateConversationInStore]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await api.conversations.remove(conversationId);
        removeConversation(conversationId);
      } catch (err) {
        console.warn(
          'Failed to delete conversation remotely, removing locally:',
          err
        );
        removeConversation(conversationId);
        toast({
          title: 'Conversation removed locally',
          description:
            'Unable to reach the server. Changes will sync when online.',
        });
      }
    },
    [removeConversation, toast]
  );

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [conversations]
  );

  return {
    conversations: sortedConversations,
    isLoading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    refetch: fetchConversations,
  };
}
