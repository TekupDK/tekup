import React from 'react';

export interface LoadingStateProps {
  variant?: 'table' | 'detail' | 'list';
  className?: string;
}

export function LoadingState({ variant = 'list', className = '' }: LoadingStateProps) {
  const baseClasses = 'animate-pulse';
  
  if (variant === 'table') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="w-full border border-neutral-800 rounded-md overflow-hidden">
          {/* Table header skeleton */}
          <div className="bg-neutral-800 px-3 py-2">
            <div className="flex space-x-4">
              <div className="h-4 bg-neutral-700 rounded w-16"></div>
              <div className="h-4 bg-neutral-700 rounded w-20"></div>
              <div className="h-4 bg-neutral-700 rounded w-16"></div>
              <div className="h-4 bg-neutral-700 rounded w-24"></div>
            </div>
          </div>
          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-t border-neutral-800 px-3 py-2">
              <div className="flex space-x-4">
                <div className="h-4 bg-neutral-700 rounded w-32"></div>
                <div className="h-4 bg-neutral-700 rounded w-16"></div>
                <div className="h-4 bg-neutral-700 rounded w-20"></div>
                <div className="h-4 bg-neutral-700 rounded w-28"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (variant === 'detail') {
    return (
      <div className={`${baseClasses} space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-neutral-700 rounded w-48"></div>
          <div className="h-4 bg-neutral-700 rounded w-32"></div>
        </div>
        
        {/* Content sections skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 bg-neutral-700 rounded w-24"></div>
            <div className="h-4 bg-neutral-700 rounded w-full"></div>
            <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-5 bg-neutral-700 rounded w-32"></div>
            <div className="h-4 bg-neutral-700 rounded w-full"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-5 bg-neutral-700 rounded w-28"></div>
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-neutral-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default list variant
  return (
    <div className={`${baseClasses} space-y-4 ${className}`}>
      <div className="h-6 bg-neutral-700 rounded w-48"></div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-neutral-800 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-neutral-700 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}