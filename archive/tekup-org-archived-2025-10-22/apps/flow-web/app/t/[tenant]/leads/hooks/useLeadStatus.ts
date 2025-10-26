import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadApi, Lead, ChangeStatusRequest } from '../../../../../lib/api';

export interface UseLeadStatusState {
  updating: boolean;
  error: string | null;
  updateStatus: (leadId: string, status: 'contacted', actor?: string) => Promise<Lead | null>;
  clearError: () => void;
}

export interface UseLeadStatusOptions {
  tenant: string;
  onSuccess?: (lead: Lead) => void;
  onError?: (error: string, leadId: string) => void;
  onOptimisticUpdate?: (leadId: string, status: 'contacted') => void;
  onRollback?: (leadId: string, originalStatus: 'new' | 'contacted') => void;
}

export interface NotificationState {
  type: 'success' | 'error';
  message: string;
  leadId?: string;
}

export function useLeadStatus({
  tenant,
  onSuccess,
  onError,
  onOptimisticUpdate,
  onRollback
}: UseLeadStatusOptions): UseLeadStatusState {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<
    Lead,
    Error,
    { leadId: string; status: 'contacted'; actor?: string },
    { previousLeads?: Lead[] }
  >({
    mutationFn: async ({ leadId, status, actor }) => {
      const request: ChangeStatusRequest = { status, ...(actor && { actor }) };
      return leadApi.changeLeadStatus(tenant, leadId, request);
    },
    onMutate: async ({ leadId, status }) => {
      setError(null);
      const queryKey = ['leads', tenant];
      await queryClient.cancelQueries({ queryKey });
      const previousLeads = queryClient.getQueryData<Lead[]>(queryKey) || [];

      // External optimistic callback
      onOptimisticUpdate?.(leadId, status);

      // Optimistically update cache
      queryClient.setQueryData<Lead[]>(queryKey, (old) => {
        if (!old) return old as any;
        return old.map((l) => (l.id === leadId ? { ...l, status } : l));
      });

      return { previousLeads };
    },
    onError: (err, { leadId }, context) => {
      const msg = err.message || 'Failed to update lead status';
      setError(msg);
      // Rollback cache
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads', tenant], context.previousLeads);
      }
      // External rollback + error callbacks
      onRollback?.(leadId, 'new');
      onError?.(msg, leadId);
    },
    onSuccess: (updatedLead) => {
      onSuccess?.(updatedLead);
    },
    onSettled: () => {
      // Ensure cache is consistent post-mutation
      queryClient.invalidateQueries({ queryKey: ['leads', tenant] });
    }
  });

  const updateStatus = useCallback(async (
    leadId: string, 
    status: 'contacted', 
    actor?: string
  ): Promise<Lead | null> => {
    try {
      const res = await mutation.mutateAsync({ leadId, status, actor });
      return res;
    } catch {
      return null;
    }
  }, [mutation]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updating: mutation.isPending,
    error,
    updateStatus,
    clearError
  };
}

// Notification hook for success/error messages
export function useLeadStatusNotifications() {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showSuccess = useCallback((message: string, leadId?: string) => {
    setNotification({ type: 'success', message, leadId });
  }, []);

  const showError = useCallback((message: string, leadId?: string) => {
    setNotification({ type: 'error', message, leadId });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showSuccess,
    showError,
    clearNotification
  };
}