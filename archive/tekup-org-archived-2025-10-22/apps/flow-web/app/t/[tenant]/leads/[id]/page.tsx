"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { leadApi, Lead } from '../../../../../lib/api';
import { useLeadStatus, useLeadStatusNotifications } from '../hooks/useLeadStatus';
import { LeadDetail } from '../components/LeadDetail';
import { EventTimeline, LeadEvent } from '../components/EventTimeline';
import { StatusActions } from '../components/StatusActions';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ErrorBoundary, LeadErrorBoundary } from '../components/ErrorBoundary';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-flow-web-app-t--tenant--leads--id--page');

export default function LeadDetailPage({ 
  params 
}: {
  params: { tenant: string; id: string } 
}) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status updates with notifications
  const { notification, showSuccess, showError, clearNotification } = useLeadStatusNotifications();
  
  const { updateStatus, updating } = useLeadStatus({
    tenant: params.tenant,
    onSuccess: (updatedLead) => {
      setLead(updatedLead);
      showSuccess(`Lead ${updatedLead.id} marked as contacted`);
      // Refresh events to show the status change
      loadEvents();
    },
    onError: (error, leadId) => {
      showError(`Failed to update lead ${leadId}: ${error}`);
    }
  });

  // Load lead data
  const loadLead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll get the lead from the list and find by ID
      // In a real app, there would be a getLeadById API endpoint
      const leads = await leadApi.getLeads(params.tenant);
      const foundLead = leads.find(l => l.id === params.id);
      
      if (!foundLead) {
        setError('Lead not found');
        return;
      }
      
      setLead(foundLead);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load lead';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [params.tenant, params.id]);

  // Load events data
  const loadEvents = useCallback(async () => {
    if (!params.id) return;
    
    try {
      setEventsLoading(true);
      const eventsData = await leadApi.getLeadEvents(params.tenant, params.id);
      setEvents(eventsData || []);
    } catch (err) {
      logger.warn('Failed to load events:', err);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [params.tenant, params.id]);

  // Handle status change
  const handleStatusChange = async (leadId: string, status: 'contacted') => {
    await updateStatus(leadId, status);
  };

  // Error boundary error handler
  const handleError = useCallback((error: Error) => {
    logger.error('Lead detail error:', error);
    showError(`Lead detail error: ${error.message}`);
  }, [showError]);

  // Initial data loading
  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Load events after lead is loaded
  useEffect(() => {
    if (lead) {
      loadEvents();
    }
  }, [lead, loadEvents]);

  // Handle retry
  const handleRetry = () => {
    loadLead();
  };

  if (loading) {
    return (
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <LoadingState variant="detail" />
        </div>
      </main>
    );
  }

  if (error || !lead) {
    return (
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href={`/t/${params.tenant}/leads`}
              className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Leads
            </Link>
          </div>

          <ErrorState 
            message={error || 'Lead not found'} 
            onRetry={handleRetry}
            variant="default"
          />
        </div>
      </main>
    );
  }

  return (
    <ErrorBoundary
      onError={handleError}
      resetKeys={[params.tenant, params.id]}
    >
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href={`/t/${params.tenant}/leads`}
              className="inline-flex items-center gap-2 px-3 py-2 -mx-3 -my-2 text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 rounded-lg transition-colors touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Leads</span>
            </Link>
          </div>

          {/* Notification Toast */}
          {notification && (
            <div className="mb-6">
              <ErrorState
                variant="toast"
                message={notification.message}
                onRetry={notification.type === 'error' ? clearNotification : undefined}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Lead Details - Main Column */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <LeadErrorBoundary leadId={lead.id} onError={handleError}>
                <LeadDetail lead={lead} />
              </LeadErrorBoundary>
            </div>

            {/* Sidebar - Actions and Timeline */}
            <div className="space-y-4 lg:space-y-6 order-1 lg:order-2">
              {/* Status Actions */}
              <LeadErrorBoundary leadId={lead.id} onError={handleError}>
                <StatusActions
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  updating={updating}
                />
              </LeadErrorBoundary>

              {/* Event Timeline */}
              <LeadErrorBoundary leadId={lead.id} onError={handleError}>
                <EventTimeline
                  events={events}
                  loading={eventsLoading}
                />
              </LeadErrorBoundary>
            </div>
          </div>

          {/* Page Metadata for SEO */}
          <div className="sr-only">
            <h1>Lead Details - {lead.id}</h1>
            <p>Lead from {lead.source} for tenant {params.tenant}</p>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}