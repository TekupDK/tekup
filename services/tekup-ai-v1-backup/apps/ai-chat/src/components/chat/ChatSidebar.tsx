'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Archive } from 'lucide-react';
import { getSessions, deleteSession, type DBChatSession } from '@/lib/supabase';

interface ChatSidebarProps {
  onNewChat: () => void;
  onSelectSession?: (sessionId: string) => void;
}

export function ChatSidebar({ onNewChat, onSelectSession }: ChatSidebarProps) {
  const [sessions, setSessions] = useState<DBChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await getSessions();
    setSessions(data);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteSession(id);
      await loadSessions();
      if (selectedId === id) {
        setSelectedId(null);
        onNewChat();
      }
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectSession?.(id);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setSelectedId(null);
            onNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelect(session.id)}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedId === session.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Archive className="w-3 h-3" />
          <span>{sessions.length} conversations</span>
        </div>
      </div>
    </div>
  );
}
