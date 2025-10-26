import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatMessage, 
  ChatConversation, 
  ChatMode, 
  ChatRequest, 
  ChatResponse,
  ChatAction 
} from '../../../shared/types/chatbot';
import { MessageBubble } from './MessageBubble';
import { ModeSelector } from './ModeSelector';
import { ActionButton } from './ActionButton';
import { ConversationList } from './ConversationList';
import { Send, Mic, Paperclip, Settings, Minimize2, Maximize2 } from 'lucide-react';

interface ChatbotInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  emailContext?: {
    emailId?: string;
    threadId?: string;
    selectedEmails?: string[];
  };
}

export const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-com');

  isOpen,
  onClose,
  emailContext
}) => {
  const [currentMode, setCurrentMode] = useState<ChatMode>('standard');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const convs = await window.electronAPI.chatbot.getConversations();
      setConversations(convs);
      
      // Auto-select most recent conversation or create new one
      if (convs.length > 0) {
        setActiveConversation(convs[0]);
      } else {
        await createNewConversation();
      }
    } catch (error) {
      logger.error('Error loading conversations:', error);
    }
  };

  const createNewConversation = async () => {
    const newConv: ChatConversation = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mode: currentMode,
      context: emailContext ? {
        selectedEmails: emailContext.selectedEmails || [],
        currentFolder: 'inbox',
        threadContext: emailContext.threadId ? {
          threadId: emailContext.threadId,
          participants: [],
          subject: ''
        } : undefined
      } : undefined
    };
    
    setActiveConversation(newConv);
    setConversations(prev => [newConv, ...prev]);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      const request: ChatRequest = {
        message: messageText,
        conversationId: activeConversation?.id,
        mode: currentMode,
        emailContext
      };

      const response: ChatResponse = await window.electronAPI.chatbot.sendMessage(request);
      
      // Update conversation with new messages
      if (activeConversation) {
        const updatedConv = {
          ...activeConversation,
          messages: [
            ...activeConversation.messages,
            {
              id: generateId(),
              content: messageText,
              role: 'user' as const,
              timestamp: new Date(),
              metadata: { mode: currentMode }
            },
            {
              id: response.messageId,
              content: response.message,
              role: 'assistant' as const,
              timestamp: new Date(),
              metadata: response.metadata
            }
          ],
          updatedAt: new Date()
        };
        
        setActiveConversation(updatedConv);
        setConversations(prev => 
          prev.map(conv => conv.id === updatedConv.id ? updatedConv : conv)
        );
      }
    } catch (error) {
      logger.error('Error sending message:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleActionClick = async (action: ChatAction) => {
    try {
      await window.electronAPI.chatbot.executeAction(action);
    } catch (error) {
      logger.error('Error executing action:', error);
    }
  };

  const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-4 bottom-4 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    } z-50`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Inbox AI Assistant</h3>
            <p className="text-xs opacity-90">
              {currentMode === 'smarter' ? 'Smarter Mode' : 'Standard Mode'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Conversations"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mode Selector */}
          <div className="p-3 border-b border-gray-100">
            <ModeSelector
              currentMode={currentMode}
              onModeChange={setCurrentMode}
            />
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            {activeConversation?.messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💬</span>
                </div>
                <h4 className="font-medium mb-2">Start a conversation</h4>
                <p className="text-sm">
                  Ask me anything about your emails or let me help you compose, search, or organize.
                </p>
              </div>
            ) : (
              activeConversation?.messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onActionClick={handleActionClick}
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask AI to help with your emails... (${currentMode} mode)`}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              
              <div className="flex space-x-1">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={20} />
                </button>
                
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Voice message"
                >
                  <Mic size={20} />
                </button>
                
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            
            {emailContext && (
              <div className="mt-2 text-xs text-gray-500">
                📧 Context: {emailContext.selectedEmails?.length || 0} selected emails
              </div>
            )}
          </div>
        </>
      )}

      {/* Conversations Sidebar */}
      {showConversations && !isMinimized && (
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onNewConversation={createNewConversation}
          onDeleteConversation={(id) => {
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeConversation?.id === id) {
              setActiveConversation(null);
            }
          }}
        />
      )}
    </div>
  );
};