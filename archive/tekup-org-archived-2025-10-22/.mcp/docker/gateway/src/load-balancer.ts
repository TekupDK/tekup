#!/usr/bin/env node

/**
 * @fileoverview MCP Load Balancer
 * 
 * Implements intelligent load balancing strategies for MCP services with
 * health-aware routing, circuit breaker pattern, and performance optimization.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { MCPServiceDiscovery, ServiceConfig, ServiceInstance } from './service-discovery.js';
import { MCPLogger } from './logger.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface LoadBalancingStrategy {
  name: string;
  description: string;
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttemptTime: number;
}

export interface LoadBalancerConfig {
  strategy: string;
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeoutMs: number;
    halfOpenMaxRequests: number;
  };
  healthCheck: {
    enabled: boolean;
    unhealthyThreshold: number;
  };
}

export interface InstanceStats {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  lastRequestTime: number;
  connectionPool: number;
}

// =============================================================================
// LOAD BALANCING STRATEGIES
// =============================================================================

/**
 * Round Robin load balancing strategy
 */
class RoundRobinStrategy implements LoadBalancingStrategy {
  name = 'round-robin';
  description = 'Distributes requests evenly across all healthy instances';
  
  private counters = new Map<string, number>();
  
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;
    
    const serviceId = instances[0].serviceId;
    const counter = this.counters.get(serviceId) || 0;
    const selectedIndex = counter % instances.length;
    
    this.counters.set(serviceId, counter + 1);
    return instances[selectedIndex];
  }
}

/**
 * Least Connections load balancing strategy
 */
class LeastConnectionsStrategy implements LoadBalancingStrategy {
  name = 'least-connections';
  description = 'Routes to the instance with fewest active connections';
  
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;
    
    return instances.reduce((least, current) => {
      const leastConnections = least.metadata?.connections || 0;
      const currentConnections = current.metadata?.connections || 0;
      
      return currentConnections < leastConnections ? current : least;
    });
  }
}

/**
 * Least Response Time strategy
 */
class LeastResponseTimeStrategy implements LoadBalancingStrategy {
  name = 'least-response-time';
  description = 'Routes to the instance with lowest average response time';
  
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;
    
    return instances.reduce((fastest, current) => {
      const fastestTime = fastest.metadata?.avgResponseTime || Infinity;
      const currentTime = current.metadata?.avgResponseTime || Infinity;
      
      return currentTime < fastestTime ? current : fastest;
    });
  }
}

/**
 * Weighted Round Robin strategy
 */
class WeightedRoundRobinStrategy implements LoadBalancingStrategy {
  name = 'weighted-round-robin';
  description = 'Distributes requests based on instance weights';
  
  private currentWeights = new Map<string, number>();
  
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    if (instances.length === 0) return null;
    
    const serviceId = instances[0].serviceId;
    let totalWeight = 0;
    let selected: ServiceInstance | null = null;
    let maxCurrentWeight = -1;
    
    for (const instance of instances) {
      const weight = instance.weight || 1;
      const instanceKey = `${serviceId}-${instance.instanceId}`;
      const currentWeight = (this.currentWeights.get(instanceKey) || 0) + weight;
      
      this.currentWeights.set(instanceKey, currentWeight);
      totalWeight += weight;
      
      if (currentWeight > maxCurrentWeight) {
        maxCurrentWeight = currentWeight;
        selected = instance;
      }
    }
    
    if (selected) {
      const selectedKey = `${serviceId}-${selected.instanceId}`;
      this.currentWeights.set(selectedKey, maxCurrentWeight - totalWeight);
    }
    
    return selected;
  }
}

// =============================================================================
// LOAD BALANCER CLASS
// =============================================================================

export class MCPLoadBalancer extends EventEmitter {
  private serviceDiscovery: MCPServiceDiscovery;
  private logger: MCPLogger;
  private config: LoadBalancerConfig;
  private strategies: Map<string, LoadBalancingStrategy>;
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private instanceStats: Map<string, InstanceStats>;
  private requestTracking: Map<string, number>;
  
  constructor(serviceDiscovery: MCPServiceDiscovery, logger: MCPLogger) {
    super();
    
    this.serviceDiscovery = serviceDiscovery;
    this.logger = logger.createChild('load-balancer');
    
    // Default configuration
    this.config = {
      strategy: 'round-robin',
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeoutMs: 30000,
        halfOpenMaxRequests: 3
      },
      healthCheck: {
        enabled: true,
        unhealthyThreshold: 3
      }
    };
    
    this.strategies = new Map();
    this.circuitBreakers = new Map();
    this.instanceStats = new Map();
    this.requestTracking = new Map();
    
    this.initializeStrategies();
    this.setupEventListeners();
  }
  
  /**
   * Initialize load balancing strategies
   */
  private initializeStrategies(): void {
    this.strategies.set('round-robin', new RoundRobinStrategy());
    this.strategies.set('least-connections', new LeastConnectionsStrategy());
    this.strategies.set('least-response-time', new LeastResponseTimeStrategy());
    this.strategies.set('weighted-round-robin', new WeightedRoundRobinStrategy());
    
    this.logger.info('Load balancing strategies initialized', {
      strategies: Array.from(this.strategies.keys())
    });
  }
  
  /**
   * Setup event listeners for service discovery
   */
  private setupEventListeners(): void {
    this.serviceDiscovery.on('serviceAdded', (serviceId: string, instance: ServiceInstance) => {
      this.resetCircuitBreaker(`${serviceId}-${instance.instanceId}`);
      this.initializeInstanceStats(`${serviceId}-${instance.instanceId}`);
      this.logger.info('Service instance added to load balancer', { serviceId, instanceId: instance.instanceId });
    });
    
    this.serviceDiscovery.on('serviceRemoved', (serviceId: string, instanceId: string) => {
      const key = `${serviceId}-${instanceId}`;
      this.circuitBreakers.delete(key);
      this.instanceStats.delete(key);
      this.logger.info('Service instance removed from load balancer', { serviceId, instanceId });
    });
    
    this.serviceDiscovery.on('serviceHealthChanged', (serviceId: string, instanceId: string, healthy: boolean) => {
      if (!healthy) {
        this.recordFailure(`${serviceId}-${instanceId}`);
      }
    });
  }
  
  /**
   * Get the best available instance for a service
   */
  async getServiceInstance(serviceId: string): Promise<ServiceInstance | null> {
    try {
      const allInstances = this.serviceDiscovery.getServiceInstances(serviceId);
      if (!allInstances || allInstances.length === 0) {
        this.logger.warn('No instances available for service', { serviceId });
        return null;
      }
      
      // Filter healthy instances
      const healthyInstances = this.filterHealthyInstances(allInstances);
      if (healthyInstances.length === 0) {
        this.logger.warn('No healthy instances available for service', { serviceId });
        return null;
      }
      
      // Apply load balancing strategy
      const strategy = this.strategies.get(this.config.strategy);
      if (!strategy) {
        this.logger.error('Unknown load balancing strategy', { strategy: this.config.strategy });
        return healthyInstances[0]; // Fallback to first instance
      }
      
      const selectedInstance = strategy.selectInstance(healthyInstances);
      
      if (selectedInstance) {
        this.recordRequest(`${serviceId}-${selectedInstance.instanceId}`);
        this.logger.debug('Instance selected by load balancer', {
          serviceId,
          instanceId: selectedInstance.instanceId,
          strategy: strategy.name
        });
      }
      
      return selectedInstance;
    } catch (error) {
      this.logger.error('Error in load balancer instance selection', { serviceId, error: error.message });
      return null;
    }
  }
  
  /**
   * Filter instances based on health and circuit breaker state
   */
  private filterHealthyInstances(instances: ServiceInstance[]): ServiceInstance[] {
    return instances.filter(instance => {
      const instanceKey = `${instance.serviceId}-${instance.instanceId}`;
      
      // Check health status
      if (this.config.healthCheck.enabled && !instance.healthy) {
        return false;
      }
      
      // Check circuit breaker state
      if (this.config.circuitBreaker.enabled) {
        const circuitBreaker = this.circuitBreakers.get(instanceKey);
        if (circuitBreaker && circuitBreaker.state === 'OPEN') {
          // Check if circuit breaker should transition to half-open
          if (Date.now() >= circuitBreaker.nextAttemptTime) {
            circuitBreaker.state = 'HALF_OPEN';
            this.logger.info('Circuit breaker transitioning to half-open', { instanceKey });
          } else {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  /**
   * Record a successful request
   */
  recordSuccess(serviceId: string, instanceId: string, responseTime: number): void {
    const instanceKey = `${serviceId}-${instanceId}`;
    
    // Update instance stats
    this.updateInstanceStats(instanceKey, responseTime, false);
    
    // Reset circuit breaker on success
    if (this.config.circuitBreaker.enabled) {
      const circuitBreaker = this.circuitBreakers.get(instanceKey);
      if (circuitBreaker) {
        if (circuitBreaker.state === 'HALF_OPEN' || circuitBreaker.state === 'OPEN') {
          this.resetCircuitBreaker(instanceKey);
          this.logger.info('Circuit breaker reset after successful request', { instanceKey });
        }
      }
    }
    
    this.emit('requestSuccess', { serviceId, instanceId, responseTime });
  }
  
  /**
   * Record a failed request
   */
  recordFailure(instanceKey: string, error?: Error): void {
    // Update instance stats
    this.updateInstanceStats(instanceKey, 0, true);
    
    // Update circuit breaker
    if (this.config.circuitBreaker.enabled) {
      const circuitBreaker = this.getOrCreateCircuitBreaker(instanceKey);
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();
      
      // Check if threshold is exceeded
      if (circuitBreaker.failures >= this.config.circuitBreaker.failureThreshold) {
        circuitBreaker.state = 'OPEN';
        circuitBreaker.nextAttemptTime = Date.now() + this.config.circuitBreaker.recoveryTimeoutMs;
        
        this.logger.warn('Circuit breaker opened due to failures', {
          instanceKey,
          failures: circuitBreaker.failures,
          nextAttemptTime: new Date(circuitBreaker.nextAttemptTime).toISOString()
        });
      }
    }
    
    const [serviceId, instanceId] = instanceKey.split('-');
    this.emit('requestFailure', { serviceId, instanceId, error: error?.message });
  }
  
  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Load balancer configuration updated', { config: this.config });
  }
  
  /**
   * Get load balancer statistics
   */
  getStatistics(): any {
    const stats = {
      strategy: this.config.strategy,
      totalInstances: this.instanceStats.size,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([key, state]) => ({
        instance: key,
        state: state.state,
        failures: state.failures
      })),
      instanceStats: Array.from(this.instanceStats.entries()).map(([key, stats]) => ({
        instance: key,
        requestCount: stats.requestCount,
        errorCount: stats.errorCount,
        avgResponseTime: stats.avgResponseTime,
        errorRate: stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0
      }))
    };
    
    return stats;
  }
  
  /**
   * Get available strategies
   */
  getAvailableStrategies(): Array<{ name: string; description: string }> {
    return Array.from(this.strategies.values()).map(strategy => ({
      name: strategy.name,
      description: strategy.description
    }));
  }
  
  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================
  
  private getOrCreateCircuitBreaker(instanceKey: string): CircuitBreakerState {
    let circuitBreaker = this.circuitBreakers.get(instanceKey);
    if (!circuitBreaker) {
      circuitBreaker = this.createCircuitBreaker();
      this.circuitBreakers.set(instanceKey, circuitBreaker);
    }
    return circuitBreaker;
  }
  
  private createCircuitBreaker(): CircuitBreakerState {
    return {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED',
      nextAttemptTime: 0
    };
  }
  
  private resetCircuitBreaker(instanceKey: string): void {
    this.circuitBreakers.set(instanceKey, this.createCircuitBreaker());
  }
  
  private initializeInstanceStats(instanceKey: string): void {
    this.instanceStats.set(instanceKey, {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      lastRequestTime: Date.now(),
      connectionPool: 0
    });
  }
  
  private updateInstanceStats(instanceKey: string, responseTime: number, isError: boolean): void {
    let stats = this.instanceStats.get(instanceKey);
    if (!stats) {
      stats = {
        requestCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        lastRequestTime: Date.now(),
        connectionPool: 0
      };
    }
    
    stats.requestCount++;
    if (isError) {
      stats.errorCount++;
    } else {
      // Update average response time using exponential moving average
      stats.avgResponseTime = stats.avgResponseTime === 0 
        ? responseTime 
        : (stats.avgResponseTime * 0.9) + (responseTime * 0.1);
    }
    stats.lastRequestTime = Date.now();
    
    this.instanceStats.set(instanceKey, stats);
  }
  
  private recordRequest(instanceKey: string): void {
    const currentCount = this.requestTracking.get(instanceKey) || 0;
    this.requestTracking.set(instanceKey, currentCount + 1);
  }
}

export default MCPLoadBalancer;