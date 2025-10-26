import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeadStatus, useLeadStatusNotifications } from '../useLeadStatus';
import { leadApi, Lead } from '../../../../../../lib/api';

// Mock the leadApi
jest.mock('../../../../../../lib/api', () => ({
  leadApi: {
    changeLeadStatus: jest.fn()
  }
}));

const mockLeadApi = leadApi as jest.Mocked<typeof leadApi>;

const mockLead: Lead = {
  id: '1',
  tenant_id: 'test-tenant',
  source: 'form',
  status: 'contacted',
  created_at: '2024-01-01T00:00:00Z'
};

describe('useLeadStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() =>
      useLeadStatus({ tenant: 'test-tenant' }),
      { wrapper }
    );
    
    expect(result.current.updating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.updateStatus).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('updates status successfully', async () => {
    mockLeadApi.changeLeadStatus.mockResolvedValue(mockLead);
    const onSuccess = jest.fn();
    const onOptimisticUpdate = jest.fn();
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLeadStatus({
          tenant: 'test-tenant',
          onSuccess,
          onOptimisticUpdate
        }),
      { wrapper }
    );
    
    let updatedLead: Lead | null = null;
    
    await act(async () => {
      updatedLead = await result.current.updateStatus('1', 'contacted', 'user123');
    });
    
    expect(result.current.updating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(updatedLead).toEqual(mockLead);
    expect(onOptimisticUpdate).toHaveBeenCalledWith('1', 'contacted');
    expect(onSuccess).toHaveBeenCalledWith(mockLead);
    expect(mockLeadApi.changeLeadStatus).toHaveBeenCalledWith(
      'test-tenant',
      '1',
      { status: 'contacted', actor: 'user123' }
    );
  });

  it('updates status without actor', async () => {
    mockLeadApi.changeLeadStatus.mockResolvedValue(mockLead);
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeadStatus({ tenant: 'test-tenant' }),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.updateStatus('1', 'contacted');
    });
    
    expect(mockLeadApi.changeLeadStatus).toHaveBeenCalledWith(
      'test-tenant',
      '1',
      { status: 'contacted' }
    );
  });

  it('handles update error with rollback', async () => {
    const errorMessage = 'Update failed';
    mockLeadApi.changeLeadStatus.mockRejectedValue(new Error(errorMessage));
    
    const onError = jest.fn();
    const onOptimisticUpdate = jest.fn();
    const onRollback = jest.fn();
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLeadStatus({
          tenant: 'test-tenant',
          onError,
          onOptimisticUpdate,
          onRollback
        }),
      { wrapper }
    );
    
    let updatedLead: Lead | null = null;
    
    await act(async () => {
      updatedLead = await result.current.updateStatus('1', 'contacted');
    });
    
    expect(result.current.updating).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(updatedLead).toBe(null);
    expect(onOptimisticUpdate).toHaveBeenCalledWith('1', 'contacted');
    expect(onRollback).toHaveBeenCalledWith('1', 'new');
    expect(onError).toHaveBeenCalledWith(errorMessage, '1');
  });

  it('handles non-Error exceptions', async () => {
    mockLeadApi.changeLeadStatus.mockRejectedValue('String error');
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeadStatus({ tenant: 'test-tenant' }),
      { wrapper }
    );
    
    await act(async () => {
      await result.current.updateStatus('1', 'contacted');
    });
    
    expect(result.current.error).toBe('Failed to update lead status');
  });

  it('sets updating state during operation', async () => {
    let resolvePromise: (value: Lead) => void;
    const promise = new Promise<Lead>((resolve) => {
      resolvePromise = resolve;
    });
    mockLeadApi.changeLeadStatus.mockReturnValue(promise);
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeadStatus({ tenant: 'test-tenant' }),
      { wrapper }
    );
    
    // Start the update
    act(() => {
      result.current.updateStatus('1', 'contacted');
    });
    
    // Should be updating
    expect(result.current.updating).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolvePromise!(mockLead);
    });
    
    // Should no longer be updating
    expect(result.current.updating).toBe(false);
  });

  it('clears error when clearError is called', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeadStatus({ tenant: 'test-tenant' }),
      { wrapper }
    );
    
    // Manually set error for testing
    act(() => {
      (result.current as any).error = 'Test error';
    });
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });
});

describe('useLeadStatusNotifications', () => {
  it('initializes with no notification', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    expect(result.current.notification).toBe(null);
  });

  it('shows success notification', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    act(() => {
      result.current.showSuccess('Success message', 'lead-1');
    });
    
    expect(result.current.notification).toEqual({
      type: 'success',
      message: 'Success message',
      leadId: 'lead-1'
    });
  });

  it('shows error notification', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    act(() => {
      result.current.showError('Error message', 'lead-1');
    });
    
    expect(result.current.notification).toEqual({
      type: 'error',
      message: 'Error message',
      leadId: 'lead-1'
    });
  });

  it('shows notification without leadId', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    act(() => {
      result.current.showSuccess('Success message');
    });
    
    expect(result.current.notification).toEqual({
      type: 'success',
      message: 'Success message'
    });
  });

  it('clears notification', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    act(() => {
      result.current.showSuccess('Success message');
    });
    
    expect(result.current.notification).not.toBe(null);
    
    act(() => {
      result.current.clearNotification();
    });
    
    expect(result.current.notification).toBe(null);
  });

  it('overwrites previous notification', () => {
    const { result } = renderHook(() => useLeadStatusNotifications());
    
    act(() => {
      result.current.showSuccess('First message');
    });
    
    act(() => {
      result.current.showError('Second message');
    });
    
    expect(result.current.notification).toEqual({
      type: 'error',
      message: 'Second message'
    });
  });
});