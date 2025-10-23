/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects against cascade failures when external services (Billy.dk API) are down
 * 
 * States:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Service is down, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 */

import CircuitBreaker from 'opossum';
import { log } from './logger.js';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  name?: string;
}

/**
 * Create a circuit breaker for a function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CircuitBreakerOptions = {}
): CircuitBreaker<any[], any> {
  const defaultOptions = {
    timeout: 10000,                    // 10 seconds timeout
    errorThresholdPercentage: 50,     // Open after 50% errors
    resetTimeout: 30000,              // Try again after 30 seconds
    rollingCountTimeout: 10000,       // 10 second window for error calculation
    rollingCountBuckets: 10,          // 10 buckets of 1 second each
    name: options.name || 'unknown',
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const breaker = new CircuitBreaker(fn, mergedOptions);

  // Event listeners for monitoring
  breaker.on('open', () => {
    log.warn(`Circuit breaker OPEN: ${mergedOptions.name}`, {
      timeout: mergedOptions.timeout,
      threshold: mergedOptions.errorThresholdPercentage,
    });
  });

  breaker.on('halfOpen', () => {
    log.info(`Circuit breaker HALF_OPEN: ${mergedOptions.name} - testing recovery`);
  });

  breaker.on('close', () => {
    log.info(`Circuit breaker CLOSED: ${mergedOptions.name} - service recovered`);
  });

  breaker.on('failure', (error: Error) => {
    log.error(`Circuit breaker failure: ${mergedOptions.name}`, {
      error: error.message,
      stats: breaker.stats,
    });
  });

  breaker.on('success', () => {
    log.debug(`Circuit breaker success: ${mergedOptions.name}`, {
      stats: breaker.stats,
    });
  });

  breaker.on('timeout', () => {
    log.warn(`Circuit breaker timeout: ${mergedOptions.name}`, {
      timeout: mergedOptions.timeout,
    });
  });

  breaker.on('fallback', (result: any) => {
    log.info(`Circuit breaker fallback: ${mergedOptions.name}`, { result });
  });

  return breaker;
}

/**
 * Get circuit breaker health status
 */
export function getCircuitBreakerHealth(breaker: CircuitBreaker<any, any>): {
  opened: boolean;
  state: string;
  stats: any;
} {
  return {
    opened: breaker.opened,
    state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
    stats: breaker.stats,
  };
}
