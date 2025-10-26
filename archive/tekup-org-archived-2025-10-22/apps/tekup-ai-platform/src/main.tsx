import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import './index.css'

// Error boundary for better error handling
import { ErrorBoundary } from 'react-error-boundary'

// Create QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1
    }
  }
})

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="glass-dark rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-danger-500/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Noget gik galt</h2>
        <p className="text-slate-300 mb-4 text-sm">
          Der opstod en uventet fejl. Prøv at genindlæse siden.
        </p>
        <div className="space-y-2">
          <button
            onClick={resetErrorBoundary}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Prøv igen
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Genindlæs siden
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-slate-400 cursor-pointer">Tekniske detaljer</summary>
            <pre className="text-xs text-danger-300 mt-2 overflow-auto max-h-32 bg-slate-800 p-2 rounded">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('🚀 TekUp AI Platform Performance Metrics:', {
      domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
      loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
      totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
      networkTime: Math.round(perfData.responseEnd - perfData.fetchStart),
      renderTime: Math.round(perfData.loadEventEnd - perfData.responseEnd)
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('🚨 React Error Boundary:', error, errorInfo);
        // In production, send to error tracking service
        if (process.env.NODE_ENV === 'production') {
          // Sentry.captureException(error, { extra: errorInfo });
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

