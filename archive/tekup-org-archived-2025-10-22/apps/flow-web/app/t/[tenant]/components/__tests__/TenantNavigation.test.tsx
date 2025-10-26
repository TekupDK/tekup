import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import TenantNavigation from '../TenantNavigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('TenantNavigation', () => {
  const tenant = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation links correctly', () => {
    mockUsePathname.mockReturnValue('/t/test-tenant/leads');
    
    render(<TenantNavigation tenant={tenant} />);
    
    expect(screen.getByRole('link', { name: 'Leads' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('applies active styling to leads link when on leads page', () => {
    mockUsePathname.mockReturnValue('/t/test-tenant/leads');
    
    render(<TenantNavigation tenant={tenant} />);
    
    const leadsLink = screen.getByRole('link', { name: 'Leads' });
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    
    expect(leadsLink).toHaveClass('text-brand', 'font-medium');
    expect(settingsLink).toHaveClass('text-neutral-400', 'hover:text-neutral-200');
  });

  it('applies active styling to settings link when on settings page', () => {
    mockUsePathname.mockReturnValue('/t/test-tenant/settings');
    
    render(<TenantNavigation tenant={tenant} />);
    
    const leadsLink = screen.getByRole('link', { name: 'Leads' });
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    
    expect(settingsLink).toHaveClass('text-brand', 'font-medium');
    expect(leadsLink).toHaveClass('text-neutral-400', 'hover:text-neutral-200');
  });

  it('applies active styling to leads link when on lead detail page', () => {
    mockUsePathname.mockReturnValue('/t/test-tenant/leads/123');
    
    render(<TenantNavigation tenant={tenant} />);
    
    const leadsLink = screen.getByRole('link', { name: 'Leads' });
    
    expect(leadsLink).toHaveClass('text-brand', 'font-medium');
  });

  it('generates correct href attributes for tenant-specific URLs', () => {
    mockUsePathname.mockReturnValue('/t/test-tenant/leads');
    
    render(<TenantNavigation tenant={tenant} />);
    
    const leadsLink = screen.getByRole('link', { name: 'Leads' });
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    
    expect(leadsLink).toHaveAttribute('href', '/t/test-tenant/leads');
    expect(settingsLink).toHaveAttribute('href', '/t/test-tenant/settings');
  });

  it('handles different tenant names correctly', () => {
    const differentTenant = 'another-tenant';
    mockUsePathname.mockReturnValue('/t/another-tenant/settings');
    
    render(<TenantNavigation tenant={differentTenant} />);
    
    const leadsLink = screen.getByRole('link', { name: 'Leads' });
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    
    expect(leadsLink).toHaveAttribute('href', '/t/another-tenant/leads');
    expect(settingsLink).toHaveAttribute('href', '/t/another-tenant/settings');
    expect(settingsLink).toHaveClass('text-brand', 'font-medium');
  });
});