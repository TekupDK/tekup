import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventTimeline, LeadEvent } from '../EventTimeline';

const mockEvents: LeadEvent[] = [
  {
    id: 'event-1',
    fromStatus: 'new',
    toStatus: 'contacted',
    actor: 'john@example.com',
    createdAt: '2024-01-02T14:30:00Z'
  },
  {
    id: 'event-2',
    from_status: 'NEW',
    to_status: 'PROCESSING',
    actor: 'system',
    created_at: '2024-01-01T10:00:00Z'
  }
];

const mockRecentEvent: LeadEvent = {
  id: 'event-recent',
  fromStatus: 'new',
  toStatus: 'contacted',
  actor: 'user',
  createdAt: new Date(Date.now() - 30000).toISOString() // 30 seconds ago
};

describe('EventTimeline', () => {
  beforeEach(() => {
    // Mock Date.now for consistent relative time testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T15:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders timeline header with event count', () => {
    render(<EventTimeline events={mockEvents} />);
    
    expect(screen.getByText('Event Timeline (2)')).toBeInTheDocument();
  });

  it('displays events in chronological order (newest first)', () => {
    render(<EventTimeline events={mockEvents} />);
    
    const statusChanges = screen.getAllByText('Status Changed');
    expect(statusChanges).toHaveLength(2);
    
    // First event should be the newer one (event-1)
    const firstEvent = statusChanges[0].closest('.bg-neutral-900\\/60');
    expect(firstEvent).toHaveTextContent('by john@example.com');
  });

  it('renders loading state', () => {
    render(<EventTimeline events={[]} loading={true} />);
    
    expect(screen.getByText('Event Timeline')).toBeInTheDocument();
    
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no events', () => {
    render(<EventTimeline events={[]} />);
    
    expect(screen.getByText('No Events Yet')).toBeInTheDocument();
    expect(screen.getByText('Status changes and other events will appear here')).toBeInTheDocument();
  });

  it('displays status change information correctly', () => {
    render(<EventTimeline events={mockEvents} />);
    
    // Check status badges
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });

  it('shows actor information', () => {
    render(<EventTimeline events={mockEvents} />);
    
    expect(screen.getByText('by john@example.com')).toBeInTheDocument();
    expect(screen.getByText('by system')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<EventTimeline events={mockEvents} />);
    
    // Should show Danish formatted dates
    expect(screen.getByText(/2\. jan\. 2024/)).toBeInTheDocument();
    expect(screen.getByText(/1\. jan\. 2024/)).toBeInTheDocument();
  });

  it('shows relative time for recent events', () => {
    render(<EventTimeline events={[mockRecentEvent]} />);
    
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('handles different time formats', () => {
    const eventsWithDifferentFormats: LeadEvent[] = [
      {
        id: 'event-1',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: '2024-01-02T14:30:00Z' // ISO format
      },
      {
        id: 'event-2',
        fromStatus: 'new',
        toStatus: 'contacted',
        created_at: '2024-01-01T10:00:00Z' // Alternative field name
      }
    ];
    
    render(<EventTimeline events={eventsWithDifferentFormats} />);
    
    expect(screen.getAllByText('Status Changed')).toHaveLength(2);
  });

  it('handles missing or invalid dates', () => {
    const eventsWithBadDates: LeadEvent[] = [
      {
        id: 'event-1',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: 'invalid-date'
      },
      {
        id: 'event-2',
        fromStatus: 'new',
        toStatus: 'contacted'
        // No date field
      }
    ];
    
    render(<EventTimeline events={eventsWithBadDates} />);
    
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
    expect(screen.getByText('Unknown time')).toBeInTheDocument();
  });

  it('displays timeline end marker', () => {
    render(<EventTimeline events={mockEvents} />);
    
    expect(screen.getByText('Lead created')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EventTimeline events={mockEvents} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles events without actor', () => {
    const eventWithoutActor: LeadEvent[] = [
      {
        id: 'event-1',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: '2024-01-02T14:30:00Z'
      }
    ];
    
    render(<EventTimeline events={eventWithoutActor} />);
    
    expect(screen.getByText('Status Changed')).toBeInTheDocument();
    expect(screen.queryByText(/by /)).not.toBeInTheDocument();
  });

  it('capitalizes status names correctly', () => {
    const eventWithLowercaseStatus: LeadEvent[] = [
      {
        id: 'event-1',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: '2024-01-02T14:30:00Z'
      }
    ];
    
    render(<EventTimeline events={eventWithLowercaseStatus} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
  });

  it('shows different icons for different status changes', () => {
    render(<EventTimeline events={mockEvents} />);
    
    // Should render SVG icons for events
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays timeline connector lines', () => {
    render(<EventTimeline events={mockEvents} />);
    
    // Should have timeline connector lines (except for last event)
    const connectors = document.querySelectorAll('.bg-neutral-800');
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('handles alternative field names for status', () => {
    const eventWithAlternativeFields: LeadEvent[] = [
      {
        id: 'event-1',
        from_status: 'NEW',
        to_status: 'CONTACTED',
        created_at: '2024-01-02T14:30:00Z'
      }
    ];
    
    render(<EventTimeline events={eventWithAlternativeFields} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
  });

  it('calculates relative time correctly', () => {
    const now = new Date('2024-01-02T15:00:00Z');
    jest.setSystemTime(now);
    
    const eventsWithDifferentTimes: LeadEvent[] = [
      {
        id: 'event-1',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      },
      {
        id: 'event-2',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: 'event-3',
        fromStatus: 'new',
        toStatus: 'contacted',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      }
    ];
    
    render(<EventTimeline events={eventsWithDifferentTimes} />);
    
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
    expect(screen.getByText('2h ago')).toBeInTheDocument();
    expect(screen.getByText('3d ago')).toBeInTheDocument();
  });
});