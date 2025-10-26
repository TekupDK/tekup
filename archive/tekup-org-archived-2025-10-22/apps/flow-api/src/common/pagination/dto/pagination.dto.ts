import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (base64 encoded)',
    example: 'eyJpZCI6MTIzfQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items to return',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'id',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class HybridPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination (overrides page-based pagination)',
    example: 'eyJpZCI6MTIzfQ==',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Include total count (may impact performance)',
    default: false,
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  includeTotalCount?: boolean = false;
}

// Response DTOs
export class PaginationMetaDto {
  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiPropertyOptional({ description: 'Total number of items', example: 150 })
  total: number;

  @ApiPropertyOptional({ description: 'Total number of pages', example: 8 })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiPropertyOptional({ description: 'Has previous page', example: false })
  hasPrevious: boolean;
}

export class CursorPaginationMetaDto {
  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiPropertyOptional({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiPropertyOptional({ description: 'Has previous page', example: false })
  hasPrevious: boolean;

  @ApiPropertyOptional({ 
    description: 'Cursor for next page', 
    example: 'eyJpZCI6MTQzfQ==' 
  })
  nextCursor?: string;

  @ApiPropertyOptional({ 
    description: 'Cursor for previous page', 
    example: 'eyJpZCI6MTIzfQ==' 
  })
  previousCursor?: string;

  @ApiPropertyOptional({ description: 'Total count (if requested)', example: 150 })
  total?: number;
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationMetaDto;
}

export class CursorPaginatedResponseDto<T> {
  data: T[];
  pagination: CursorPaginationMetaDto;
}

// Utility function to create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMetaDto
): PaginatedResponseDto<T> {
  return { data, pagination };
}

export function createCursorPaginatedResponse<T>(
  data: T[],
  pagination: CursorPaginationMetaDto
): CursorPaginatedResponseDto<T> {
  return { data, pagination };
}