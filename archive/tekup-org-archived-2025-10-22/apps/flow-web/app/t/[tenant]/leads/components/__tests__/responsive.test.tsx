import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeadList } from '../LeadList';
import { LeadCard } from '../LeadCard';
import { Lead } from '../../../../../../lib/api';

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new',
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
    status: 'contacted',
    created_at: '2024-01-02T12:00:00Z'
  }
];

describe('Responsive Design', () => {
  beforeEach(() => {
    // Reset matchMedia mock
    delete (window as any).matchMedia;
  });

  describe('LeadList Responsive Behavior', () => {
    it('shows both mobile and desktop layouts in responsive variant', () => {
      render(<LeadList leads={mockLeads} variant="responsive" />);
      
      // Should have both mobile and desktop containers
      const mobileContainer = document.querySelector('.block.md\\:hidden');
      const desktopContainer = document.querySelector('.hidden.md\\:block');
      
      expect(mobileContainer).toBeInTheDocument();
      expect(desktopContainer).toBeInTheDocument();
    });

    it('shows only table layout in table variant', () => {
      render(<LeadList leads={mockLeads} variant="table" />);
      
      // Should have table
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Should not have mobile/desktop specific containers
      expect(document.querySelector('.block.md\\:hidden')).not.toBeInTheDocument();
      expect(document.querySelector('.hidden.md\\:block')).not.toBeInTheDocument();
    });

    it('shows only card layout in cards variant', () => {
      render(<LeadList leads={mockLeads} variant="cards" />);
      
      // Should have grid layout
      const gridContainer = document.querySelector('.grid.gap-4');
      expect(gridContainer).toBeInTheDocument();
      
      // Should not have table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('applies touch-friendly classes in mobile card layout', () => {
      render(<LeadList leads={mockLeads} variant="responsive" />);
      
      // Mobile cards should have touch-manipulation class
      const mobileCards = document.querySelectorAll('.block.md\\:hidden .touch-manipulation');
      expect(mobileCards.length).toBeGreaterThan(0);
    });

    it('hides preview column on small screens in table variant', () => {
      render(<LeadList leads={mockLeads} variant="table" />);
      
      // Preview header should have hidden class for small screens
      const previewHeader = screen.getByText('Preview');
      expect(previewHeader).toHaveClass('hidden', 'sm:table-cell');
    });
  });

  describe('LeadCard Responsive Behavior', () => {
    const mockLead = mockLeads[0];

    it('shows mobile-friendly text in card variant', () => {
      render(<LeadCard lead={mockLead} onClick={jest.fn()} variant="card" />);
      
      expect(screen.getByText('Tap to view details')).toBeInTheDocument();
    });

    it('shows desktop text in row variant', () => {
      const { container } = render(
        <table>
          <tbody>
            <LeadCard lead={mockLead} onClick={jest.fn()} variant="row" />
          </tbody>
        </table>
      );
      
      // Row variant doesn't show the tap text
      expect(screen.queryByText('Tap to view details')).not.toBeInTheDocument();
    });

    it('applies proper padding for touch targets in card variant', () => {
      const { container } = render(<LeadCard lead={mockLead} variant="card" />);
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
    });

    it('applies proper padding for table rows', () => {
      const { container } = render(
        <table>
          <tbody>
            <LeadCard lead={mockLead} variant="row" />
          </tbody>
        </table>
      );
      
      const cells = container.querySelectorAll('td');
      cells.forEach(cell => {
        expect(cell).toHaveClass('py-3'); // Increased padding for better touch targets
      });
    });

    it('hides preview cell on small screens in row variant', () => {
      const { container } = render(
        <table>
          <tbody>
            <LeadCard lead={mockLead} variant="row" />
          </tbody>
        </table>
      );
      
      const previewCell = container.querySelector('td:last-child');
      expect(previewCell).toHaveClass('hidden', 'sm:table-cell');
    });

    it('shows navigation arrow in card variant', () => {
      render(<LeadCard lead={mockLead} onClick={jest.fn()} variant="card" />);
      
      const arrow = document.querySelector('svg');
      expect(arrow).toBeInTheDocument();
    });

    it('applies touch-manipulation class when provided', () => {
      const { container } = render(
        <LeadCard lead={mockLead} variant="card" className="touch-manipulation" />
      );
      
      expect(container.firstChild).toHaveClass('touch-manipulation');
    });
  });

  describe('Breakpoint Behavior', () => {
    it('uses correct Tailwind breakpoints', () => {
      render(<LeadList leads={mockLeads} variant="responsive" />);
      
      // Check that we're using md: breakpoint (768px)
      const mobileContainer = document.querySelector('.block.md\\:hidden');
      const desktopContainer = document.querySelector('.hidden.md\\:block');
      
      expect(mobileContainer).toBeInTheDocument();
      expect(desktopContainer).toBeInTheDocument();
    });

    it('applies responsive grid classes in card layout', () => {
      render(<LeadList leads={mockLeads} variant="cards" />);
      
      const gridContainer = document.querySelector('.grid.gap-4.sm\\:grid-cols-2.lg\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Loading States Responsive Behavior', () => {
    it('shows appropriate loading state for responsive variant', () => {
      render(<LeadList leads={[]} loading={true} variant="responsive" />);
      
      // Should show list loading state (not table specific)
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('shows table loading state for table variant', () => {
      render(<LeadList leads={[]} loading={true} variant="table" />);
      
      const loadingElement = document.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('provides adequate touch targets in card layout', () => {
      const { container } = render(<LeadCard lead={mockLeads[0]} onClick={jest.fn()} />);
      
      const card = container.firstChild as HTMLElement;
      // Cards should have adequate padding for touch targets (minimum 44px recommended)
      expect(card).toHaveClass('p-4'); // 16px padding = 32px minimum touch area + content
    });

    it('shows touch-friendly feedback text', () => {
      render(<LeadCard lead={mockLeads[0]} onClick={jest.fn()} />);
      
      expect(screen.getByText('Tap to view details')).toBeInTheDocument();
    });
  });
});