'use client';

import { Message } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-3xl rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 shadow-sm border border-gray-200'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  
                  return !inline && match ? (
                    <div className="relative group">
                      <button
                        onClick={() => copyCode(codeString)}
                        className="absolute right-2 top-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy code"
                      >
                        {copiedCode === codeString ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
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

            {/* Citations */}
            {message.citations && message.citations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Sources:
                </p>
                <ul className="space-y-1">
                  {message.citations.map((citation, idx) => (
                    <li key={idx} className="text-xs text-gray-600">
                      <span className="font-mono">
                        {citation.source && `[${citation.source}] `}
                        {citation.file_path}
                        {citation.line_start &&
                          ` (lines ${citation.line_start}-${citation.line_end})`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-xs mt-2 opacity-70">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
