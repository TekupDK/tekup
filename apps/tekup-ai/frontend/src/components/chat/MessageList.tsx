'use client';

import { MessageItem } from './MessageItem';
import { StreamingMessage } from './StreamingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  toolCalls?: any[];
  metadata?: any;
}

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
}

export function MessageList({ messages, streamingContent }: MessageListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="container mx-auto max-w-4xl py-6 space-y-6">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {streamingContent && (
          <StreamingMessage content={streamingContent} />
        )}
      </div>
    </ScrollArea>
  );
}
