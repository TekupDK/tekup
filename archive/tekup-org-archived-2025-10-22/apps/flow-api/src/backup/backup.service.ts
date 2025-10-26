import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  cronSchedule: string;
  retentionDays: number;
  backupPath: string;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  crossRegionReplication: boolean;
  replicationRegions: string[];
  validationEnabled: boolean;
  validationCronSchedule: string;
}

export interface BackupJob {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'validating' | 'validated' | 'validation_failed';
  backupPath: string;
  fileSize: number;
  checksum: string;
  duration: number;
  errorMessage?: string;
  validatedAt?: Date;
  validationPassed?: boolean;
  encrypted: boolean;
  compressed: boolean;
}

export interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalSize: number;
  lastBackup: Date | null;
  lastValidation: Date | null;
  validationPassed: boolean;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  restorePath: string;
  duration: number;
  errorMessage?: string;
  restoredRecords: number;
}

export interface PointInTimeRecoveryConfig {
  enabled: boolean;
  retentionHours: number;
  walArchivingEnabled: boolean;
  walArchivePath: string;
}

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private readonly config: BackupConfig;
  private readonly pitrConfig: PointInTimeRecoveryConfig;
  private backupJobs: Map<string, BackupJob> = new Map();
  private restoreJobs: Map<string, RestoreJob> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
  ) {
    this.config = {
      enabled: process.env.BACKUP_ENABLED === 'true',
      cronSchedule: process.env.BACKUP_CRON_SCHEDULE || '0 1 * * *', // Run daily at 1 AM
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      backupPath: process.env.BACKUP_PATH || './backups',
      enableCompression: process.env.BACKUP_ENABLE_COMPRESSION !== 'false',
      enableEncryption: process.env.BACKUP_ENABLE_ENCRYPTION === 'true',
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      crossRegionReplication: process.env.BACKUP_CROSS_REGION_REPLICATION === 'true',
      replicationRegions: process.env.BACKUP_REPLICATION_REGIONS 
        ? process.env.BACKUP_REPLICATION_REGIONS.split(',') 
        : [],
      validationEnabled: process.env.BACKUP_VALIDATION_ENABLED !== 'false',
      validationCronSchedule: process.env.BACKUP_VALIDATION_CRON_SCHEDULE || '0 3 * * *', // Run daily at 3 AM
    };

    this.pitrConfig = {
      enabled: process.env.PITR_ENABLED === 'true',
      retentionHours: parseInt(process.env.PITR_RETENTION_HOURS || '24'),
      walArchivingEnabled: process.env.PITR_WAL_ARCHIVING_ENABLED === 'true',
      walArchivePath: process.env.PITR_WAL_ARCHIVE_PATH || './wal-archive',
    };

    // Ensure backup directory exists
    if (!existsSync(this.config.backupPath)) {
      mkdirSync(this.config.backupPath, { recursive: true });
    }

    // Ensure WAL archive directory exists if PITR is enabled
    if (this.pitrConfig.enabled && this.pitrConfig.walArchivingEnabled) {
      if (!existsSync(this.pitrConfig.walArchivePath)) {
        mkdirSync(this.pitrConfig.walArchivePath, { recursive: true });
      }
    }
  }

  async onModuleInit() {
    if (this.config.enabled) {
      this.logger.log('Backup service initialized with config:', this.config);
      this.logger.log('PITR config:', this.pitrConfig);
    } else {
      this.logger.log('Backup service is disabled');
    }
  }

  /**
   * Create a database backup
   */
  async createBackup(): Promise<BackupJob> {
    if (!this.config.enabled) {
      throw new Error('Backup service is not enabled');
    }

    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.sql`;
    const backupFilePath = join(this.config.backupPath, backupFileName);
    
    const backupJob: BackupJob = {
      id: backupId,
      startedAt: new Date(),
      status: 'running',
      backupPath: backupFilePath,
      fileSize: 0,
      checksum: '',
      duration: 0,
      encrypted: this.config.enableEncryption,
      compressed: this.config.enableCompression,
    };

    this.backupJobs.set(backupId, backupJob);
    
    this.structuredLogger.info(
      'Starting database backup',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          backupId,
          backupPath: backupFilePath,
        },
      }
    );

    try {
      const startTime = Date.now();
      
      // In a real implementation, this would use the actual database backup command
      // For PostgreSQL, this might be something like:
      // pg_dump -h localhost -U username -d database_name > backup_file.sql
      
      // For now, we'll simulate the backup process
      await this.simulateDatabaseBackup(backupFilePath);
      
      // Compress if enabled
      if (this.config.enableCompression) {
        await this.compressBackup(backupFilePath);
        backupJob.backupPath = `${backupFilePath}.gz`;
      }
      
      // Encrypt if enabled
      if (this.config.enableEncryption) {
        await this.encryptBackup(backupJob.backupPath);
        backupJob.backupPath = `${backupJob.backupPath}.enc`;
      }
      
      // Calculate file size and checksum
      backupJob.fileSize = this.calculateFileSize(backupJob.backupPath);
      backupJob.checksum = this.calculateChecksum(backupJob.backupPath);
      
      backupJob.duration = Date.now() - startTime;
      backupJob.status = 'completed';
      backupJob.completedAt = new Date();
      
      this.structuredLogger.info(
        'Database backup completed successfully',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            backupId,
            backupPath: backupJob.backupPath,
            fileSize: backupJob.fileSize,
            duration: backupJob.duration,
          },
        }
      );

      // Record metrics
      this.metrics.increment('backup_completed_total', { status: 'success' });
      this.metrics.histogram('backup_duration_seconds', backupJob.duration / 1000);
      this.metrics.gauge('backup_file_size_bytes', backupJob.fileSize);

      return { ...backupJob };
    } catch (error) {
      this.logger.error(`Backup failed for ${backupId}:`, error);
      
      backupJob.status = 'failed';
      backupJob.completedAt = new Date();
      backupJob.duration = Date.now() - backupJob.startedAt.getTime();
      backupJob.errorMessage = error.message;
      
      this.structuredLogger.error(
        'Database backup failed',
        error,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            backupId,
          },
        }
      );

      // Record metrics
      this.metrics.increment('backup_completed_total', { status: 'failed' });

      throw error;
    } finally {
      this.backupJobs.set(backupId, { ...backupJob });
    }
  }

  /**
   * Simulate database backup process
   */
  private async simulateDatabaseBackup(backupFilePath: string): Promise<void> {
    // In a real implementation, this would execute the actual database backup command
    // For now, we'll create a mock backup file
    
    const backupContent = `-- Mock database backup
-- Generated at ${new Date().toISOString()}

-- Table structure for table 'leads'
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  source VARCHAR(255),
  payload JSONB,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table structure for table 'lead_events'
CREATE TABLE lead_events (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample data (mock)
-- In a real backup, this would contain actual data
`;
    
    // Write mock backup content to file
    const fs = await import('fs/promises');
    await fs.writeFile(backupFilePath, backupContent);
  }

  /**
   * Compress backup file
   */
  private async compressBackup(filePath: string): Promise<void> {
    const gzip = createGzip();
    const source = createReadStream(filePath);
    const destination = createWriteStream(`${filePath}.gz`);
    
    await pipeline(source, gzip, destination);
  }

  /**
   * Encrypt backup file
   */
  private async encryptBackup(filePath: string): Promise<void> {
    // In a real implementation, this would use actual encryption
    // For now, we'll just rename the file to simulate encryption
    const fs = await import('fs/promises');
    await fs.rename(filePath, `${filePath}.enc`);
  }

  /**
   * Calculate file size
   */
  private calculateFileSize(filePath: string): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      this.logger.warn(`Failed to calculate file size for ${filePath}:`, error);
      return 0;
    }
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(filePath: string): string {
    // In a real implementation, this would calculate an actual checksum
    // For now, we'll return a mock checksum
    return `mock-checksum-${Date.now()}`;
  }

  /**
   * Validate a backup
   */
  async validateBackup(backupId: string): Promise<BackupJob> {
    const backupJob = this.backupJobs.get(backupId);
    if (!backupJob) {
      throw new Error(`Backup job ${backupId} not found`);
    }

    if (backupJob.status !== 'completed') {
      throw new Error(`Backup job ${backupId} is not completed`);
    }

    this.logger.log(`Validating backup ${backupId}`);

    try {
      backupJob.status = 'validating';
      this.backupJobs.set(backupId, { ...backupJob });

      // In a real implementation, this would:
      // 1. Restore the backup to a temporary database
      // 2. Run integrity checks
      // 3. Verify data consistency
      // 4. Clean up temporary database

      // For now, we'll simulate validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      backupJob.status = 'validated';
      backupJob.validatedAt = new Date();
      backupJob.validationPassed = true;

      this.structuredLogger.info(
        'Backup validation completed successfully',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            backupId,
            validationPassed: true,
          },
        }
      );

      // Record metrics
      this.metrics.increment('backup_validation_total', { status: 'passed' });

      return { ...backupJob };
    } catch (error) {
      this.logger.error(`Backup validation failed for ${backupId}:`, error);
      
      backupJob.status = 'validation_failed';
      backupJob.validatedAt = new Date();
      backupJob.validationPassed = false;
      
      this.structuredLogger.error(
        'Backup validation failed',
        error,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            backupId,
          },
        }
      );

      // Record metrics
      this.metrics.increment('backup_validation_total', { status: 'failed' });

      throw error;
    } finally {
      this.backupJobs.set(backupId, { ...backupJob });
    }
  }

  /**
   * Restore from a backup
   */
  async restoreFromBackup(backupId: string): Promise<RestoreJob> {
    const backupJob = this.backupJobs.get(backupId);
    if (!backupJob) {
      throw new Error(`Backup job ${backupId} not found`);
    }

    if (backupJob.status !== 'completed' && backupJob.status !== 'validated') {
      throw new Error(`Backup job ${backupId} is not valid for restoration`);
    }

    const restoreId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const restorePath = join(this.config.backupPath, `restore_${restoreId}`);
    
    const restoreJob: RestoreJob = {
      id: restoreId,
      backupId,
      startedAt: new Date(),
      status: 'running',
      restorePath,
      duration: 0,
      restoredRecords: 0,
    };

    this.restoreJobs.set(restoreId, restoreJob);
    
    this.structuredLogger.info(
      'Starting database restoration',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          restoreId,
          backupId,
          restorePath,
        },
      }
    );

    try {
      const startTime = Date.now();
      
      // In a real implementation, this would:
      // 1. Stop application services
      // 2. Restore the backup to the database
      // 3. Run any necessary migrations
      // 4. Start application services
      
      // For now, we'll simulate the restoration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      restoreJob.duration = Date.now() - startTime;
      restoreJob.status = 'completed';
      restoreJob.completedAt = new Date();
      restoreJob.restoredRecords = 1000; // Mock record count
      
      this.structuredLogger.info(
        'Database restoration completed successfully',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            restoreId,
            backupId,
            duration: restoreJob.duration,
            restoredRecords: restoreJob.restoredRecords,
          },
        }
      );

      // Record metrics
      this.metrics.increment('restore_completed_total', { status: 'success' });
      this.metrics.histogram('restore_duration_seconds', restoreJob.duration / 1000);

      return { ...restoreJob };
    } catch (error) {
      this.logger.error(`Restoration failed for ${restoreId}:`, error);
      
      restoreJob.status = 'failed';
      restoreJob.completedAt = new Date();
      restoreJob.duration = Date.now() - restoreJob.startedAt.getTime();
      restoreJob.errorMessage = error.message;
      
      this.structuredLogger.error(
        'Database restoration failed',
        {
          ...this.contextService.toLogContext(),
          error: error.message,
          stack: error.stack,
          metadata: {
            restoreId,
            backupId,
          },
        }
      );

      // Record metrics
      this.metrics.increment('restore_completed_total', { status: 'failed' });

      throw error;
    } finally {
      this.restoreJobs.set(restoreId, { ...restoreJob });
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<BackupStats> {
    const backups = Array.from(this.backupJobs.values());
    
    const totalBackups = backups.length;
    const successfulBackups = backups.filter(b => b.status === 'completed' || b.status === 'validated').length;
    const failedBackups = backups.filter(b => b.status === 'failed' || b.status === 'validation_failed').length;
    const totalSize = backups.reduce((sum, backup) => sum + backup.fileSize, 0);
    
    const completedBackups = backups.filter(b => b.completedAt);
    const lastBackup = completedBackups.length > 0 
      ? new Date(Math.max(...completedBackups.map(b => b.completedAt!.getTime())))
      : null;
      
    const validatedBackups = backups.filter(b => b.validatedAt);
    const lastValidation = validatedBackups.length > 0 
      ? new Date(Math.max(...validatedBackups.map(b => b.validatedAt!.getTime())))
      : null;
      
    const validationPassed = validatedBackups.length > 0 
      ? validatedBackups[validatedBackups.length - 1].validationPassed || false
      : true;

    return {
      totalBackups,
      successfulBackups,
      failedBackups,
      totalSize,
      lastBackup,
      lastValidation,
      validationPassed,
    };
  }

  /**
   * Get all backup jobs
   */
  getBackupJobs(): BackupJob[] {
    return Array.from(this.backupJobs.values()).map(job => ({ ...job }));
  }

  /**
   * Get all restore jobs
   */
  getRestoreJobs(): RestoreJob[] {
    return Array.from(this.restoreJobs.values()).map(job => ({ ...job }));
  }

  /**
   * Scheduled backup job
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduledBackup(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    this.logger.log('Starting scheduled backup process');

    try {
      const backupJob = await this.createBackup();
      this.logger.log(`Scheduled backup completed: ${backupJob.id}`);
      
      // Validate backup if enabled
      if (this.config.validationEnabled) {
        await this.validateBackup(backupJob.id);
        this.logger.log(`Scheduled backup validation completed: ${backupJob.id}`);
      }
    } catch (error) {
      this.logger.error('Scheduled backup process failed:', error);
    }
  }

  /**
   * Scheduled backup validation
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledValidation(): Promise<void> {
    if (!this.config.enabled || !this.config.validationEnabled) {
      return;
    }

    this.logger.log('Starting scheduled backup validation process');

    try {
      // Get the most recent completed backup
      const backups = Array.from(this.backupJobs.values())
        .filter(b => b.status === 'completed')
        .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());
      
      if (backups.length > 0) {
        const latestBackup = backups[0];
        await this.validateBackup(latestBackup.id);
        this.logger.log(`Scheduled validation completed for backup: ${latestBackup.id}`);
      } else {
        this.logger.log('No completed backups found for validation');
      }
    } catch (error) {
      this.logger.error('Scheduled validation process failed:', error);
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    if (!this.config.enabled) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.logger.log(`Cleaning up backups older than ${cutoffDate.toISOString()}`);

    let deletedCount = 0;
    
    try {
      // Get backups older than cutoff date
      const oldBackups = Array.from(this.backupJobs.values()).filter(
        backup => backup.completedAt && backup.completedAt < cutoffDate
      );

      // Delete backup files and remove from tracking
      for (const backup of oldBackups) {
        try {
          // Delete backup file
          const fs = await import('fs/promises');
          if (existsSync(backup.backupPath)) {
            await fs.unlink(backup.backupPath);
            this.logger.log(`Deleted backup file: ${backup.backupPath}`);
          }
          
          // Remove from tracking
          this.backupJobs.delete(backup.id);
          deletedCount++;
        } catch (error) {
          this.logger.error(`Failed to delete backup ${backup.id}:`, error);
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} old backups`);
      
      // Record metrics
      this.metrics.increment('backup_cleanup_total', {}, deletedCount);

      return deletedCount;
    } catch (error) {
      this.logger.error('Backup cleanup process failed:', error);
      throw error;
    }
  }

  /**
   * Get backup configuration
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  /**
   * Get PITR configuration
   */
  getPitrConfig(): PointInTimeRecoveryConfig {
    return { ...this.pitrConfig };
  }

  /**
   * Health check for backup service
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; error?: string }> {
    try {
      if (!this.config.enabled) {
        return { status: 'healthy', error: 'Backup service disabled' };
      }

      // Check if backup directory is writable
      const testFilePath = join(this.config.backupPath, `health_check_${Date.now()}.tmp`);
      const fs = await import('fs/promises');
      await fs.writeFile(testFilePath, 'test');
      await fs.unlink(testFilePath);

      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}