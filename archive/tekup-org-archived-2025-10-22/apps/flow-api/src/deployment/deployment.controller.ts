import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { DeploymentService } from './deployment.service.js';
import { 
  InitializeDeploymentDto, 
  DeploymentStatusDto, 
  DeploymentConfigDto,
  ReadinessCheckDto,
  RollbackDeploymentDto,
  HealthCheckResultDto
} from './dto/deployment.dto.js';

@ApiTags('Deployment')
@Controller('deployment')
export class DeploymentController {
  private readonly logger = new Logger(DeploymentController.name);

  constructor(
    private readonly deploymentService: DeploymentService,
  ) {}

  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize a new deployment' })
  @ApiBody({ type: InitializeDeploymentDto })
  @ApiResponse({ status: 201, description: 'Deployment initialized successfully', type: DeploymentStatusDto })
  async initializeDeployment(
    @Body() initializeDto: InitializeDeploymentDto
  ): Promise<DeploymentStatusDto> {
    this.logger.log(`Initializing deployment for version ${initializeDto.version}`);
    const status = await this.deploymentService.initializeDeployment(initializeDto.version);
    
    return this.mapDeploymentStatusToDto(status);
  }

  @Post('migrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute database migrations' })
  @ApiResponse({ status: 200, description: 'Migrations executed successfully' })
  async executeMigrations(): Promise<any> {
    this.logger.log('Executing database migrations');
    const migrationStatus = await this.deploymentService.executeMigrations();
    
    return {
      name: migrationStatus.name,
      status: migrationStatus.status,
      startedAt: migrationStatus.startedAt.toISOString(),
      completedAt: migrationStatus.completedAt?.toISOString(),
      error: migrationStatus.error,
      progress: migrationStatus.progress,
    };
  }

  @Put('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark deployment as ready for traffic' })
  @ApiResponse({ status: 200, description: 'Deployment marked as ready', type: DeploymentStatusDto })
  async markDeploymentReady(): Promise<DeploymentStatusDto> {
    this.logger.log('Marking deployment as ready');
    const status = await this.deploymentService.markDeploymentReady();
    
    return this.mapDeploymentStatusToDto(status);
  }

  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate rollback for current deployment' })
  @ApiBody({ type: RollbackDeploymentDto })
  @ApiResponse({ status: 200, description: 'Rollback initiated successfully', type: DeploymentStatusDto })
  async initiateRollback(
    @Body() rollbackDto: RollbackDeploymentDto
  ): Promise<DeploymentStatusDto> {
    this.logger.log(`Initiating rollback: ${rollbackDto.reason || 'No reason provided'}`);
    const status = await this.deploymentService.initiateRollback(rollbackDto.reason || 'Manual rollback');
    
    return this.mapDeploymentStatusToDto(status);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current deployment status' })
  @ApiResponse({ status: 200, description: 'Current deployment status', type: DeploymentStatusDto })
  async getDeploymentStatus(): Promise<DeploymentStatusDto | null> {
    this.logger.debug('Getting deployment status');
    const status = this.deploymentService.getDeploymentStatus();
    
    if (!status) {
      return null;
    }
    
    return this.mapDeploymentStatusToDto(status);
  }

  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get deployment configuration' })
  @ApiResponse({ status: 200, description: 'Deployment configuration', type: DeploymentConfigDto })
  async getDeploymentConfig(): Promise<DeploymentConfigDto> {
    this.logger.debug('Getting deployment configuration');
    const config = this.deploymentService.getConfig();
    
    return {
      enabled: config.enabled,
      healthCheckEndpoint: config.healthCheckEndpoint,
      readinessCheckEndpoint: config.readinessCheckEndpoint,
      shutdownTimeout: config.shutdownTimeout,
      migrationTimeout: config.migrationTimeout,
      rollbackOnFailure: config.rollbackOnFailure,
      maxRetries: config.maxRetries,
      retryDelay: config.retryDelay,
    };
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if service is ready for traffic' })
  @ApiResponse({ status: 200, description: 'Readiness check result', type: ReadinessCheckDto })
  async checkReadiness(): Promise<ReadinessCheckDto> {
    this.logger.debug('Performing readiness check');
    const ready = await this.deploymentService.checkReadiness();
    
    return {
      ready,
      reason: ready ? undefined : 'Service is not ready for traffic',
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check deployment service health' })
  @ApiResponse({ status: 200, description: 'Health check result', type: HealthCheckResultDto })
  async healthCheck(): Promise<HealthCheckResultDto> {
    this.logger.debug('Performing deployment service health check');
    const health = await this.deploymentService.healthCheck();
    
    return {
      status: health.status,
      error: health.error,
    };
  }

  /**
   * Map internal deployment status to DTO
   */
  private mapDeploymentStatusToDto(status: any): DeploymentStatusDto {
    return {
      id: status.id,
      version: status.version,
      status: status.status,
      startedAt: status.startedAt.toISOString(),
      completedAt: status.completedAt?.toISOString(),
      errorMessage: status.errorMessage,
      healthChecks: status.healthChecks.map((check: any) => ({
        status: check.status,
        timestamp: check.timestamp,
        uptime: check.uptime,
        version: check.version,
        environment: check.environment,
        dependencies: check.dependencies,
        metrics: check.metrics,
      })),
      migrationStatus: status.migrationStatus ? {
        name: status.migrationStatus.name,
        status: status.migrationStatus.status,
        startedAt: status.migrationStatus.startedAt.toISOString(),
        completedAt: status.migrationStatus.completedAt?.toISOString(),
        error: status.migrationStatus.error,
        progress: status.migrationStatus.progress,
      } : undefined,
      rollbackInfo: status.rollbackInfo ? {
        originalVersion: status.rollbackInfo.originalVersion,
        rollbackReason: status.rollbackInfo.rollbackReason,
        rollbackStartedAt: status.rollbackInfo.rollbackStartedAt.toISOString(),
        rollbackCompletedAt: status.rollbackInfo.rollbackCompletedAt?.toISOString(),
        rollbackSuccess: status.rollbackInfo.rollbackSuccess,
      } : undefined,
    };
  }
}