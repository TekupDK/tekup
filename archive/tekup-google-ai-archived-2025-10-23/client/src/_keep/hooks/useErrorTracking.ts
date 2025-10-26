import { useCallback, useEffect, useRef } from 'react'
import { startSpan, reportError, addBreadcrumb, setUserContext } from '../lib/sentry'
import { logger, createLogger } from '../lib/logger'

interface ErrorTrackingOptions {
  component?: string
  userId?: string
  enablePerformanceTracking?: boolean
  enableNavigationTracking?: boolean
  enableUserActionTracking?: boolean
}

interface PerformanceMetrics {
  renderTime?: number
  loadTime?: number
  interactionTime?: number
}

export function useErrorTracking(options: ErrorTrackingOptions = {}) {
  const {
    component = 'UnknownComponent',
    userId,
    enablePerformanceTracking = true,
    enableNavigationTracking = false, // Disabled since we removed react-router-dom
    enableUserActionTracking = true
  } = options

  const componentLogger = createLogger(component)
  const renderStartTime = useRef<number>(Date.now())
  const transactionRef = useRef<any>(null)
  const metricsRef = useRef<PerformanceMetrics>({})

  // Set user context when userId changes
  useEffect(() => {
    if (userId) {
      setUserContext({
        id: userId,
        component
      })
      componentLogger.info('User context updated', { userId })
    }
  }, [userId, component, componentLogger])

  // Track component render performance
  useEffect(() => {
    if (!enablePerformanceTracking) return

    const renderEndTime = Date.now()
    const renderTime = renderEndTime - renderStartTime.current
    
    metricsRef.current.renderTime = renderTime
    
    componentLogger.performance('component_render_time', renderTime, 'ms')
    
    // Track if render time is unusually long
    if (renderTime > 100) {
      componentLogger.warn('Slow component render detected', {
        renderTime,
        threshold: 100
      })
    }
  }, [enablePerformanceTracking, componentLogger])

  // Error reporting function
  const reportComponentError = useCallback((
    error: Error,
    errorInfo?: any,
    severity: 'error' | 'warning' | 'info' = 'error'
  ) => {
    const context = {
      component,
      userId,
      metrics: metricsRef.current,
      errorInfo
    }

    componentLogger.error('Component error occurred', context, error)
    
    reportError(error, context, severity)
    
    // Add breadcrumb for error context
    addBreadcrumb(
      `Error in ${component}`,
      'error',
      'error',
      {
        component,
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 200)
      }
    )
  }, [component, userId, componentLogger])

  // User action tracking
  const trackUserAction = useCallback((
    action: string,
    metadata?: Record<string, any>
  ) => {
    if (!enableUserActionTracking) return

    const actionContext = {
      component,
      userId,
      metadata
    }

    componentLogger.userAction(action, component, metadata)
    
    addBreadcrumb(
      `User action: ${action}`,
      'info',
      'user',
      actionContext
    )
  }, [component, userId, enableUserActionTracking, componentLogger])

  // API call tracking
  const trackApiCall = useCallback((
    method: string,
    url: string,
    status?: number,
    duration?: number,
    error?: Error
  ) => {
    const apiContext = {
      component,
      userId,
      method,
      url,
      status,
      duration
    }

    if (error) {
      componentLogger.error('API call failed', apiContext, error)
      reportComponentError(error, { apiCall: { method, url, status } }, 'error')
    } else {
      componentLogger.apiCall(method, url, status, duration, apiContext)
    }
  }, [component, userId, componentLogger, reportComponentError])

  // Performance measurement utilities
  const measurePerformance = useCallback((
    name: string,
    fn: () => void | Promise<void>
  ) => {
    if (!enablePerformanceTracking) {
      return typeof fn === 'function' ? fn() : fn
    }

    const start = performance.now()
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          componentLogger.performance(name, duration, 'ms')
        })
      } else {
        const duration = performance.now() - start
        componentLogger.performance(name, duration, 'ms')
        return result
      }
    } catch (error) {
      const duration = performance.now() - start
      componentLogger.performance(name, duration, 'ms')
      reportComponentError(error as Error, { performanceMeasurement: name })
      throw error
    }
  }, [enablePerformanceTracking, componentLogger, reportComponentError])

  // Start a custom transaction
  const startCustomTransaction = useCallback((
    name: string,
    op: string = 'custom',
    tags?: Record<string, string>
  ) => {
    return startSpan({
      name: `${component}: ${name}`,
      op,
      attributes: {
        component,
        userId: userId || 'anonymous',
        ...tags
      }
    })
  }, [component, userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transactionRef.current) {
        transactionRef.current.end()
      }
    }
  }, [])

  return {
    reportError: reportComponentError,
    trackUserAction,
    trackApiCall,
    measurePerformance,
    startTransaction: startCustomTransaction,
    logger: componentLogger,
    metrics: metricsRef.current
  }
}

// Hook for API error handling
export function useApiErrorHandler(component: string = 'ApiComponent') {
  const { reportError, trackApiCall } = useErrorTracking({ component })

  const handleApiError = useCallback((
    error: any,
    request: {
      method: string
      url: string
      data?: any
    }
  ) => {
    const status = error.response?.status
    const statusText = error.response?.statusText
    const responseData = error.response?.data

    const apiError = new Error(
      `API Error: ${request.method} ${request.url} - ${status} ${statusText}`
    )

    const context = {
      request: {
        method: request.method,
        url: request.url,
        data: request.data
      },
      response: {
        status,
        statusText,
        data: responseData
      },
      originalError: error.message
    }

    trackApiCall(request.method, request.url, status, undefined, apiError)
    reportError(apiError, context, status >= 500 ? 'error' : 'warning')

    return {
      error: apiError,
      status,
      data: responseData
    }
  }, [reportError, trackApiCall])

  return { handleApiError }
}

// Hook for form error handling
export function useFormErrorHandler(formName: string) {
  const { reportError, trackUserAction } = useErrorTracking({ 
    component: `Form_${formName}` 
  })

  const handleFormError = useCallback((
    error: Error,
    formData?: Record<string, any>,
    fieldErrors?: Record<string, string>
  ) => {
    trackUserAction('form_error', {
      formName,
      fieldErrors: Object.keys(fieldErrors || {}),
      hasFormData: !!formData
    })

    reportError(error, {
      formName,
      formData: formData ? Object.keys(formData) : undefined,
      fieldErrors
    }, 'warning')
  }, [formName, reportError, trackUserAction])

  const handleFormSubmit = useCallback((
    formData: Record<string, any>
  ) => {
    trackUserAction('form_submit', {
      formName,
      fieldCount: Object.keys(formData).length
    })
  }, [formName, trackUserAction])

  return {
    handleFormError,
    handleFormSubmit
  }
}