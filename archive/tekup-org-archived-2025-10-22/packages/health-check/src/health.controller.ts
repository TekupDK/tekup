import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StandardHealthService } from './health.service.js';
import { HealthCheckResult, ReadinessCheck, LivenessCheck } from './types.js';

@ApiTags('Health')
@Controller('health')
export class StandardHealthController {
  constructor(private readonly healthService: StandardHealthService) {}

  /**
   * Comprehensive health check endpoint
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns overall system health with optional detailed information'
  })
  @ApiResponse({ status: 200, description: 'System is healthy or degraded' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  @ApiQuery({ 
    name: 'detailed', 
    required: false, 
    description: 'Include detailed system information',
    example: 'true'
  })
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
          service: healthResult.service,
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
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Used by Kubernetes and load balancers to determine if app can handle traffic'
  })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async getReadiness(): Promise<{ status: string; timestamp: string; service: string; message: string }> {
    const readinessResult = await this.healthService.getReadinessStatus();
    
    if (!readinessResult.ready) {
      throw new HttpException(
        {
          status: 'not_ready',
          timestamp: readinessResult.timestamp,
          service: readinessResult.service,
          message: 'Application is not ready to serve traffic',
          reason: readinessResult.reason,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'ready',
      timestamp: readinessResult.timestamp,
      service: readinessResult.service,
      message: 'Application is ready to serve traffic',
    };
  }

  /**
   * Liveness probe endpoint
   */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Used by Kubernetes to determine if app is alive and should be restarted'
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @ApiResponse({ status: 503, description: 'Application is not responding' })
  async getLiveness(): Promise<{ status: string; timestamp: string; service: string; message: string }> {
    const livenessResult = await this.healthService.getLivenessStatus();
    
    if (!livenessResult.alive) {
      throw new HttpException(
        {
          status: 'not_alive',
          timestamp: livenessResult.timestamp,
          service: livenessResult.service,
          message: 'Application is not responding',
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return {
      status: 'alive',
      timestamp: livenessResult.timestamp,
      service: livenessResult.service,
      message: 'Application is alive and responding',
    };
  }

  /**
   * Dependencies health check
   */
  @Get('dependencies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Dependencies health check',
    description: 'Check the health of all service dependencies'
  })
  @ApiResponse({ status: 200, description: 'Dependencies status' })
  async getDependenciesHealth(): Promise<any> {
    const healthResult = await this.healthService.getHealthStatus(false);
    
    return {
      status: healthResult.status,
      timestamp: healthResult.timestamp,
      service: healthResult.service,
      dependencies: healthResult.dependencies,
    };
  }

  /**
   * Metrics endpoint
   */
  @Get('metrics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'System metrics',
    description: 'Get current system performance metrics'
  })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getMetrics(): Promise<any> {
    const healthResult = await this.healthService.getHealthStatus(false);
    
    return {
      timestamp: healthResult.timestamp,
      service: healthResult.service,
      uptime: healthResult.uptime,
      metrics: healthResult.metrics,
    };
  }
}
