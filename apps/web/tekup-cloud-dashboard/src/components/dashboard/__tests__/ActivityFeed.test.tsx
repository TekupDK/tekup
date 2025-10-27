import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '../ActivityFeed';
import type { Activity } from '../../../types';

describe('ActivityFeed', () => {
  it('renders activity items with title and time', () => {
    const activities: Activity[] = [
      {
        id: '1',
        tenant_id: '1',
        type: 'lead_created',
        title: 'New Lead',
        description: 'A new lead was created',
        created_at: new Date().toISOString(),
        metadata: {},
      },
    ];
    render(<ActivityFeed activities={activities} />);
    expect(screen.getByText('New Lead')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});

