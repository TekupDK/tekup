import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { BackupService } from './backup.service.js';
import { 
  CreateBackupDto, 
  BackupJobDto, 
  RestoreJobDto, 
  BackupStatsDto, 
  BackupConfigDto,
  PointInTimeRecoveryConfigDto,
  ValidateBackupDto,
  RestoreBackupDto,
  HealthCheckDto
} from './dto/backup.dto.js';

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(
    private readonly backupService: BackupService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new database backup' })
  @ApiBody({ type: CreateBackupDto })
  @ApiResponse({ status: 201, description: 'Backup created successfully', type: BackupJobDto })
  async createBackup(
    @Body() createBackupDto: CreateBackupDto
  ): Promise<BackupJobDto> {
    this.logger.log('Creating new database backup');
    const backupJob = await this.backupService.createBackup();
    
    if (createBackupDto.validateAfterBackup) {
      await this.backupService.validateBackup(backupJob.id);
    }
    
    return this.mapBackupJobToDto(backupJob);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a backup' })
  @ApiBody({ type: ValidateBackupDto })
  @ApiResponse({ status: 200, description: 'Backup validation completed', type: BackupJobDto })
  async validateBackup(
    @Body() validateBackupDto: ValidateBackupDto
  ): Promise<BackupJobDto> {
    this.logger.log(`Validating backup ${validateBackupDto.backupId}`);
    const backupJob = await this.backupService.validateBackup(validateBackupDto.backupId);
    
    return this.mapBackupJobToDto(backupJob);
  }

  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore from a backup' })
  @ApiBody({ type: RestoreBackupDto })
  @ApiResponse({ status: 200, description: 'Restore process started', type: RestoreJobDto })
  async restoreFromBackup(
    @Body() restoreBackupDto: RestoreBackupDto
  ): Promise<RestoreJobDto> {
    this.logger.log(`Restoring from backup ${restoreBackupDto.backupId}`);
    const restoreJob = await this.backupService.restoreFromBackup(restoreBackupDto.backupId);
    
    return this.mapRestoreJobToDto(restoreJob);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get backup statistics' })
  @ApiResponse({ status: 200, description: 'Backup statistics retrieved', type: BackupStatsDto })
  async getBackupStats(): Promise<BackupStatsDto> {
    this.logger.debug('Getting backup statistics');
    const stats = await this.backupService.getBackupStats();
    
    return {
      totalBackups: stats.totalBackups,
      successfulBackups: stats.successfulBackups,
      failedBackups: stats.failedBackups,
      totalSize: stats.totalSize,
      lastBackup: stats.lastBackup?.toISOString(),
      lastValidation: stats.lastValidation?.toISOString(),
      validationPassed: stats.validationPassed,
    };
  }

  @Get('jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all backup jobs' })
  @ApiResponse({ status: 200, description: 'Backup jobs retrieved', type: [BackupJobDto] })
  async getBackupJobs(): Promise<BackupJobDto[]> {
    this.logger.debug('Getting all backup jobs');
    const jobs = this.backupService.getBackupJobs();
    
    return jobs.map(job => this.mapBackupJobToDto(job));
  }

  @Get('jobs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific backup job' })
  @ApiParam({ name: 'id', description: 'Backup job ID' })
  @ApiResponse({ status: 200, description: 'Backup job retrieved', type: BackupJobDto })
  async getBackupJob(
    @Param('id') id: string
  ): Promise<BackupJobDto> {
    this.logger.debug(`Getting backup job ${id}`);
    const jobs = this.backupService.getBackupJobs();
    const job = jobs.find(j => j.id === id);
    
    if (!job) {
      throw new Error(`Backup job ${id} not found`);
    }
    
    return this.mapBackupJobToDto(job);
  }

  @Get('restore-jobs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all restore jobs' })
  @ApiResponse({ status: 200, description: 'Restore jobs retrieved', type: [RestoreJobDto] })
  async getRestoreJobs(): Promise<RestoreJobDto[]> {
    this.logger.debug('Getting all restore jobs');
    const jobs = this.backupService.getRestoreJobs();
    
    return jobs.map(job => this.mapRestoreJobToDto(job));
  }

  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get backup configuration' })
  @ApiResponse({ status: 200, description: 'Backup configuration retrieved', type: BackupConfigDto })
  async getBackupConfig(): Promise<BackupConfigDto> {
    this.logger.debug('Getting backup configuration');
    const config = this.backupService.getConfig();
    
    return {
      enabled: config.enabled,
      cronSchedule: config.cronSchedule,
      retentionDays: config.retentionDays,
      backupPath: config.backupPath,
      enableCompression: config.enableCompression,
      enableEncryption: config.enableEncryption,
      encryptionKey: config.encryptionKey,
      crossRegionReplication: config.crossRegionReplication,
      replicationRegions: config.replicationRegions,
      validationEnabled: config.validationEnabled,
      validationCronSchedule: config.validationCronSchedule,
    };
  }

  @Get('pitr-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get point-in-time recovery configuration' })
  @ApiResponse({ status: 200, description: 'PITR configuration retrieved', type: PointInTimeRecoveryConfigDto })
  async getPitrConfig(): Promise<PointInTimeRecoveryConfigDto> {
    this.logger.debug('Getting PITR configuration');
    const config = this.backupService.getPitrConfig();
    
    return {
      enabled: config.enabled,
      retentionHours: config.retentionHours,
      walArchivingEnabled: config.walArchivingEnabled,
      walArchivePath: config.walArchivePath,
    };
  }

  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up old backups based on retention policy' })
  @ApiResponse({ status: 200, description: 'Old backups cleaned up' })
  async cleanupOldBackups(): Promise<{ deletedCount: number }> {
    this.logger.log('Cleaning up old backups');
    const deletedCount = await this.backupService.cleanupOldBackups();
    
    return { deletedCount };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check backup service health' })
  @ApiResponse({ status: 200, description: 'Health check completed', type: HealthCheckDto })
  async healthCheck(): Promise<HealthCheckDto> {
    this.logger.debug('Performing backup service health check');
    const health = await this.backupService.healthCheck();
    
    return {
      status: health.status,
      error: health.error,
    };
  }

  /**
   * Map internal backup job to DTO
   */
  private mapBackupJobToDto(job: any): BackupJobDto {
    return {
      id: job.id,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      status: job.status,
      backupPath: job.backupPath,
      fileSize: job.fileSize,
      checksum: job.checksum,
      duration: job.duration,
      errorMessage: job.errorMessage,
      validatedAt: job.validatedAt?.toISOString(),
      validationPassed: job.validationPassed,
      encrypted: job.encrypted,
      compressed: job.compressed,
    };
  }

  /**
   * Map internal restore job to DTO
   */
  private mapRestoreJobToDto(job: any): RestoreJobDto {
    return {
      id: job.id,
      backupId: job.backupId,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      status: job.status,
      restorePath: job.restorePath,
      duration: job.duration,
      errorMessage: job.errorMessage,
      restoredRecords: job.restoredRecords,
    };
  }
}