/**
 * @fileoverview MCP Health Monitor System
 * 
 * Comprehensive health monitoring for MCP services with alerting,
 * recovery strategies, and detailed health metrics collection.
 */

import { EventEmitter } from 'events';
import { MCPServiceDiscovery, ServiceConfig, HealthCheckResult } from './service-discovery.js';
import { MCPLogger } from './logger.js';

// =============================================================================
// INTERFACES
// =============================================================================

export interface HealthStatus {
  serviceId: string;
  serviceName: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime: number;
  uptime: number;
  consecutiveFailures: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HealthMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastFailure?: Date;
  lastSuccess?: Date;
}

export interface AlertConfig {
  enabled: boolean;
  maxConsecutiveFailures: number;
  responseTimeThreshold: number;
  uptimeThreshold: number;
  channels: string[];
}

// =============================================================================
// HEALTH MONITOR CLASS
// =============================================================================

export class MCPHealthMonitor extends EventEmitter {
  private serviceDiscovery: MCPServiceDiscovery;
  private logger: MCPLogger;
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private healthMetrics: Map<string, HealthMetrics> = new Map();
  private monitoringInterval?: NodeJS.Timeout;
  private alertConfig: AlertConfig;
  private isMonitoring = false;
  
  constructor(serviceDiscovery: MCPServiceDiscovery, logger: MCPLogger) {
    super();
    this.serviceDiscovery = serviceDiscovery;
    this.logger = logger;
    
    // Default alert configuration
    this.alertConfig = {
      enabled: process.env.NODE_ENV === 'production',
      maxConsecutiveFailures: 3,
      responseTimeThreshold: 5000, // 5 seconds
      uptimeThreshold: 0.95, // 95%
      channels: ['console', 'log']
    };
    
    this.setupServiceDiscoveryListeners();
  }
  
  /**
   * Setup listeners for service discovery events
   */
  private setupServiceDiscoveryListeners(): void {
    this.serviceDiscovery.on('serviceRegistered', (event) => {
      this.initializeHealthStatus(event.serviceId, event.config);
    });
    
    this.serviceDiscovery.on('serviceUnregistered', (event) => {
      this.removeHealthStatus(event.serviceId);
    });
    
    this.serviceDiscovery.on('serviceHealthy', (event) => {
      this.updateHealthStatus(event.serviceId, true);
    });
    
    this.serviceDiscovery.on('serviceUnhealthy', (event) => {
      this.updateHealthStatus(event.serviceId, false, event.error);
    });
  }
  
  /**
   * Start health monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      this.logger.warn('Health monitoring is already running');
      return;
    }
    
    this.isMonitoring = true;
    
    // Initialize health statuses for existing services
    this.initializeExistingServices();
    
    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthMonitoring();
    }, intervalMs);
    
    this.logger.info('Health monitoring started', {
      intervalMs,
      serviceCount: this.healthStatuses.size
    });
    
    this.emit('monitoringStarted', {
      intervalMs,
      serviceCount: this.healthStatuses.size
    });
  }
  
  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.logger.info('Health monitoring stopped');
    this.emit('monitoringStopped');
  }
  
  /**
   * Initialize health statuses for existing services
   */
  private initializeExistingServices(): void {
    const services = this.serviceDiscovery.getServices();
    
    for (const [serviceId, service] of services) {
      this.initializeHealthStatus(serviceId, service);
    }
  }
  
  /**
   * Initialize health status for a service
   */
  private initializeHealthStatus(serviceId: string, service: ServiceConfig): void {
    if (!this.healthStatuses.has(serviceId)) {
      this.healthStatuses.set(serviceId, {
        serviceId,
        serviceName: service.name,
        healthy: false,
        lastCheck: new Date(0),
        responseTime: 0,
        uptime: 0,
        consecutiveFailures: 0
      });
    }
    
    if (!this.healthMetrics.has(serviceId)) {
      this.healthMetrics.set(serviceId, {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
        uptimePercentage: 100
      });
    }
    
    this.logger.debug('Health status initialized', { serviceId });
  }
  
  /**
   * Remove health status for a service
   */
  private removeHealthStatus(serviceId: string): void {
    this.healthStatuses.delete(serviceId);
    this.healthMetrics.delete(serviceId);
    
    this.logger.debug('Health status removed', { serviceId });
  }
  
  /**
   * Update health status for a service
   */
  private updateHealthStatus(serviceId: string, healthy: boolean, error?: string): void {
    const status = this.healthStatuses.get(serviceId);
    const metrics = this.healthMetrics.get(serviceId);
    
    if (!status || !metrics) {
      this.logger.warn('Attempted to update health status for unknown service', { serviceId });
      return;
    }
    
    const previousHealthy = status.healthy;
    status.healthy = healthy;
    status.lastCheck = new Date();
    status.error = error;
    
    // Update metrics
    metrics.totalChecks++;
    
    if (healthy) {
      metrics.successfulChecks++;
      metrics.lastSuccess = new Date();
      status.consecutiveFailures = 0;
      
      // Update uptime calculation
      status.uptime = this.calculateUptime(serviceId);
    } else {
      metrics.failedChecks++;
      metrics.lastFailure = new Date();
      status.consecutiveFailures++;
    }
    
    // Update average response time (if we have it)
    if (status.responseTime > 0) {
      metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.totalChecks - 1) + status.responseTime) / metrics.totalChecks;
    }
    
    // Calculate uptime percentage
    metrics.uptimePercentage = (metrics.successfulChecks / metrics.totalChecks) * 100;
    
    // Check for alerts
    if (this.alertConfig.enabled) {
      this.checkAlertConditions(serviceId, status, metrics);
    }
    
    // Emit health status change events
    if (previousHealthy !== healthy) {
      this.emit('healthStatusChanged', {
        serviceId,
        healthy,
        previousHealthy,
        status,
        metrics
      });
      
      if (healthy) {
        this.emit('serviceRecovered', { serviceId, status });
      } else {
        this.emit('serviceDown', { serviceId, status, error });
      }
    }
  }
  
  /**
   * Perform health monitoring for all services
   */
  private async performHealthMonitoring(): Promise<void> {
    const services = this.serviceDiscovery.getServices();
    
    for (const [serviceId, service] of services) {
      try {
        const healthResult = await this.serviceDiscovery.performHealthCheck(service);
        const status = this.healthStatuses.get(serviceId);
        
        if (status) {
          status.responseTime = healthResult.responseTime;
          status.metadata = healthResult.metadata;
        }
        
        this.updateHealthStatus(serviceId, healthResult.healthy, healthResult.error);
      } catch (error) {
        this.logger.error('Error during health check', {
          serviceId,
          error: error.message
        });
        
        this.updateHealthStatus(serviceId, false, error.message);
      }
    }
  }
  
  /**
   * Calculate service uptime in seconds
   */
  private calculateUptime(serviceId: string): number {
    const metrics = this.healthMetrics.get(serviceId);
    if (!metrics || metrics.totalChecks === 0) {
      return 0;
    }
    
    // Simple uptime calculation based on success ratio
    const uptimeRatio = metrics.successfulChecks / metrics.totalChecks;
    const totalTimeSpan = Date.now() - (metrics.lastSuccess?.getTime() || Date.now());
    
    return Math.floor(totalTimeSpan * uptimeRatio / 1000);
  }
  
  /**
   * Check alert conditions and trigger alerts if necessary
   */
  private checkAlertConditions(serviceId: string, status: HealthStatus, metrics: HealthMetrics): void {
    const alerts: string[] = [];
    
    // Consecutive failures alert
    if (status.consecutiveFailures >= this.alertConfig.maxConsecutiveFailures) {
      alerts.push(`Service has ${status.consecutiveFailures} consecutive failures`);
    }
    
    // Response time alert
    if (status.responseTime > this.alertConfig.responseTimeThreshold) {
      alerts.push(`Response time (${status.responseTime}ms) exceeds threshold (${this.alertConfig.responseTimeThreshold}ms)`);
    }
    
    // Uptime alert
    if (metrics.uptimePercentage < this.alertConfig.uptimeThreshold * 100) {
      alerts.push(`Uptime (${metrics.uptimePercentage.toFixed(2)}%) below threshold (${this.alertConfig.uptimeThreshold * 100}%)`);
    }
    
    // Trigger alerts
    for (const alertMessage of alerts) {
      this.triggerAlert(serviceId, alertMessage, status, metrics);
    }
  }
  
  /**
   * Trigger an alert for a service
   */
  private triggerAlert(serviceId: string, message: string, status: HealthStatus, metrics: HealthMetrics): void {
    const alert = {
      serviceId,
      serviceName: status.serviceName,
      message,
      timestamp: new Date(),
      status,
      metrics
    };
    
    this.emit('alert', alert);
    
    // Send alerts through configured channels
    for (const channel of this.alertConfig.channels) {
      this.sendAlert(channel, alert);
    }
    
    this.logger.warn('Health alert triggered', {
      serviceId,
      message,
      consecutiveFailures: status.consecutiveFailures
    });
  }
  
  /**
   * Send alert through a specific channel
   */
  private sendAlert(channel: string, alert: any): void {
    switch (channel) {
      case 'console':
        console.error(`🚨 HEALTH ALERT: ${alert.serviceName} - ${alert.message}`);
        break;
        
      case 'log':
        this.logger.error('Health alert', alert);
        break;
        
      case 'webhook':
        // Could implement webhook notifications here
        this.logger.debug('Webhook alert would be sent', { alert });
        break;
        
      default:
        this.logger.warn('Unknown alert channel', { channel });
    }
  }
  
  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceId: string): HealthStatus | undefined {
    return this.healthStatuses.get(serviceId);
  }
  
  /**
   * Get health metrics for a specific service
   */
  getServiceMetrics(serviceId: string): HealthMetrics | undefined {
    return this.healthMetrics.get(serviceId);
  }
  
  /**
   * Get health status for all services
   */
  getAllServiceHealth(): Record<string, HealthStatus> {
    const result: Record<string, HealthStatus> = {};
    
    for (const [serviceId, status] of this.healthStatuses) {
      result[serviceId] = { ...status };
    }
    
    return result;
  }
  
  /**
   * Get health metrics for all services
   */
  getAllServiceMetrics(): Record<string, HealthMetrics> {
    const result: Record<string, HealthMetrics> = {};
    
    for (const [serviceId, metrics] of this.healthMetrics) {
      result[serviceId] = { ...metrics };
    }
    
    return result;
  }
  
  /**
   * Get overall health summary
   */
  getHealthSummary(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    overallHealth: boolean;
    averageUptime: number;
    alerts: number;
  } {
    const services = Array.from(this.healthStatuses.values());
    const metrics = Array.from(this.healthMetrics.values());
    
    const healthyCount = services.filter(s => s.healthy).length;
    const unhealthyCount = services.length - healthyCount;
    
    const averageUptime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.uptimePercentage, 0) / metrics.length
      : 100;
    
    const alertCount = services.reduce((sum, s) => sum + (s.consecutiveFailures >= this.alertConfig.maxConsecutiveFailures ? 1 : 0), 0);
    
    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      unhealthyServices: unhealthyCount,
      overallHealth: unhealthyCount === 0,
      averageUptime,
      alerts: alertCount
    };
  }
  
  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    
    this.logger.info('Alert configuration updated', { config: this.alertConfig });
    this.emit('alertConfigUpdated', this.alertConfig);
  }
  
  /**
   * Reset metrics for a service
   */
  resetServiceMetrics(serviceId: string): void {
    const metrics = this.healthMetrics.get(serviceId);
    if (metrics) {
      metrics.totalChecks = 0;
      metrics.successfulChecks = 0;
      metrics.failedChecks = 0;
      metrics.averageResponseTime = 0;
      metrics.uptimePercentage = 100;
      metrics.lastFailure = undefined;
      metrics.lastSuccess = undefined;
      
      this.logger.info('Service metrics reset', { serviceId });
      this.emit('metricsReset', { serviceId });
    }
  }
  
  /**
   * Reset all metrics
   */
  resetAllMetrics(): void {
    for (const serviceId of this.healthMetrics.keys()) {
      this.resetServiceMetrics(serviceId);
    }
    
    this.logger.info('All metrics reset');
    this.emit('allMetricsReset');
  }
  
  /**
   * Get monitoring status
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.healthStatuses.clear();
    this.healthMetrics.clear();
    this.removeAllListeners();
    
    this.logger.info('Health monitor cleanup completed');
  }
}

export default MCPHealthMonitor;
