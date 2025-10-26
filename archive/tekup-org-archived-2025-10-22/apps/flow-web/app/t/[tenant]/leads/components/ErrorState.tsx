import React from 'react';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'toast';
}

export function ErrorState({ 
  message = 'Something went wrong. Please try again.', 
  onRetry, 
  className = '',
  variant = 'default'
}: ErrorStateProps) {
  
  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-md shadow-lg z-50 max-w-sm ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-sm mt-1 text-red-100">{message}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-200 hover:text-white text-sm underline flex-shrink-0"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-red-400 text-sm ${className}`}>
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-300 hover:text-red-200 underline ml-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  
  // Default variant - centered error state
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-neutral-200 mb-2">
        Oops! Something went wrong
      </h3>
      
      <p className="text-neutral-400 mb-6 max-w-md">
        {message}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}