import { IsEnum, IsOptional, IsInt, Min, Max, IsString, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, Profitability } from '../entities/job.entity';

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatus, example: JobStatus.COMPLETED, description: 'New job status' })
  @IsEnum(JobStatus)
  status: JobStatus;

  @ApiPropertyOptional({ example: 135, description: 'Actual duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  actual_duration?: number;

  @ApiPropertyOptional({ example: 4, description: 'Quality score (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  quality_score?: number;

  @ApiPropertyOptional({ example: 'base64-encoded-signature', description: 'Customer signature' })
  @IsOptional()
  @IsString()
  customer_signature?: string;

  @ApiPropertyOptional({ 
    description: 'Profitability breakdown',
    example: {
      total_price: 1200,
      labor_cost: 600,
      material_cost: 100,
      travel_cost: 50,
      profit_margin: 450
    }
  })
  @IsOptional()
  @IsObject()
  profitability?: Profitability;
}