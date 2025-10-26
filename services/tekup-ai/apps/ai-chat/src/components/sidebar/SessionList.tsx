'use client';

import { useState, useEffect } from 'react';
import { DBChatSession } from '@/lib/supabase';
import { Plus, MessageSquare, Archive } from 'lucide-react';

interface SessionListProps {
  userId: string;
  currentSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function SessionList({
  userId,
  currentSessionId,
  onSelectSession,
  onNewChat,
}: SessionListProps) {
  const [sessions, setSessions] = useState<DBChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [userId]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?userId=${userId}`);
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to archive session:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleArchive(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                    title="Archive chat"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
        <p>Tekup AI Assistant v1.0</p>
        <p>Powered by TekupVault & GPT-4o</p>
      </div>
    </div>
  );
}
