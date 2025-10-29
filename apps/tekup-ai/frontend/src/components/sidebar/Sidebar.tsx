'use client';

import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/useConversations';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAuthStore } from '@/store/authStore';
import {
  Brain,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Puzzle,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ConversationList } from './ConversationList';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { createConversation } = useConversations();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNewChat = useCallback(async () => {
    try {
      const conversation = await createConversation('New Chat');
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [createConversation, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useKeyboardShortcuts(
    [
      {
        keys: 'ctrl+shift+n',
        preventDefault: true,
        handler: () => {
          void handleNewChat();
        },
      },
      {
        keys: 'ctrl+shift+b',
        preventDefault: true,
        handler: () => {
          setIsCollapsed((prev: boolean) => !prev);
        },
      },
    ],
    [handleNewChat, isCollapsed]
  );

  const navigation = [
    {
      name: 'Chat',
      icon: MessageSquare,
      href: '/chat',
      active: pathname?.startsWith('/chat'),
    },
    {
      name: 'Memories',
      icon: Brain,
      href: '/memories',
      active: pathname === '/memories',
    },
    {
      name: 'Prompts',
      icon: Sparkles,
      href: '/prompts',
      active: pathname === '/prompts',
    },
    {
      name: 'Integrations',
      icon: Puzzle,
      href: '/integrations',
      active: pathname === '/integrations',
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        } fixed md:relative inset-y-0 left-0 z-40 w-64 border-r bg-card transition-transform duration-300 ease-in-out flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TekupAI</span>
          </div>
          <Button onClick={handleNewChat} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Navigation */}
        <div className="p-2 border-b">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? 'secondary' : 'ghost'}
              className="w-full justify-start mb-1"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </Button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList />
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
