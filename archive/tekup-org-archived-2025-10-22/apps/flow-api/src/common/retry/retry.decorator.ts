import { SetMetadata } from '@nestjs/common';
import { RetryOptions } from './retry.service.js';

export const RETRY_METADATA_KEY = 'retry_options';

/**
 * Decorator to add retry logic to a method
 */
export function Retry(options: RetryOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const retryService = this.retryService;
      
      if (!retryService) {
        logger.warn(`RetryService not found in ${target.constructor.name}. Make sure to inject RetryService.`);
        return originalMethod.apply(this, args);
      }

      const result = await retryService.executeWithRetry(
        () => originalMethod.apply(this, args),
        options
      );

      return result.result;
    };

    // Store metadata for potential inspection
    SetMetadata(RETRY_METADATA_KEY, options)(target, propertyName, descriptor);

    return descriptor;
  };
}

/**
 * Decorator for database operations with appropriate retry settings
 */
export function RetryDatabase(customOptions: Partial<RetryOptions> = {}) {
  const defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffStrategy: 'exponential',
    jitter: true,
    retryCondition: (error, attempt) => {
      // Retry database connection errors and timeouts
      return error.code === 'P1001' || // Prisma connection error
             error.code === 'P1008' || // Prisma timeout
             error.code === 'P1017' || // Prisma server not found
             error.message?.includes('connection') ||
             error.message?.includes('timeout') ||
             error.message?.includes('database');
    },
  };

  return Retry({ ...defaultOptions, ...customOptions });
}

/**
 * Decorator for HTTP requests with appropriate retry settings
 */
export function RetryHttp(customOptions: Partial<RetryOptions> = {}) {
  const defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 30000,
    backoffStrategy: 'exponential',
    jitter: true,
    timeout: 30000,
    retryCondition: (error, attempt) => {
      // Retry 5xx errors, timeouts, and rate limits
      return error.status >= 500 ||
             error.status === 408 ||
             error.status === 429 ||
             error.code === 'ETIMEDOUT' ||
             error.code === 'ECONNRESET' ||
             error.code === 'ECONNREFUSED';
    },
  };

  return Retry({ ...defaultOptions, ...customOptions });
}

/**
 * Decorator for external API calls with more aggressive retry settings
 */
export function RetryExternalApi(customOptions: Partial<RetryOptions> = {}) {
  const defaultOptions: RetryOptions = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 60000,
    backoffStrategy: 'exponential',
    jitter: true,
    timeout: 30000,
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
             error.code === 'ECONNREFUSED' ||
             error.code === 'ENOTFOUND';
    },
  };

  return Retry({ ...defaultOptions, ...customOptions });
}

/**
 * Decorator for critical operations that should retry more aggressively
 */
export function RetryCritical(customOptions: Partial<RetryOptions> = {}) {
  const defaultOptions: RetryOptions = {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 20000,
    backoffStrategy: 'exponential',
    jitter: true,
    retryCondition: (error, attempt) => {
      // Retry most errors except explicit non-retryable ones
      const nonRetryableErrors = [
        'ValidationError',
        'BadRequestException',
        'UnauthorizedException',
        'ForbiddenException',
        'NotFoundException',
      ];

      return !nonRetryableErrors.includes(error.name) &&
             error.status !== 400 &&
             error.status !== 401 &&
             error.status !== 403 &&
             error.status !== 404;
    },
  };

  return Retry({ ...defaultOptions, ...customOptions });
}

/**
 * Decorator for operations that should not retry on certain errors
 */
export function RetryConditional(
  retryCondition: (error: any, attempt: number) => boolean,
  customOptions: Partial<RetryOptions> = {}
) {
  const defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffStrategy: 'exponential',
    jitter: true,
    retryCondition,
  };

  return Retry({ ...defaultOptions, ...customOptions });
}

/**
 * Method decorator that logs retry attempts
 */
export function LogRetries(logLevel: 'debug' | 'info' | 'warn' = 'info') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = this.logger || this.structuredLogger || console;
      const methodName = `${target.constructor.name}.${propertyName}`;

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        if (logger[logLevel]) {
          logger[logLevel](`Method ${methodName} failed, will be retried`, {
            method: methodName,
            error: error.message,
            args: args.length,
          });
        }
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator to add retry capability to all methods
 */
export function RetryableClass(defaultOptions: RetryOptions = {}) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-common-retry');

  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);

        // Add retry capability to all methods
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype)
          .filter(name => 
            name !== 'constructor' && 
            typeof prototype[name] === 'function' &&
            !name.startsWith('_') // Skip private methods
          );

        methodNames.forEach(methodName => {
          const originalMethod = this[methodName];
          if (typeof originalMethod === 'function') {
            this[methodName] = async function (...args: any[]) {
              const retryService = this.retryService;
              
              if (!retryService) {
                return originalMethod.apply(this, args);
              }

              const result = await retryService.executeWithRetry(
                () => originalMethod.apply(this, args),
                defaultOptions
              );

              return result.result;
            };
          }
        });
      }
    };
  };
}