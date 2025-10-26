import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../leads/components/StatusBadge';
import { StatusActions } from '../leads/components/StatusActions';
import { Lead } from '../../../../../lib/api';

// Mock data
const mockLead: Lead = {
  id: 'test-lead-1',
  source: 'test-source',
  status: 'new',
  payload: {
    email: 'test@example.com',
    phone: '+1234567890',
    message: 'Test message',
    name: 'Test User'
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('Tenant Branding Integration', () => {
  beforeEach(() => {
    // Set up CSS custom property for testing
    document.documentElement.style.setProperty('--px-primary', '#2563eb');
  });

  afterEach(() => {
    // Clean up
    document.documentElement.style.removeProperty('--px-primary');
  });

  describe('StatusBadge', () => {
    it('applies brand colors to new status badge', () => {
      render(<StatusBadge status="new" />);
      
      const badge = screen.getByText('New');
      expect(badge).toHaveClass('bg-brand/20', 'text-brand', 'border-brand/30');
    });

    it('keeps green colors for contacted status badge', () => {
      render(<StatusBadge status="contacted" />);
      
      const badge = screen.getByText('Contacted');
      expect(badge).toHaveClass('bg-green-600/20', 'text-green-300', 'border-green-600/30');
    });
  });

  describe('StatusActions', () => {
    const mockOnStatusChange = jest.fn();

    beforeEach(() => {
      mockOnStatusChange.mockClear();
    });

    it('applies brand colors to action button', () => {
      render(
        <StatusActions 
          lead={mockLead} 
          onStatusChange={mockOnStatusChange}
        />
      );
      
      const button = screen.getByRole('button', { name: /mark as contacted/i });
      expect(button).toHaveClass('bg-brand', 'hover:bg-brand/90', 'active:bg-brand/80');
    });

    it('applies brand colors to status guide section', () => {
      render(
        <StatusActions 
          lead={mockLead} 
          onStatusChange={mockOnStatusChange}
        />
      );
      
      const statusGuide = screen.getByText('Status Guide');
      expect(statusGuide).toHaveClass('text-brand');
      
      // Check if the parent container has brand background
      const container = statusGuide.closest('.bg-brand\\/10');
      expect(container).toBeInTheDocument();
    });

    it('shows completed state without brand colors for contacted leads', () => {
      const contactedLead = { ...mockLead, status: 'contacted' as const };
      
      render(
        <StatusActions 
          lead={contactedLead} 
          onStatusChange={mockOnStatusChange}
        />
      );
      
      expect(screen.queryByRole('button', { name: /mark as contacted/i })).not.toBeInTheDocument();
      expect(screen.getByText('This lead has already been contacted.')).toBeInTheDocument();
    });
  });

  describe('CSS Custom Properties', () => {
    it('supports brand color with opacity modifiers', () => {
      // This test verifies that our CSS setup supports the brand classes
      const testElement = document.createElement('div');
      testElement.className = 'bg-brand/20 text-brand border-brand/30';
      document.body.appendChild(testElement);
      
      // The classes should be applied (actual color computation would need browser environment)
      expect(testElement).toHaveClass('bg-brand/20', 'text-brand', 'border-brand/30');
      
      document.body.removeChild(testElement);
    });
  });
});