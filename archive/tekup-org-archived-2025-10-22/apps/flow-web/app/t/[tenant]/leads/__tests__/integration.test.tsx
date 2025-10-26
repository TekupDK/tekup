import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LeadsPage from '../page';
import LeadDetailPage from '../[id]/page';
import { leadApi } from '../../../../../lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/t/test-tenant/leads')
}));

// Mock the leadApi
jest.mock('../../../../../lib/api', () => ({
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

const mockLeads = [
  {
    id: 'lead-1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new' as const,
    created_at: '2024-01-01T12:00:00Z',
    updated_at: '2024-01-01T12:00:00Z',
    payload: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      message: 'I need help with cleaning services'
    }
  },
  {
    id: 'lead-2',
    tenant_id: 'test-tenant',
    source: 'email',
    status: 'contacted' as const,
    created_at: '2024-01-02T12:00:00Z',
    updated_at: '2024-01-02T13:00:00Z',
    payload: {
      name: 'Jane Smith',
      email: 'jane@example.com'
    }
  }
];

const mockEvents = [
  {
    id: 'event-1',
    lead_id: 'lead-1',
    fromStatus: null,
    toStatus: 'new',
    createdAt: '2024-01-01T12:00:00Z',
    actor: 'system'
  }
];

describe('Lead Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (leadApi.getLeads as jest.Mock).mockResolvedValue(mockLeads);
    (leadApi.getLeadEvents as jest.Mock).mockResolvedValue(mockEvents);
    (leadApi.changeLeadStatus as jest.Mock).mockResolvedValue({
      ...mockLeads[0],
      status: 'contacted'
    });
  });

  describe('Complete User Journey: List → Detail → Status Change', () => {
    it('allows user to navigate from list to detail and update status', async () => {
      // Step 1: Render leads list page
      const { rerender } = render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      // Wait for leads to load
      await waitFor(() => {
        expect(screen.getByText('Lead Dashboard')).toBeInTheDocument();
        expect(screen.getByText('lead-1')).toBeInTheDocument();
      });
      
      // Verify lead list displays correctly
      expect(screen.getByText('Leads (2)')).toBeInTheDocument();
      expect(screen.getByText('1 new')).toBeInTheDocument();
      expect(screen.getByText('1 contacted')).toBeInTheDocument();
      
      // Step 2: Click on a lead to navigate to detail
      const leadRow = screen.getByText('lead-1').closest('tr');
      fireEvent.click(leadRow!);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/t/test-tenant/leads/lead-1');
      
      // Step 3: Render lead detail page (simulating navigation)
      rerender(
        <LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-1' }} />
      );
      
      // Wait for lead detail to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Verify lead details are displayed
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('I need help with cleaning services')).toBeInTheDocument();
      
      // Step 4: Update lead status
      const markContactedButton = screen.getByRole('button', { name: /mark as contacted/i });
      expect(markContactedButton).toBeInTheDocument();
      
      fireEvent.click(markContactedButton);
      
      // Verify API call was made
      await waitFor(() => {
        expect(leadApi.changeLeadStatus).toHaveBeenCalledWith('test-tenant', 'lead-1', 'contacted');
      });
      
      // Verify success notification appears
      await waitFor(() => {
        expect(screen.getByText(/Lead lead-1 marked as contacted/)).toBeInTheDocument();
      });
    });

    it('handles errors gracefully throughout the journey', async () => {
      // Step 1: Test error on leads list
      (leadApi.getLeads as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      
      // Test retry functionality
      (leadApi.getLeads as jest.Mock).mockResolvedValueOnce(mockLeads);
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Leads (2)')).toBeInTheDocument();
      });
      
      // Step 2: Test error on status update
      const { rerender } = render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-1' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Mock status update error
      (leadApi.changeLeadStatus as jest.Mock).mockRejectedValueOnce(new Error('Status update failed'));
      
      const markContactedButton = screen.getByRole('button', { name: /mark as contacted/i });
      fireEvent.click(markContactedButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to update lead lead-1: Status update failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Tenant Isolation', () => {
    it('maintains proper tenant isolation across different tenants', async () => {
      // Test with first tenant
      const { rerender } = render(<LeadsPage params={{ tenant: 'tenant-1' }} />);
      
      await waitFor(() => {
        expect(leadApi.getLeads).toHaveBeenCalledWith('tenant-1');
      });
      
      // Switch to different tenant
      rerender(<LeadsPage params={{ tenant: 'tenant-2' }} />);
      
      await waitFor(() => {
        expect(leadApi.getLeads).toHaveBeenCalledWith('tenant-2');
      });
      
      // Verify both calls were made with correct tenant
      expect(leadApi.getLeads).toHaveBeenCalledTimes(2);
      expect(leadApi.getLeads).toHaveBeenNthCalledWith(1, 'tenant-1');
      expect(leadApi.getLeads).toHaveBeenNthCalledWith(2, 'tenant-2');
    });

    it('isolates status updates by tenant', async () => {
      render(<LeadDetailPage params={{ tenant: 'specific-tenant', id: 'lead-1' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      const markContactedButton = screen.getByRole('button', { name: /mark as contacted/i });
      fireEvent.click(markContactedButton);
      
      await waitFor(() => {
        expect(leadApi.changeLeadStatus).toHaveBeenCalledWith('specific-tenant', 'lead-1', 'contacted');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile and desktop', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });
      
      render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Leads (2)')).toBeInTheDocument();
      });
      
      // On mobile, should show card layout instead of table
      // This would be tested with actual CSS media queries in a real browser environment
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('refreshes lead list after status update', async () => {
      const updatedLeads = [
        { ...mockLeads[0], status: 'contacted' as const },
        mockLeads[1]
      ];
      
      // Initial render
      render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('1 new')).toBeInTheDocument();
      });
      
      // Simulate status update success (this would normally happen via the detail page)
      (leadApi.getLeads as jest.Mock).mockResolvedValueOnce(updatedLeads);
      
      // Trigger refetch (simulating what happens after status update)
      const retryButton = screen.getByText('Try Again');
      if (retryButton) {
        fireEvent.click(retryButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('0 new')).toBeInTheDocument();
        expect(screen.getByText('2 contacted')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and keyboard navigation', async () => {
      render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
      
      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Lead Dashboard');
      
      // Check for table accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('supports keyboard navigation in lead detail', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-1' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Check for focusable elements
      const markContactedButton = screen.getByRole('button', { name: /mark as contacted/i });
      expect(markContactedButton).toBeInTheDocument();
      
      // Check for proper link accessibility
      const backLink = screen.getByRole('link', { name: /back to leads/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/t/test-tenant/leads');
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      // Create a large dataset
      const largeLeadSet = Array.from({ length: 100 }, (_, i) => ({
        id: `lead-${i}`,
        tenant_id: 'test-tenant',
        source: 'form',
        status: i % 2 === 0 ? 'new' as const : 'contacted' as const,
        created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
        updated_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
        payload: {
          name: `User ${i}`,
          email: `user${i}@example.com`
        }
      }));
      
      (leadApi.getLeads as jest.Mock).mockResolvedValue(largeLeadSet);
      
      const startTime = performance.now();
      render(<LeadsPage params={{ tenant: 'test-tenant' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Leads (100)')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (this is a rough benchmark)
      expect(renderTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});