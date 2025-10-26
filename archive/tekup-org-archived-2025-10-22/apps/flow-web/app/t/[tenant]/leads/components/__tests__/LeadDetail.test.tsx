import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeadDetail } from '../LeadDetail';
import { Lead } from '../../../../../../lib/api';

const mockLeadWithPayload: Lead = {
  id: 'lead-123',
  tenant_id: 'test-tenant',
  source: 'form',
  status: 'new',
  created_at: '2024-01-01T12:00:00Z',
  updated_at: '2024-01-02T15:30:00Z',
  payload: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+45 12 34 56 78',
    company: 'Test Company',
    subject: 'Inquiry about services',
    message: 'Hello, I would like to know more about your services.\n\nPlease contact me at your earliest convenience.',
    customField: 'Custom value'
  }
};

const mockLeadMinimal: Lead = {
  id: 'lead-456',
  tenant_id: 'test-tenant',
  source: 'email',
  status: 'contacted',
  created_at: '2024-01-01T12:00:00Z'
};

const mockLeadNoPayload: Lead = {
  id: 'lead-789',
  tenant_id: 'test-tenant',
  source: 'api',
  status: 'new',
  created_at: '2024-01-01T12:00:00Z',
  payload: null
};

describe('LeadDetail', () => {
  it('renders lead header information', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Lead Details')).toBeInTheDocument();
    expect(screen.getByText('ID: lead-123')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('displays metadata correctly', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('form')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
  });

  it('renders contact information with clickable links', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check email link
    const emailLink = screen.getByText('john@example.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:john@example.com');
    
    // Check phone link
    const phoneLink = screen.getByText('+45 12 34 56 78');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+4512345678');
  });

  it('displays company and subject information', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Inquiry about services')).toBeInTheDocument();
  });

  it('renders message with proper formatting', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Message')).toBeInTheDocument();
    const messageElement = screen.getByText(/Hello, I would like to know more/);
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass('whitespace-pre-wrap');
  });

  it('displays custom payload fields', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    expect(screen.getByText('Custom field')).toBeInTheDocument();
    expect(screen.getByText('Custom value')).toBeInTheDocument();
  });

  it('handles lead without payload', () => {
    render(<LeadDetail lead={mockLeadNoPayload} />);
    
    expect(screen.getByText('No additional information available for this lead.')).toBeInTheDocument();
  });

  it('handles lead with minimal data', () => {
    render(<LeadDetail lead={mockLeadMinimal} />);
    
    expect(screen.getByText('ID: lead-456')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    // Should display formatted Danish dates
    expect(screen.getByText(/1\. januar 2024/)).toBeInTheDocument();
  });

  it('handles invalid dates gracefully', () => {
    const leadWithInvalidDate = {
      ...mockLeadWithPayload,
      created_at: 'invalid-date'
    };
    
    render(<LeadDetail lead={leadWithInvalidDate} />);
    
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('handles missing dates', () => {
    const leadWithoutDate = {
      ...mockLeadWithPayload,
      created_at: undefined,
      createdAt: undefined
    };
    
    render(<LeadDetail lead={leadWithoutDate} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('does not show last updated when not available', () => {
    render(<LeadDetail lead={mockLeadMinimal} />);
    
    expect(screen.queryByText('Last Updated')).not.toBeInTheDocument();
  });

  it('handles createdAt field as fallback', () => {
    const leadWithCreatedAt = {
      ...mockLeadWithPayload,
      created_at: undefined,
      createdAt: '2024-02-01T10:00:00Z'
    };
    
    render(<LeadDetail lead={leadWithCreatedAt} />);
    
    expect(screen.getByText(/1\. februar 2024/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<LeadDetail lead={mockLeadWithPayload} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('capitalizes source field', () => {
    const leadWithLowercaseSource = {
      ...mockLeadWithPayload,
      source: 'email'
    };
    
    render(<LeadDetail lead={leadWithLowercaseSource} />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('handles complex payload values', () => {
    const leadWithComplexPayload = {
      ...mockLeadWithPayload,
      payload: {
        ...mockLeadWithPayload.payload,
        complexField: { nested: 'value', array: [1, 2, 3] }
      }
    };
    
    render(<LeadDetail lead={leadWithComplexPayload} />);
    
    expect(screen.getByText('Complex field')).toBeInTheDocument();
    expect(screen.getByText(/"nested":"value"/)).toBeInTheDocument();
  });

  it('skips empty payload fields', () => {
    const leadWithEmptyFields = {
      ...mockLeadWithPayload,
      payload: {
        name: 'John Doe',
        email: '',
        phone: null,
        message: undefined
      }
    };
    
    render(<LeadDetail lead={leadWithEmptyFields} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    expect(screen.queryByText('Message')).not.toBeInTheDocument();
  });

  it('formats field names correctly', () => {
    const leadWithUnderscoreFields = {
      ...mockLeadWithPayload,
      payload: {
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '12345678'
      }
    };
    
    render(<LeadDetail lead={leadWithUnderscoreFields} />);
    
    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getByText('Phone number')).toBeInTheDocument();
  });

  it('provides proper accessibility attributes', () => {
    render(<LeadDetail lead={mockLeadWithPayload} />);
    
    const emailLink = screen.getByText('john@example.com').closest('a');
    expect(emailLink).toHaveAttribute('title', 'Send email to john@example.com');
    
    const phoneLink = screen.getByText('+45 12 34 56 78').closest('a');
    expect(phoneLink).toHaveAttribute('title', 'Call +45 12 34 56 78');
  });
});