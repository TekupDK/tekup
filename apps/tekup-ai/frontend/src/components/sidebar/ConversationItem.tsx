'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/store/chatStore';
import { useConversations } from '@/hooks/useConversations';
import { MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

interface ConversationItemProps {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const router = useRouter();
  const { currentConversationId } = useChatStore();
  const { updateConversation, deleteConversation } = useConversations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(conversation.title);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = currentConversationId === conversation.id;

  const handleClick = () => {
    if (!isEditing) {
      router.push(`/chat/${conversation.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedTitle.trim() && editedTitle !== conversation.title) {
      await updateConversation(conversation.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(conversation.title);
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(conversation.id);
      if (isActive) {
        router.push('/chat');
      }
    }
  };

  return (
    <div
      className={`group relative rounded-lg transition-colors ${
        isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={handleClick}
        className="w-full text-left p-2 pr-16 flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave(e as any);
              } else if (e.key === 'Escape') {
                handleCancel(e as any);
              }
            }}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{conversation.title}</span>
        )}
      </button>

      {/* Action Buttons */}
      {(isHovered || isEditing) && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleSave}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCancel}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleEdit}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
