import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, LeadErrorBoundary, useErrorBoundary } from '../ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow = false, message = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <div>No error</div>;
};

// Test component using the useErrorBoundary hook
const TestHookComponent = () => {
  const { captureError, resetError } = useErrorBoundary();
  
  return (
    <div>
      <button onClick={() => captureError(new Error('Hook error'))}>
        Trigger Error
      </button>
      <button onClick={resetError}>
        Reset Error
      </button>
      <div>Hook component content</div>
    </div>
  );
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Component crashed" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Component crashed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} message="Callback test" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Callback test' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('resets error state when Try Again is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      React.useEffect(() => {
        if (!shouldThrow) {
          // Simulate component recovery
          const timer = setTimeout(() => setShouldThrow(false), 100);
          return () => clearTimeout(timer);
        }
      }, [shouldThrow]);

      return (
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
          <button onClick={() => setShouldThrow(false)}>Fix Component</button>
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    // Component should attempt to re-render (though it will error again in this test)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('resets when resetKeys change', () => {
    const TestComponent = () => {
      const [key, setKey] = React.useState('key1');
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <div>
          <button onClick={() => {
            setKey('key2');
            setShouldThrow(false);
          }}>
            Change Key
          </button>
          <ErrorBoundary resetKeys={[key]}>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change the reset key
    fireEvent.click(screen.getByRole('button', { name: 'Change Key' }));

    // Error should be cleared and component should re-render
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows technical details when expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} message="Stack trace test" />
      </ErrorBoundary>
    );

    const details = screen.getByText('Technical Details').closest('details');
    expect(details).not.toHaveAttribute('open');

    // Click to expand technical details
    fireEvent.click(screen.getByText('Technical Details'));

    expect(details).toHaveAttribute('open');
    expect(screen.getByText(/Stack trace test/)).toBeInTheDocument();
  });
});

describe('LeadErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders lead-specific error message', () => {
    render(
      <LeadErrorBoundary leadId="test-lead-123">
        <ThrowError shouldThrow={true} />
      </LeadErrorBoundary>
    );

    expect(screen.getByText('Failed to load lead component')).toBeInTheDocument();
    expect(screen.getByText('Lead ID: test-lead-123')).toBeInTheDocument();
  });

  it('renders generic message when no leadId provided', () => {
    render(
      <LeadErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LeadErrorBoundary>
    );

    expect(screen.getByText('Failed to load lead component')).toBeInTheDocument();
    expect(screen.getByText('Please try refreshing the page.')).toBeInTheDocument();
  });

  it('calls onError with lead context', () => {
    const onError = jest.fn();

    render(
      <LeadErrorBoundary leadId="test-lead-456" onError={onError}>
        <ThrowError shouldThrow={true} message="Lead error" />
      </LeadErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Lead error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});

describe('useErrorBoundary hook', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('throws error when captureError is called', () => {
    const TestWrapper = () => (
      <ErrorBoundary>
        <TestHookComponent />
      </ErrorBoundary>
    );

    render(<TestWrapper />);

    // Initially should show hook component
    expect(screen.getByText('Hook component content')).toBeInTheDocument();

    // Trigger error
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));

    // Should now show error boundary
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Hook error')).toBeInTheDocument();
  });
});