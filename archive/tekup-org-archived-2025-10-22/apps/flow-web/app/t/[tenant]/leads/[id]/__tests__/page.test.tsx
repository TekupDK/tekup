import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LeadDetailPage from '../page';
import { leadApi } from '../../../../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the leadApi
jest.mock('../../../../../../lib/api', () => ({
  leadApi: {
    getLeads: jest.fn(),
    getLeadEvents: jest.fn(),
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

const mockLead = {
  id: 'lead-123',
  tenant_id: 'test-tenant',
  source: 'form',
  status: 'new' as const,
  created_at: '2024-01-01T12:00:00Z',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+45 12 34 56 78',
    message: 'Test message'
  }
};

const mockEvents = [
  {
    id: 'event-1',
    fromStatus: 'new',
    toStatus: 'contacted',
    actor: 'user@example.com',
    createdAt: '2024-01-02T14:30:00Z'
  }
];

describe('LeadDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (leadApi.getLeads as jest.Mock).mockResolvedValue([mockLead]);
    (leadApi.getLeadEvents as jest.Mock).mockResolvedValue(mockEvents);
  });

  it('renders loading state initially', () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    // Should show loading skeleton
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('loads and displays lead details', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Details')).toBeInTheDocument();
    });
    
    expect(screen.getByText('ID: lead-123')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(leadApi.getLeads).toHaveBeenCalledWith('test-tenant');
  });

  it('loads and displays events timeline', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Event Timeline (1)')).toBeInTheDocument();
    });
    
    expect(leadApi.getLeadEvents).toHaveBeenCalledWith('test-tenant', 'lead-123');
  });

  it('displays status actions', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Current Status')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
  });

  it('handles lead not found error', async () => {
    (leadApi.getLeads as jest.Mock).mockResolvedValue([]);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'nonexistent' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead not found')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    (leadApi.getLeads as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('provides back navigation to leads list', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    const backLink = screen.getByText('Back to Leads');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/t/test-tenant/leads');
  });

  it('handles status change successfully', async () => {
    const updatedLead = { ...mockLead, status: 'contacted' as const };
    (leadApi.changeLeadStatus as jest.Mock).mockResolvedValue(updatedLead);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
    });
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    expect(leadApi.changeLeadStatus).toHaveBeenCalledWith(
      'test-tenant',
      'lead-123',
      { status: 'contacted' }
    );
  });

  it('shows success notification after status change', async () => {
    const updatedLead = { ...mockLead, status: 'contacted' as const };
    (leadApi.changeLeadStatus as jest.Mock).mockResolvedValue(updatedLead);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
    });
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Lead lead-123 marked as contacted/)).toBeInTheDocument();
    });
  });

  it('handles status change error', async () => {
    (leadApi.changeLeadStatus as jest.Mock).mockRejectedValue(new Error('Update failed'));
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
    });
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update lead lead-123/)).toBeInTheDocument();
    });
  });

  it('retries loading when retry button is clicked', async () => {
    (leadApi.getLeads as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([mockLead]);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Details')).toBeInTheDocument();
    });
    
    expect(leadApi.getLeads).toHaveBeenCalledTimes(2);
  });

  it('handles events loading failure gracefully', async () => {
    (leadApi.getLeadEvents as jest.Mock).mockRejectedValue(new Error('Events error'));
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Details')).toBeInTheDocument();
    });
    
    // Should still show the timeline, but with no events
    await waitFor(() => {
      expect(screen.getByText('Event Timeline (0)')).toBeInTheDocument();
    });
  });

  it('provides proper page metadata for SEO', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Details')).toBeInTheDocument();
    });
    
    // Check for SEO metadata (screen reader only)
    expect(screen.getByText('Lead Details - lead-123')).toBeInTheDocument();
    expect(screen.getByText(/Lead from form for tenant test-tenant/)).toBeInTheDocument();
  });

  it('maintains tenant isolation in API calls', async () => {
    render(<LeadDetailPage params={{ tenant: 'different-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(leadApi.getLeads).toHaveBeenCalledWith('different-tenant');
    });
    
    await waitFor(() => {
      expect(leadApi.getLeadEvents).toHaveBeenCalledWith('different-tenant', 'lead-123');
    });
  });

  it('refreshes events after successful status change', async () => {
    const updatedLead = { ...mockLead, status: 'contacted' as const };
    (leadApi.changeLeadStatus as jest.Mock).mockResolvedValue(updatedLead);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
    });
    
    // Clear previous calls
    (leadApi.getLeadEvents as jest.Mock).mockClear();
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    await waitFor(() => {
      // Should call getLeadEvents again to refresh the timeline
      expect(leadApi.getLeadEvents).toHaveBeenCalledWith('test-tenant', 'lead-123');
    });
  });

  it('displays proper layout with sidebar', async () => {
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Lead Details')).toBeInTheDocument();
    });
    
    // Should have grid layout
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles contacted lead correctly', async () => {
    const contactedLead = { ...mockLead, status: 'contacted' as const };
    (leadApi.getLeads as jest.Mock).mockResolvedValue([contactedLead]);
    
    render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Contacted')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Mark as Contacted')).not.toBeInTheDocument();
    expect(screen.getByText('This lead has already been contacted.')).toBeInTheDocument();
  });
});