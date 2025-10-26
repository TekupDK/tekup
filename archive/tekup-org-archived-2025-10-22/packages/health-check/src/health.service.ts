import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  HealthCheckResult,
  DependencyHealth,
  HealthMetrics,
  ReadinessCheck,
  LivenessCheck,
  HealthCheckConfig,
  DependencyChecker,
  HealthStatus,
} from './types.js';

@Injectable()
export class StandardHealthService {
  private readonly logger = new Logger(StandardHealthService.name);
  private readonly startTime = Date.now();
  private readonly healthCheckCache = new Map<string, DependencyHealth>();
  private readonly dependencyCheckers = new Map<string, DependencyChecker>();
  private redis?: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly config: HealthCheckConfig
  ) {
    // Initialize Redis if configured
    if (config.redis) {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
    }

    // Register default dependency checkers
    this.registerDefaultCheckers();
  }

  /**
   * Register a custom dependency checker
   */
  registerDependencyChecker(checker: DependencyChecker): void {
    this.dependencyCheckers.set(checker.name, checker);
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
        version: this.config.version,
        environment: this.configService.get('NODE_ENV', 'development'),
        service: this.config.serviceName,
        dependencies,
        metrics,
      };

      if (detailed) {
        result.details = {
          systemInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
          },
          configuration: {
            serviceName: this.config.serviceName,
            hasRedis: !!this.redis,
            hasDatabaseCheck: this.config.database?.enabled || false,
          },
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.config.version,
        environment: this.configService.get('NODE_ENV', 'development'),
        service: this.config.serviceName,
        dependencies: [],
        metrics: await this.getHealthMetrics(),
        details: { error: error.message },
      };
    }
  }

  /**
   * Readiness check
   */
  async getReadinessStatus(): Promise<ReadinessCheck> {
    const requiredDependencies = this.config.requiredDependencies || [];
    const dependencyStatus: Record<string, boolean> = {};
    
    let allReady = true;
    let reason = '';

    for (const depName of requiredDependencies) {
      try {
        const health = await this.checkDependency(depName);
        const isReady = health.status === 'healthy';
        dependencyStatus[depName] = isReady;
        
        if (!isReady) {
          allReady = false;
          reason += `${depName}: ${health.error || 'unhealthy'}; `;
        }
      } catch (error) {
        dependencyStatus[depName] = false;
        allReady = false;
        reason += `${depName}: ${error.message}; `;
      }
    }

    return {
      ready: allReady,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      requiredDependencies,
      dependencyStatus,
      reason: reason || undefined,
    };
  }

  /**
   * Liveness check
   */
  async getLivenessStatus(): Promise<LivenessCheck> {
    const uptime = Date.now() - this.startTime;
    const lastActivity = this.getLastActivityTime();

    return {
      alive: true, // If we can respond, we're alive
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      uptime,
      lastActivity,
    };
  }

  /**
   * Simple application alive check
   */
  async isApplicationAlive(): Promise<boolean> {
    try {
      const uptime = Date.now() - this.startTime;
      return uptime > 0;
    } catch (error) {
      this.logger.error('Application liveness check failed:', error);
      return false;
    }
  }

  /**
   * Check all dependencies
   */
  private async checkAllDependencies(): Promise<DependencyHealth[]> {
    const checkers = Array.from(this.dependencyCheckers.values());
    const results = await Promise.allSettled(
      checkers.map(checker => checker.check())
    );
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: checkers[index]?.name || 'unknown',
          status: 'unhealthy' as const,
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: result.reason?.message || 'Check failed',
        };
      }
    });
  }

  /**
   * Check individual dependency by name
   */
  private async checkDependency(name: string): Promise<DependencyHealth> {
    const checker = this.dependencyCheckers.get(name);
    if (!checker) {
      throw new Error(`Unknown dependency: ${name}`);
    }

    return checker.check();
  }

  /**
   * Calculate overall status from dependencies
   */
  private calculateOverallStatus(dependencies: DependencyHealth[]): HealthStatus {
    if (dependencies.length === 0) return 'healthy';

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

    const cacheTimeout = this.config.cacheTimeout || 30000;
    const age = Date.now() - new Date(cached.lastCheck).getTime();
    if (age > cacheTimeout) {
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
   * Get last activity time (simplified)
   */
  private getLastActivityTime(): string {
    return new Date().toISOString();
  }

  /**
   * Register default dependency checkers
   */
  private registerDefaultCheckers(): void {
    // Redis checker
    if (this.redis) {
      this.registerDependencyChecker({
        name: 'redis',
        check: async () => this.checkRedis(),
      });
    }

    // Database checker (generic)
    if (this.config.database?.enabled) {
      this.registerDependencyChecker({
        name: 'database',
        check: async () => this.checkDatabase(),
      });
    }

    // External services checkers
    if (this.config.externalServices) {
      for (const service of this.config.externalServices) {
        this.registerDependencyChecker({
          name: service.name,
          check: async () => this.checkHttpEndpoint(service.name, service.url, service.timeout),
        });
      }
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
      if (!this.redis) {
        throw new Error('Redis not configured');
      }

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
   * Check database health (generic implementation)
   */
  private async checkDatabase(): Promise<DependencyHealth> {
    const cacheKey = 'database';
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      // This is a placeholder - actual implementation would be injected
      // via a custom database checker
      const responseTime = Date.now() - startTime;
      
      const health: DependencyHealth = {
        name: 'database',
        status: 'healthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        details: {
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
   * Check HTTP endpoint health
   */
  private async checkHttpEndpoint(name: string, url: string, timeout: number = 5000): Promise<DependencyHealth> {
    const cacheKey = `http_${name}`;
    const cached = this.getCachedHealth(cacheKey);
    if (cached) return cached;

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
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
}
