import { Injectable, Logger } from '@nestjs/common';
import { StructuredLoggerService } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { SystemException } from '../exceptions/custom-exceptions.js';

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, failing fast
  HALF_OPEN = 'half_open' // Testing if service has recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;      // Time in ms before attempting half-open
  monitoringPeriod: number;     // Time window for failure counting in ms
  halfOpenMaxCalls: number;     // Max calls allowed in half-open state
  volumeThreshold: number;      // Minimum calls before circuit can open
  errorThresholdPercentage: number; // Percentage of errors to open circuit
  slowCallThreshold: number;    // Threshold for slow calls in ms
  slowCallPercentage: number;   // Percentage of slow calls to open circuit
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateTransitionTime: Date;
  slowCallCount: number;
  averageResponseTime: number;
  errorRate: number;
}

interface CallRecord {
  timestamp: number;
  success: boolean;
  duration: number;
  error?: string;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000, // 1 minute
  halfOpenMaxCalls: 3,
  volumeThreshold: 10,
  errorThresholdPercentage: 50,
  slowCallThreshold: 5000, // 5 seconds
  slowCallPercentage: 50,
};

class CircuitBreakerInstance {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private halfOpenCalls: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateTransitionTime: Date = new Date();
  private callHistory: CallRecord[] = [];
  private readonly logger: Logger;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig,
  private readonly structuredLogger: StructuredLoggerService,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Defer logger name construction until after name is assigned
    this.logger = new Logger(`CircuitBreaker-${name}`);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.recordMetrics('rejected');
        throw new SystemException(
          `Circuit breaker is OPEN for ${this.name}`,
          'CIRCUIT_BREAKER_OPEN',
          {
            circuitName: this.name,
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime,
          }
        );
      }
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.recordMetrics('rejected');
        throw new SystemException(
          `Circuit breaker is HALF_OPEN and max calls exceeded for ${this.name}`,
          'CIRCUIT_BREAKER_HALF_OPEN_LIMIT',
          {
            circuitName: this.name,
            state: this.state,
            halfOpenCalls: this.halfOpenCalls,
            maxCalls: this.config.halfOpenMaxCalls,
          }
        );
      }
      this.halfOpenCalls++;
    }

    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordSuccess(duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(duration, error);
      throw error;
    }
  }

  private recordSuccess(duration: number): void {
    this.successCount++;
    this.lastSuccessTime = new Date();
    
    const callRecord: CallRecord = {
      timestamp: Date.now(),
      success: true,
      duration,
    };
    
    this.addCallRecord(callRecord);
    this.cleanupOldRecords();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    }

    this.recordMetrics('success');
    this.logStateTransition('success');
  }

  private recordFailure(duration: number, error: any): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    const callRecord: CallRecord = {
      timestamp: Date.now(),
      success: false,
      duration,
      error: error.message || error.toString(),
    };
    
    this.addCallRecord(callRecord);
    this.cleanupOldRecords();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED && this.shouldOpenCircuit()) {
      this.transitionToOpen();
    }

    this.recordMetrics('failure');
    this.logStateTransition('failure');
  }

  private shouldOpenCircuit(): boolean {
    const recentCalls = this.getRecentCalls();
    
    // Not enough volume to make a decision
    if (recentCalls.length < this.config.volumeThreshold) {
      return false;
    }

    const failures = recentCalls.filter(call => !call.success);
    const slowCalls = recentCalls.filter(call => call.duration > this.config.slowCallThreshold);
    
    const errorRate = (failures.length / recentCalls.length) * 100;
    const slowCallRate = (slowCalls.length / recentCalls.length) * 100;

    return errorRate >= this.config.errorThresholdPercentage ||
           slowCallRate >= this.config.slowCallPercentage;
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  private transitionToClosed(): void {
    const previousState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.stateTransitionTime = new Date();
    
    this.logStateChange(previousState, this.state);
    this.recordMetrics('state_change');
  }

  private transitionToOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.OPEN;
    this.stateTransitionTime = new Date();
    
    this.logStateChange(previousState, this.state);
    this.recordMetrics('state_change');
  }

  private transitionToHalfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    this.stateTransitionTime = new Date();
    
    this.logStateChange(previousState, this.state);
    this.recordMetrics('state_change');
  }

  private addCallRecord(record: CallRecord): void {
    this.callHistory.push(record);
    // Keep only recent records to prevent memory leaks
    if (this.callHistory.length > 1000) {
      this.callHistory = this.callHistory.slice(-500);
    }
  }

  private cleanupOldRecords(): void {
    const cutoffTime = Date.now() - this.config.monitoringPeriod;
    this.callHistory = this.callHistory.filter(record => record.timestamp > cutoffTime);
  }

  private getRecentCalls(): CallRecord[] {
    const cutoffTime = Date.now() - this.config.monitoringPeriod;
    return this.callHistory.filter(record => record.timestamp > cutoffTime);
  }

  private logStateChange(from: CircuitState, to: CircuitState): void {
    this.structuredLogger.warn(`Circuit breaker state changed: ${from} -> ${to}`, {
      ...this.contextService.toLogContext(),
      metadata: {
        circuitName: this.name,
        fromState: from,
        toState: to,
        failureCount: this.failureCount,
        successCount: this.successCount,
        lastFailureTime: this.lastFailureTime,
        config: this.config,
      },
    });
  }

  private logStateTransition(event: string): void {
    if (this.state !== CircuitState.CLOSED) {
      this.structuredLogger.debug(`Circuit breaker event: ${event}`, {
        ...this.contextService.toLogContext(),
        metadata: {
          circuitName: this.name,
          event,
          state: this.state,
          failureCount: this.failureCount,
          successCount: this.successCount,
        },
      });
    }
  }

  private recordMetrics(operation: string): void {
    const labels = {
      circuit: this.name,
      state: this.state,
      operation,
    };

    this.metricsService.increment('circuit_breaker_calls_total', labels);
    this.metricsService.gauge('circuit_breaker_state', this.getStateValue(), {
      circuit: this.name,
    });
    
    if (operation === 'state_change') {
      this.metricsService.increment('circuit_breaker_state_changes_total', {
        circuit: this.name,
        state: this.state,
      });
    }
  }

  private getStateValue(): number {
    switch (this.state) {
      case CircuitState.CLOSED: return 0;
      case CircuitState.HALF_OPEN: return 1;
      case CircuitState.OPEN: return 2;
      default: return -1;
    }
  }

  getStats(): CircuitBreakerStats {
    const recentCalls = this.getRecentCalls();
    const totalCalls = recentCalls.length;
    const failures = recentCalls.filter(call => !call.success);
    const slowCalls = recentCalls.filter(call => call.duration > this.config.slowCallThreshold);
    
    const avgResponseTime = totalCalls > 0 
      ? recentCalls.reduce((sum, call) => sum + call.duration, 0) / totalCalls 
      : 0;
    
    const errorRate = totalCalls > 0 ? (failures.length / totalCalls) * 100 : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateTransitionTime: this.stateTransitionTime,
      slowCallCount: slowCalls.length,
      averageResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  reset(): void {
    this.transitionToClosed();
    this.callHistory = [];
  this.structuredLogger.log(`Circuit breaker reset: ${this.name}`, this.contextService.toLogContext());
  }
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerInstance>();

  constructor(
  private readonly structuredLogger: StructuredLoggerService,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    // Initialize common circuit breakers
    this.initializeDefaultCircuits();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    circuitName: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(circuitName, config);
    return circuit.execute(fn);
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitStats(circuitName: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(circuitName);
    return circuit ? circuit.getStats() : null;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllCircuitStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuit] of this.circuits) {
      stats[name] = circuit.getStats();
    }
    
    return stats;
  }

  /**
   * Reset a specific circuit breaker
   */
  resetCircuit(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuits(): void {
    for (const circuit of this.circuits.values()) {
      circuit.reset();
    }
    this.structuredLogger.log(
      'All circuit breakers reset',
      this.contextService.toLogContext()
    );
  }

  /**
   * Create a circuit breaker decorator
   */
  createCircuitBreakerDecorator(circuitName: string, config?: Partial<CircuitBreakerConfig>) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const self: any = this;
        const circuitBreakerService: CircuitBreakerService | undefined = self?.circuitBreakerService;
        if (!circuitBreakerService) {
          logger.warn(`CircuitBreakerService not found in ${target.constructor?.name}. Executing without circuit breaker.`);
          return originalMethod.apply(self, args);
        }
        return circuitBreakerService.executeWithCircuitBreaker(
          circuitName,
          () => originalMethod.apply(self, args),
          config
        );
      };

      return descriptor;
    };
  }

  private getOrCreateCircuit(
    name: string,
    configOverrides?: Partial<CircuitBreakerConfig>
  ): CircuitBreakerInstance {
    if (!this.circuits.has(name)) {
      const config = { ...DEFAULT_CONFIG, ...configOverrides };
      const circuit = new CircuitBreakerInstance(
        name,
        config,
        this.structuredLogger,
        this.contextService,
        this.metricsService
      );
      this.circuits.set(name, circuit);
      
      this.structuredLogger.log(
        `Circuit breaker created: ${name}`,
        {
          ...this.contextService.toLogContext(),
          metadata: { circuitName: name, config },
        }
      );
    }
    
    return this.circuits.get(name)!;
  }

  private initializeDefaultCircuits(): void {
    // Database circuit breaker
    this.getOrCreateCircuit('database', {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 2,
      volumeThreshold: 10,
      errorThresholdPercentage: 60,
      slowCallThreshold: 5000,
      slowCallPercentage: 50,
    });

    // Cache circuit breaker
    this.getOrCreateCircuit('cache', {
      failureThreshold: 3,
      recoveryTimeout: 10000,
      monitoringPeriod: 30000,
      halfOpenMaxCalls: 3,
      volumeThreshold: 5,
      errorThresholdPercentage: 50,
      slowCallThreshold: 2000,
      slowCallPercentage: 70,
    });

    // External service circuit breaker
    this.getOrCreateCircuit('external_service', {
      failureThreshold: 3,
      recoveryTimeout: 60000,
      monitoringPeriod: 120000,
      halfOpenMaxCalls: 2,
      volumeThreshold: 5,
      errorThresholdPercentage: 40,
      slowCallThreshold: 10000,
      slowCallPercentage: 30,
    });
  }
}

/**
 * Circuit breaker decorator
 */
export function CircuitBreaker(circuitName: string, config?: Partial<CircuitBreakerConfig>) {
  // Use basic console logging for decorator since it's outside class context
  const logger = console;

  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const self: any = this;
      const circuitBreakerService: CircuitBreakerService | undefined = self?.circuitBreakerService;
      if (!circuitBreakerService) {
        logger.warn(`CircuitBreakerService not found in ${target.constructor?.name}. Executing without circuit breaker.`);
        return originalMethod.apply(self, args);
      }
      return circuitBreakerService.executeWithCircuitBreaker(
        circuitName,
        () => originalMethod.apply(self, args),
        config
      );
    };

    return descriptor;
  };
}
