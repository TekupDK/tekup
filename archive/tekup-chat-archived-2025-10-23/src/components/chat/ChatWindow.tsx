'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Message } from '@/lib/supabase';

interface ChatWindowProps {
  sessionId: string;
  initialMessages?: Message[];
}

export function ChatWindow({ sessionId, initialMessages = [] }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call chat API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: content,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add assistant message placeholder
      const assistantMessageId = `temp-assistant-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          session_id: sessionId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString(),
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.chunk) {
                  assistantContent += data.chunk;
                  
                  // Update assistant message with streaming content
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessageId
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }

                if (data.done) {
                  // Update with final message including citations
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: assistantContent,
                            citations: data.citations,
                          }
                        : m
                    )
                  );
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          session_id: sessionId,
          role: 'assistant',
          content: '❌ Failed to get response. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <h2 className="text-2xl font-semibold mb-2">Tekup AI Assistant</h2>
              <p>Ask me anything about your Tekup portfolio!</p>
              <div className="mt-6 grid grid-cols-1 gap-3 max-w-2xl">
                <button
                  onClick={() =>
                    handleSendMessage('What should I work on today?')
                  }
                  className="p-3 text-sm text-left bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  What should I work on today?
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('How do I create an invoice in Billy.dk?')
                  }
                  className="p-3 text-sm text-left bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  How do I create an invoice in Billy.dk?
                </button>
                <button
                  onClick={() =>
                    handleSendMessage('Show me the Tekup-Billy tech stack')
                  }
                  className="p-3 text-sm text-left bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  Show me the Tekup-Billy tech stack
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
