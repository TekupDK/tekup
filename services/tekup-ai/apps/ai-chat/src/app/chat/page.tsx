'use client';

import { useChat } from '@/hooks/useChat';
import { ChatWindow } from '@/components/chat/SimpleChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function ChatPage() {
  const { messages, isLoading, sendMessage, cancelStream, clearMessages } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out`}
      >
        <ChatSidebar onNewChat={clearMessages} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tekup AI Assistant
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Powered by GPT-4o + TekupVault
            </span>
          </div>
        </header>

        {/* Chat window */}
        <ChatWindow messages={messages} isLoading={isLoading} />

        {/* Input */}
        <MessageInput
          onSend={sendMessage}
          onCancel={cancelStream}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
