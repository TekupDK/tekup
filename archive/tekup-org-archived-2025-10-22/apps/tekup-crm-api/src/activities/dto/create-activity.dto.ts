import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  tenantId: string;

  @IsString()
  activityTypeId: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  outcome?: string;
}