import { Injectable, Logger } from '@nestjs/common';
import { isRetryableError, getRetryDelay, getMaxRetries } from './custom-exceptions.js';
import { StructuredLoggerService } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBase: number;
  jitterFactor: number; // 0-1
  retryableErrors?: string[];
  nonRetryableErrors?: string[];
  onRetry?: (error: any, attempt: number) => void;
  onFailure?: (error: any, attempts: number) => void;
}

export interface RetryOptions extends Partial<RetryConfig> {
  operation?: string;
  context?: Record<string, any>;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitterFactor: 0.1, // 10% jitter
};

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(
  private readonly structuredLogger: StructuredLoggerService,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...options };
    const operation = options.operation || 'unknown_operation';
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Log attempt
        if (attempt > 1) {
          this.logRetryAttempt(operation, attempt, config.maxAttempts);
        }

        // Execute the function
        const result = await fn();
        
        // Log success if there were retries
        if (attempt > 1) {
          this.logRetrySuccess(operation, attempt);
          this.recordRetryMetrics(operation, attempt, true);
        }

        return result;
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.shouldRetry(error, attempt, config)) {
          this.logRetryFailure(operation, attempt, error, false);
          this.recordRetryMetrics(operation, attempt, false);
          throw error;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(error, attempt, config);
        
        // Log retry decision
        this.logRetryDecision(operation, attempt, config.maxAttempts, delay, error);
        
        // Call onRetry callback if provided
        if (config.onRetry) {
          config.onRetry(error, attempt);
        }

        // Wait before next attempt (unless it's the last attempt)
        if (attempt < config.maxAttempts) {
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    this.logRetryFailure(operation, config.maxAttempts, lastError, true);
    this.recordRetryMetrics(operation, config.maxAttempts, false);
    
    if (config.onFailure) {
      config.onFailure(lastError, config.maxAttempts);
    }

    throw lastError;
  }

  /**
   * Execute with database-specific retry configuration
   */
  async executeWithDatabaseRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'database_operation'
  ): Promise<T> {
    return this.executeWithRetry(fn, {
      operation: `db_${operation}`,
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 5000,
      retryableErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ConnectionError',
        'TransactionError',
      ],
      nonRetryableErrors: [
        'ValidationError',
        'UniqueConstraintError',
        'ForeignKeyConstraintError',
      ],
    });
  }

  /**
   * Execute with external service retry configuration
   */
  async executeWithExternalServiceRetry<T>(
    fn: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    return this.executeWithRetry(fn, {
      operation: `external_${serviceName}`,
      maxAttempts: 3,
      baseDelay: 2000,
      maxDelay: 30000,
      exponentialBase: 2,
      jitterFactor: 0.2,
      retryableErrors: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ServiceUnavailable',
      ],
    });
  }

  /**
   * Execute with cache retry configuration
   */
  async executeWithCacheRetry<T>(
    fn: () => Promise<T>,
    operation: string = 'cache_operation'
  ): Promise<T> {
    return this.executeWithRetry(fn, {
      operation: `cache_${operation}`,
      maxAttempts: 2,
      baseDelay: 100,
      maxDelay: 1000,
      exponentialBase: 2,
      jitterFactor: 0.1,
    });
  }

  /**
   * Create a retryable function wrapper
   */
  createRetryableFunction<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return (async (...args: any[]) => {
      return this.executeWithRetry(() => fn(...args), options);
    }) as T;
  }

  /**
   * Batch retry multiple operations
   */
  async executeBatchWithRetry<T>(
    operations: Array<() => Promise<T>>,
    options: RetryOptions = {}
  ): Promise<T[]> {
    const results = await Promise.allSettled(
      operations.map(op => this.executeWithRetry(op, options))
    );

    const failures = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected');

    if (failures.length > 0) {
      this.logBatchFailures(failures, options.operation || 'batch_operation');
    }

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      throw result.reason;
    });
  }

  private shouldRetry(error: any, attempt: number, config: RetryConfig): boolean {
    // Don't retry if we've reached max attempts
    if (attempt >= config.maxAttempts) {
      return false;
    }

    // Check non-retryable errors first
    if (config.nonRetryableErrors) {
      const isNonRetryable = config.nonRetryableErrors.some(errorType => 
        error.code === errorType || 
        error.name === errorType ||
        error.message.includes(errorType)
      );
      if (isNonRetryable) {
        return false;
      }
    }

    // Check specific retryable errors
    if (config.retryableErrors) {
      return config.retryableErrors.some(errorType => 
        error.code === errorType || 
        error.name === errorType ||
        error.message.includes(errorType)
      );
    }

    // Use general retry logic
    return isRetryableError(error);
  }

  private calculateDelay(error: any, attempt: number, config: RetryConfig): number {
    // Use error-specific delay if available
    const errorDelay = getRetryDelay(error, attempt);
    if (errorDelay > 0) {
      return errorDelay;
    }

    // Calculate exponential backoff
    const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    
    // Apply max delay limit
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    
    return Math.round(cappedDelay + jitter);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logRetryAttempt(operation: string, attempt: number, maxAttempts: number): void {
    this.structuredLogger.warn(`Retrying operation: ${operation}`, {
      ...this.contextService.toLogContext(),
      operation,
      attempt,
      maxAttempts,
      retryReason: 'previous_attempt_failed',
    });
  }

  private logRetryDecision(
    operation: string,
    attempt: number,
    maxAttempts: number,
    delay: number,
    error: any
  ): void {
    this.structuredLogger.debug(`Retry decision for ${operation}`, {
      ...this.contextService.toLogContext(),
      operation,
      attempt,
      maxAttempts,
      nextAttemptIn: delay,
      errorName: error.name || 'Unknown',
      errorMessage: error.message,
      willRetry: attempt < maxAttempts,
    });
  }

  private logRetrySuccess(operation: string, attempt: number): void {
    this.structuredLogger.log(`Operation succeeded after retry: ${operation}`, {
      ...this.contextService.toLogContext(),
      operation,
      succeededOnAttempt: attempt,
      totalAttempts: attempt,
    });
  }

  private logRetryFailure(
    operation: string,
    attempts: number,
    error: any,
    exhausted: boolean
  ): void {
    const message = exhausted 
      ? `Operation failed after ${attempts} attempts: ${operation}`
      : `Operation failed (non-retryable): ${operation}`;

    this.structuredLogger.error(message, error, {
      ...this.contextService.toLogContext(),
      operation,
      attempts,
      exhausted,
      finalError: {
        name: error.name,
        message: error.message,
        code: error.code,
      },
    });
  }

  private logBatchFailures(failures: any[], operation: string): void {
    this.structuredLogger.warn(`Batch operation had failures: ${operation}`, {
      ...this.contextService.toLogContext(),
      operation,
      failureCount: failures.length,
      failureIndexes: failures.map(f => f.index),
    });
  }

  private recordRetryMetrics(
    operation: string,
    attempts: number,
    success: boolean
  ): void {
    const tenantId = this.contextService.getTenantId() || 'unknown';
    
    // Record retry attempts
    this.metricsService.histogram('retry_attempts_total', attempts, {
      operation,
      tenant: tenantId,
      success: success.toString(),
    });

    // Record retry success/failure
    this.metricsService.increment('retry_operations_total', {
      operation,
      tenant: tenantId,
      result: success ? 'success' : 'failure',
    });

    // Record if operation needed retries
    if (attempts > 1) {
      this.metricsService.increment('retry_operations_with_retries_total', {
        operation,
        tenant: tenantId,
        finalResult: success ? 'success' : 'failure',
      });
    }
  }
}

/**
 * Decorator for automatic retry functionality
 */
export function Retryable(options: RetryOptions = {}) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-common-excep');

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const retryService: RetryService | undefined = (this as any)?.retryService || (this as any)?.retry || (this as any)?.retrySvc;

      if (!retryService) {
        logger.warn(`RetryService not found on instance for ${target.constructor.name}.${propertyName}. Running without retry.`);
        return originalMethod.apply(this, args);
      }

      return retryService.executeWithRetry(() => originalMethod.apply(this, args), {
        ...options,
        operation: options.operation || `${target.constructor.name}.${propertyName}`,
      });
    };

    return descriptor;
  };
}
