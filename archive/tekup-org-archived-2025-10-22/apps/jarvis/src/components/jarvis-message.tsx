'use client';

import React from 'react';
import { ChatMessage } from '@/store/jarvis-store';
import { Brain, Wrench, Mail, Calendar, FileText, Database, Zap, Loader2 } from 'lucide-react';

interface JarvisMessageProps {
  message: ChatMessage;
  isThinking?: boolean;
}

const toolIcons: Record<string, React.ReactNode> = {
  'mcp_gmail': <Mail className="w-4 h-4" />,
  'mcp_calendar': <Calendar className="w-4 h-4" />,
  'mcp_drive': <FileText className="w-4 h-4" />,
  'mcp_zapier': <Zap className="w-4 h-4" />,
  'consciousness': <Brain className="w-4 h-4" />,
  'lead_manager': <Database className="w-4 h-4" />,
  'default': <Wrench className="w-4 h-4" />
};

export function JarvisMessage({ message, isThinking }: JarvisMessageProps) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isAssistant = message.type === 'assistant';
  
  // Get tool icons for this message
  const tools = message.metadata?.tools || [];
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : ''}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center mb-2 space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isSystem ? 'bg-jarvis-accent/20 border border-jarvis-accent/40' : 
              'bg-gradient-to-br from-jarvis-primary to-jarvis-secondary'
            }`}>
              {isThinking ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Brain className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-sm text-gray-400">
              {isSystem ? 'System' : 'Jarvis AI'}
            </span>
            {message.metadata?.consciousnessLevel && (
              <span className="text-xs text-jarvis-primary">
                🧠 {message.metadata.consciousnessLevel}/10
              </span>
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-jarvis-primary text-jarvis-dark ml-auto' :
          isSystem ? 'bg-jarvis-accent/20 border border-jarvis-accent/40 text-jarvis-accent' :
          'bg-jarvis-surface border border-jarvis-border text-white'
        }`}>
          {/* Thinking animation */}
          {isThinking ? (
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-jarvis-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-jarvis-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-jarvis-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-400 italic">Jarvis tænker...</span>
            </div>
          ) : (
            <>
              {/* Tool usage indicators */}
              {tools.length > 0 && !isUser && (
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-jarvis-border/50">
                  <span className="text-xs text-gray-400">Bruger:</span>
                  <div className="flex items-center space-x-1">
                    {tools.map((tool, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-1 px-2 py-1 bg-jarvis-primary/10 rounded-lg border border-jarvis-primary/30"
                      >
                        {toolIcons[tool] || toolIcons.default}
                        <span className="text-xs text-jarvis-primary">
                          {tool.replace('mcp_', '').replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Message content */}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Metadata */}
              {message.metadata && (
                <div className="mt-2 pt-2 border-t border-jarvis-border/30">
                  <div className="flex items-center space-x-3 text-xs opacity-70">
                    {message.metadata.processingTime && (
                      <span>⚡ {message.metadata.processingTime}ms</span>
                    )}
                    {message.metadata.confidence && (
                      <span>🎯 {Math.round(message.metadata.confidence)}% sikker</span>
                    )}
                    {message.metadata.vision && (
                      <span>👁️ Vision</span>
                    )}
                    {message.metadata.audioUrl && (
                      <span>🎤 Audio</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1 px-2">
          {new Date(message.timestamp).toLocaleTimeString('da-DK', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}