'use client';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-4 animate-fade-in">
      {/* Avatar */}
      <Avatar className="w-10 h-10 flex-shrink-0">
        <div className="w-full h-full flex items-center justify-center bg-secondary">
          <Bot className="w-5 h-5 text-foreground" />
        </div>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        <Card className="p-4 bg-card">
          {content ? (
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
                {content}
              </ReactMarkdown>
              {/* Cursor */}
              <span className="inline-block w-2 h-4 bg-primary animate-pulse-subtle ml-1" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
                <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
                <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
              </div>
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
