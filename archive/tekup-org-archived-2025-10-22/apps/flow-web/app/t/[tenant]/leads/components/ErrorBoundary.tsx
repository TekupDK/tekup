"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error for debugging
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <svg 
                  className="w-12 h-12 text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                Something went wrong
              </h3>
              
              <p className="text-sm text-red-200/80 mb-4">
                {error?.message || 'An unexpected error occurred while loading this component.'}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg transition-colors font-medium"
                >
                  Try Again
                </button>
                
                <details className="text-left">
                  <summary className="text-xs text-red-300/60 cursor-pointer hover:text-red-300/80">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-red-950/50 rounded border border-red-600/20">
                    <pre className="text-xs text-red-200/60 whitespace-pre-wrap break-words">
                      {error?.stack || 'No stack trace available'}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}

// Specialized error boundary for lead components
interface LeadErrorBoundaryProps {
  children: ReactNode;
  leadId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function LeadErrorBoundary({ children, leadId, onError }: LeadErrorBoundaryProps) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-web-app-t--tenant--l');

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log lead-specific error context
    logger.error(`Error in lead component (leadId: ${leadId}):`, {
      error,
      errorInfo,
      leadId,
      timestamp: new Date().toISOString(),
    });

    onError?.(error, errorInfo);
  };

  const fallback = (
    <div className="p-4 bg-red-900/10 border border-red-600/20 rounded-lg">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-red-300">
            Failed to load lead component
          </h4>
          <p className="text-xs text-red-200/70 mt-1">
            {leadId ? `Lead ID: ${leadId}` : 'Please try refreshing the page.'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={handleError}
      resetKeys={[leadId]}
    >
      {children}
    </ErrorBoundary>
  );
}