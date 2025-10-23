/**
 * Enhanced Health Monitoring System for Tekup-Billy MCP v2.0
 * 
 * Provides comprehensive health monitoring for Render.com deployment:
 * - Dependency health checks (Billy API, Supabase, Redis)
 * - Prometheus metrics collection and export
 * - Render.com monitoring integration
 * - Auto-scaling recommendations based on system metrics
 * - Performance monitoring and alerting
 */

import { log } from '../utils/logger.js';
import { BillyClient } from '../billy-client.js';
import { testConnection as testSupabaseConnection, isSupabaseEnabled } from '../database/supabase-client.js';
import { getRedisClusterManager, isRedisEnabled } from '../database/redis-cluster-manager.js';
import { getBillyConfig } from '../config.js';

// Health check interfaces
export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
  lastChecked: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  dependencies: HealthCheckResult[];
  metrics: SystemMetrics;
  recommendations?: string[];
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cache: {
    hitRate: number;
    size: number;
  };
  circuitBreaker: {
    state: string;
    failures: number;
    successes: number;
  };
}

export interface ScalingRecommendation {
  action: 'scale_up' | 'scale_down' | 'maintain';
  reason: string;
  currentInstances: number;
  recommendedInstances: number;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    requestRate: number;
    errorRate: number;
  };
}

/**
 * Prometheus metrics collector
 */
class PrometheusMetrics {
  private metrics = new Map<string, { value: number; labels?: Record<string, string>; timestamp: number }>();

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.metrics.set(name, { value, labels, timestamp: Date.now() });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const key = `${name}_${JSON.stringify(labels || {})}`;
    const existing = this.metrics.get(key);
    this.metrics.set(key, {
      value: (existing?.value || 0) + 1,
      labels,
      timestamp: Date.now()
    });
  }

  /**
   * Export metrics in Prometheus format
   */
  exportMetrics(): string {
    const lines: string[] = [];
    
    for (const [name, metric] of this.metrics) {
      const labelStr = metric.labels 
        ? Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')
        : '';
      
      const metricLine = labelStr 
        ? `${name}{${labelStr}} ${metric.value}`
        : `${name} ${metric.value}`;
      
      lines.push(metricLine);
    }
    
    return lines.join('\n');
  }

  /**
   * Get all metrics as JSON
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, metric] of this.metrics) {
      result[name] = metric;
    }
    return result;
  }
}

/**
 * Enhanced Health Monitor
 */
export class HealthMonitor {
  private startTime = Date.now();
  private prometheusMetrics = new PrometheusMetrics();
  private healthChecks = new Map<string, HealthCheckResult>();
  private billyClient: BillyClient | null = null;
  private lastMetricsUpdate = 0;
  private requestStats = {
    total: 0,
    successful: 0,
    failed: 0,
    totalResponseTime: 0
  };

  constructor() {
    // Initialize Billy client for health checks
    this.initializeBillyClient();
    
    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Initialize Billy client for health checks
   */
  private async initializeBillyClient(): Promise<void> {
    try {
      const config = getBillyConfig();
      this.billyClient = new BillyClient(config);
    } catch (error) {
      log.warn('Failed to initialize Billy client for health checks', { error });
    }
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Update Prometheus metrics every 15 seconds
    setInterval(() => {
      this.updatePrometheusMetrics();
    }, 15000);
  }

  /**
   * Perform health check on Billy.dk API
   */
  private async checkBillyApiHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      if (!this.billyClient) {
        throw new Error('Billy client not initialized');
      }

      const authResult = await this.billyClient.validateAuth();
      const responseTime = Date.now() - startTime;

      if (authResult.valid) {
        return {
          name: 'billy_api',
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          details: {
            organization: authResult.organization?.name,
            circuitBreakerState: this.billyClient.getHealthStatus().circuitBreaker.state
          }
        };
      } else {
        return {
          name: 'billy_api',
          status: 'unhealthy',
          responseTime,
          error: authResult.error,
          lastChecked: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        name: 'billy_api',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Perform health check on Supabase
   */
  private async checkSupabaseHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!isSupabaseEnabled()) {
      return {
        name: 'supabase',
        status: 'degraded',
        responseTime: 0,
        error: 'Supabase not configured',
        lastChecked: new Date().toISOString(),
        details: { configured: false }
      };
    }

    try {
      const isHealthy = await testSupabaseConnection();
      const responseTime = Date.now() - startTime;

      return {
        name: 'supabase',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: { configured: true }
      };
    } catch (error: any) {
      return {
        name: 'supabase',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Perform health check on Redis
   */
  private async checkRedisHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!isRedisEnabled()) {
      return {
        name: 'redis',
        status: 'degraded',
        responseTime: 0,
        error: 'Redis not configured',
        lastChecked: new Date().toISOString(),
        details: { configured: false }
      };
    }

    try {
      const redisManager = getRedisClusterManager();
      const healthStatus = await redisManager.getHealthStatus();
      const responseTime = Date.now() - startTime;

      const status = healthStatus.connected ? 'healthy' : 'unhealthy';

      return {
        name: 'redis',
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          configured: true,
          connected: healthStatus.connected,
          circuitBreakerState: healthStatus.circuitBreakerState,
          nodeCount: healthStatus.nodeCount,
          metrics: healthStatus.metrics
        }
      };
    } catch (error: any) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      // CPU metrics (simplified - would need more sophisticated monitoring in production)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = Math.round((cpuUsage.user + cpuUsage.system) / 1000000); // Convert to percentage

      this.lastMetricsUpdate = Date.now();

      log.debug('System metrics collected', {
        memory: { used: memUsedMB, total: memTotalMB },
        cpu: { usage: cpuPercent },
        uptime: Math.round((Date.now() - this.startTime) / 1000)
      });
    } catch (error) {
      log.error('Failed to collect system metrics', error);
    }
  }

  /**
   * Update Prometheus metrics
   */
  private updatePrometheusMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const uptime = (Date.now() - this.startTime) / 1000;

      // System metrics
      this.prometheusMetrics.setGauge('tekup_billy_memory_used_bytes', memUsage.heapUsed);
      this.prometheusMetrics.setGauge('tekup_billy_memory_total_bytes', memUsage.heapTotal);
      this.prometheusMetrics.setGauge('tekup_billy_uptime_seconds', uptime);

      // Request metrics
      this.prometheusMetrics.setGauge('tekup_billy_requests_total', this.requestStats.total);
      this.prometheusMetrics.setGauge('tekup_billy_requests_successful', this.requestStats.successful);
      this.prometheusMetrics.setGauge('tekup_billy_requests_failed', this.requestStats.failed);

      if (this.requestStats.total > 0) {
        const avgResponseTime = this.requestStats.totalResponseTime / this.requestStats.total;
        this.prometheusMetrics.setGauge('tekup_billy_response_time_avg_ms', avgResponseTime);
      }

      // Health check metrics
      for (const [name, healthCheck] of this.healthChecks) {
        const statusValue = healthCheck.status === 'healthy' ? 1 : 0;
        this.prometheusMetrics.setGauge(`tekup_billy_dependency_healthy`, statusValue, { dependency: name });
        this.prometheusMetrics.setGauge(`tekup_billy_dependency_response_time_ms`, healthCheck.responseTime, { dependency: name });
      }
    } catch (error) {
      log.error('Failed to update Prometheus metrics', error);
    }
  }

  /**
   * Record request metrics
   */
  recordRequest(success: boolean, responseTime: number): void {
    this.requestStats.total++;
    this.requestStats.totalResponseTime += responseTime;
    
    if (success) {
      this.requestStats.successful++;
    } else {
      this.requestStats.failed++;
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();

    try {
      // Run all health checks in parallel
      const [billyHealth, supabaseHealth, redisHealth] = await Promise.all([
        this.checkBillyApiHealth(),
        this.checkSupabaseHealth(),
        this.checkRedisHealth()
      ]);

      // Store health check results
      this.healthChecks.set('billy_api', billyHealth);
      this.healthChecks.set('supabase', supabaseHealth);
      this.healthChecks.set('redis', redisHealth);

      const dependencies = [billyHealth, supabaseHealth, redisHealth];

      // Determine overall system status
      const hasUnhealthy = dependencies.some(dep => dep.status === 'unhealthy');
      const hasDegraded = dependencies.some(dep => dep.status === 'degraded');
      
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      // Collect system metrics
      const memUsage = process.memoryUsage();
      const uptime = (Date.now() - this.startTime) / 1000;

      const metrics: SystemMetrics = {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        cpu: {
          usage: 0 // Would need more sophisticated CPU monitoring
        },
        requests: {
          total: this.requestStats.total,
          successful: this.requestStats.successful,
          failed: this.requestStats.failed,
          averageResponseTime: this.requestStats.total > 0 
            ? this.requestStats.totalResponseTime / this.requestStats.total 
            : 0
        },
        cache: {
          hitRate: 0, // Would be populated by cache manager
          size: 0
        },
        circuitBreaker: {
          state: this.billyClient?.getHealthStatus().circuitBreaker.state || 'unknown',
          failures: this.billyClient?.getHealthStatus().circuitBreaker.stats.failures || 0,
          successes: this.billyClient?.getHealthStatus().circuitBreaker.stats.successes || 0
        }
      };

      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, dependencies);

      const result: SystemHealth = {
        status: overallStatus,
        version: process.env.npm_package_version || '2.0.0',
        uptime,
        timestamp: new Date().toISOString(),
        dependencies,
        metrics,
        recommendations
      };

      const duration = Date.now() - startTime;
      log.info('Health check completed', {
        status: overallStatus,
        duration,
        dependencyCount: dependencies.length
      });

      return result;
    } catch (error) {
      log.error('Health check failed', error);
      
      return {
        status: 'unhealthy',
        version: process.env.npm_package_version || '2.0.0',
        uptime: (Date.now() - this.startTime) / 1000,
        timestamp: new Date().toISOString(),
        dependencies: [],
        metrics: {} as SystemMetrics,
        recommendations: ['Health check system failure - investigate immediately']
      };
    }
  }

  /**
   * Generate scaling recommendations
   */
  generateScalingRecommendation(): ScalingRecommendation {
    const memUsage = process.memoryUsage();
    const memoryUsage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const errorRate = this.requestStats.total > 0 
      ? (this.requestStats.failed / this.requestStats.total) * 100 
      : 0;
    const requestRate = this.requestStats.total; // Simplified

    // Simple scaling logic (would be more sophisticated in production)
    let action: 'scale_up' | 'scale_down' | 'maintain' = 'maintain';
    let reason = 'System metrics within normal range';
    let recommendedInstances = 2; // Default

    if (memoryUsage > 80 || errorRate > 5) {
      action = 'scale_up';
      reason = `High resource usage: Memory ${memoryUsage.toFixed(1)}%, Error rate ${errorRate.toFixed(1)}%`;
      recommendedInstances = 4;
    } else if (memoryUsage < 30 && errorRate < 1 && requestRate < 10) {
      action = 'scale_down';
      reason = 'Low resource usage - can reduce instances';
      recommendedInstances = 1;
    }

    return {
      action,
      reason,
      currentInstances: parseInt(process.env.RENDER_INSTANCE_COUNT || '2'),
      recommendedInstances,
      metrics: {
        cpuUsage: 0, // Would need proper CPU monitoring
        memoryUsage,
        requestRate,
        errorRate
      }
    };
  }

  /**
   * Generate system recommendations
   */
  private generateRecommendations(metrics: SystemMetrics, dependencies: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    if (metrics.memory.percentage > 80) {
      recommendations.push('High memory usage detected - consider scaling up or optimizing memory usage');
    }

    // Error rate recommendations
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.failed / metrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 5) {
      recommendations.push(`High error rate (${errorRate.toFixed(1)}%) - investigate failing requests`);
    }

    // Circuit breaker recommendations
    if (metrics.circuitBreaker.state === 'open') {
      recommendations.push('Circuit breaker is open - Billy API may be experiencing issues');
    }

    // Dependency recommendations
    const unhealthyDeps = dependencies.filter(dep => dep.status === 'unhealthy');
    if (unhealthyDeps.length > 0) {
      recommendations.push(`Unhealthy dependencies: ${unhealthyDeps.map(d => d.name).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Export Prometheus metrics
   */
  exportPrometheusMetrics(): string {
    return this.prometheusMetrics.exportMetrics();
  }

  /**
   * Get metrics as JSON
   */
  getMetrics(): Record<string, any> {
    return this.prometheusMetrics.getMetrics();
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }
}

/**
 * Global health monitor instance
 */
let healthMonitor: HealthMonitor | null = null;

/**
 * Get or create health monitor
 */
export function getHealthMonitor(): HealthMonitor {
  if (!healthMonitor) {
    healthMonitor = new HealthMonitor();
  }
  return healthMonitor;
}

/**
 * Initialize health monitoring
 */
export function initializeHealthMonitoring(): HealthMonitor {
  return getHealthMonitor();
}