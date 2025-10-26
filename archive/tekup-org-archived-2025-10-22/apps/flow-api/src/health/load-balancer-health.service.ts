import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from '../metrics/metrics.service.js';
import { RedisClusterService } from '../cache/redis-cluster.service.js';
import { SessionAffinityService } from '../session/session-affinity.service.js';

export interface LoadBalancerHealthConfig {
  healthCheckEndpoint: string;
  readinessCheckEndpoint: string;
  livenessCheckEndpoint: string;
  healthCheckInterval: number; // in milliseconds
  gracefulShutdownTimeout: number; // in milliseconds
  requestDrainingTimeout: number; // in milliseconds
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  components: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    session: 'healthy' | 'degraded' | 'unhealthy';
    [key: string]: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics?: {
    activeConnections: number;
    requestRate: number;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ReadinessStatus {
  ready: boolean;
  timestamp: Date;
  requiredServices: string[];
  serviceStatus: Record<string, boolean>;
  reason?: string;
}

export interface LivenessStatus {
  alive: boolean;
  timestamp: Date;
  uptime: number;
  lastActivity: Date;
}

@Injectable()
export class LoadBalancerHealthService implements OnApplicationShutdown {
  private readonly logger = new Logger(LoadBalancerHealthService.name);
  private readonly config: LoadBalancerHealthConfig;
  private isShuttingDown = false;
  private activeConnections = 0;
  private lastActivity = new Date();
  private healthCheckIntervalId: NodeJS.Timeout;
  private requestQueue: Set<string> = new Set();

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    private readonly redisClusterService: RedisClusterService,
    private readonly sessionAffinityService: SessionAffinityService,
  ) {
    this.config = {
      healthCheckEndpoint: this.configService.get('HEALTH_CHECK_ENDPOINT', '/health'),
      readinessCheckEndpoint: this.configService.get('READINESS_CHECK_ENDPOINT', '/ready'),
      livenessCheckEndpoint: this.configService.get('LIVENESS_CHECK_ENDPOINT', '/alive'),
      healthCheckInterval: this.configService.get('HEALTH_CHECK_INTERVAL', 30000), // 30 seconds
      gracefulShutdownTimeout: this.configService.get('GRACEFUL_SHUTDOWN_TIMEOUT', 30000), // 30 seconds
      requestDrainingTimeout: this.configService.get('REQUEST_DRAINING_TIMEOUT', 10000), // 10 seconds
    };

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckIntervalId = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Periodic health check failed:', error);
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    const timestamp = new Date();
    const components: HealthStatus['components'] = {
      database: 'healthy',
      cache: 'healthy',
      session: 'healthy',
    };

    try {
      // Check Redis cluster health
      const cacheHealth = await this.redisClusterService.healthCheck();
      components.cache = cacheHealth.status === 'healthy' ? 'healthy' : 
                        cacheHealth.status === 'degraded' ? 'degraded' : 'unhealthy';

      // Check session affinity service health
      const sessionHealth = await this.sessionAffinityService.healthCheck();
      components.session = sessionHealth.status === 'healthy' ? 'healthy' : 
                          sessionHealth.status === 'degraded' ? 'degraded' : 'unhealthy';

      // Determine overall status
      const statuses = Object.values(components);
      const hasUnhealthy = statuses.includes('unhealthy');
      const hasDegraded = statuses.includes('degraded');
      
      const status: 'healthy' | 'degraded' | 'unhealthy' = 
        hasUnhealthy ? 'unhealthy' : 
        hasDegraded ? 'degraded' : 'healthy';

      // Collect metrics
      const metrics = {
        activeConnections: this.activeConnections,
        requestRate: 0, // Would be populated from metrics service
        errorRate: 0, // Would be populated from metrics service
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      };

      const healthStatus: HealthStatus = {
        status,
        timestamp,
        components,
        metrics,
      };

      // Log health status if not healthy
      if (status !== 'healthy') {
        this.logger.warn(`Health check status: ${status}`, { components });
      }

      // Record metrics
      this.metricsService.increment('health_check_total', { status });
      this.metricsService.gauge('active_connections', this.activeConnections);

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp,
        components: {
          database: 'unknown',
          cache: 'unknown',
          session: 'unknown',
        },
        metrics: {
          activeConnections: this.activeConnections,
          requestRate: 0,
          errorRate: 0,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      };
    }
  }

  /**
   * Check if the service is ready to serve requests
   */
  async checkReadiness(): Promise<ReadinessStatus> {
    const timestamp = new Date();
    const requiredServices = ['database', 'cache', 'session'];
    const serviceStatus: Record<string, boolean> = {};

    try {
      // Check if we're shutting down
      if (this.isShuttingDown) {
        return {
          ready: false,
          timestamp,
          requiredServices,
          serviceStatus,
          reason: 'Service is shutting down',
        };
      }

      // Check Redis cluster
      const cacheHealth = await this.redisClusterService.healthCheck();
      serviceStatus.cache = cacheHealth.status === 'healthy';
      
      // Check session affinity service
      const sessionHealth = await this.sessionAffinityService.healthCheck();
      serviceStatus.session = sessionHealth.status === 'healthy';

      // Check if all required services are healthy
      const allReady = Object.values(serviceStatus).every(status => status);
      
      return {
        ready: allReady,
        timestamp,
        requiredServices,
        serviceStatus,
        reason: allReady ? undefined : 'One or more required services are not ready',
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      
      return {
        ready: false,
        timestamp,
        requiredServices,
        serviceStatus: {},
        reason: `Readiness check error: ${error.message}`,
      };
    }
  }

  /**
   * Check if the service is alive
   */
  checkLiveness(): LivenessStatus {
    return {
      alive: !this.isShuttingDown,
      timestamp: new Date(),
      uptime: process.uptime(),
      lastActivity: this.lastActivity,
    };
  }

  /**
   * Track an incoming request
   */
  trackRequestStart(requestId: string): void {
    this.activeConnections++;
    this.lastActivity = new Date();
    this.requestQueue.add(requestId);
    
    // Record metrics
    this.metricsService.increment('http_requests_total');
    this.metricsService.gauge('active_connections', this.activeConnections);
  }

  /**
   * Track request completion
   */
  trackRequestEnd(requestId: string): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
    this.requestQueue.delete(requestId);
    
    // Record metrics
    this.metricsService.gauge('active_connections', this.activeConnections);
  }

  /**
   * Handle application shutdown gracefully
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Received shutdown signal: ${signal || 'unknown'}`);
    
    if (this.isShuttingDown) {
      this.logger.log('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    
    try {
      // Stop health checks
      if (this.healthCheckIntervalId) {
        clearInterval(this.healthCheckIntervalId);
      }

      // Log shutdown start
      this.logger.log(`Starting graceful shutdown with ${this.activeConnections} active connections`);

      // Wait for request draining period
      if (this.activeConnections > 0) {
        this.logger.log(`Waiting up to ${this.config.requestDrainingTimeout}ms for requests to complete`);
        
        // Wait for either all requests to complete or timeout
        await Promise.race([
          this.waitForRequestsToComplete(),
          new Promise(resolve => setTimeout(resolve, this.config.requestDrainingTimeout))
        ]);
      }

      // Final log before shutdown
      this.logger.log(`Graceful shutdown completed. Remaining connections: ${this.activeConnections}`);
    } catch (error) {
      this.logger.error('Error during graceful shutdown:', error);
    }
  }

  /**
   * Wait for all active requests to complete
   */
  private async waitForRequestsToComplete(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.activeConnections <= 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Set a maximum wait time
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, this.config.gracefulShutdownTimeout);
    });
  }

  /**
   * Get current load balancer health configuration
   */
  getConfig(): LoadBalancerHealthConfig {
    return { ...this.config };
  }

  /**
   * Get current status of active connections
   */
  getConnectionStatus(): { active: number; queued: number; lastActivity: Date } {
    return {
      active: this.activeConnections,
      queued: this.requestQueue.size,
      lastActivity: this.lastActivity,
    };
  }

  /**
   * Force shutdown (for emergency situations)
   */
  async forceShutdown(): Promise<void> {
    this.logger.warn('Force shutdown initiated');
    this.isShuttingDown = true;
    
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
    }
  }
}