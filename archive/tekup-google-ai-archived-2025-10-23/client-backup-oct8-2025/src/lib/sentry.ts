import * as Sentry from '@sentry/react'

// Initialize Sentry with enhanced configuration
export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    debug: import.meta.env.DEV,
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay for debugging
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Enhanced error filtering
    beforeSend(event, hint) {
      // Filter out development-only errors
      if (import.meta.env.DEV) {
        const error = hint.originalException
        if (error instanceof Error) {
          // Skip React DevTools errors
          if (error.message.includes('ResizeObserver loop limit exceeded')) {
            return null
          }
          // Skip network errors in development
          if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
            return null
          }
        }
      }
      
      // Add user context if available
      const user = event.user || {}
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const userData = localStorage.getItem('user')
          if (userData) {
            const parsedUser = JSON.parse(userData)
            Object.assign(user, {
              id: parsedUser.id,
              email: parsedUser.email,
              name: parsedUser.name
            })
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      return event
    },
    
    // Enhanced release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',
    
    // Custom tags for better organization
    initialScope: {
      tags: {
        component: 'client',
        framework: 'react',
        build: import.meta.env.MODE
      }
    }
  })
  
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason, {
        tags: { errorType: 'unhandledRejection' }
      })
    })
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      Sentry.captureException(event.error, {
        tags: { errorType: 'globalError' },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })
  }
}

// Enhanced error reporting with automatic context
export function reportError(error: Error, context?: Record<string, any>, level: 'error' | 'warning' | 'info' = 'error') {
  if (import.meta.env.PROD || import.meta.env.VITE_SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Set error level
      scope.setLevel(level)
      
      // Add automatic context
      scope.setContext('errorDetails', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })

      // Add custom context if provided
      if (context) {
        Object.keys(context).forEach((key) => {
          scope.setContext(key, context[key])
        })
      }

      // Add fingerprinting for better error grouping
      scope.setFingerprint([error.name, error.message])
      
      Sentry.captureException(error)
    })
  } else {
    // Enhanced development logging
    console.group(`🚨 Error reported (${level})`)
    console.error('Error:', error)
    if (context) {
      console.log('Context:', context)
    }
    console.log('Stack:', error.stack)
    console.groupEnd()
  }
}

// Enhanced user context with additional metadata
export function setUserContext(user: { 
  id: string; 
  email?: string; 
  name?: string;
  role?: string;
  subscription?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  })
  
  // Add additional user context
  Sentry.setContext('userProfile', {
    role: user.role,
    subscription: user.subscription,
    loginTime: new Date().toISOString(),
  })
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null)
  Sentry.setContext('userProfile', null)
}

// Enhanced breadcrumb with automatic categorization
export function addBreadcrumb(
  message: string, 
  level: 'info' | 'warning' | 'error' | 'debug' = 'info',
  category?: string, 
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level,
    timestamp: Date.now() / 1000,
    data: {
      ...data,
      url: window.location.href,
    },
  })
}

// Performance monitoring helpers
export function startTransaction(name: string, operation: string = 'navigation') {
  // Use the newer startSpan API instead of deprecated startTransaction
  return Sentry.startSpan({
    name,
    op: operation,
  }, (span) => {
    return span
  })
}

// Error boundary integration
export function captureErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  Sentry.withScope((scope) => {
    scope.setContext('errorBoundary', {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })
    scope.setLevel('error')
    scope.setFingerprint(['ErrorBoundary', error.name])
    Sentry.captureException(error)
  })
}

// Network error tracking
export function captureNetworkError(url: string, method: string, status?: number, error?: Error) {
  Sentry.withScope((scope) => {
    scope.setContext('networkError', {
      url,
      method,
      status,
      timestamp: new Date().toISOString(),
    })
    scope.setLevel('warning')
    scope.setFingerprint(['NetworkError', method, url])
    
    if (error) {
      Sentry.captureException(error)
    } else {
      Sentry.captureMessage(`Network error: ${method} ${url} (${status})`)
    }
  })
}