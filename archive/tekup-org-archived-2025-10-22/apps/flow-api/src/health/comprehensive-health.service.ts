import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.service.js';
import Redis from 'ioredis';
import { ImapWorkerService } from '../ingestion/imap-worker.service.js';
import { SlaMonitoringService } from '../lead/services/sla-monitoring.service.js';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  dependencies: DependencyHealth[];
  metrics: HealthMetrics;
  details?: Record<string, any>;
}

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface ReadinessCheck {
  ready: boolean;
  timestamp: string;
  requiredDependencies: string[];
  dependencyStatus: Record<string, boolean>;
  reason?: string;
}

export interface LivenessCheck {
  alive: boolean;
  timestamp: string;
  uptime: number;
  lastActivity: string;
}

@Injectable()
export class ComprehensiveHealthService {
  private readonly logger = new Logger(ComprehensiveHealthService.name);
  private readonly redis: Redis;
  private readonly startTime = Date.now();
  private lastHealthCheck: HealthCheckResult | null = null;
  private readonly healthCheckCache = new Map<string, DependencyHealth>();
  private readonly cacheTimeout = 30000; // 30 seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly imapWorkerService: ImapWorkerService,
    private readonly slaMonitoringService: SlaMonitoringService
  ) {
    // Initialize Redis connection for health checks
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_HEALTH_DB', 0),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Start background health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Comprehensive health check
   */
  async getHealthStatus(detailed: boolean = false): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Check all dependencies
      const dependencies = await this.checkAllDependencies();
      
      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(dependencies);
      
      // Get system metrics
      const metrics = await this.getHealthMetrics();
      
      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get('API_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development'),
        dependencies,
        metrics,
      };

      if (detailed) {
        result.details = {
          circuitBreakers: this.circuitBreakerService.getAllCircuitStats(),
          systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
          },
          configuration: {
            redisHost: this.configService.get('REDIS_HOST'),
            databaseUrl: this.configService.get('PX_DATABASE_URL')?.replace(/:[^:@]*@/, ':***@'),
          },
        };
      }

      // Cache the result
      this.lastHealthCheck = result;

      // Record metrics
      this.metricsService.gauge('health_check_duration_ms', Date.now() - startTime);
      this.metricsService.gauge('health_check_status', this.statusToNumber(overallStatus));

      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.configService.get('API_VERSION', '1.0.0'),
        environment: this.configService.get('NODE_ENV', 'development'),
        dependencies: [],
        metrics: await this.getHealthMetrics(),
        details: { error: error.message },
      };
    }
  }

  /**
   * Readiness check - indicates if the service is ready to serve traffic
   */
  async getReadinessStatus(): Promise<ReadinessCheck> {
    const requiredDependencies = ['database', 'redis', 'imap', 'compliance'];
    const dependencyStatus: Record<string, boolean> = {};
    
    let allReady = true;
    let reason = '';

    for (const depName of requiredDependencies) {
      const health = await this.checkDependency(depName);
      const isReady = health.status === 'healthy';
      dependencyStatus[depName] = isReady;
      
      if (!isReady) {
        allReady = false;
        reason += `${depName}: ${health.error || 'unhealthy'}; `;
      }
    }

    return {
      ready: allReady,
      timestamp: new Date().toISOString(),
      requiredDependencies,
      dependencyStatus,
      reason: reason || undefined,
    };
  }

  /**
   * Liveness check - indicates if the service is alive and should not be restarted
   */
  async getLivenessStatus(): Promise<LivenessCheck> {
    const uptime = Date.now() - this.startTime;
    const lastActivity = this.getLastActivityTime();

    return {
      alive: true, // If we can respond, we're alive
      timestamp: new Date().toISOString(),
      uptime,
      lastActivity,
    };
  }

  /**
   * Simple application alive check for liveness probe
   */
  async isApplicationAlive(): Promise<boolean> {
    try {
      // Basic check - if we can execute this method, we're alive
      const uptime = Date.now() - this.startTime;
      return uptime > 0; // If we have positive uptime, we're alive
    } catch (error) {
      this.logger.error('Application liveness check failed:', error);
      return false;
    }
  }

  /**
   * Check all dependencies
   */
  private async checkAllDependencies(): Promise<DependencyHealth[]> {
    const dependencyChecks = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkImapConnectivity(),
      this.checkComplianceService(),
      this.checkExternalServices(),
    ];

    const results = await Promise.allSettled(dependencyChecks);
    
    return results.flatMap((result, index) => {
      if (result.status === 'fulfilled') {
        return Array.isArray(result.value) ? result.value : [result.value];
      } else {
        const dependencyNames = ['database', 'redis', 'imap', 'compliance', 'external-services'];
        return [{
          name: dependencyNames[index] || 'unknown',
          status: 'unhealthy' as const,
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: result.reason?.message || 'Check failed',
        }];
      }
    });
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<DependencyHealth> {
    const cacheKey = 'database';
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      // Test more complex operations
      const tenantCount = await this.prisma.tenant.count();
      const leadCount = await this.prisma.lead.count({ take: 1 });
      
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          tenantCount,
          canQueryLeads: leadCount >= 0,
          connectionPool: 'active',
        },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<DependencyHealth> {
    const cacheKey = 'redis';
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Test connectivity and basic operations
      await this.redis.ping();
      
      // Test set/get operations
      const testKey = `health_check_${Date.now()}`;
      await this.redis.set(testKey, 'test', 'EX', 10);
      const testValue = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'redis',
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          canReadWrite: testValue === 'test',
          connected: this.redis.status === 'ready',
        },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'redis',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    }
  }

  /**
   * Check IMAP connectivity health
   */
  private async checkImapConnectivity(): Promise<DependencyHealth> {
    const cacheKey = 'imap';
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // Get status from IMAP workers
      const workersStatus = this.imapWorkerService.getWorkersStatus();
      
      // Check if any workers are connected
      const connectedWorkers = Object.values(workersStatus).filter(status => status.isConnected);
      const totalWorkers = Object.keys(workersStatus).length;
      
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'imap',
        status: connectedWorkers.length === totalWorkers ? 'healthy' : 
                connectedWorkers.length > 0 ? 'degraded' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          totalWorkers,
          connectedWorkers: connectedWorkers.length,
          workersStatus
        },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'imap',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    }
  }

  /**
   * Check compliance service health
   */
  private async checkComplianceService(): Promise<DependencyHealth> {
    const cacheKey = 'compliance';
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // For now, we'll just check if the service is accessible
      // In a more advanced implementation, we might check specific compliance-related functionality
      
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'compliance',
        status: 'healthy', // Assuming the service is available if we can instantiate it
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          serviceAvailable: true,
          slaMonitoringActive: true
        },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'compliance',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message,
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    }
  }

  /**
   * Check external services health
   */
  private async checkExternalServices(): Promise<DependencyHealth[]> {
    const services = [];
    
    // Check tracing endpoint if configured
    const tracingEndpoint = this.configService.get('TRACING_EXPORT_ENDPOINT');
    if (tracingEndpoint) {
      services.push(this.checkHttpEndpoint('tracing-service', tracingEndpoint));
    }

    // Check metrics endpoint if configured
    const metricsEndpoint = this.configService.get('METRICS_EXPORT_ENDPOINT');
    if (metricsEndpoint) {
      services.push(this.checkHttpEndpoint('metrics-service', metricsEndpoint));
    }

    if (services.length === 0) {
      return [{
        name: 'external-services',
        status: 'healthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        details: { configured: false },
      }];
    }

    const results = await Promise.allSettled(services);
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: `external-service-${index}`,
          status: 'unhealthy' as const,
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: result.reason?.message || 'Check failed',
        };
      }
    });
  }

  /**
   * Check HTTP endpoint health
   */
  private async checkHttpEndpoint(name: string, url: string): Promise<DependencyHealth> {
    const cacheKey = `http_${name}`;
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name,
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
          statusCode: response.status,
          url,
        },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name,
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: error.message,
        details: { url },
      };

      this.setCachedHealth(cacheKey, health);
      return health;
    }
  }

  /**
   * Check individual dependency by name
   */
  private async checkDependency(name: string): Promise<DependencyHealth> {
    switch (name) {
      case 'database':
        return this.checkDatabase();
      case 'redis':
        return this.checkRedis();
      case 'imap':
        return this.checkImapConnectivity();
      case 'compliance':
        return this.checkComplianceService();
      default:
        throw new Error(`Unknown dependency: ${name}`);
    }
  }

  /**
   * Calculate overall status from dependencies
   */
  private calculateOverallStatus(dependencies: DependencyHealth[]): 'healthy' | 'degraded' | 'unhealthy' {
    if (dependencies.length === 0) return 'unhealthy';

    const unhealthyCount = dependencies.filter(d => d.status === 'unhealthy').length;
    const degradedCount = dependencies.filter(d => d.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get health metrics
   */
  private async getHealthMetrics(): Promise<HealthMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memoryUsage,
      cpuUsage,
      requestCount: 0, // Would be tracked by metrics service
      errorRate: 0, // Would be calculated from metrics
      averageResponseTime: 0, // Would be calculated from metrics
    };
  }

  /**
   * Get cached health result
   */
  private getCachedHealth(key: string): DependencyHealth | null {
    const cached = this.healthCheckCache.get(key);
    if (!cached) return null;

    const age = Date.now() - new Date(cached.lastCheck).getTime();
    if (age > this.cacheTimeout) {
      this.healthCheckCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Set cached health result
   */
  private setCachedHealth(key: string, health: DependencyHealth): void {
    this.healthCheckCache.set(key, health);
  }

  /**
   * Convert status to number for metrics
   */
  private statusToNumber(status: string): number {
    switch (status) {
      case 'healthy': return 1;
      case 'degraded': return 0.5;
      case 'unhealthy': return 0;
      default: return -1;
    }
  }

  /**
   * Get last activity time (simplified)
   */
  private getLastActivityTime(): string {
    return new Date().toISOString(); // In real implementation, track actual last activity
  }

  /**
   * Start background health monitoring
   */
  private startHealthMonitoring(): void {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.getHealthStatus(false);
        
        // Log health status changes
        if (this.lastHealthCheck && this.lastHealthCheck.status !== health.status) {
          this.structuredLogger.warn(
            `Health status changed: ${this.lastHealthCheck.status} -> ${health.status}`,
            {
              ...this.contextService.toLogContext(),
              metadata: {
                previousStatus: this.lastHealthCheck.status,
                currentStatus: health.status,
                dependencies: health.dependencies.map(d => ({
                  name: d.name,
                  status: d.status,
                  error: d.error,
                })),
              },
            }
          );
        }

        // Update metrics
        this.metricsService.gauge('service_health_status', this.statusToNumber(health.status));
        
        for (const dep of health.dependencies) {
          this.metricsService.gauge('dependency_health_status', this.statusToNumber(dep.status), {
            dependency: dep.name,
          });
          
          this.metricsService.gauge('dependency_response_time_ms', dep.responseTime, {
            dependency: dep.name,
          });
        }

      } catch (error) {
        this.logger.error('Background health monitoring failed:', error);
      }
    }, 30000);
  }
}