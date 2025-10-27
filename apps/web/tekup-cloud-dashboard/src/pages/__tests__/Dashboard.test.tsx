import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';
import { withProviders } from '../../test-utils';

describe('Dashboard', () => {
  it('renders KPI cards and sections', async () => {
    render(withProviders(<Dashboard />));
    // Headline
    expect(await screen.findByText(/Dashboard Overview/i)).toBeInTheDocument();
    // KPIs from fallback data (allow multiple matches in cards)
    expect((await screen.findAllByText(/Total Revenue/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Active Leads/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/System Health/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Agent Status/i)).length).toBeGreaterThan(0);
    // Sections
    expect((await screen.findAllByText(/Recent Activity/i)).length).toBeGreaterThan(0);
  });
});
