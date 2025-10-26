import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders default variant with default message', () => {
    render(<ErrorState />);
    
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    const customMessage = 'Custom error message';
    render(<ErrorState message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const mockRetry = jest.fn();
    render(<ErrorState onRetry={mockRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('renders toast variant correctly', () => {
    render(<ErrorState variant="toast" message="Toast error" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Toast error')).toBeInTheDocument();
    
    // Should have fixed positioning classes for toast
    const toastElement = screen.getByText('Error').closest('div');
    expect(toastElement).toHaveClass('fixed', 'top-4', 'right-4', 'bg-red-600');
  });

  it('renders inline variant correctly', () => {
    render(<ErrorState variant="inline" message="Inline error" />);
    
    expect(screen.getByText('Inline error')).toBeInTheDocument();
    
    // Should have inline styling
    const inlineElement = screen.getByText('Inline error').closest('div');
    expect(inlineElement).toHaveClass('flex', 'items-center', 'gap-2', 'text-red-400');
  });

  it('renders retry button in toast variant', () => {
    const mockRetry = jest.fn();
    render(<ErrorState variant="toast" onRetry={mockRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders retry button in inline variant', () => {
    const mockRetry = jest.fn();
    render(<ErrorState variant="inline" onRetry={mockRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorState className="custom-error" />);
    
    expect(container.firstChild).toHaveClass('custom-error');
  });

  it('includes error icon in all variants', () => {
    const variants: Array<'default' | 'inline' | 'toast'> = ['default', 'inline', 'toast'];
    
    variants.forEach(variant => {
      const { container } = render(<ErrorState variant={variant} />);
      const svgIcon = container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
    });
  });
});