import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { HealthCheckResult } from '../health/comprehensive-health.service.js';

export interface DeploymentConfig {
  enabled: boolean;
  healthCheckEndpoint: string;
  readinessCheckEndpoint: string;
  shutdownTimeout: number; // in milliseconds
  migrationTimeout: number; // in milliseconds
  rollbackOnFailure: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

export interface DeploymentStatus {
  id: string;
  version: string;
  status: 'pending' | 'deploying' | 'ready' | 'healthy' | 'degraded' | 'unhealthy' | 'rolled_back' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  healthChecks: HealthCheckResult[];
  migrationStatus?: MigrationStatus;
  rollbackInfo?: RollbackInfo;
}

export interface MigrationStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  progress?: number; // 0-100
}

export interface RollbackInfo {
  originalVersion: string;
  rollbackReason: string;
  rollbackStartedAt: Date;
  rollbackCompletedAt?: Date;
  rollbackSuccess: boolean;
}

export interface DeploymentHealthCheck {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  components: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
  details?: Record<string, any>;
}

@Injectable()
export class DeploymentService implements OnApplicationShutdown {
  private readonly logger = new Logger(DeploymentService.name);
  private readonly config: DeploymentConfig;
  private deploymentStatus: DeploymentStatus | null = null;
  private healthCheckIntervalId: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
  ) {
    this.config = {
      enabled: process.env.DEPLOYMENT_ENABLED !== 'false',
      healthCheckEndpoint: process.env.DEPLOYMENT_HEALTH_CHECK_ENDPOINT || '/health',
      readinessCheckEndpoint: process.env.DEPLOYMENT_READINESS_CHECK_ENDPOINT || '/ready',
      shutdownTimeout: parseInt(process.env.DEPLOYMENT_SHUTDOWN_TIMEOUT) || 30000, // 30 seconds
      migrationTimeout: parseInt(process.env.DEPLOYMENT_MIGRATION_TIMEOUT) || 300000, // 5 minutes
      rollbackOnFailure: process.env.DEPLOYMENT_ROLLBACK_ON_FAILURE === 'true',
      maxRetries: parseInt(process.env.DEPLOYMENT_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.DEPLOYMENT_RETRY_DELAY) || 5000, // 5 seconds
    };

    // Start health monitoring if enabled
    if (this.config.enabled) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Start health monitoring for deployment
   */
  private startHealthMonitoring(): void {
    this.healthCheckIntervalId = setInterval(async () => {
      try {
        await this.performDeploymentHealthCheck();
      } catch (error) {
        this.logger.error('Deployment health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Perform deployment health check
   */
  async performDeploymentHealthCheck(): Promise<DeploymentHealthCheck> {
    const timestamp = new Date();
    
    try {
      // In a real implementation, this would check various components
      // For now, we'll simulate a health check
      
      const components: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {
        database: 'healthy',
        cache: 'healthy',
        api: 'healthy',
      };

      // Check database connectivity
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        components.database = 'unhealthy';
      }

      // Determine overall status
      const statuses = Object.values(components);
      const hasUnhealthy = statuses.includes('unhealthy');
      const hasDegraded = statuses.includes('degraded');
      
      const status: 'healthy' | 'degraded' | 'unhealthy' = 
        hasUnhealthy ? 'unhealthy' : 
        hasDegraded ? 'degraded' : 'healthy';

      const healthCheck: DeploymentHealthCheck = {
        timestamp,
        status,
        responseTime: Date.now() - timestamp.getTime(),
        components,
      };

      // Update deployment status if we have one
      if (this.deploymentStatus) {
        this.deploymentStatus.healthChecks.push({
          status: healthCheck.status,
          timestamp: healthCheck.timestamp.toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || 'unknown',
          environment: process.env.NODE_ENV || 'development',
          dependencies: Object.entries(healthCheck.components).map(([name, status]) => ({
            name,
            status,
            responseTime: 0,
            lastCheck: new Date().toISOString(),
          })),
          metrics: {
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            requestCount: 0,
            errorRate: 0,
            averageResponseTime: 0,
          },
        });

        // Trim health checks to last 100
        if (this.deploymentStatus.healthChecks.length > 100) {
          this.deploymentStatus.healthChecks = this.deploymentStatus.healthChecks.slice(-100);
        }

        // Check if we need to rollback
        if (this.config.rollbackOnFailure && status === 'unhealthy') {
          await this.initiateRollback('Health check failed');
        }
      }

      return healthCheck;
    } catch (error) {
      this.logger.error('Deployment health check failed:', error);
      
      return {
        timestamp,
        status: 'unhealthy',
        responseTime: Date.now() - timestamp.getTime(),
        components: {
          database: 'unknown',
          cache: 'unknown',
          api: 'unknown',
        },
        details: {
          error: error.message,
        },
      };
    }
  }

  /**
   * Initialize a new deployment
   */
  async initializeDeployment(version: string): Promise<DeploymentStatus> {
    if (!this.config.enabled) {
      throw new Error('Deployment service is not enabled');
    }

    this.logger.log(`Initializing deployment for version ${version}`);

    const deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.deploymentStatus = {
      id: deploymentId,
      version,
      status: 'pending',
      startedAt: new Date(),
      healthChecks: [],
    };

    this.structuredLogger.info(
      'Deployment initialized',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          deploymentId,
          version,
        },
      }
    );

    // Record metrics
    this.metrics.increment('deployment_initialized_total', { version });

    return { ...this.deploymentStatus };
  }

  /**
   * Execute database migrations
   */
  async executeMigrations(): Promise<MigrationStatus> {
    if (!this.deploymentStatus) {
      throw new Error('No deployment initialized');
    }

    this.logger.log('Executing database migrations');

    const migrationStatus: MigrationStatus = {
      name: 'database_migrations',
      status: 'running',
      startedAt: new Date(),
    };

    try {
      this.deploymentStatus.status = 'deploying';
      this.deploymentStatus.migrationStatus = migrationStatus;

      // In a real implementation, this would execute actual database migrations
      // For now, we'll simulate the process
      
      // Simulate migration progress
      for (let i = 0; i <= 100; i += 10) {
        migrationStatus.progress = i;
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      migrationStatus.status = 'completed';
      migrationStatus.completedAt = new Date();
      
      this.logger.log('Database migrations completed successfully');

      // Record metrics
      this.metrics.increment('migrations_completed_total', { status: 'success' });

      return { ...migrationStatus };
    } catch (error) {
      this.logger.error('Database migrations failed:', error);
      
      migrationStatus.status = 'failed';
      migrationStatus.completedAt = new Date();
      migrationStatus.error = error.message;
      
      this.deploymentStatus.status = 'failed';
      this.deploymentStatus.errorMessage = error.message;
      
      // Record metrics
      this.metrics.increment('migrations_completed_total', { status: 'failed' });

      // Check if we should rollback
      if (this.config.rollbackOnFailure) {
        await this.initiateRollback(`Migration failed: ${error.message}`);
      }

      throw error;
    } finally {
      if (this.deploymentStatus) {
        this.deploymentStatus.migrationStatus = { ...migrationStatus };
      }
    }
  }

  /**
   * Check if the service is ready for traffic
   */
  async checkReadiness(): Promise<boolean> {
    try {
      // In a real implementation, this would check if all services are ready
      // For now, we'll simulate a readiness check
      
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check if we have a deployment status
      if (!this.deploymentStatus) {
        return true; // No deployment in progress, ready
      }
      
      // Check deployment status
      return ['ready', 'healthy', 'degraded'].includes(this.deploymentStatus.status);
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return false;
    }
  }

  /**
   * Mark deployment as ready
   */
  async markDeploymentReady(): Promise<DeploymentStatus> {
    if (!this.deploymentStatus) {
      throw new Error('No deployment initialized');
    }

    this.logger.log(`Marking deployment ${this.deploymentStatus.id} as ready`);

    this.deploymentStatus.status = 'ready';
    this.deploymentStatus.completedAt = new Date();

    this.structuredLogger.info(
      'Deployment marked as ready',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          deploymentId: this.deploymentStatus.id,
          version: this.deploymentStatus.version,
        },
      }
    );

    // Record metrics
    this.metrics.increment('deployment_ready_total', { 
      version: this.deploymentStatus.version 
    });

    return { ...this.deploymentStatus };
  }

  /**
   * Initiate rollback process
   */
  async initiateRollback(reason: string): Promise<DeploymentStatus> {
    if (!this.deploymentStatus) {
      throw new Error('No deployment initialized');
    }

    this.logger.warn(`Initiating rollback for deployment ${this.deploymentStatus.id}: ${reason}`);

    // Create rollback info
    const rollbackInfo: RollbackInfo = {
      originalVersion: this.deploymentStatus.version,
      rollbackReason: reason,
      rollbackStartedAt: new Date(),
      rollbackSuccess: false,
    };

    this.deploymentStatus.status = 'rolled_back';
    this.deploymentStatus.rollbackInfo = rollbackInfo;

    try {
      // In a real implementation, this would actually perform the rollback
      // For now, we'll simulate the process
      
      // Simulate rollback work
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      rollbackInfo.rollbackCompletedAt = new Date();
      rollbackInfo.rollbackSuccess = true;
      
      this.deploymentStatus.completedAt = new Date();
      
      this.logger.log(`Rollback completed successfully for deployment ${this.deploymentStatus.id}`);

      // Record metrics
      this.metrics.increment('deployment_rollback_total', { status: 'success' });

      return { ...this.deploymentStatus };
    } catch (error) {
      this.logger.error(`Rollback failed for deployment ${this.deploymentStatus.id}:`, error);
      
      rollbackInfo.rollbackCompletedAt = new Date();
      rollbackInfo.rollbackSuccess = false;
      
      this.deploymentStatus.status = 'failed';
      this.deploymentStatus.errorMessage = `Rollback failed: ${error.message}`;
      
      // Record metrics
      this.metrics.increment('deployment_rollback_total', { status: 'failed' });

      throw error;
    } finally {
      if (this.deploymentStatus) {
        this.deploymentStatus.rollbackInfo = { ...rollbackInfo };
      }
    }
  }

  /**
   * Get current deployment status
   */
  getDeploymentStatus(): DeploymentStatus | null {
    return this.deploymentStatus ? { ...this.deploymentStatus } : null;
  }

  /**
   * Get deployment configuration
   */
  getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  /**
   * Health check for deployment service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }> {
    try {
      if (!this.config.enabled) {
        return { status: 'healthy', error: 'Deployment service disabled' };
      }

      // Test database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Handle application shutdown gracefully
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.log(`Deployment service shutting down due to signal: ${signal || 'unknown'}`);

    try {
      // Stop health monitoring
      if (this.healthCheckIntervalId) {
        clearInterval(this.healthCheckIntervalId);
      }

      // If we have an active deployment, mark it as failed
      if (this.deploymentStatus && 
          ['pending', 'deploying', 'ready'].includes(this.deploymentStatus.status)) {
        this.deploymentStatus.status = 'failed';
        this.deploymentStatus.errorMessage = `Shutdown during deployment: ${signal || 'unknown'}`;
        this.deploymentStatus.completedAt = new Date();
        
        this.logger.warn(`Deployment ${this.deploymentStatus.id} marked as failed due to shutdown`);
      }
    } catch (error) {
      this.logger.error('Error during deployment service shutdown:', error);
    }
  }

  /**
   * Wait for graceful shutdown
   */
  async waitForGracefulShutdown(): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        // Check if we're no longer shutting down or timeout reached
        if (!this.isShuttingDown || (Date.now() - startTime) > this.config.shutdownTimeout) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Set maximum timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, this.config.shutdownTimeout);
    });
  }
}