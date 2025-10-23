import { IsOptional, IsEnum, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, JobStatus } from '../entities/job.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class JobFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: JobStatus, description: 'Filter by job status' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ enum: ServiceType, description: 'Filter by service type' })
  @IsOptional()
  @IsEnum(ServiceType)
  service_type?: ServiceType;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000002', description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000003', description: 'Filter by assigned team member ID' })
  @IsOptional()
  @IsUUID()
  team_member_id?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Filter by date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Filter by date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ example: 'København', description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}