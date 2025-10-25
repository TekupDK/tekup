import { IsOptional, IsEnum, IsInt, Min, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { LeadStatus, LeadPriority } from '../entities/lead.entity';

export class LeadFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LeadStatus, description: 'Filter by lead status' })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority, description: 'Filter by lead priority' })
  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @ApiPropertyOptional({ example: 'website', description: 'Filter by source' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 3000, description: 'Minimum estimated value in DKK' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minEstimatedValue?: number;

  @ApiPropertyOptional({ example: 50, description: 'Minimum lead score' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minScore?: number;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Filter by email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+4512345678', description: 'Filter by phone' })
  @IsOptional()
  @IsString()
  phone?: string;
}
