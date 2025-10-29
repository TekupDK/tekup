'use client';

import { useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { PromptSuggestions } from './PromptSuggestions';
import { useChat } from '@/hooks/useChat';
import { useChatStore } from '@/store/chatStore';
import { Brain, Loader2 } from 'lucide-react';

export function ChatInterface() {
  const { currentConversationId } = useChatStore();
  const { messages, isLoading, sendMessage, isStreaming } = useChat(currentConversationId || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  if (!currentConversationId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Brain className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
          <p className="text-muted-foreground">
            Select a conversation or create a new one to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
                <p className="text-muted-foreground">
                  Ask me anything. I have access to your memories and can help with various tasks.
                </p>
              </div>
              <PromptSuggestions onSelectPrompt={handleSendMessage} />
            </div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-card">
        <div className="container mx-auto max-w-4xl p-4">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || isStreaming}
            placeholder={
              isStreaming
                ? 'AI is responding...'
                : 'Type your message...'
            }
          />
          <p className="text-xs text-center text-muted-foreground mt-2">
            TekupAI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
