import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import {
  connectSocket,
  subscribeToMessages,
  subscribeToTyping,
} from '@/lib/socket';
import { delay, generateId } from '@/lib/utils';
import { useChatStore, type ChatState } from '@/store/chatStore';
import type { Message } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseChatResult {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
}

const buildAssistantFallback = (
  conversationId: string,
  prompt: string
): Message => {
  const now = new Date().toISOString();
  const summary = prompt.length > 160 ? `${prompt.slice(0, 157)}...` : prompt;

  return {
    id: generateId('assistant'),
    conversationId,
    role: 'assistant',
    createdAt: now,
    content: `I received your message and I'm currently offline, but here's a quick summary you can use when back online:\n\n> ${summary}\n\nTry asking me again once the connection is restored.`,
  };
};

export function useChat(conversationId: string | null): UseChatResult {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messages = useChatStore((state: ChatState) =>
    conversationId ? (state.messages[conversationId] ?? []) : []
  );
  const setMessages = useChatStore((state: ChatState) => state.setMessages);
  const addMessage = useChatStore((state: ChatState) => state.addMessage);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    (async () => {
      try {
        const data = await api.chat.listMessages(conversationId);
        if (!isActive) {
          return;
        }
        setMessages(conversationId, data);
      } catch (err) {
        if (!isActive) {
          return;
        }
        console.warn('Failed to fetch chat messages:', err);
        setError(
          err instanceof ApiError ? err.message : 'Failed to load messages'
        );
        if (messages.length === 0) {
          setMessages(conversationId, []);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [conversationId, messages.length, setMessages]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const socket = connectSocket();
    const unsubscribeMessages = subscribeToMessages((message) => {
      if (message.conversationId === conversationId) {
        addMessage(conversationId, message);
      }
    });

    const unsubscribeTyping = subscribeToTyping(
      ({ conversationId: id, isTyping }) => {
        if (id === conversationId) {
          setIsStreaming(isTyping);
        }
      }
    );

    socket?.emit?.('joinConversation', conversationId);

    return () => {
      unsubscribeMessages?.();
      unsubscribeTyping?.();
      socket?.emit?.('leaveConversation', conversationId);
    };
  }, [addMessage, conversationId]);

  const simulateStreamingResponse = useCallback(
    async (content: string) => {
      if (!conversationId) {
        return;
      }

      setIsStreaming(true);
      setStreamingContent('');

      const message = buildAssistantFallback(conversationId, content);
      const words = message.content.split(' ');

      for (const word of words) {
        setStreamingContent((prev: string | null) =>
          prev ? `${prev} ${word}` : word
        );
        // eslint-disable-next-line no-await-in-loop
        await delay(40);
      }

      setStreamingContent(null);
      setIsStreaming(false);
      addMessage(conversationId, message);
    },
    [addMessage, conversationId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) {
        toast({
          title: 'No conversation selected',
          description:
            'Please select or create a conversation before sending a message.',
          variant: 'destructive',
        });
        return;
      }

      const trimmed = content.trim();
      if (!trimmed) {
        return;
      }

      const userMessage: Message = {
        id: generateId('message'),
        conversationId,
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      addMessage(conversationId, userMessage);
      setIsStreaming(true);
      setStreamingContent(null);

      try {
        const response = await api.chat.sendMessage(conversationId, {
          content: trimmed,
        });
        addMessage(conversationId, response);
      } catch (err) {
        if (err instanceof ApiError) {
          toast({
            title: 'Unable to send message',
            description: err.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Offline mode',
            description: 'Simulating a response while the API is unreachable.',
          });
          await simulateStreamingResponse(trimmed);
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent(null);
      }
    },
    [addMessage, conversationId, simulateStreamingResponse, toast]
  );

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  return {
    messages: orderedMessages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
  };
}
