import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-based)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'name', description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'asc', description: 'Sort direction', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ example: 'search term', description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Array of items' })
  data: T[];

  @ApiPropertyOptional({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiPropertyOptional({ example: 1, description: 'Current page number' })
  page: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  limit: number;

  @ApiPropertyOptional({ example: 5, description: 'Total number of pages' })
  totalPages: number;

  @ApiPropertyOptional({ example: true, description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether there is a previous page' })
  hasPrev: boolean;
}