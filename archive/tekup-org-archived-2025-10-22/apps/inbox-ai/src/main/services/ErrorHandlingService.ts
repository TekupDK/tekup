/**
 * Error handling service for centralized error management
 */

import { AppError, EventBus } from '@shared/types'
import { ERROR_CODES } from '@shared/constants'
import { LogService } from './LogService.js'

export class ErrorHandlingService {
  private log: LogService
  private eventBus: EventBus | null = null
  private errorQueue: AppError[] = []
  private maxQueueSize = 100

  constructor() {
    this.log = new LogService()
    this.setupGlobalErrorHandlers()
  }

  /**
   * Set event bus for error broadcasting
   */
  setEventBus(eventBus: EventBus): void {
    this.eventBus = eventBus
  }

  /**
   * Handle application error
   */
  handleError(error: Error | AppError, context?: any): AppError {
    let appError: AppError

    // Convert regular Error to AppError if needed
    if (!('code' in error)) {
      appError = this.createAppError(error, context)
    } else {
      appError = error as AppError
    }

    // Log the error
    this.logError(appError, context)

    // Add to error queue
    this.addToQueue(appError)

    // Broadcast error event
    this.broadcastError(appError)

    // Determine if we should show user notification
    if (this.shouldNotifyUser(appError)) {
      this.showUserNotification(appError)
    }

    return appError
  }

  /**
   * Handle async operation errors
   */
  async handleAsyncError<T>(
    operation: () => Promise<T>,
    context?: any,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation()
    } catch (error) {
      const appError = this.handleError(error as Error, context)
      
      // Return fallback value if provided
      if (fallback !== undefined) {
        return fallback
      }
      
      // Re-throw if no fallback
      if (this.isCriticalError(appError)) {
        throw appError
      }
      
      return undefined
    }
  }

  /**
   * Handle operation with retry logic
   */
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000,
    context?: any
  ): Promise<T> {
    let lastError: AppError | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.handleError(error as Error, { ...context, attempt })

        // Don't retry if error is not retryable
        if (!this.isRetryableError(lastError)) {
          throw lastError
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError
        }

        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Create AppError from regular Error
   */
  private createAppError(error: Error, context?: any): AppError {
    const appError = error as AppError
    
    // Try to infer error type and code from message
    const { type, code } = this.inferErrorTypeAndCode(error)
    
    appError.code = code
    appError.type = type
    appError.timestamp = new Date()
    appError.details = context
    appError.userMessage = this.getUserMessage(error, type, code)

    return appError
  }

  /**
   * Infer error type and code from error message
   */
  private inferErrorTypeAndCode(error: Error): { type: AppError['type']; code: string } {
    const message = error.message.toLowerCase()

    // Network/Connection errors
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return { type: 'network', code: ERROR_CODES.CONNECTION_REFUSED }
    }
    if (message.includes('etimedout') || message.includes('timeout')) {
      return { type: 'network', code: ERROR_CODES.CONNECTION_TIMEOUT }
    }
    if (message.includes('enotfound') || message.includes('network')) {
      return { type: 'network', code: ERROR_CODES.CONNECTION_FAILED }
    }

    // Authentication errors
    if (message.includes('authentication') || message.includes('auth') || message.includes('login')) {
      return { type: 'auth', code: ERROR_CODES.AUTH_FAILED }
    }

    // IMAP errors
    if (message.includes('imap') || message.includes('mailbox')) {
      return { type: 'network', code: ERROR_CODES.IMAP_OPERATION_FAILED }
    }

    // Database errors
    if (message.includes('database') || message.includes('sqlite')) {
      return { type: 'database', code: ERROR_CODES.DB_OPERATION_FAILED }
    }

    // AI/API errors
    if (message.includes('api') || message.includes('openai') || message.includes('anthropic')) {
      return { type: 'ai', code: ERROR_CODES.AI_API_ERROR }
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return { type: 'validation', code: ERROR_CODES.VALIDATION_ERROR }
    }

    // Default to unknown
    return { type: 'unknown', code: ERROR_CODES.UNKNOWN_ERROR }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: Error, type: AppError['type'], code: string): string {
    const userMessages: Record<string, string> = {
      [ERROR_CODES.CONNECTION_REFUSED]: 'Cannot connect to the email server. Please check your server settings and internet connection.',
      [ERROR_CODES.CONNECTION_TIMEOUT]: 'Connection timed out. Please check your internet connection and try again.',
      [ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect to the server. Please check your internet connection.',
      [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please check your username and password.',
      [ERROR_CODES.IMAP_OPERATION_FAILED]: 'Email operation failed. Please try again.',
      [ERROR_CODES.DB_OPERATION_FAILED]: 'A database error occurred. Please restart the application.',
      [ERROR_CODES.AI_API_ERROR]: 'AI service is temporarily unavailable. Please try again later.',
      [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input provided. Please check your data and try again.',
      [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
    }

    return userMessages[code] || 'An error occurred. Please try again.'
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AppError, context?: any): void {
    const logData = {
      code: error.code,
      type: error.type,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: error.timestamp,
    }

    switch (error.type) {
      case 'validation':
        this.log.warn('Validation error', logData)
        break
      case 'auth':
        this.log.warn('Authentication error', logData)
        break
      case 'network':
        this.log.error('Network error', error, logData)
        break
      case 'database':
        this.log.error('Database error', error, logData)
        break
      case 'ai':
        this.log.warn('AI service error', logData)
        break
      default:
        this.log.error('Application error', error, logData)
    }
  }

  /**
   * Add error to queue for tracking
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error)
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  /**
   * Broadcast error event
   */
  private broadcastError(error: AppError): void {
    if (this.eventBus) {
      this.eventBus.emit('error:occurred', error)
    }
  }

  /**
   * Check if error should notify user
   */
  private shouldNotifyUser(error: AppError): boolean {
    // Don't notify for validation errors (handled by UI)
    if (error.type === 'validation') {
      return false
    }

    // Don't notify for frequent errors (rate limiting)
    const recentSimilarErrors = this.errorQueue
      .filter(e => e.code === error.code)
      .filter(e => Date.now() - e.timestamp.getTime() < 60000) // Last minute

    return recentSimilarErrors.length <= 2
  }

  /**
   * Show user notification
   */
  private showUserNotification(error: AppError): void {
    // This would be handled by the notification service
    if (this.eventBus) {
      this.eventBus.emit('notification:show', {
        type: 'error',
        title: 'Error',
        message: error.userMessage || error.message,
        duration: 5000,
      })
    }
  }

  /**
   * Check if error is critical (should stop operation)
   */
  private isCriticalError(error: AppError): boolean {
    const criticalCodes = [
      ERROR_CODES.DB_CONNECTION_FAILED,
      ERROR_CODES.DB_MIGRATION_FAILED,
      ERROR_CODES.PERMISSION_DENIED,
    ]

    return criticalCodes.includes(error.code as any)
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      ERROR_CODES.CONNECTION_TIMEOUT,
      ERROR_CODES.CONNECTION_FAILED,
      ERROR_CODES.AI_RATE_LIMITED,
      ERROR_CODES.IMAP_OPERATION_FAILED,
    ]

    return retryableCodes.includes(error.code as any)
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.handleError(error, { type: 'unhandledRejection', promise })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.handleError(error, { type: 'uncaughtException' })
      
      // Log critical error and exit gracefully
      this.log.error('Uncaught exception - application will exit', error)
      setTimeout(() => process.exit(1), 1000)
    })
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errorQueue
      .slice(-limit)
      .reverse() // Most recent first
  }

  /**
   * Get error statistics
   */
  getErrorStats(): any {
    const now = Date.now()
    const last24h = this.errorQueue.filter(e => now - e.timestamp.getTime() < 24 * 60 * 60 * 1000)
    const lastHour = this.errorQueue.filter(e => now - e.timestamp.getTime() < 60 * 60 * 1000)

    const byType = last24h.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCode = last24h.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total24h: last24h.length,
      totalLastHour: lastHour.length,
      byType,
      byCode,
      mostCommon: Object.entries(byCode)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([code, count]) => ({ code, count }))
    }
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = []
  }
}