'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types';

interface SimpleChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatWindow({ messages, isLoading }: SimpleChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium">Start en samtale</p>
          <p className="text-sm mt-2">Stil et spørgsmål om Tekup projekter</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
