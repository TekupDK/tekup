'use client';

import { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SessionList } from '@/components/sidebar/SessionList';
import { DBMessage } from '@/lib/supabase';

// Temporary user ID - in production, use authentication
const USER_ID = 'demo-user';

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize with new session on first load
    createNewChat();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: USER_ID,
          title: 'New Chat',
        }),
      });

      const data = await response.json();
      setCurrentSessionId(data.session.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <SessionList
          userId={USER_ID}
          currentSessionId={currentSessionId || undefined}
          onSelectSession={setCurrentSessionId}
          onNewChat={createNewChat}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading chat...</p>
            </div>
          </div>
        ) : currentSessionId ? (
          <ChatWindow sessionId={currentSessionId} initialMessages={messages} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a chat or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
