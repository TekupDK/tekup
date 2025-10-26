import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class InitializeDeploymentDto {
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  executeMigrations?: boolean;
}

export class DeploymentStatusDto {
  @IsString()
  id: string;

  @IsString()
  version: string;

  @IsEnum(['pending', 'deploying', 'ready', 'healthy', 'degraded', 'unhealthy', 'rolled_back', 'failed'])
  status: 'pending' | 'deploying' | 'ready' | 'healthy' | 'degraded' | 'unhealthy' | 'rolled_back' | 'failed';

  @IsString()
  startedAt: string;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthCheckDto)
  healthChecks: HealthCheckDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => MigrationStatusDto)
  migrationStatus?: MigrationStatusDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => RollbackInfoDto)
  rollbackInfo?: RollbackInfoDto;
}

export class MigrationStatusDto {
  @IsString()
  name: string;

  @IsEnum(['pending', 'running', 'completed', 'failed'])
  status: 'pending' | 'running' | 'completed' | 'failed';

  @IsString()
  startedAt: string;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;
}

export class RollbackInfoDto {
  @IsString()
  originalVersion: string;

  @IsString()
  rollbackReason: string;

  @IsString()
  rollbackStartedAt: string;

  @IsOptional()
  @IsString()
  rollbackCompletedAt?: string;

  @IsBoolean()
  rollbackSuccess: boolean;
}

export class HealthCheckDto {
  @IsString()
  status: string;

  @IsString()
  timestamp: string;

  @IsNumber()
  uptime: number;

  @IsString()
  version: string;

  @IsString()
  environment: string;

  @IsArray()
  dependencies: any[];

  @IsOptional()
  metrics?: any;
}

export class DeploymentConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  healthCheckEndpoint: string;

  @IsString()
  readinessCheckEndpoint: string;

  @IsNumber()
  shutdownTimeout: number;

  @IsNumber()
  migrationTimeout: number;

  @IsBoolean()
  rollbackOnFailure: boolean;

  @IsNumber()
  maxRetries: number;

  @IsNumber()
  retryDelay: number;
}

export class ReadinessCheckDto {
  @IsBoolean()
  ready: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RollbackDeploymentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class HealthCheckResultDto {
  @IsEnum(['healthy', 'degraded', 'unhealthy'])
  status: 'healthy' | 'degraded' | 'unhealthy';

  @IsOptional()
  @IsString()
  error?: string;
}