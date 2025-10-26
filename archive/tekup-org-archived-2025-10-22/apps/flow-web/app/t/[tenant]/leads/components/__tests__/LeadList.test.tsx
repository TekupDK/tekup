import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LeadList } from '../LeadList';
import { Lead } from '../../../../../../lib/api';

const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new',
    created_at: '2024-01-03T12:00:00Z'
  },
  {
    id: 'lead-2',
    tenant_id: 'test-tenant',
    source: 'email',
    status: 'contacted',
    created_at: '2024-01-02T12:00:00Z'
  },
  {
    id: 'lead-3',
    tenant_id: 'test-tenant',
    source: 'form',
    status: 'new',
    created_at: '2024-01-01T12:00:00Z'
  }
];

describe('LeadList', () => {
  it('renders loading state', () => {
    render(<LeadList leads={[]} loading={true} />);
    
    // Should show loading skeleton
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRetry = jest.fn();
    render(
      <LeadList 
        leads={[]} 
        error="Failed to load leads" 
        onRetry={mockRetry}
      />
    );
    
    expect(screen.getByText('Failed to load leads')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no leads', () => {
    render(<LeadList leads={[]} />);
    
    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(screen.getByText(/When leads are submitted through your forms/)).toBeInTheDocument();
  });

  it('renders leads in card variant by default', () => {
    render(<LeadList leads={mockLeads} />);
    
    expect(screen.getByText('Leads (3)')).toBeInTheDocument();
    expect(screen.getByText('2 new')).toBeInTheDocument();
    expect(screen.getByText('1 contacted')).toBeInTheDocument();
    
    // Should render as cards (grid layout)
    const grid = document.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders leads in table variant', () => {
    render(<LeadList leads={mockLeads} variant="table" />);
    
    // Should render as table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('sorts leads by newest first by default', () => {
    render(<LeadList leads={mockLeads} />);
    
    const leadCards = screen.getAllByText(/lead-/);
    // Should be sorted newest first: lead-1 (Jan 3), lead-2 (Jan 2), lead-3 (Jan 1)
    expect(leadCards[0]).toHaveTextContent('lead-1');
    expect(leadCards[1]).toHaveTextContent('lead-2');
    expect(leadCards[2]).toHaveTextContent('lead-3');
  });

  it('sorts leads by oldest first when selected', () => {
    render(<LeadList leads={mockLeads} />);
    
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });
    
    const leadCards = screen.getAllByText(/lead-/);
    // Should be sorted oldest first: lead-3 (Jan 1), lead-2 (Jan 2), lead-1 (Jan 3)
    expect(leadCards[0]).toHaveTextContent('lead-3');
    expect(leadCards[1]).toHaveTextContent('lead-2');
    expect(leadCards[2]).toHaveTextContent('lead-1');
  });

  it('sorts leads by source when selected', () => {
    render(<LeadList leads={mockLeads} />);
    
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'source' } });
    
    const leadCards = screen.getAllByText(/lead-/);
    // Should be sorted by source: email first, then form
    // lead-2 has email source, lead-1 and lead-3 have form source
    expect(leadCards[0]).toHaveTextContent('lead-2');
  });

  it('sorts leads by status when selected', () => {
    render(<LeadList leads={mockLeads} />);
    
    const sortSelect = screen.getByLabelText('Sort by:');
    fireEvent.change(sortSelect, { target: { value: 'status' } });
    
    const leadCards = screen.getAllByText(/lead-/);
    // Should show 'new' status leads first
    // lead-1 and lead-3 are 'new', lead-2 is 'contacted'
    expect(leadCards[0]).toHaveTextContent('lead-1');
    expect(leadCards[1]).toHaveTextContent('lead-3');
    expect(leadCards[2]).toHaveTextContent('lead-2');
  });

  it('calls onLeadClick when lead is clicked', () => {
    const mockOnLeadClick = jest.fn();
    render(<LeadList leads={mockLeads} onLeadClick={mockOnLeadClick} />);
    
    const firstLead = screen.getByText('lead-1');
    fireEvent.click(firstLead);
    
    expect(mockOnLeadClick).toHaveBeenCalledWith(mockLeads[0]);
  });

  it('highlights selected lead', () => {
    render(<LeadList leads={mockLeads} selectedLeadId="lead-2" />);
    
    // The selected lead should have selected styling
    // This is tested through the LeadCard component's isSelected prop
    const leadCards = document.querySelectorAll('[class*="bg-neutral-900/70"]');
    expect(leadCards.length).toBeGreaterThan(0);
  });

  it('displays correct lead counts', () => {
    render(<LeadList leads={mockLeads} />);
    
    expect(screen.getByText('Leads (3)')).toBeInTheDocument();
    expect(screen.getByText('2 new')).toBeInTheDocument();
    expect(screen.getByText('1 contacted')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LeadList leads={mockLeads} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles leads with missing dates gracefully', () => {
    const leadsWithMissingDates: Lead[] = [
      {
        id: 'lead-no-date',
        tenant_id: 'test-tenant',
        source: 'form',
        status: 'new'
      }
    ];
    
    render(<LeadList leads={leadsWithMissingDates} />);
    
    expect(screen.getByText('Leads (1)')).toBeInTheDocument();
    expect(screen.getByText('1 new')).toBeInTheDocument();
  });

  it('handles empty leads array', () => {
    render(<LeadList leads={[]} />);
    
    expect(screen.getByText('No leads yet')).toBeInTheDocument();
  });

  it('shows loading state for table variant', () => {
    render(<LeadList leads={[]} loading={true} variant="table" />);
    
    // Should show table loading skeleton
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders sort options correctly', () => {
    render(<LeadList leads={mockLeads} />);
    
    const sortSelect = screen.getByLabelText('Sort by:');
    expect(sortSelect).toBeInTheDocument();
    
    // Check all sort options are present
    expect(screen.getByText('Newest first')).toBeInTheDocument();
    expect(screen.getByText('Oldest first')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('maintains sort selection', () => {
    render(<LeadList leads={mockLeads} />);
    
    const sortSelect = screen.getByLabelText('Sort by:') as HTMLSelectElement;
    
    fireEvent.change(sortSelect, { target: { value: 'source' } });
    expect(sortSelect.value).toBe('source');
    
    fireEvent.change(sortSelect, { target: { value: 'status' } });
    expect(sortSelect.value).toBe('status');
  });
});