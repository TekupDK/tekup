import React from 'react';

export interface LeadEvent {
  id: string;
  fromStatus?: string;
  from_status?: string;
  toStatus?: string;
  to_status?: string;
  actor?: string;
  createdAt?: string;
  created_at?: string;
}

export interface EventTimelineProps {
  events: LeadEvent[];
  loading?: boolean;
  className?: string;
}

export function EventTimeline({ events, loading = false, className = '' }: EventTimelineProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown time';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('da-DK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return formatDate(dateString);
    } catch {
      return '';
    }
  };

  const getStatusDisplayName = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getEventIcon = (fromStatus?: string, toStatus?: string) => {
    const from = fromStatus?.toLowerCase();
    const to = toStatus?.toLowerCase();
    
    if (from === 'new' && to === 'contacted') {
      return (
        <div className="w-8 h-8 bg-green-600/20 border-2 border-green-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    // Default event icon
    return (
      <div className="w-8 h-8 bg-blue-600/20 border-2 border-blue-600 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  };

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
    const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-medium text-neutral-200">Event Timeline</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 bg-neutral-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-neutral-300 mb-1">No Events Yet</h3>
        <p className="text-xs text-neutral-500">
          Status changes and other events will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-neutral-200">
        Event Timeline ({events.length})
      </h3>
      
      <div className="space-y-4">
        {sortedEvents.map((event, index) => {
          const fromStatus = event.fromStatus || event.from_status;
          const toStatus = event.toStatus || event.to_status;
          const eventDate = event.createdAt || event.created_at;
          const isLast = index === sortedEvents.length - 1;
          
          return (
            <div key={event.id} className="relative flex items-start gap-3">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-4 top-8 w-0.5 h-full bg-neutral-800"></div>
              )}
              
              {/* Event icon */}
              {getEventIcon(fromStatus, toStatus)}
              
              {/* Event content */}
              <div className="flex-1 min-w-0">
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <span className="text-sm font-medium text-neutral-200">
                          Status Changed
                        </span>
                        {event.actor && (
                          <span className="text-xs text-neutral-500">
                            by {event.actor}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-orange-600/20 text-orange-300 rounded text-xs">
                            {getStatusDisplayName(fromStatus)}
                          </span>
                          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded text-xs">
                            {getStatusDisplayName(toStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-xs text-neutral-400">
                        {getRelativeTime(eventDate)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1 hidden sm:block">
                        {formatDate(eventDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Timeline end marker */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-neutral-800 border-2 border-neutral-700 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="text-sm text-neutral-500">Lead created</div>
      </div>
    </div>
  );
}