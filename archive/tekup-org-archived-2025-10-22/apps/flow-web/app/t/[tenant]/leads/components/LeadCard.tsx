import React from 'react';
import { Lead } from '../../../../../lib/api';
import { StatusBadge } from './StatusBadge';

export interface LeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
  className?: string;
  variant?: 'card' | 'row';
  isSelected?: boolean;
}

export function LeadCard({ 
  lead, 
  onClick, 
  className = '', 
  variant = 'card',
  isSelected = false 
}: LeadCardProps) {
  const handleClick = () => {
    onClick?.(lead);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getLeadPreview = (lead: Lead) => {
    if (!lead.payload) return 'No additional information';
    
    const { name, email, phone, message, subject } = lead.payload;
    const parts = [];
    
    if (name) parts.push(`Name: ${name}`);
    if (email) parts.push(`Email: ${email}`);
    if (phone) parts.push(`Phone: ${phone}`);
    if (subject) parts.push(`Subject: ${subject}`);
    if (message) parts.push(`Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    return parts.length > 0 ? parts.join(' • ') : 'No additional information';
  };

  const baseClasses = 'transition-all duration-200 border border-neutral-800 rounded-md';
  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:bg-neutral-900/60 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/10' 
    : '';
  const selectedClasses = isSelected ? 'bg-brand/10 border-brand/50 shadow-md shadow-brand/10' : '';

  if (variant === 'row') {
    return (
      <tr 
        className={`${baseClasses} ${interactiveClasses} ${selectedClasses} ${className}`}
        onClick={handleClick}
      >
        <td className="px-3 py-3 font-mono text-xs truncate max-w-[140px]">
          {lead.id}
        </td>
        <td className="px-3 py-3 capitalize">
          {lead.source}
        </td>
        <td className="px-3 py-3">
          <StatusBadge status={lead.status} size="sm" />
        </td>
        <td className="px-3 py-3 text-neutral-400 text-sm">
          {formatDate(lead.created_at || lead.createdAt)}
        </td>
        <td className="px-3 py-3 text-neutral-300 text-sm truncate max-w-[200px] hidden sm:table-cell">
          {getLeadPreview(lead)}
        </td>
      </tr>
    );
  }

  // Card variant (default)
  return (
    <div 
      className={`group ${baseClasses} ${interactiveClasses} ${selectedClasses} p-4 ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-neutral-500 truncate">
              {lead.id}
            </span>
            <StatusBadge status={lead.status} size="sm" />
          </div>
          <div className="text-sm text-neutral-300 capitalize font-medium">
            Source: {lead.source}
          </div>
        </div>
        <div className="text-xs text-neutral-500 ml-4 flex-shrink-0">
          {formatDate(lead.created_at || lead.createdAt)}
        </div>
      </div>
      
      <div className="text-sm text-neutral-400 line-clamp-2 mb-3">
        {getLeadPreview(lead)}
      </div>
      
      {onClick && (
        <div className="pt-3 border-t border-neutral-800">
          <div className="text-xs text-neutral-500 flex items-center justify-between group-hover:text-brand transition-colors">
            <span>Tap to view details</span>
            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}