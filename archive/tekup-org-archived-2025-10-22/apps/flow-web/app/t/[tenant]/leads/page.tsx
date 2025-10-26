"use client";
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '../../../../lib/api';
import { useLeads } from './hooks/useLeads';
import { useLeadStatus, useLeadStatusNotifications } from './hooks/useLeadStatus';
import { LeadList } from './components/LeadList';
import { ErrorState } from './components/ErrorState';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from '../../components/Dashboard';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-flow-web-app-t--tenant--leads--page');

export default function LeadsPage({ params }: { params: { tenant: string } }) {
  const router = useRouter();
  
  // Data fetching
  const { leads, loading, error, refetch } = useLeads({ 
    tenant: params.tenant 
  });

  // Status updates with notifications
  const { notification, showSuccess, showError, clearNotification } = useLeadStatusNotifications();
  
  const { updateStatus } = useLeadStatus({
    tenant: params.tenant,
    onSuccess: (lead) => {
      showSuccess(`Lead ${lead.id} marked as contacted`);
      refetch(); // Refresh the lead list
    },
    onError: (error, leadId) => {
      showError(`Failed to update lead ${leadId}: ${error}`);
    }
  });

  // Navigation to lead detail
  const handleLeadClick = useCallback((lead: Lead) => {
    router.push(`/t/${params.tenant}/leads/${lead.id}`);
  }, [router, params.tenant]);

  // Error boundary error handler
  const handleError = (error: Error) => {
    logger.error('Lead dashboard error:', error);
    showError(`Dashboard error: ${error.message}`);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      resetKeys={[params.tenant]}
    >
      <main className="flow-main-content bg-ecosystem min-h-screen">
        {/* Header with futuristic styling */}
        <div className="mb-8">
          <div className="glass-card p-6">
            <h1 className="text-2xl sm:text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-cyan mb-2">
              Lead Dashboard
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Administrer og track leads for <span className="text-neon-blue font-semibold capitalize">{params.tenant}</span>
            </p>
          </div>
        </div>

        {/* Dashboard Overview */}
        <ErrorBoundary
          onError={handleError}
          resetKeys={[params.tenant]}
        >
          <Dashboard 
            tenant={params.tenant}
            leads={leads}
            loading={loading}
            error={error}
          />
        </ErrorBoundary>

        {/* Notification Toast */}
        {notification && (
          <ErrorState
            variant="toast"
            message={notification.message}
            onRetry={notification.type === 'error' ? clearNotification : undefined}
          />
        )}

        {/* Lead List */}
        <div className="mt-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-orbitron font-semibold text-neon-blue mb-6 flex items-center gap-3">
              <div className="w-2 h-6 bg-gradient-to-b from-neon-blue to-neon-cyan rounded-full"></div>
              Alle Leads
            </h2>
            <ErrorBoundary
              onError={handleError}
              resetKeys={[leads.length, params.tenant]}
            >
              <LeadList
                leads={leads}
                loading={loading}
                error={error}
                onLeadClick={handleLeadClick}
                onRetry={refetch}
                variant="responsive"
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
