import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LeadsPage from '../page';
import { leadApi } from '../../../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the leadApi
jest.mock('../../../../../lib/api', () => ({
  leadApi: {
    getLeads: jest.fn(),
    changeLeadStatus: jest.fn()
  }
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
};

const mockLeads = [
  {
    id: 'lead-1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new' as const,
    created_at: '2024-01-01T12:00:00Z',
    payload: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  },
  {
    id: 'lead-2',
    tenant_id: 'test-tenant',
    source: 'email',
    status: 'contacted' as const,
    created_at: '2024-01-02T12:00:00Z'
  }
];

describe('LeadsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (leadApi.getLeads as jest.Mock).mockResolvedValue(mockLeads);
  });

  it('renders page title and description', async () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    expect(screen.getByText('Lead Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage and track leads for test-tenant')).toBeInTheDocument();
  });

  it('loads and displays leads', async () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Leads (2)')).toBeInTheDocument();
    });
    
    expect(screen.getByText('lead-1')).toBeInTheDocument();
    expect(screen.getByText('lead-2')).toBeInTheDocument();
    expect(leadApi.getLeads).toHaveBeenCalledWith('test-tenant');
  });

  it('shows loading state initially', () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    // Should show loading skeleton
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    (leadApi.getLeads as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('navigates to lead detail when lead is clicked', async () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('lead-1')).toBeInTheDocument();
    });
    
    const leadRow = screen.getByText('lead-1').closest('tr');
    fireEvent.click(leadRow!);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/t/test-tenant/leads/lead-1');
  });

  it('retries loading when retry button is clicked', async () => {
    (leadApi.getLeads as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockLeads);
    
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('Leads (2)')).toBeInTheDocument();
    });
    
    expect(leadApi.getLeads).toHaveBeenCalledTimes(2);
  });

  it('displays empty state when no leads', async () => {
    (leadApi.getLeads as jest.Mock).mockResolvedValue([]);
    
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('No leads yet')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/When leads are submitted through your forms/)).toBeInTheDocument();
  });

  it('renders table variant by default', async () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    
    // Check table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows lead counts correctly', async () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Leads (2)')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
      expect(screen.getByText('1 contacted')).toBeInTheDocument();
    });
  });

  it('handles tenant-specific data loading', async () => {
    render(<LeadsPage params={{ tenant: 'different-tenant' }} />);
    
    await waitFor(() => {
      expect(leadApi.getLeads).toHaveBeenCalledWith('different-tenant');
    });
    
    expect(screen.getByText('Manage and track leads for different-tenant')).toBeInTheDocument();
  });

  it('provides proper page metadata context', () => {
    render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
    
    // The page should have proper semantic structure
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Lead Dashboard');
  });

  it('maintains tenant isolation in API calls', async () => {
    const { rerender } = render(<LeadsPage params={{ tenant: 'tenant-1' }} />);
    
    await waitFor(() => {
      expect(leadApi.getLeads).toHaveBeenCalledWith('tenant-1');
    });
    
    // Change tenant
    rerender(<LeadsPage params={{ tenant: 'tenant-2' }} />);
    
    await waitFor(() => {
      expect(leadApi.getLeads).toHaveBeenCalledWith('tenant-2');
    });
    
    // Should have been called with both tenants
    expect(leadApi.getLeads).toHaveBeenCalledTimes(2);
  });
});