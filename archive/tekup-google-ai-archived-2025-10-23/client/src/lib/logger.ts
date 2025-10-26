import { addBreadcrumb, reportError } from './sentry'

export interface LogContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  timestamp?: string
  url?: string
  userAgent?: string
  metadata?: Record<string, any>
  intervalMs?: number
  error?: Error | string
  method?: string
  status?: number
  duration?: number
  metric?: string
  value?: number
  unit?: string
  from?: string
  to?: string
  renderTime?: number
  loadTime?: number
  interactionTime?: number
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
}

class Logger {
  private context: LogContext
  private isDevelopment = import.meta.env.DEV

  constructor(context: LogContext = {}) {
    this.context = {
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      ...context
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const contextStr = this.context.component ? `[${this.context.component}]` : ''
    const actionStr = this.context.action ? `(${this.context.action})` : ''
    
    let formattedMessage = `${timestamp} ${level.toUpperCase()} ${contextStr}${actionStr} ${message}`
    
    if (data) {
      formattedMessage += ` ${JSON.stringify(data)}`
    }
    
    return formattedMessage
  }

  private getLogColor(level: LogLevel): string {
    const colors = {
      debug: '#6B7280',
      info: '#3B82F6', 
      warn: '#F59E0B',
      error: '#EF4444'
    }
    return colors[level]
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error'
  }

  private enhanceContext(context?: LogContext): LogContext {
    return {
      ...this.context,
      ...context,
      timestamp: new Date().toISOString()
    }
  }

  private sendToExternalLogger(level: LogLevel, message: string, data?: any) {
    // In production, send to external logging service
    // This is a placeholder for actual implementation
    if (!this.isDevelopment) {
      // Could send to services like LogRocket, DataDog, etc.
      console.log(`[EXTERNAL LOG] ${level}: ${message}`, data)
    }
  }

  private logToConsole(level: LogLevel, message: string, data?: any) {
    const formattedMessage = this.formatMessage(level, message, data)
    const color = this.getLogColor(level)
    
    if (this.isDevelopment) {
      const enrichedContext = {
        ...this.context,
        level,
        message,
        data,
        performance: {
          memory: (performance as any).memory ? {
            used: Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024) * 100) / 100,
            total: Math.round(((performance as any).memory.totalJSHeapSize / 1024 / 1024) * 100) / 100
          } : undefined,
          timing: performance.now()
        }
      }
      
      console.groupCollapsed(`%c${formattedMessage}`, `color: ${color}`)
      console.log('Context:', enrichedContext)
      if (data) console.log('Data:', data)
      console.groupEnd()
    } else {
      // Production logging - send to external service
      this.sendToExternalLogger(level, message, data)
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return

    const enhancedContext = this.enhanceContext(context)
    this.logToConsole('debug', message, enhancedContext)
    addBreadcrumb(message, 'info', 'debug', enhancedContext)
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return

    const enhancedContext = this.enhanceContext(context)
    this.logToConsole('info', message, enhancedContext)
    addBreadcrumb(message, 'info', 'info', enhancedContext)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return

    const enhancedContext = this.enhanceContext(context)
    this.logToConsole('warn', message, enhancedContext)
    addBreadcrumb(message, 'warning', 'warning', enhancedContext)
    
    if (error) {
      reportError(error, enhancedContext)
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return

    const enhancedContext = this.enhanceContext(context)
    this.logToConsole('error', message, enhancedContext)
    addBreadcrumb(message, 'error', 'error', enhancedContext)
    
    if (error) {
      reportError(error, enhancedContext)
    }
  }

  // Specialized logging methods
  apiCall(method: string, url: string, status?: number, duration?: number, context?: LogContext): void {
    const apiContext = this.enhanceContext({
      ...context,
      method,
      url,
      status,
      duration
    })

    const message = `API ${method} ${url} ${status ? `(${status})` : ''} ${duration ? `- ${duration}ms` : ''}`
    
    if (status && status >= 400) {
      this.error(message, apiContext)
    } else if (duration && duration > 2000) {
      this.warn(`Slow API call: ${message}`, apiContext)
    } else {
      this.info(message, apiContext)
    }
  }

  userAction(action: string, component?: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      component: component || this.context.component,
      action,
      metadata
    })
  }

  performance(metric: string, value: number, unit: string = 'ms', context?: LogContext): void {
    const perfContext = this.enhanceContext({
      ...context,
      metric,
      value,
      unit
    })

    const message = `Performance: ${metric} = ${value}${unit}`
    
    if (unit === 'ms' && value > 1000) {
      this.warn(message, perfContext)
    } else {
      this.info(message, perfContext)
    }
  }

  navigation(from: string, to: string, context?: LogContext): void {
    this.info(`Navigation: ${from} → ${to}`, this.enhanceContext({
      ...context,
      from,
      to,
      action: 'navigation'
    }))
  }

  batch(entries: LogEntry[]): void {
    entries.forEach(entry => {
      switch (entry.level) {
        case 'debug':
          this.debug(entry.message, entry.context)
          break
        case 'info':
          this.info(entry.message, entry.context)
          break
        case 'warn':
          this.warn(entry.message, entry.context, entry.error)
          break
        case 'error':
          this.error(entry.message, entry.context, entry.error)
          break
      }
    })
  }

  child(defaultContext: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...defaultContext
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Factory function for component-specific loggers
export function createLogger(component: string, additionalContext?: LogContext): Logger {
  return new Logger({
    component,
    ...additionalContext
  })
}

// Convenience exports
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  api: logger.apiCall.bind(logger),
  user: logger.userAction.bind(logger),
  perf: logger.performance.bind(logger),
  nav: logger.navigation.bind(logger)
}