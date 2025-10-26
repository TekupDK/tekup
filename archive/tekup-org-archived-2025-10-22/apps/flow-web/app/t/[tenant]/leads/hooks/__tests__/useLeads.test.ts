import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '../useLeads';
import { leadApi, Lead } from '../../../../../../lib/api';

// Mock the leadApi
jest.mock('../../../../../../lib/api', () => ({
  leadApi: {
    getLeads: jest.fn()
  }
}));

const mockLeadApi = leadApi as jest.Mocked<typeof leadApi>;

const mockLeads: Lead[] = [
  {
    id: '1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    tenant_id: 'test-tenant',
    source: 'email',
    status: 'contacted',
    created_at: '2024-01-02T00:00:00Z'
  }
];

describe('useLeads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with loading state when no initial data', () => {
    mockLeadApi.getLeads.mockResolvedValue(mockLeads);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLeads({ tenant: 'test-tenant' }), { wrapper });
    
    expect(result.current.loading).toBe(true);
    expect(result.current.leads).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('initializes with initial data when provided', () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeads({ tenant: 'test-tenant', initialData: mockLeads }),
      { wrapper }
    );
    
    expect(result.current.loading).toBe(false);
    expect(result.current.leads).toEqual(mockLeads);
    expect(result.current.error).toBe(null);
  });

  it('fetches leads successfully', async () => {
    mockLeadApi.getLeads.mockResolvedValue(mockLeads);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLeads({ tenant: 'test-tenant' }), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.leads).toEqual(mockLeads);
    expect(result.current.error).toBe(null);
    expect(mockLeadApi.getLeads).toHaveBeenCalledWith('test-tenant');
  });

  it('handles fetch error', async () => {
    const errorMessage = 'Network error';
    mockLeadApi.getLeads.mockRejectedValue(new Error(errorMessage));
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeads({ tenant: 'test-tenant', autoRetry: false }),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.leads).toEqual([]);
  });

  it('handles non-Error exceptions', async () => {
    mockLeadApi.getLeads.mockRejectedValue('String error');
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeads({ tenant: 'test-tenant', autoRetry: false }),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBe('Failed to load leads');
  });

  it('refetches data when refetch is called', async () => {
    mockLeadApi.getLeads.mockResolvedValue(mockLeads);

    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useLeads({ tenant: 'test-tenant' }), { wrapper });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Clear previous calls
    mockLeadApi.getLeads.mockClear();
    
    await act(async () => {
      await result.current.refetch();
    });
    
    expect(mockLeadApi.getLeads).toHaveBeenCalledWith('test-tenant');
  });

  it('retries on error when retry is called', async () => {
    mockLeadApi.getLeads
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(mockLeads);
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeads({ tenant: 'test-tenant', autoRetry: false }),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });
    
    act(() => {
      result.current.retry();
    });
    
    await waitFor(() => {
      expect(result.current.leads).toEqual(mockLeads);
      expect(result.current.error).toBe(null);
    });
  });

  it('auto-retries with exponential backoff', async () => {
    mockLeadApi.getLeads
      .mockRejectedValueOnce(new Error('First error'))
      .mockRejectedValueOnce(new Error('Second error'))
      .mockResolvedValueOnce(mockLeads);
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLeads({
          tenant: 'test-tenant',
          autoRetry: true,
          retryDelay: 100,
          maxRetries: 3,
        }),
      { wrapper }
    );
    
    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });
    
    // Fast-forward first retry (100ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Second error');
    });
    
    // Fast-forward second retry (200ms - exponential backoff)
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    await waitFor(() => {
      expect(result.current.leads).toEqual(mockLeads);
      expect(result.current.error).toBe(null);
    });
    
    expect(mockLeadApi.getLeads).toHaveBeenCalledTimes(3);
  });

  it('stops retrying after max retries', async () => {
    mockLeadApi.getLeads.mockRejectedValue(new Error('Persistent error'));
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLeads({
          tenant: 'test-tenant',
          autoRetry: true,
          retryDelay: 100,
          maxRetries: 2,
        }),
      { wrapper }
    );
    
    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBe('Persistent error');
    });
    
    // Fast-forward through all retries
    act(() => {
      jest.advanceTimersByTime(1000); // More than enough time for 2 retries
    });
    
    await waitFor(() => {
      expect(mockLeadApi.getLeads).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  it('resets retry count on successful refetch', async () => {
    mockLeadApi.getLeads
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue(mockLeads);
    
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useLeads({ tenant: 'test-tenant', autoRetry: false }),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.error).toBe('Error');
    });
    
    await act(async () => {
      await result.current.refetch();
    });
    
    expect(result.current.error).toBe(null);
    expect(result.current.leads).toEqual(mockLeads);
  });
});