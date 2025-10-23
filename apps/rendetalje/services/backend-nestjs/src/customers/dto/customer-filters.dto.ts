import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CustomerFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'København', description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({ example: 4.0, description: 'Minimum satisfaction score' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  min_satisfaction?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum number of jobs' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_jobs?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Minimum total revenue' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_revenue?: number;
}