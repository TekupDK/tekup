import { IsBoolean, IsNumber, IsOptional, IsString, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateArchivingConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  retentionDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  archiveOlderThanDays?: number;

  @IsOptional()
  @IsBoolean()
  enableCompression?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  deleteArchivedAfterDays?: number;

  @IsOptional()
  @IsString({ each: true })
  excludedEntities?: string[];
}

export class TriggerArchivingDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  includeCleanup?: boolean;
}

export class ArchiveStatsDto {
  @IsNumber()
  totalJobs: number = 0;

  @IsNumber()
  completedJobs: number = 0;

  @IsNumber()
  failedJobs: number = 0;

  @IsNumber()
  totalArchivedRecords: number = 0;

  @IsNumber()
  totalFailedRecords: number = 0;

  @IsString()
  lastRun: string = new Date().toISOString();
}

export class ArchivingConfigDto {
  @IsString()
  tenantId: string = '';

  @IsNumber()
  retentionDays: number = 365;

  @IsNumber()
  archiveOlderThanDays: number = 180;

  @IsBoolean()
  enableCompression: boolean = false;

  @IsOptional()
  @IsNumber()
  deleteArchivedAfterDays?: number;

  @IsOptional()
  @IsString({ each: true })
  excludedEntities?: string[];
}

export class ArchiveJobDto {
  @IsString()
  id: string = '';

  @IsString()
  tenantId: string = '';

  @IsString()
  entity: string = '';

  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';

  @IsNumber()
  totalRecords: number = 0;

  @IsNumber()
  processedRecords: number = 0;

  @IsNumber()
  archivedRecords: number = 0;

  @IsNumber()
  failedRecords: number = 0;

  @IsString()
  startedAt: string = new Date().toISOString();

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  archivePath?: string;
}

export class ArchiveResultDto {
  @IsNumber()
  archived: number = 0;

  @IsNumber()
  deleted: number = 0;

  @IsOptional()
  @IsString()
  jobId?: string;
}

export class HealthCheckDto {
  @IsEnum(['healthy', 'degraded', 'unhealthy'])
  status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  @IsOptional()
  @IsString()
  error?: string;
}