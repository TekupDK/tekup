import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, ValidateNested, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  validateAfterBackup?: boolean;
}

export class BackupJobDto {
  @IsString()
  id: string;

  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsEnum(['pending', 'running', 'completed', 'failed', 'validating', 'validated', 'validation_failed'])
  status: 'pending' | 'running' | 'completed' | 'failed' | 'validating' | 'validated' | 'validation_failed';

  @IsString()
  backupPath: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  checksum: string;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsDateString()
  validatedAt?: string;

  @IsOptional()
  @IsBoolean()
  validationPassed?: boolean;

  @IsBoolean()
  encrypted: boolean;

  @IsBoolean()
  compressed: boolean;
}

export class RestoreJobDto {
  @IsString()
  id: string;

  @IsString()
  backupId: string;

  @IsDateString()
  startedAt: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsEnum(['pending', 'running', 'completed', 'failed'])
  status: 'pending' | 'running' | 'completed' | 'failed';

  @IsString()
  restorePath: string;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsNumber()
  restoredRecords: number;
}

export class BackupStatsDto {
  @IsNumber()
  totalBackups: number;

  @IsNumber()
  successfulBackups: number;

  @IsNumber()
  failedBackups: number;

  @IsNumber()
  totalSize: number;

  @IsOptional()
  @IsDateString()
  lastBackup?: string;

  @IsOptional()
  @IsDateString()
  lastValidation?: string;

  @IsBoolean()
  validationPassed: boolean;
}

export class BackupConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  cronSchedule: string;

  @IsNumber()
  retentionDays: number;

  @IsString()
  backupPath: string;

  @IsBoolean()
  enableCompression: boolean;

  @IsBoolean()
  enableEncryption: boolean;

  @IsOptional()
  @IsString()
  encryptionKey?: string;

  @IsBoolean()
  crossRegionReplication: boolean;

  @IsArray()
  @IsString({ each: true })
  replicationRegions: string[];

  @IsBoolean()
  validationEnabled: boolean;

  @IsString()
  validationCronSchedule: string;
}

export class PointInTimeRecoveryConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsNumber()
  retentionHours: number;

  @IsBoolean()
  walArchivingEnabled: boolean;

  @IsString()
  walArchivePath: string;
}

export class ValidateBackupDto {
  @IsString()
  backupId: string;
}

export class RestoreBackupDto {
  @IsString()
  backupId: string;

  @IsOptional()
  @IsBoolean()
  stopServices?: boolean;
}

export class HealthCheckDto {
  @IsEnum(['healthy', 'degraded', 'unhealthy'])
  status: 'healthy' | 'degraded' | 'unhealthy';

  @IsOptional()
  @IsString()
  error?: string;
}