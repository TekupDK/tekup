import React, { useState, useMemo } from 'react';
import { Lead } from '../../../../../lib/api';
import { LeadCard } from './LeadCard';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

export interface LeadListProps {
  leads: Lead[];
  loading?: boolean;
  error?: string | null;
  onLeadClick?: (lead: Lead) => void;
  onRetry?: () => void;
  selectedLeadId?: string;
  className?: string;
  variant?: 'table' | 'cards' | 'responsive';
}

type SortOption = 'newest' | 'oldest' | 'source' | 'status';

export function LeadList({
  leads,
  loading = false,
  error = null,
  onLeadClick,
  onRetry,
  selectedLeadId,
  className = '',
  variant = 'responsive'
}: LeadListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedLeads = useMemo(() => {
    const sorted = [...leads];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA; // Newest first
        });
      
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateA - dateB; // Oldest first
        });
      
      case 'source':
        return sorted.sort((a, b) => a.source.localeCompare(b.source));
      
      case 'status':
        return sorted.sort((a, b) => {
          // Sort by status: 'new' first, then 'contacted'
          if (a.status === b.status) return 0;
          return a.status === 'new' ? -1 : 1;
        });
      
      default:
        return sorted;
    }
  }, [leads, sortBy]);

  const leadCount = leads.length;
  const newLeadsCount = leads.filter(lead => lead.status === 'new').length;
  const contactedLeadsCount = leads.filter(lead => lead.status === 'contacted').length;

  if (loading) {
    return (
      <div className={className}>
        <LoadingState variant={variant === 'table' ? 'table' : 'list'} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorState 
          message={error} 
          onRetry={onRetry}
          variant="default"
        />
      </div>
    );
  }

  if (leadCount === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-200 mb-2">
            No leads yet
          </h3>
          <p className="text-neutral-400 max-w-md mx-auto">
            When leads are submitted through your forms or email, they'll appear here. 
            You can then review and manage them from this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with stats and sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-neutral-200">
            Leads ({leadCount})
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand font-medium">
              {newLeadsCount} new
            </span>
            <span className="text-green-400 font-medium">
              {contactedLeadsCount} contacted
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-neutral-400">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand transition-all"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="source">Source</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Lead list */}
      {variant === 'table' ? (
        <div className="border border-neutral-800 rounded-md overflow-hidden bg-neutral-950/50 backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 text-neutral-300 border-b border-neutral-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">ID</th>
                <th className="text-left px-3 py-3 font-semibold">Source</th>
                <th className="text-left px-3 py-3 font-semibold">Status</th>
                <th className="text-left px-3 py-3 font-semibold">Created</th>
                <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">Preview</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={onLeadClick}
                  variant="row"
                  isSelected={selectedLeadId === lead.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : variant === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={onLeadClick}
              variant="card"
              isSelected={selectedLeadId === lead.id}
            />
          ))}
        </div>
      ) : (
        /* Responsive variant - cards on mobile, table on desktop */
        <>
          {/* Mobile: Card layout */}
          <div className="block md:hidden">
            <div className="space-y-3">
              {sortedLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={onLeadClick}
                  variant="card"
                  isSelected={selectedLeadId === lead.id}
                  className="touch-manipulation"
                />
              ))}
            </div>
          </div>
          
          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            <div className="border border-neutral-800 rounded-md overflow-hidden bg-neutral-950/50 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead className="bg-neutral-800 text-neutral-300 border-b border-neutral-700">
                  <tr>
                    <th className="text-left px-3 py-3 font-semibold">ID</th>
                    <th className="text-left px-3 py-3 font-semibold">Source</th>
                    <th className="text-left px-3 py-3 font-semibold">Status</th>
                    <th className="text-left px-3 py-3 font-semibold">Created</th>
                    <th className="text-left px-3 py-3 font-semibold">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={onLeadClick}
                      variant="row"
                      isSelected={selectedLeadId === lead.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}