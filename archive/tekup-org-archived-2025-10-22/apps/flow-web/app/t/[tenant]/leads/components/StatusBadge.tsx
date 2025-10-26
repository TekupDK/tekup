import React from 'react';

export interface StatusBadgeProps {
  status: 'new' | 'contacted';
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded font-medium transition-colors';
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm'
  };
  
  const statusClasses = {
    new: 'bg-brand/20 text-brand border border-brand/30',
    contacted: 'bg-green-600/20 text-green-300 border border-green-600/30'
  };
  
  const statusText = {
    new: 'New',
    contacted: 'Contacted'
  };
  
  return (
    <span 
      className={`${baseClasses} ${sizeClasses[size]} ${statusClasses[status]} ${className}`}
    >
      {statusText[status]}
    </span>
  );
}