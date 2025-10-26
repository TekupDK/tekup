import { reportError, addBreadcrumb } from './sentry'

// Global error handler for unhandled errors
export function initGlobalErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    addBreadcrumb('Unhandled promise rejection', 'error', 'error')
    
    // Report to Sentry
    reportError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        type: 'unhandledrejection',
        promise: event.promise,
        reason: event.reason
      }
    )
  })

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error || event.message)
    
    addBreadcrumb(`Global error: ${event.message}`, 'error', 'error')
    
    // Report to Sentry
    reportError(
      event.error || new Error(event.message),
      {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message
      }
    )
  })

  // Handle resource loading errors (images, scripts, etc.)
  window.addEventListener('error', (event) => {
    const target = event.target
    
    if (target && target !== window && 'tagName' in target) {
      const element = target as HTMLElement
      console.error('Resource loading error:', element.tagName, element)
      
      addBreadcrumb(`Resource loading error: ${element.tagName}`, 'warning', 'resource')
      
      // Report resource errors to Sentry
      reportError(
        new Error(`Failed to load ${element.tagName}: ${(element as any).src || (element as any).href || 'unknown'}`),
        {
          type: 'resource',
          tagName: element.tagName,
          src: (element as any).src,
          href: (element as any).href
        }
      )
    }
  }, true) // Use capture phase for resource errors

  console.log('Global error handlers initialized')
}

// Function to manually report errors with context
export function reportManualError(error: Error | string, context?: Record<string, any>) {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  
  addBreadcrumb(`Manual error report: ${errorObj.message}`, 'error', 'manual')
  
  reportError(errorObj, {
    type: 'manual',
    ...context
  })
}

// Function to report performance issues
export function reportPerformanceIssue(message: string, timing: number, context?: Record<string, any>) {
  addBreadcrumb(`Performance issue: ${message} (${timing}ms)`, 'warning', 'performance')
  
  reportError(new Error(`Performance issue: ${message}`), {
    type: 'performance',
    timing,
    ...context
  })
}