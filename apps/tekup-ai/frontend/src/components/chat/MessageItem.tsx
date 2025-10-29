'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToolCallDisplay } from './ToolCallDisplay';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  toolCalls?: any[];
  metadata?: any;
}

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { toast } = useToast();
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: 'Copied to clipboard',
      description: 'Message content has been copied',
    });
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    toast({
      title: 'Feedback recorded',
      description: `Thank you for your ${type} feedback`,
    });
  };

  return (
    <div
      className={`flex gap-4 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } animate-fade-in`}
    >
      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <div
          className={`w-full h-full flex items-center justify-center ${
            isUser ? 'bg-primary' : 'bg-secondary'
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Bot className="w-5 h-5 text-foreground" />
          )}
        </div>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
              : 'bg-card max-w-full'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="markdown prose dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.toolCalls.map((toolCall: any, index: number) => (
                <ToolCallDisplay key={index} toolCall={toolCall} />
              ))}
            </div>
          )}
        </Card>

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('positive')}
              className="h-8 px-2"
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('negative')}
              className="h-8 px-2"
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
