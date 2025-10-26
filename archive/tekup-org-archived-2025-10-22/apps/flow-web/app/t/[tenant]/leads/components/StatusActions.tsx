import React from 'react';
import { Lead } from '../../../../../lib/api';
import { StatusBadge } from './StatusBadge';

export interface StatusActionsProps {
  lead: Lead;
  onStatusChange: (leadId: string, status: 'contacted') => Promise<void>;
  updating?: boolean;
  className?: string;
}

export function StatusActions({ 
  lead, 
  onStatusChange, 
  updating = false, 
  className = '' 
}: StatusActionsProps) {
  const handleMarkAsContacted = async () => {
    if (lead.status === 'contacted' || updating) return;
    await onStatusChange(lead.id, 'contacted');
  };

  const canMarkAsContacted = lead.status === 'new' && !updating;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Status Display */}
      <div className="flex items-center justify-between p-4 bg-neutral-900/40 border border-neutral-800 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-neutral-200 mb-1">
            Current Status
          </h3>
          <StatusBadge status={lead.status} size="md" />
        </div>
        
        {lead.status === 'contacted' && (
          <div className="text-right">
            <svg className="w-6 h-6 text-green-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-xs text-green-400">Complete</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-200">
          Available Actions
        </h3>
        
        {canMarkAsContacted ? (
          <button
            onClick={handleMarkAsContacted}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand hover:bg-brand/90 active:bg-brand/80 disabled:bg-brand/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium touch-manipulation min-h-[48px]"
          >
            {updating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Status...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Contacted
              </>
            )}
          </button>
        ) : (
          <div className="w-full p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg text-center">
            {lead.status === 'contacted' ? (
              <div className="text-sm text-neutral-400">
                <svg className="w-5 h-5 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This lead has already been contacted.
              </div>
            ) : (
              <div className="text-sm text-neutral-400">
                No actions available for this lead status.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Information */}
      <div className="p-4 bg-brand/10 border border-brand/30 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <div className="text-brand font-medium mb-1">Status Guide</div>
            <div className="text-neutral-300 space-y-1">
              <div><strong>New:</strong> Lead just received, needs attention</div>
              <div><strong>Contacted:</strong> Lead has been reached out to</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions (Future Enhancement) */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          Quick Actions
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lead.payload?.email && (
            <a
              href={`mailto:${lead.payload.email}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Send Email</span>
            </a>
          )}
          
          {lead.payload?.phone && (
            <a
              href={`tel:${lead.payload.phone.replace(/[^\d+]/g, '')}`}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 border border-neutral-700 rounded-lg text-sm text-neutral-300 transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">Call Now</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}