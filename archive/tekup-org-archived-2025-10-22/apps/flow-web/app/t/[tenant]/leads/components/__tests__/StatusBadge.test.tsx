import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders new status correctly', () => {
    render(<StatusBadge status="new" />);
    
    const badge = screen.getByText('New');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-brand/20', 'text-brand', 'border-brand/30');
  });

  it('renders contacted status correctly', () => {
    render(<StatusBadge status="contacted" />);
    
    const badge = screen.getByText('Contacted');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-600/20', 'text-green-300', 'border-green-600/30');
  });

  it('applies small size correctly', () => {
    render(<StatusBadge status="new" size="sm" />);
    
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('px-1.5', 'py-0.5', 'text-xs');
  });

  it('applies medium size correctly (default)', () => {
    render(<StatusBadge status="new" size="md" />);
    
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
  });

  it('uses medium size as default when size not specified', () => {
    render(<StatusBadge status="new" />);
    
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
  });

  it('applies custom className', () => {
    render(<StatusBadge status="new" className="custom-class" />);
    
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('custom-class');
  });

  it('includes all base classes', () => {
    render(<StatusBadge status="new" />);
    
    const badge = screen.getByText('New');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded', 'font-medium', 'transition-colors');
  });
});