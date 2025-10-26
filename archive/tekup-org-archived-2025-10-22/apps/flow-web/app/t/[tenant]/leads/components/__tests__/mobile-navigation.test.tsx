import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LeadDetailPage from '../../[id]/page';
import { StatusActions } from '../StatusActions';
import { leadApi, Lead } from '../../../../../../lib/api';

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

const mockLead: Lead = {
  id: 'lead-123',
  tenant_id: 'test-tenant',
  source: 'form',
  status: 'new',
  created_at: '2024-01-01T12:00:00Z',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+45 12 34 56 78'
  }
};

describe('Mobile Navigation and Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (leadApi.getLeads as jest.Mock).mockResolvedValue([mockLead]);
    (leadApi.getLeadEvents as jest.Mock).mockResolvedValue([]);
  });

  describe('Touch-Friendly Navigation', () => {
    it('provides adequate touch targets for back navigation', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      const backLink = await screen.findByText('Back to Leads');
      const linkElement = backLink.closest('a');
      
      expect(linkElement).toHaveClass('touch-manipulation');
      expect(linkElement).toHaveClass('px-3', 'py-2'); // Adequate padding for touch
    });

    it('shows mobile-optimized layout order', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Actions should appear before details on mobile (order-1 vs order-2)
      const actionsContainer = document.querySelector('.order-1.lg\\:order-2');
      const detailsContainer = document.querySelector('.order-2.lg\\:order-1');
      
      expect(actionsContainer).toBeInTheDocument();
      expect(detailsContainer).toBeInTheDocument();
    });

    it('uses appropriate spacing for mobile', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Should use smaller spacing on mobile, larger on desktop
      const sidebarContainer = document.querySelector('.space-y-4.lg\\:space-y-6');
      expect(sidebarContainer).toBeInTheDocument();
    });
  });

  describe('Touch-Friendly Action Buttons', () => {
    it('provides minimum touch target size for primary actions', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const button = screen.getByText('Mark as Contacted');
      expect(button).toHaveClass('min-h-[48px]'); // Minimum 48px height for touch
      expect(button).toHaveClass('touch-manipulation');
    });

    it('shows active states for touch feedback', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const button = screen.getByText('Mark as Contacted');
      expect(button).toHaveClass('active:bg-brand/80'); // Active state for touch feedback
    });

    it('provides touch-friendly quick action buttons', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const emailButton = screen.getByText('Send Email');
      const callButton = screen.getByText('Call Now');
      
      expect(emailButton).toHaveClass('touch-manipulation');
      expect(callButton).toHaveClass('touch-manipulation');
      
      // Should have adequate padding
      expect(emailButton).toHaveClass('px-4', 'py-3');
      expect(callButton).toHaveClass('px-4', 'py-3');
    });

    it('uses single column layout on mobile for quick actions', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const quickActionsGrid = document.querySelector('.grid-cols-1.sm\\:grid-cols-2');
      expect(quickActionsGrid).toBeInTheDocument();
    });
  });

  describe('Mobile-Optimized Content Layout', () => {
    it('uses responsive grid for metadata', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Should use responsive grid classes
      const metadataGrid = document.querySelector('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(metadataGrid).toBeInTheDocument();
    });

    it('stacks content vertically on mobile in event timeline', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Timeline should use flex-col on mobile, flex-row on desktop
      const timelineContent = document.querySelector('.flex-col.sm\\:flex-row');
      expect(timelineContent).toBeInTheDocument();
    });

    it('hides detailed timestamps on mobile', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Detailed timestamps should be hidden on mobile
      const hiddenTimestamp = document.querySelector('.hidden.sm\\:block');
      expect(hiddenTimestamp).toBeInTheDocument();
    });
  });

  describe('Responsive Typography', () => {
    it('uses smaller text sizes on mobile', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      // Page title should be responsive
      const title = screen.getByText('Lead Dashboard');
      expect(title).toHaveClass('text-xl', 'sm:text-2xl');
    });

    it('adjusts description text size for mobile', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      const description = screen.getByText(/Manage and track leads for/);
      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });
  });

  describe('Touch Gesture Support', () => {
    it('prevents text selection on interactive elements', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const button = screen.getByText('Mark as Contacted');
      // touch-manipulation class helps with touch responsiveness
      expect(button).toHaveClass('touch-manipulation');
    });

    it('provides visual feedback for touch interactions', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const emailButton = screen.getByText('Send Email');
      expect(emailButton).toHaveClass('active:bg-neutral-600'); // Active state for touch
    });
  });

  describe('Mobile Loading States', () => {
    it('shows appropriate loading states for mobile', () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'nonexistent' }} />);
      
      // Should show loading skeleton
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Accessibility on Mobile', () => {
    it('maintains proper heading hierarchy', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      const mainHeading = await screen.findByText('Lead Details');
      expect(mainHeading.tagName).toBe('H1');
    });

    it('provides proper link context for navigation', async () => {
      render(<LeadDetailPage params={{ tenant: 'test-tenant', id: 'lead-123' }} />);
      
      const backLink = await screen.findByText('Back to Leads');
      expect(backLink.closest('a')).toHaveAttribute('href', '/t/test-tenant/leads');
    });

    it('maintains proper button semantics', () => {
      const mockOnStatusChange = jest.fn();
      render(<StatusActions lead={mockLead} onStatusChange={mockOnStatusChange} />);
      
      const button = screen.getByRole('button', { name: /Mark as Contacted/ });
      expect(button).toBeInTheDocument();
    });
  });
});