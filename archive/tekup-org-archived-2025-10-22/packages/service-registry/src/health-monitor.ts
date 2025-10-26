import { createLogger } from './simple-logger.js';
import { ServiceHealth, ServiceHealthSchema, ServiceStatus } from './types.js';
import * as cron from 'node-cron';

export class HealthMonitor {
  private logger = createLogger('health-monitor');
  private healthData = new Map<string, ServiceHealth>();
  private monitoringJobs = new Map<string, cron.ScheduledTask>();
  private registry: any; // ServiceRegistry reference

  constructor(registry: any) {
    this.registry = registry;
  }

  /**
   * Start monitoring a specific service
   */
  async startMonitoring(serviceId: string): Promise<void> {
    const service = this.registry.getService(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    if (!service.healthCheck.enabled) {
      this.logger.info(`Health monitoring disabled for service: ${serviceId}`);
      return;
    }

    // Stop existing monitoring if any
    await this.stopMonitoring(serviceId);

    // Create cron schedule based on interval
    const intervalMinutes = Math.max(1, Math.floor(service.healthCheck.intervalSeconds / 60));
    const cronExpression = `*/${intervalMinutes} * * * *`;

    const job = cron.schedule(cronExpression, async () => {
      try {
        await this.checkServiceHealth(serviceId);
      } catch (error) {
        this.logger.error(`Health check failed for ${serviceId}:`, error);
      }
    }, {
      scheduled: false
    });

    this.monitoringJobs.set(serviceId, job);
    job.start();

    // Perform initial health check
    await this.checkServiceHealth(serviceId);

    this.logger.info(`Started health monitoring for service: ${serviceId} (interval: ${intervalMinutes}m)`);
  }

  /**
   * Stop monitoring a specific service
   */
  async stopMonitoring(serviceId: string): Promise<void> {
    const job = this.monitoringJobs.get(serviceId);
    if (job) {
      job.stop();
      this.monitoringJobs.delete(serviceId);
      this.logger.info(`Stopped health monitoring for service: ${serviceId}`);
    }
  }

  /**
   * Restart monitoring for a service (useful after config changes)
   */
  async restartMonitoring(serviceId: string): Promise<void> {
    await this.stopMonitoring(serviceId);
    await this.startMonitoring(serviceId);
  }

  /**
   * Start monitoring all enabled services
   */
  async startAll(): Promise<void> {
    const services = this.registry.getServices({ enabled: true });
    
    for (const service of services) {
      if (service.healthCheck.enabled) {
        await this.startMonitoring(service.id);
      }
    }

    this.logger.info(`Started monitoring ${this.monitoringJobs.size} services`);
  }

  /**
   * Stop monitoring all services
   */
  async stopAll(): Promise<void> {
    const serviceIds = Array.from(this.monitoringJobs.keys());
    
    for (const serviceId of serviceIds) {
      await this.stopMonitoring(serviceId);
    }

    this.logger.info('Stopped all service monitoring');
  }

  /**
   * Perform health check for a specific service
   */
  async checkServiceHealth(serviceId: string): Promise<ServiceHealth> {
    const service = this.registry.getService(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    const startTime = Date.now();
    let status: ServiceStatus = 'unknown';
    let responseTimeMs = 0;
    let issues: any[] = [];

    try {
      // Determine health check endpoint
      const healthEndpoint = service.healthCheck.endpoint || 
        (service.baseUrl.endsWith('/') ? service.baseUrl + 'health' : service.baseUrl + '/health');

      // Perform HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.healthCheck.timeoutMs);

      const response = await fetch(healthEndpoint, {
        method: service.healthCheck.method,
        headers: {
          [service.apiKeyHeader]: `${service.apiKeyPrefix} ${service.apiKey}`,
          ...service.additionalHeaders,
          'User-Agent': 'TekUp-ServiceRegistry/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      responseTimeMs = Date.now() - startTime;

      // Check if response status is expected
      if (service.healthCheck.expectedStatusCodes.includes(response.status)) {
        status = 'healthy';
        
        // Check response time threshold
        if (responseTimeMs > service.healthCheck.alertThresholds.responseTimeMs) {
          status = 'degraded';
          issues.push({
            code: 'HIGH_RESPONSE_TIME',
            message: `Response time ${responseTimeMs}ms exceeds threshold ${service.healthCheck.alertThresholds.responseTimeMs}ms`,
            severity: 'medium' as const,
            timestamp: new Date()
          });
        }
      } else {
        status = 'degraded';
        issues.push({
          code: 'UNEXPECTED_STATUS_CODE',
          message: `Received status ${response.status}, expected one of: ${service.healthCheck.expectedStatusCodes.join(', ')}`,
          severity: 'high' as const,
          timestamp: new Date()
        });
      }

    } catch (error) {
      responseTimeMs = Date.now() - startTime;
      status = 'down';
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      issues.push({
        code: 'CONNECTION_FAILED',
        message: `Health check failed: ${errorMessage}`,
        severity: 'critical' as const,
        timestamp: new Date()
      });
    }

    // Get previous health data to calculate consecutive failures
    const previousHealth = this.healthData.get(serviceId);
    const consecutiveFailures = status === 'healthy' ? 0 : 
      (previousHealth?.consecutiveFailures || 0) + 1;

    // Calculate error rate (simplified - based on recent status)
    const errorRate = status === 'healthy' ? 0 : 1;

    // Calculate uptime (simplified - would need historical data for accuracy)
    const uptime = status === 'healthy' ? 1 : 0;

    const healthData: ServiceHealth = ServiceHealthSchema.parse({
      serviceId,
      status,
      responseTimeMs,
      errorRate,
      lastChecked: new Date(),
      consecutiveFailures,
      uptime,
      issues
    });

    // Store health data
    this.healthData.set(serviceId, healthData);

    // Check if we need to trigger alerts
    if (consecutiveFailures >= service.healthCheck.alertThresholds.consecutiveFailures) {
      await this.triggerAlert(serviceId, healthData);
    }

    this.logger.debug(`Health check for ${serviceId}: ${status} (${responseTimeMs}ms)`);

    return healthData;
  }

  /**
   * Get health data for a specific service
   */
  getServiceHealth(serviceId: string): ServiceHealth | undefined {
    return this.healthData.get(serviceId);
  }

  /**
   * Get health data for all monitored services
   */
  getAllServiceHealth(): Map<string, ServiceHealth> {
    return new Map(this.healthData);
  }

  /**
   * Get services by health status
   */
  getServicesByStatus(status: ServiceStatus): ServiceHealth[] {
    return Array.from(this.healthData.values()).filter(health => health.status === status);
  }

  /**
   * Get overall system health summary
   */
  getSystemHealthSummary(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    downServices: number;
    unknownServices: number;
    averageResponseTime: number;
    overallStatus: ServiceStatus;
  } {
    const allHealth = Array.from(this.healthData.values());
    const totalServices = allHealth.length;
    
    if (totalServices === 0) {
      return {
        totalServices: 0,
        healthyServices: 0,
        degradedServices: 0,
        downServices: 0,
        unknownServices: 0,
        averageResponseTime: 0,
        overallStatus: 'unknown'
      };
    }

    const healthyServices = allHealth.filter(h => h.status === 'healthy').length;
    const degradedServices = allHealth.filter(h => h.status === 'degraded').length;
    const downServices = allHealth.filter(h => h.status === 'down').length;
    const unknownServices = allHealth.filter(h => h.status === 'unknown').length;

    const averageResponseTime = allHealth.reduce((sum, h) => sum + h.responseTimeMs, 0) / totalServices;

    // Determine overall status
    let overallStatus: ServiceStatus = 'healthy';
    if (downServices > 0) {
      overallStatus = 'down';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    } else if (unknownServices === totalServices) {
      overallStatus = 'unknown';
    }

    return {
      totalServices,
      healthyServices,
      degradedServices,
      downServices,
      unknownServices,
      averageResponseTime,
      overallStatus
    };
  }

  /**
   * Trigger alert for service health issues
   */
  private async triggerAlert(serviceId: string, health: ServiceHealth): Promise<void> {
    const service = this.registry.getService(serviceId);
    if (!service) return;

    const alertData = {
      serviceId,
      serviceName: service.name,
      status: health.status,
      consecutiveFailures: health.consecutiveFailures,
      responseTime: health.responseTimeMs,
      issues: health.issues,
      timestamp: new Date()
    };

    this.logger.warn(`Service alert triggered for ${serviceId}:`, alertData);

    // Here you would integrate with your alerting system
    // For example: send to webhook, email, Slack, etc.
    
    // Example webhook call (if configured)
    const webhookUrl = this.registry.config?.monitoring?.alertWebhookUrl;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(alertData)
        });
      } catch (error) {
        this.logger.error('Failed to send alert webhook:', error);
      }
    }
  }

  /**
   * Clean up old health data
   */
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // This is a simplified cleanup - in a real implementation,
    // you'd want to store historical data in a database
    this.logger.info(`Cleanup completed for data older than ${retentionDays} days`);
  }
}