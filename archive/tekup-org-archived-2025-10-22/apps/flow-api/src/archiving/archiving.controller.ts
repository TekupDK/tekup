import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ArchivingService } from './archiving.service.js';
import { 
  UpdateArchivingConfigDto, 
  TriggerArchivingDto, 
  ArchiveStatsDto, 
  ArchivingConfigDto, 
  ArchiveResultDto,
  HealthCheckDto
} from './dto/archiving.dto.js';
import { TenantValidationPipe } from '../common/validation/tenant-validation.pipe.js';

@ApiTags('Archiving')
@Controller('archiving')
export class ArchivingController {
  private readonly logger = new Logger(ArchivingController.name);

  constructor(
    private readonly archivingService: ArchivingService,
  ) {}

  @Get('config/:tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tenant archiving configuration' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Archiving configuration retrieved successfully' })
  async getArchivingConfig(
    @Param('tenantId', TenantValidationPipe) tenantId: string
  ): Promise<ArchivingConfigDto> {
    this.logger.log(`Getting archiving config for tenant ${tenantId}`);
    const config = await this.archivingService.getTenantConfig(tenantId);
    
    return {
      tenantId: config.tenantId,
      retentionDays: config.retentionDays,
      archiveOlderThanDays: config.archiveOlderThanDays,
      enableCompression: config.enableCompression,
      deleteArchivedAfterDays: config.deleteArchivedAfterDays,
      excludedEntities: config.excludedEntities,
    };
  }

  @Put('config/:tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant archiving configuration' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiBody({ type: UpdateArchivingConfigDto })
  @ApiResponse({ status: 200, description: 'Archiving configuration updated successfully' })
  async updateArchivingConfig(
    @Param('tenantId', TenantValidationPipe) tenantId: string,
    @Body() updateConfigDto: UpdateArchivingConfigDto
  ): Promise<ArchivingConfigDto> {
    this.logger.log(`Updating archiving config for tenant ${tenantId}`);
    const config = await this.archivingService.updateTenantConfig(tenantId, updateConfigDto);
    
    return {
      tenantId: config.tenantId,
      retentionDays: config.retentionDays,
      archiveOlderThanDays: config.archiveOlderThanDays,
      enableCompression: config.enableCompression,
      deleteArchivedAfterDays: config.deleteArchivedAfterDays,
      excludedEntities: config.excludedEntities,
    };
  }

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual archiving process' })
  @ApiBody({ type: TriggerArchivingDto })
  @ApiResponse({ status: 200, description: 'Archiving process triggered successfully' })
  async triggerArchiving(
    @Body() triggerDto: TriggerArchivingDto
  ): Promise<ArchiveResultDto> {
    this.logger.log(`Manual archiving triggered for tenant ${triggerDto.tenantId || 'all'}`);
    
    if (triggerDto.tenantId) {
      const result = await this.archivingService.triggerArchiving(triggerDto.tenantId);
      return {
        archived: result.archived,
        deleted: result.deleted,
      };
    } else {
      // In a real implementation, you might want to trigger for all tenants
      throw new Error('Tenant ID is required for manual archiving');
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get archiving statistics' })
  @ApiQuery({ name: 'tenantId', required: false, description: 'Tenant ID (optional)' })
  @ApiResponse({ status: 200, description: 'Archiving statistics retrieved successfully' })
  async getArchivingStats(
    @Query('tenantId', TenantValidationPipe) tenantId?: string
  ): Promise<ArchiveStatsDto> {
    this.logger.log(`Getting archiving stats ${tenantId ? `for tenant ${tenantId}` : 'for all tenants'}`);
    const stats = await this.archivingService.getArchivingStats(tenantId);
    
    return {
      totalJobs: stats.totalJobs,
      completedJobs: stats.completedJobs,
      failedJobs: stats.failedJobs,
      totalArchivedRecords: stats.totalArchivedRecords,
      totalFailedRecords: stats.totalFailedRecords,
      lastRun: stats.lastRun.toISOString(),
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check archiving service health' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async healthCheck(): Promise<HealthCheckDto> {
    this.logger.log('Archiving service health check requested');
    const health = await this.archivingService.healthCheck();
    
    return {
      status: health.status,
      error: health.error,
    };
  }

  @Delete('cleanup/:tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger cleanup of archived data' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Cleanup process completed' })
  async cleanupArchivedData(
    @Param('tenantId', TenantValidationPipe) tenantId: string
  ): Promise<ArchiveResultDto> {
    this.logger.log(`Cleanup of archived data triggered for tenant ${tenantId}`);
    const result = await this.archivingService.deleteArchivedData(tenantId);
    
    return {
      archived: 0, // No new archiving in cleanup
      deleted: result.deleted,
    };
  }
}