import React, { useState } from 'react';
import { ChatConversation } from '../../../shared/types/chatbot';
import { 
  MessageCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock,
  Zap,
  User,
  Search,
  X
} from 'lucide-react';

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  onSelectConversation: (conversation: ChatConversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation?: (conversationId: string, newTitle: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(msg => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleRename = (conversation: ChatConversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const saveRename = (conversationId: string) => {
    if (editTitle.trim() && onRenameConversation) {
      onRenameConversation(conversationId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const getLastMessage = (conversation: ChatConversation): string => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return 'No messages yet';
    
    const content = lastMessage.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="absolute left-0 top-0 w-80 h-full bg-white border-r border-gray-200 rounded-l-lg shadow-lg z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Conversations</h3>
          <button
            onClick={onNewConversation}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewConversation}
                className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeConversation?.id === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    {editingId === conversation.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveRename(conversation.id);
                            } else if (e.key === 'Escape') {
                              cancelRename();
                            }
                          }}
                          onBlur={() => saveRename(conversation.id)}
                          className="flex-1 text-sm font-medium bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelRename();
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm text-gray-800 truncate">
                          {conversation.title}
                        </h4>
                        {conversation.mode === 'smarter' ? (
                          <Zap size={12} className="text-purple-500 flex-shrink-0" />
                        ) : (
                          <User size={12} className="text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    )}
                    
                    {/* Last message preview */}
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {getLastMessage(conversation)}
                    </p>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <Clock size={10} />
                        <span>{formatDate(conversation.updatedAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-gray-400">
                        <MessageCircle size={10} />
                        <span>{conversation.messages.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {onRenameConversation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(conversation);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Rename conversation"
                      >
                        <Edit3 size={12} />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this conversation?')) {
                          onDeleteConversation(conversation.id);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};