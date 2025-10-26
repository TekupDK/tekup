#!/usr/bin/env node

/**
 * @fileoverview MCP Metrics Collection
 * 
 * Comprehensive metrics collection system for MCP Gateway with Prometheus
 * integration, custom metrics tracking, and performance monitoring.
 * 
 * @author TekUp.org Development Team
 * @version 1.0.0
 */

import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  Summary,
  collectDefaultMetrics,
  register as defaultRegister
} from 'prom-client';
import { EventEmitter } from 'events';
import { MCPLogger } from './logger.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface MetricsConfig {
  enabled: boolean;
  collectDefaults: boolean;
  prefix: string;
  labels: Record<string, string>;
  endpoint: string;
  customMetrics: {
    enabled: boolean;
    flushInterval: number;
  };
}

export interface CustomMetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

export interface MetricSnapshot {
  name: string;
  type: string;
  help: string;
  value: number | string;
  labels?: Record<string, string>;
  timestamp: number;
}

// =============================================================================
// METRICS CLASS
// =============================================================================

export class MCPMetrics extends EventEmitter {
  private logger: MCPLogger;
  private config: MetricsConfig;
  public register: Registry;
  
  // Core MCP Gateway metrics
  private requestsTotal: Counter<string>;
  private requestDuration: Histogram<string>;
  private activeConnections: Gauge<string>;
  private serviceHealthStatus: Gauge<string>;
  private proxyErrorsTotal: Counter<string>;
  private circuitBreakerState: Gauge<string>;
  
  // Load balancer metrics
  private loadBalancerSelections: Counter<string>;
  private serviceResponseTime: Histogram<string>;
  private instanceFailures: Counter<string>;
  
  // WebSocket metrics
  private websocketConnections: Gauge<string>;
  private websocketMessages: Counter<string>;
  private websocketErrors: Counter<string>;
  
  // Configuration and health metrics
  private configReloads: Counter<string>;
  private healthCheckDuration: Histogram<string>;
  private memoryUsage: Gauge<string>;
  private cpuUsage: Gauge<string>;
  
  // Custom metrics tracking
  private customCounters: Map<string, Counter<string>>;
  private customHistograms: Map<string, Histogram<string>>;
  private customGauges: Map<string, Gauge<string>>;
  
  constructor(logger?: MCPLogger) {
    super();
    
    this.logger = logger?.createChild('metrics') || new MCPLogger('metrics');
    this.register = new Registry();
    
    // Default configuration
    this.config = {
      enabled: true,
      collectDefaults: true,
      prefix: 'mcp_gateway_',
      labels: {
        service: 'mcp-gateway',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      endpoint: '/metrics',
      customMetrics: {
        enabled: true,
        flushInterval: 15000
      }
    };
    
    this.customCounters = new Map();
    this.customHistograms = new Map();
    this.customGauges = new Map();
    
    this.initializeMetrics();
  }
  
  /**
   * Initialize all metrics
   */
  private initializeMetrics(): void {
    // Collect default Node.js metrics
    if (this.config.collectDefaults) {
      collectDefaultMetrics({ register: this.register });
    }
    
    // Core HTTP/API metrics
    this.requestsTotal = new Counter({
      name: `${this.config.prefix}requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status_code', 'path', 'service'],
      registers: [this.register]
    });
    
    this.requestDuration = new Histogram({
      name: `${this.config.prefix}request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'service'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });
    
    this.activeConnections = new Gauge({
      name: `${this.config.prefix}active_connections`,
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    // Service health metrics
    this.serviceHealthStatus = new Gauge({
      name: `${this.config.prefix}service_health_status`,
      help: 'Health status of MCP services (1=healthy, 0=unhealthy)',
      labelNames: ['service_id', 'instance_id'],
      registers: [this.register]
    });
    
    this.proxyErrorsTotal = new Counter({
      name: `${this.config.prefix}proxy_errors_total`,
      help: 'Total number of proxy errors',
      labelNames: ['service', 'error_type'],
      registers: [this.register]
    });
    
    // Circuit breaker metrics
    this.circuitBreakerState = new Gauge({
      name: `${this.config.prefix}circuit_breaker_state`,
      help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
      labelNames: ['service', 'instance'],
      registers: [this.register]
    });
    
    // Load balancer metrics
    this.loadBalancerSelections = new Counter({
      name: `${this.config.prefix}load_balancer_selections_total`,
      help: 'Total number of load balancer instance selections',
      labelNames: ['service', 'instance', 'strategy'],
      registers: [this.register]
    });
    
    this.serviceResponseTime = new Histogram({
      name: `${this.config.prefix}service_response_time_seconds`,
      help: 'Response time from downstream services',
      labelNames: ['service', 'instance'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register]
    });
    
    this.instanceFailures = new Counter({
      name: `${this.config.prefix}instance_failures_total`,
      help: 'Total number of instance failures',
      labelNames: ['service', 'instance', 'failure_type'],
      registers: [this.register]
    });
    
    // WebSocket metrics
    this.websocketConnections = new Gauge({
      name: `${this.config.prefix}websocket_connections`,
      help: 'Number of active WebSocket connections',
      labelNames: ['service'],
      registers: [this.register]
    });
    
    this.websocketMessages = new Counter({
      name: `${this.config.prefix}websocket_messages_total`,
      help: 'Total number of WebSocket messages',
      labelNames: ['service', 'direction', 'message_type'],
      registers: [this.register]
    });
    
    this.websocketErrors = new Counter({
      name: `${this.config.prefix}websocket_errors_total`,
      help: 'Total number of WebSocket errors',
      labelNames: ['service', 'error_type'],
      registers: [this.register]
    });
    
    // Configuration and health metrics
    this.configReloads = new Counter({
      name: `${this.config.prefix}config_reloads_total`,
      help: 'Total number of configuration reloads',
      labelNames: ['status'],
      registers: [this.register]
    });
    
    this.healthCheckDuration = new Histogram({
      name: `${this.config.prefix}health_check_duration_seconds`,
      help: 'Health check duration in seconds',
      labelNames: ['service', 'instance'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register]
    });
    
    // System resource metrics
    this.memoryUsage = new Gauge({
      name: `${this.config.prefix}memory_usage_bytes`,
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [this.register]
    });
    
    this.cpuUsage = new Gauge({
      name: `${this.config.prefix}cpu_usage_percent`,
      help: 'CPU usage percentage',
      registers: [this.register]
    });
    
    // Start resource monitoring
    this.startResourceMonitoring();
    
    this.logger.info('Metrics initialized', {
      prefix: this.config.prefix,
      totalMetrics: this.register.getMetricsAsArray().length
    });
  }
  
  // =============================================================================
  // CORE METRIC METHODS
  // =============================================================================
  
  /**
   * Increment a counter metric
   */
  incrementCounter(metricName: string, labels: Record<string, string> = {}): void {
    try {
      const metric = this.getMetricByName(metricName);
      if (metric && metric instanceof Counter) {
        metric.inc(labels);
      }
    } catch (error) {
      this.logger.error('Error incrementing counter', { metricName, labels, error: error.message });
    }
  }
  
  /**
   * Observe a histogram metric
   */
  observeHistogram(metricName: string, value: number, labels: Record<string, string> = {}): void {
    try {
      const metric = this.getMetricByName(metricName);
      if (metric && metric instanceof Histogram) {
        metric.observe(labels, value);
      }
    } catch (error) {
      this.logger.error('Error observing histogram', { metricName, value, labels, error: error.message });
    }
  }
  
  /**
   * Set a gauge metric value
   */
  setGauge(metricName: string, value: number, labels: Record<string, string> = {}): void {
    try {
      const metric = this.getMetricByName(metricName);
      if (metric && metric instanceof Gauge) {
        metric.set(labels, value);
      }
    } catch (error) {
      this.logger.error('Error setting gauge', { metricName, value, labels, error: error.message });
    }
  }
  
  /**
   * Increment a gauge metric
   */
  incrementGauge(metricName: string, value: number = 1, labels: Record<string, string> = {}): void {
    try {
      const metric = this.getMetricByName(metricName);
      if (metric && metric instanceof Gauge) {
        metric.inc(labels, value);
      }
    } catch (error) {
      this.logger.error('Error incrementing gauge', { metricName, value, labels, error: error.message });
    }
  }
  
  /**
   * Decrement a gauge metric
   */
  decrementGauge(metricName: string, value: number = 1, labels: Record<string, string> = {}): void {
    try {
      const metric = this.getMetricByName(metricName);
      if (metric && metric instanceof Gauge) {
        metric.dec(labels, value);
      }
    } catch (error) {
      this.logger.error('Error decrementing gauge', { metricName, value, labels, error: error.message });
    }
  }
  
  // =============================================================================
  // SPECIALIZED METRIC METHODS
  // =============================================================================
  
  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number, service?: string): void {
    this.requestsTotal.inc({
      method,
      status_code: statusCode.toString(),
      path,
      service: service || 'gateway'
    });
    
    this.requestDuration.observe({
      method,
      path,
      service: service || 'gateway'
    }, duration);
  }
  
  /**
   * Record service health status
   */
  recordServiceHealth(serviceId: string, instanceId: string, healthy: boolean): void {
    this.serviceHealthStatus.set({
      service_id: serviceId,
      instance_id: instanceId
    }, healthy ? 1 : 0);
  }
  
  /**
   * Record circuit breaker state
   */
  recordCircuitBreakerState(service: string, instance: string, state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const stateValue = state === 'CLOSED' ? 0 : state === 'OPEN' ? 1 : 2;
    this.circuitBreakerState.set({ service, instance }, stateValue);
  }
  
  /**
   * Record load balancer selection
   */
  recordLoadBalancerSelection(service: string, instance: string, strategy: string): void {
    this.loadBalancerSelections.inc({ service, instance, strategy });
  }
  
  /**
   * Record service response time
   */
  recordServiceResponseTime(service: string, instance: string, responseTime: number): void {
    this.serviceResponseTime.observe({ service, instance }, responseTime);
  }
  
  /**
   * Record WebSocket connection change
   */
  recordWebSocketConnection(service: string, change: number): void {
    this.websocketConnections.inc({ service }, change);
  }
  
  /**
   * Record WebSocket message
   */
  recordWebSocketMessage(service: string, direction: 'inbound' | 'outbound', messageType: string): void {
    this.websocketMessages.inc({ service, direction, message_type: messageType });
  }
  
  /**
   * Record configuration reload
   */
  recordConfigReload(success: boolean): void {
    this.configReloads.inc({ status: success ? 'success' : 'failure' });
  }
  
  /**
   * Record health check duration
   */
  recordHealthCheckDuration(service: string, instance: string, duration: number): void {
    this.healthCheckDuration.observe({ service, instance }, duration);
  }
  
  // =============================================================================
  // CUSTOM METRICS
  // =============================================================================
  
  /**
   * Create a custom counter metric
   */
  createCustomCounter(name: string, help: string, labelNames: string[] = []): void {
    if (this.customCounters.has(name)) {
      this.logger.warn('Custom counter already exists', { name });
      return;
    }
    
    const counter = new Counter({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      registers: [this.register]
    });
    
    this.customCounters.set(name, counter);
    this.logger.info('Custom counter created', { name, help });
  }
  
  /**
   * Create a custom histogram metric
   */
  createCustomHistogram(name: string, help: string, labelNames: string[] = [], buckets?: number[]): void {
    if (this.customHistograms.has(name)) {
      this.logger.warn('Custom histogram already exists', { name });
      return;
    }
    
    const histogram = new Histogram({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      buckets: buckets || [0.001, 0.01, 0.1, 1, 10],
      registers: [this.register]
    });
    
    this.customHistograms.set(name, histogram);
    this.logger.info('Custom histogram created', { name, help });
  }
  
  /**
   * Create a custom gauge metric
   */
  createCustomGauge(name: string, help: string, labelNames: string[] = []): void {
    if (this.customGauges.has(name)) {
      this.logger.warn('Custom gauge already exists', { name });
      return;
    }
    
    const gauge = new Gauge({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames,
      registers: [this.register]
    });
    
    this.customGauges.set(name, gauge);
    this.logger.info('Custom gauge created', { name, help });
  }
  
  /**
   * Update custom metric
   */
  updateCustomMetric(name: string, value: CustomMetricValue): void {
    try {
      if (this.customCounters.has(name)) {
        this.customCounters.get(name)!.inc(value.labels || {}, value.value);
      } else if (this.customHistograms.has(name)) {
        this.customHistograms.get(name)!.observe(value.labels || {}, value.value);
      } else if (this.customGauges.has(name)) {
        this.customGauges.get(name)!.set(value.labels || {}, value.value);
      } else {
        this.logger.warn('Custom metric not found', { name });
      }
    } catch (error) {
      this.logger.error('Error updating custom metric', { name, error: error.message });
    }
  }
  
  // =============================================================================
  // CONFIGURATION AND MANAGEMENT
  // =============================================================================
  
  /**
   * Update metrics configuration
   */
  updateConfiguration(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Metrics configuration updated', { config: this.config });
  }
  
  /**
   * Get metrics snapshot
   */
  async getSnapshot(): Promise<MetricSnapshot[]> {
    const metricsString = await this.register.metrics();
    const lines = metricsString.split('\n');
    const snapshots: MetricSnapshot[] = [];
    
    let currentMetric: Partial<MetricSnapshot> = {};
    
    for (const line of lines) {
      if (line.startsWith('# HELP ')) {
        if (currentMetric.name) {
          snapshots.push(currentMetric as MetricSnapshot);
        }
        currentMetric = {
          name: line.split(' ')[2],
          help: line.substring(line.indexOf(currentMetric.name!) + currentMetric.name!.length + 1),
          timestamp: Date.now()
        };
      } else if (line.startsWith('# TYPE ')) {
        currentMetric.type = line.split(' ')[3];
      } else if (line && !line.startsWith('#')) {
        const spaceIndex = line.lastIndexOf(' ');
        if (spaceIndex > 0) {
          currentMetric.value = parseFloat(line.substring(spaceIndex + 1));
        }
      }
    }
    
    if (currentMetric.name) {
      snapshots.push(currentMetric as MetricSnapshot);
    }
    
    return snapshots;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.register.clear();
    this.customCounters.clear();
    this.customHistograms.clear();
    this.customGauges.clear();
    
    this.initializeMetrics();
    this.logger.info('All metrics reset and reinitialized');
  }
  
  /**
   * Get metrics statistics
   */
  getStatistics(): any {
    const metricsArray = this.register.getMetricsAsArray();
    
    return {
      totalMetrics: metricsArray.length,
      customMetrics: {
        counters: this.customCounters.size,
        histograms: this.customHistograms.size,
        gauges: this.customGauges.size
      },
      config: this.config,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
  
  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================
  
  private getMetricByName(name: string): any {
    // Handle prefixed names
    const fullName = name.startsWith(this.config.prefix) ? name : `${this.config.prefix}${name}`;
    
    // Map of metric names to instances
    const metricMap: Record<string, any> = {
      [`${this.config.prefix}requests_total`]: this.requestsTotal,
      [`${this.config.prefix}request_duration_seconds`]: this.requestDuration,
      [`${this.config.prefix}active_connections`]: this.activeConnections,
      [`${this.config.prefix}service_health_status`]: this.serviceHealthStatus,
      [`${this.config.prefix}proxy_errors_total`]: this.proxyErrorsTotal,
      [`${this.config.prefix}circuit_breaker_state`]: this.circuitBreakerState,
      [`${this.config.prefix}load_balancer_selections_total`]: this.loadBalancerSelections,
      [`${this.config.prefix}service_response_time_seconds`]: this.serviceResponseTime,
      [`${this.config.prefix}instance_failures_total`]: this.instanceFailures,
      [`${this.config.prefix}websocket_connections`]: this.websocketConnections,
      [`${this.config.prefix}websocket_messages_total`]: this.websocketMessages,
      [`${this.config.prefix}websocket_errors_total`]: this.websocketErrors,
      [`${this.config.prefix}config_reloads_total`]: this.configReloads,
      [`${this.config.prefix}health_check_duration_seconds`]: this.healthCheckDuration,
      [`${this.config.prefix}memory_usage_bytes`]: this.memoryUsage,
      [`${this.config.prefix}cpu_usage_percent`]: this.cpuUsage
    };
    
    return metricMap[fullName] || metricMap[name];
  }
  
  private startResourceMonitoring(): void {
    setInterval(() => {
      try {
        const memUsage = process.memoryUsage();
        this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
        this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
        this.memoryUsage.set({ type: 'external' }, memUsage.external);
        this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
        
        // CPU usage is more complex and would require additional libraries
        // For now, we'll emit an event that can be handled externally
        this.emit('resourceUpdate', { memory: memUsage });
        
      } catch (error) {
        this.logger.error('Error collecting resource metrics', error);
      }
    }, 10000); // Every 10 seconds
  }
}

export default MCPMetrics;