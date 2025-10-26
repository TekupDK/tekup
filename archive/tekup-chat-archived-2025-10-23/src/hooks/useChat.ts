import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { Message, Source, StreamChunk } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, useVault: boolean = true) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      // Create assistant message placeholder
      const assistantMessageId = nanoid();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            useVault,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        let sources: Source[] | undefined;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'sources':
                    sources = data.sources;
                    break;

                  case 'content':
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              content: msg.content + (data.content || ''),
                              sources,
                            }
                          : msg
                      )
                    );
                    break;

                  case 'done':
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, isStreaming: false }
                          : msg
                      )
                    );
                    setIsLoading(false);
                    break;

                  case 'error':
                    throw new Error(data.error || 'Unknown error');
                }
              } catch (parseError) {
                console.error('Parse error:', parseError);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Request aborted');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          console.error('Chat error:', err);

          // Update assistant message with error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: `Error: ${errorMessage}. Please try again.`,
                    isStreaming: false,
                  }
                : msg
            )
          );
        }
        setIsLoading(false);
      }
    },
    []
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancelStream,
    clearMessages,
  };
}
