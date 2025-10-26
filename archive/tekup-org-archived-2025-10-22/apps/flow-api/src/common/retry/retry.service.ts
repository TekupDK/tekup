import { Injectable, Logger } from '@nestjs/common';
import { StructuredLoggerService } from '../logging/structured-logger.service.js';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'fixed';
  jitter?: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
  timeout?: number;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  totalDuration: number;
  errors: any[];
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly isRetryable: boolean = true,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private readonly structuredLogger: StructuredLoggerService) {}

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffStrategy = 'exponential',
      jitter = true,
      retryCondition = this.defaultRetryCondition,
      onRetry,
      timeout,
    } = options;

    const startTime = Date.now();
    const errors: any[] = [];
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        attempt++;
        
        const operationPromise = timeout 
          ? this.withTimeout(operation(), timeout)
          : operation();

        const result = await operationPromise;
        
        const totalDuration = Date.now() - startTime;
        
        if (attempt > 1) {
          this.structuredLogger.info('Operation succeeded after retries', {
            attempts: attempt,
            totalDuration,
            operation: operation.name || 'anonymous',
          });
        }

        return {
          result,
          attempts: attempt,
          totalDuration,
          errors,
        };
      } catch (error) {
        errors.push(error);
        
        const shouldRetry = attempt <= maxRetries && retryCondition(error, attempt);
        
        if (!shouldRetry) {
          const totalDuration = Date.now() - startTime;
          
          this.structuredLogger.error('Operation failed after all retries', error, {
            attempts: attempt,
            totalDuration,
            maxRetries,
            operation: operation.name || 'anonymous',
            finalError: error.message,
          });
          
          throw error;
        }

        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffStrategy, jitter);
        
        this.structuredLogger.warn(`Operation failed, retrying in ${delay}ms`, {
          attempt,
          maxRetries,
          delay,
          error: error.message,
          operation: operation.name || 'anonymous',
        });

        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        await this.sleep(delay);
      }
    }

    // This should never be reached due to the logic above, but TypeScript requires it
    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Execute with retry using a decorator pattern
   */
  withRetry<T extends any[], R>(
    target: (...args: T) => Promise<R>,
    options: RetryOptions = {}
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.executeWithRetry(() => target(...args), options);
      return result.result;
    };
  }

  /**
   * Create a retryable version of a function
   */
  retryable<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: RetryOptions = {}
  ): (...args: T) => Promise<R> {
    return this.withRetry(fn, options);
  }

  /**
   * Default retry condition - determines if an error should trigger a retry
   */
  private defaultRetryCondition(error: any, attempt: number): boolean {
    // Don't retry NonRetryableError
    if (error instanceof NonRetryableError) {
      return false;
    }

    // Always retry RetryableError
    if (error instanceof RetryableError) {
      return true;
    }

    // Network and timeout errors are retryable
    if (this.isNetworkError(error) || this.isTimeoutError(error)) {
      return true;
    }

    // Database connection errors are retryable
    if (this.isDatabaseConnectionError(error)) {
      return true;
    }

    // HTTP 5xx errors are retryable
    if (this.isServerError(error)) {
      return true;
    }

    // HTTP 429 (Too Many Requests) is retryable
    if (this.isRateLimitError(error)) {
      return true;
    }

    // HTTP 408 (Request Timeout) is retryable
    if (this.isRequestTimeoutError(error)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    strategy: 'linear' | 'exponential' | 'fixed',
    jitter: boolean
  ): number {
    let delay: number;

    switch (strategy) {
      case 'linear':
        delay = baseDelay * attempt;
        break;
      case 'exponential':
        delay = baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = baseDelay;
        break;
    }

    // Apply jitter to avoid thundering herd
    if (jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.min(Math.max(delay, 0), maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add timeout to a promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Check if error is a network error
   */
  private isNetworkError(error: any): boolean {
    const networkErrorCodes = ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'];
    return networkErrorCodes.includes(error.code) || 
           error.message?.toLowerCase().includes('network') ||
           error.message?.toLowerCase().includes('connection');
  }

  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: any): boolean {
    return error.code === 'ETIMEDOUT' || 
           error.message?.toLowerCase().includes('timeout') ||
           error.name?.toLowerCase().includes('timeout');
  }

  /**
   * Check if error is a database connection error
   */
  private isDatabaseConnectionError(error: any): boolean {
    const dbErrorMessages = [
      'connection terminated',
      'connection refused',
      'connection timeout',
      'database is not available',
      'connection pool exhausted',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return dbErrorMessages.some(msg => errorMessage.includes(msg)) ||
           error.code === 'P1001' || // Prisma connection error
           error.code === 'P1008' || // Prisma timeout
           error.code === 'P1017';   // Prisma server not found
  }

  /**
   * Check if error is a server error (5xx)
   */
  private isServerError(error: any): boolean {
    return error.status >= 500 && error.status < 600;
  }

  /**
   * Check if error is a rate limit error (429)
   */
  private isRateLimitError(error: any): boolean {
    return error.status === 429 || 
           error.message?.toLowerCase().includes('rate limit') ||
           error.message?.toLowerCase().includes('too many requests');
  }

  /**
   * Check if error is a request timeout error (408)
   */
  private isRequestTimeoutError(error: any): boolean {
    return error.status === 408;
  }

  /**
   * Create retry options for database operations
   */
  static databaseRetryOptions(): RetryOptions {
    return {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryCondition: (error, attempt) => {
        // Retry database connection errors and timeouts
        return error.code === 'P1001' || // Connection error
               error.code === 'P1008' || // Timeout
               error.code === 'P1017' || // Server not found
               error.message?.includes('connection') ||
               error.message?.includes('timeout');
      },
    };
  }

  /**
   * Create retry options for HTTP requests
   */
  static httpRetryOptions(): RetryOptions {
    return {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryCondition: (error, attempt) => {
        // Retry 5xx errors, timeouts, and rate limits
        return error.status >= 500 ||
               error.status === 408 ||
               error.status === 429 ||
               error.code === 'ETIMEDOUT' ||
               error.code === 'ECONNRESET';
      },
    };
  }

  /**
   * Create retry options for external API calls
   */
  static externalApiRetryOptions(): RetryOptions {
    return {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 60000,
      backoffStrategy: 'exponential',
      jitter: true,
      timeout: 30000, // 30 second timeout
      retryCondition: (error, attempt) => {
        // More aggressive retry for external APIs
        return error.status >= 500 ||
               error.status === 408 ||
               error.status === 429 ||
               error.status === 502 ||
               error.status === 503 ||
               error.status === 504 ||
               error.code === 'ETIMEDOUT' ||
               error.code === 'ECONNRESET' ||
               error.code === 'ECONNREFUSED';
      },
    };
  }
}