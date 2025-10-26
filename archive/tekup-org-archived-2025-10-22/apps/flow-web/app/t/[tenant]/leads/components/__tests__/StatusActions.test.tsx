import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StatusActions } from '../StatusActions';
import { Lead } from '../../../../../../lib/api';

const mockNewLead: Lead = {
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

const mockContactedLead: Lead = {
  id: 'lead-456',
  tenant_id: 'test-tenant',
  source: 'email',
  status: 'contacted',
  created_at: '2024-01-01T12:00:00Z',
  payload: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
};

const mockLeadNoContact: Lead = {
  id: 'lead-789',
  tenant_id: 'test-tenant',
  source: 'api',
  status: 'new',
  created_at: '2024-01-01T12:00:00Z'
};

describe('StatusActions', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays current status correctly', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Current Status')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('shows mark as contacted button for new leads', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    const button = screen.getByText('Mark as Contacted');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('calls onStatusChange when mark as contacted is clicked', async () => {
    mockOnStatusChange.mockResolvedValue(undefined);
    
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('lead-123', 'contacted');
  });

  it('shows updating state when updating is true', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} updating={true} />);
    
    expect(screen.getByText('Updating Status...')).toBeInTheDocument();
    
    const button = screen.getByText('Updating Status...');
    expect(button).toBeDisabled();
  });

  it('shows completed state for contacted leads', () => {
    render(<StatusActions lead={mockContactedLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('This lead has already been contacted.')).toBeInTheDocument();
  });

  it('does not show mark as contacted button for contacted leads', () => {
    render(<StatusActions lead={mockContactedLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.queryByText('Mark as Contacted')).not.toBeInTheDocument();
  });

  it('displays status guide information', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Status Guide')).toBeInTheDocument();
    expect(screen.getByText(/New:/)).toBeInTheDocument();
    expect(screen.getByText(/Contacted:/)).toBeInTheDocument();
  });

  it('shows email quick action when email is available', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    const emailLink = screen.getByText('Email');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:john@example.com');
  });

  it('shows phone quick action when phone is available', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    const phoneLink = screen.getByText('Call');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+4512345678');
  });

  it('does not show quick actions when contact info is not available', () => {
    render(<StatusActions lead={mockLeadNoContact} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Call')).not.toBeInTheDocument();
  });

  it('shows only available quick actions', () => {
    const leadWithEmailOnly = {
      ...mockNewLead,
      payload: { email: 'test@example.com' }
    };
    
    render(<StatusActions lead={leadWithEmailOnly} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Call')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('disables button during update', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} updating={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:bg-brand/50', 'disabled:cursor-not-allowed');
  });

  it('shows loading spinner during update', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} updating={true} />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('handles phone number formatting for tel link', () => {
    const leadWithFormattedPhone = {
      ...mockNewLead,
      payload: {
        phone: '+45 12 34 56 78'
      }
    };
    
    render(<StatusActions lead={leadWithFormattedPhone} onStatusChange={mockOnStatusChange} />);
    
    const phoneLink = screen.getByText('Call');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+4512345678');
  });

  it('shows available actions section', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Available Actions')).toBeInTheDocument();
  });

  it('shows quick actions section', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('prevents action when lead is already contacted', async () => {
    render(<StatusActions lead={mockContactedLead} onStatusChange={mockOnStatusChange} />);
    
    // Should not have the mark as contacted button
    expect(screen.queryByText('Mark as Contacted')).not.toBeInTheDocument();
    
    // Should show completion message
    expect(screen.getByText('This lead has already been contacted.')).toBeInTheDocument();
  });

  it('prevents multiple clicks during update', async () => {
    let resolvePromise: () => void;
    const slowPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    
    mockOnStatusChange.mockReturnValue(slowPromise);
    
    const { rerender } = render(
      <StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} updating={false} />
    );
    
    const button = screen.getByText('Mark as Contacted');
    fireEvent.click(button);
    
    // Simulate updating state
    rerender(
      <StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} updating={true} />
    );
    
    const updatingButton = screen.getByText('Updating Status...');
    expect(updatingButton).toBeDisabled();
    
    // Try to click again - should not call the function again
    fireEvent.click(updatingButton);
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
    
    // Resolve the promise
    resolvePromise!();
  });

  it('shows proper icons for different states', () => {
    render(<StatusActions lead={mockNewLead} onStatusChange={mockOnStatusChange} />);
    
    // Should have various SVG icons
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('handles leads without payload gracefully', () => {
    const leadWithoutPayload = {
      ...mockNewLead,
      payload: null
    };
    
    render(<StatusActions lead={leadWithoutPayload} onStatusChange={mockOnStatusChange} />);
    
    expect(screen.getByText('Mark as Contacted')).toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Call')).not.toBeInTheDocument();
  });
});