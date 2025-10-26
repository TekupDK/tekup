import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders list variant by default', () => {
    const { container } = render(<LoadingState />);
    
    // Should have animate-pulse class
    expect(container.firstChild).toHaveClass('animate-pulse');
    
    // Should render multiple skeleton items for list
    const skeletonItems = container.querySelectorAll('.border.border-neutral-800.rounded-md');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('renders table variant correctly', () => {
    const { container } = render(<LoadingState variant="table" />);
    
    // Should have table structure with header
    const tableHeader = container.querySelector('.bg-neutral-800');
    expect(tableHeader).toBeInTheDocument();
    
    // Should have multiple table rows
    const tableRows = container.querySelectorAll('.border-t.border-neutral-800');
    expect(tableRows.length).toBe(5); // Should render 5 skeleton rows
  });

  it('renders detail variant correctly', () => {
    const { container } = render(<LoadingState variant="detail" />);
    
    // Should have header section
    const headerSection = container.querySelector('.space-y-2');
    expect(headerSection).toBeInTheDocument();
    
    // Should have content sections
    const contentSections = container.querySelectorAll('.space-y-4');
    expect(contentSections.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingState className="custom-loading" />);
    
    expect(container.firstChild).toHaveClass('custom-loading');
  });

  it('includes animate-pulse class for all variants', () => {
    const variants: Array<'table' | 'detail' | 'list'> = ['table', 'detail', 'list'];
    
    variants.forEach(variant => {
      const { container } = render(<LoadingState variant={variant} />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });
  });
});