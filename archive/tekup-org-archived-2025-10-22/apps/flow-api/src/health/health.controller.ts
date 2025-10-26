import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  UseInterceptors,
  HttpException,
} from '@nestjs/common';
import { ComprehensiveHealthService, HealthCheckResult } from './comprehensive-health.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';

@Controller('health')
@UseInterceptors(MetricsInterceptor)
export class HealthController {
  constructor(
    private readonly healthService: ComprehensiveHealthService
  ) {}

  /**
   * Comprehensive health check endpoint
   * Returns overall system health with optional detailed information
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getHealth(
    @Query('detailed') detailed?: string
  ): Promise<HealthCheckResult> {
    const includeDetails = detailed === 'true' || detailed === '1';
    const healthResult = await this.healthService.getHealthStatus(includeDetails);
    
    // Return appropriate HTTP status based on health
    if (healthResult.status === 'unhealthy') {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: healthResult.timestamp,
          message: 'System is unhealthy',
          details: includeDetails ? healthResult.details : undefined,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    if (healthResult.status === 'degraded') {
      // Still return 200 OK for degraded state but include warning
      return {
        ...healthResult,
        message: 'System is running but some services are degraded',
      };
    }

    return healthResult;
  }

  /**
   * Readiness probe endpoint
   * Used by Kubernetes and load balancers to determine if app can handle traffic
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getReadiness(): Promise<{ status: string; timestamp: string; message: string }> {
    const healthResult = await this.healthService.getHealthStatus(false);
    
    // App is ready if it's healthy or degraded (can still serve requests)
    if (healthResult.status === 'unhealthy') {
      throw new HttpException(
        {
          status: 'not_ready',
          timestamp: healthResult.timestamp,
          message: 'Application is not ready to serve traffic',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'ready',
      timestamp: healthResult.timestamp,
      message: 'Application is ready to serve traffic',
    };
  }

  /**
   * Liveness probe endpoint
   * Used by Kubernetes to determine if app is alive and should be restarted
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getLiveness(): Promise<{ status: string; timestamp: string; message: string }> {
    // Basic liveness check - just verify the service is responding
    // Don't check external dependencies for liveness
    const isAlive = await this.healthService.isApplicationAlive();
    
    if (!isAlive) {
      throw new HttpException(
        {
          status: 'not_alive',
          timestamp: new Date().toISOString(),
          message: 'Application is not responding',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      message: 'Application is alive and responding',
    };
  }

  /**
   * Database-specific health check
   */
  @Get('database')
  @HttpCode(HttpStatus.OK)
  async getDatabaseHealth(): Promise<any> {
    const healthResult = await this.healthService.getHealthStatus(true);
    const dbHealth = healthResult.details?.dependencies?.database;
    
    if (!dbHealth || dbHealth.status !== 'healthy') {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: healthResult.timestamp,
          service: 'database',
          details: dbHealth,
          message: 'Database is not healthy',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'healthy',
      timestamp: healthResult.timestamp,
      service: 'database',
      details: dbHealth,
      message: 'Database is healthy',
    };
  }

  /**
   * Cache-specific health check
   */
  @Get('cache')
  @HttpCode(HttpStatus.OK)
  async getCacheHealth(): Promise<any> {
    const healthResult = await this.healthService.getHealthStatus(true);
    const cacheHealth = healthResult.details?.dependencies?.cache;
    
    if (!cacheHealth || cacheHealth.status !== 'healthy') {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: healthResult.timestamp,
          service: 'cache',
          details: cacheHealth,
          message: 'Cache is not healthy',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'healthy',
      timestamp: healthResult.timestamp,
      service: 'cache',
      details: cacheHealth,
      message: 'Cache is healthy',
    };
  }

  /**
   * External services health check
   */
  @Get('external')
  @HttpCode(HttpStatus.OK)
  async getExternalServicesHealth(): Promise<any> {
    const healthResult = await this.healthService.getHealthStatus(true);
    const externalHealth = healthResult.details?.dependencies?.external;
    
    if (!externalHealth || externalHealth.status !== 'healthy') {
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: healthResult.timestamp,
          service: 'external_services',
          details: externalHealth,
          message: 'External services are not healthy',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'healthy',
      timestamp: healthResult.timestamp,
      service: 'external_services',
      details: externalHealth,
      message: 'External services are healthy',
    };
  }
}