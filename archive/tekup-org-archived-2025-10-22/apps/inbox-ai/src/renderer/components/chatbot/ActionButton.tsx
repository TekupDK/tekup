import React from 'react';
import { ChatAction } from '../../../shared/types/chatbot';
import { 
  Mail, 
  Reply, 
  Calendar, 
  Archive, 
  Trash2, 
  Forward, 
  Search,
  Plus,
  Clock,
  Tag
} from 'lucide-react';

interface ActionButtonProps {
  action: ChatAction;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  action, 
  onClick, 
  size = 'sm',
  variant = 'outline'
}) => {
  const getIcon = (type: ChatAction['type']) => {
    const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;
    
    switch (type) {
      case 'compose':
        return <Mail size={iconSize} />;
      case 'reply':
        return <Reply size={iconSize} />;
      case 'schedule':
        return <Calendar size={iconSize} />;
      case 'archive':
        return <Archive size={iconSize} />;
      case 'delete':
        return <Trash2 size={iconSize} />;
      case 'forward':
        return <Forward size={iconSize} />;
      case 'search':
        return <Search size={iconSize} />;
      default:
        return <Plus size={iconSize} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-2 py-1 text-xs';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500';
      case 'secondary':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200';
      case 'outline':
        return 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400';
      default:
        return 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300 hover:border-gray-400';
    }
  };

  const getActionColor = (type: ChatAction['type']) => {
    switch (type) {
      case 'compose':
        return 'text-blue-600 hover:text-blue-700';
      case 'reply':
        return 'text-green-600 hover:text-green-700';
      case 'schedule':
        return 'text-purple-600 hover:text-purple-700';
      case 'archive':
        return 'text-yellow-600 hover:text-yellow-700';
      case 'delete':
        return 'text-red-600 hover:text-red-700';
      case 'forward':
        return 'text-indigo-600 hover:text-indigo-700';
      case 'search':
        return 'text-gray-600 hover:text-gray-700';
      default:
        return 'text-gray-600 hover:text-gray-700';
    }
  };

  return (
    <button
      onClick={onClick}
      title={action.description || action.label}
      className={`
        inline-flex items-center space-x-1 rounded-md border font-medium
        transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${getSizeClasses()}
        ${variant === 'outline' ? `border ${getActionColor(action.type)}` : getVariantClasses()}
      `}
    >
      {getIcon(action.type)}
      <span>{action.label}</span>
    </button>
  );
};

// Predefined action configurations
export const createQuickActions = (): ChatAction[] => [
  {
    id: 'compose-new',
    type: 'compose',
    label: 'Compose',
    description: 'Compose a new email'
  },
  {
    id: 'search-emails',
    type: 'search',
    label: 'Search',
    description: 'Search through your emails'
  },
  {
    id: 'schedule-email',
    type: 'schedule',
    label: 'Schedule',
    description: 'Schedule an email to be sent later'
  }
];

export const createContextActions = (emailId?: string): ChatAction[] => {
  const actions: ChatAction[] = [];
  
  if (emailId) {
    actions.push(
      {
        id: `reply-${emailId}`,
        type: 'reply',
        label: 'Reply',
        description: 'Reply to this email',
        payload: { emailId }
      },
      {
        id: `forward-${emailId}`,
        type: 'forward',
        label: 'Forward',
        description: 'Forward this email',
        payload: { emailId }
      },
      {
        id: `archive-${emailId}`,
        type: 'archive',
        label: 'Archive',
        description: 'Archive this email',
        payload: { emailId }
      }
    );
  }
  
  return actions;
};