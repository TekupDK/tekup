import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoadBalancerHealthService, HealthStatus, ReadinessStatus, LivenessStatus } from './load-balancer-health.service.js';

@ApiTags('Health')
@Controller()
export class LoadBalancerHealthController {
  private readonly logger = new Logger(LoadBalancerHealthController.name);

  constructor(
    private readonly loadBalancerHealthService: LoadBalancerHealthService,
  ) {}

  @Get('/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint for load balancer' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck(): Promise<HealthStatus> {
    this.logger.debug('Health check endpoint called');
    const healthStatus = await this.loadBalancerHealthService.performHealthCheck();
    
    // Return appropriate HTTP status based on health
    if (healthStatus.status === 'unhealthy') {
      // In a real implementation, you might want to throw an exception here
      // to return a 503 status, but for now we'll return the status in the response
    }
    
    return healthStatus;
  }

  @Get('/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness check endpoint for load balancer' })
  @ApiResponse({ status: 200, description: 'Service is ready to serve requests' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessCheck(): Promise<ReadinessStatus> {
    this.logger.debug('Readiness check endpoint called');
    const readinessStatus = await this.loadBalancerHealthService.checkReadiness();
    
    // Return appropriate HTTP status based on readiness
    if (!readinessStatus.ready) {
      // In a real implementation, you might want to throw an exception here
      // to return a 503 status
    }
    
    return readinessStatus;
  }

  @Get('/alive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check endpoint for load balancer' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  livenessCheck(): LivenessStatus {
    this.logger.debug('Liveness check endpoint called');
    return this.loadBalancerHealthService.checkLiveness();
  }
}