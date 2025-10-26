import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadCard } from '../LeadCard';
import { Lead } from '../../../../../../lib/api';

const mockLead: Lead = {
  id: 'lead-123',
  tenant_id: 'test-tenant',
  source: 'form',
  status: 'new',
  created_at: '2024-01-01T12:00:00Z',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'This is a test message that is longer than 100 characters to test the truncation functionality in the lead preview display.',
    subject: 'Test Subject'
  }
};

const mockContactedLead: Lead = {
  ...mockLead,
  id: 'lead-456',
  status: 'contacted'
};

const mockLeadNoPayload: Lead = {
  id: 'lead-789',
  tenant_id: 'test-tenant',
  source: 'email',
  status: 'new',
  created_at: '2024-01-02T15:30:00Z'
};

describe('LeadCard', () => {
  it('renders card variant by default', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.getByText('lead-123')).toBeInTheDocument();
    expect(screen.getByText('Source: form')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders row variant correctly', () => {
    const { container } = render(<LeadCard lead={mockLead} variant="row" />);
    
    const row = container.querySelector('tr');
    expect(row).toBeInTheDocument();
    
    expect(screen.getByText('lead-123')).toBeInTheDocument();
    expect(screen.getByText('form')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('displays lead information correctly', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.getByText('lead-123')).toBeInTheDocument();
    expect(screen.getByText('Source: form')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    
    // Check if payload information is displayed
    expect(screen.getByText(/Name: John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Email: john@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Phone: \+1234567890/)).toBeInTheDocument();
  });

  it('displays contacted status correctly', () => {
    render(<LeadCard lead={mockContactedLead} />);
    
    expect(screen.getByText('Contacted')).toBeInTheDocument();
  });

  it('handles lead with no payload', () => {
    render(<LeadCard lead={mockLeadNoPayload} />);
    
    expect(screen.getByText('No additional information')).toBeInTheDocument();
  });

  it('truncates long messages in preview', () => {
    render(<LeadCard lead={mockLead} />);
    
    const preview = screen.getByText(/Message: This is a test message/);
    expect(preview.textContent).toContain('...');
    expect(preview.textContent?.length).toBeLessThan(mockLead.payload.message.length + 50);
  });

  it('formats date correctly', () => {
    render(<LeadCard lead={mockLead} />);
    
    // Should display a formatted date
    const dateElement = screen.getByText(/1\/1\/2024/);
    expect(dateElement).toBeInTheDocument();
  });

  it('handles invalid date gracefully', () => {
    const leadWithInvalidDate = {
      ...mockLead,
      created_at: 'invalid-date'
    };
    
    render(<LeadCard lead={leadWithInvalidDate} />);
    
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('handles missing date', () => {
    const leadWithoutDate = {
      ...mockLead,
      created_at: undefined,
      createdAt: undefined
    };
    
    render(<LeadCard lead={leadWithoutDate} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<LeadCard lead={mockLead} onClick={mockOnClick} />);
    
    const card = screen.getByText('lead-123').closest('div');
    fireEvent.click(card!);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockLead);
  });

  it('shows click hint when onClick is provided', () => {
    render(<LeadCard lead={mockLead} onClick={jest.fn()} />);
    
    expect(screen.getByText('Click to view details →')).toBeInTheDocument();
  });

  it('does not show click hint when onClick is not provided', () => {
    render(<LeadCard lead={mockLead} />);
    
    expect(screen.queryByText('Click to view details →')).not.toBeInTheDocument();
  });

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(<LeadCard lead={mockLead} isSelected={true} />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-neutral-900/70', 'border-neutral-700');
  });

  it('applies custom className', () => {
    const { container } = render(<LeadCard lead={mockLead} className="custom-class" />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('applies hover classes when onClick is provided', () => {
    const { container } = render(<LeadCard lead={mockLead} onClick={jest.fn()} />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('cursor-pointer', 'hover:bg-neutral-900/60');
  });

  it('does not apply hover classes when onClick is not provided', () => {
    const { container } = render(<LeadCard lead={mockLead} />);
    
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('handles createdAt field as fallback for date', () => {
    const leadWithCreatedAt = {
      ...mockLead,
      created_at: undefined,
      createdAt: '2024-02-01T10:00:00Z'
    };
    
    render(<LeadCard lead={leadWithCreatedAt} />);
    
    expect(screen.getByText(/2\/1\/2024/)).toBeInTheDocument();
  });

  it('capitalizes source in card variant', () => {
    const leadWithLowercaseSource = {
      ...mockLead,
      source: 'email'
    };
    
    render(<LeadCard lead={leadWithLowercaseSource} />);
    
    expect(screen.getByText('Source: email')).toBeInTheDocument();
  });

  it('displays source without "Source:" prefix in row variant', () => {
    const leadWithLowercaseSource = {
      ...mockLead,
      source: 'email'
    };
    
    render(<LeadCard lead={leadWithLowercaseSource} variant="row" />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.queryByText('Source: email')).not.toBeInTheDocument();
  });
});