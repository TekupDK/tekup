import React from 'react';
import { ChatMessage, ChatAction } from '../../../shared/types/chatbot';
import { User, Bot, Clock, Zap } from 'lucide-react';
import { ActionButton } from './ActionButton';

interface MessageBubbleProps {
  message: ChatMessage;
  onActionClick?: (action: ChatAction) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onActionClick }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : message.metadata?.mode === 'smarter'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-200 text-gray-600'
        }`}>
          {isUser ? (
            <User size={16} />
          ) : message.metadata?.mode === 'smarter' ? (
            <Zap size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-4 py-2 max-w-full ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
            
            {/* Metadata */}
            {message.metadata && !isUser && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                {message.metadata.model && (
                  <div className="flex items-center space-x-1">
                    <span>Model:</span>
                    <span className="font-mono">{message.metadata.model}</span>
                    {message.metadata.mode === 'smarter' && (
                      <Zap size={12} className="text-purple-500" />
                    )}
                  </div>
                )}
                {message.metadata.tokens && (
                  <div>Tokens: {message.metadata.tokens}</div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-400 ${
            isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
          }`}>
            <Clock size={12} />
            <span>{formatTime(message.timestamp)}</span>
          </div>

          {/* Actions */}
          {!isUser && message.metadata?.actions && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.metadata.actions.map((action: ChatAction) => (
                <ActionButton
                  key={action.id}
                  action={action}
                  onClick={() => onActionClick?.(action)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}