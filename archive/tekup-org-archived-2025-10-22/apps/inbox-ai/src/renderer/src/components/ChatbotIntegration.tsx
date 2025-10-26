import React, { useState, useEffect } from 'react';
import { ChatbotInterface } from './chatbot/ChatbotInterface';
import { ChatbotCapabilities } from '../../../shared/types/chatbot';

interface ChatbotIntegrationProps {
  className?: string;
}

export const ChatbotIntegration: React.FC<ChatbotIntegrationProps> = ({ className }) => {
  const [capabilities, setCapabilities] = useState<ChatbotCapabilities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeChatbot();
  }, []);

  const initializeChatbot = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get chatbot capabilities
      const caps = await window.electronAPI.chatbot.getCapabilities();
      setCapabilities(caps);
      
      logger.info('Chatbot initialized with capabilities:', caps);
    } catch (err) {
      logger.error('Failed to initialize chatbot:', err);
      setError('Failed to initialize chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Initializing chatbot...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className || ''}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={initializeChatbot}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!capabilities) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className || ''}`}>
        <span className="text-yellow-700">Chatbot capabilities not available</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <ChatbotInterface capabilities={capabilities} />
    </div>
  );
};

export default ChatbotIntegration;
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-inbox-ai-src-renderer-src');
