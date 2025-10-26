import { IsOptional, IsString, IsNumber, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum LeadSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  STATUS = 'status',
  SOURCE = 'source',
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsEnum(LeadSortField)
  sortField?: LeadSortField = LeadSortField.CREATED_AT;
}

export class LeadListDto extends PaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface PaginationMeta {
  totalCount?: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
  limit: number;
  currentPage?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}

export interface CursorInfo {
  id: string;
  createdAt: Date;
  [key: string]: any;
}

export class CursorPagination {
  /**
   * Encode cursor from record data
   */
  static encodeCursor(record: CursorInfo, sortField: string = 'createdAt'): string {
    const cursorData = {
      id: record.id,
      [sortField]: record[sortField],
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode cursor to extract sorting information
   */
  static decodeCursor(cursor: string): { id: string; [key: string]: any } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate pagination metadata
   */
  static generateMeta<T extends CursorInfo>(
    data: T[],
    dto: PaginationDto,
    totalCount?: number
  ): PaginationMeta {
    const hasNextPage = data.length === dto.limit;
    const hasPreviousPage = !!dto.cursor;

    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (hasNextPage && data.length > 0) {
      const lastRecord = data[data.length - 1];
      nextCursor = this.encodeCursor(lastRecord, dto.sortField);
    }

    if (hasPreviousPage && data.length > 0) {
      const firstRecord = data[0];
      previousCursor = this.encodeCursor(firstRecord, dto.sortField);
    }

    const meta: PaginationMeta = {
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor,
      limit: dto.limit || 20,
    };

    // Add total count information if available
    if (totalCount !== undefined) {
      meta.totalCount = totalCount;
      meta.totalPages = Math.ceil(totalCount / (dto.limit || 20));
      
      // Estimate current page (approximate for cursor-based pagination)
      if (dto.cursor) {
        meta.currentPage = Math.floor(totalCount / (dto.limit || 20)) - Math.floor(data.length / (dto.limit || 20));
      } else {
        meta.currentPage = 1;
      }
    }

    return meta;
  }

  /**
   * Generate pagination links
   */
  static generateLinks(
    baseUrl: string,
    meta: PaginationMeta,
    dto: PaginationDto
  ): PaginatedResponse<any>['links'] {
    const params = new URLSearchParams();
    
    if (dto.limit) params.set('limit', dto.limit.toString());
    if (dto.sortField) params.set('sortField', dto.sortField);
    if (dto.sortOrder) params.set('sortOrder', dto.sortOrder);

    const links: PaginatedResponse<any>['links'] = {};

    // First page link
    const firstParams = new URLSearchParams(params);
    links.first = `${baseUrl}?${firstParams.toString()}`;

    // Next page link
    if (meta.hasNextPage && meta.nextCursor) {
      const nextParams = new URLSearchParams(params);
      nextParams.set('cursor', meta.nextCursor);
      links.next = `${baseUrl}?${nextParams.toString()}`;
    }

    // Previous page link
    if (meta.hasPreviousPage && meta.previousCursor) {
      const prevParams = new URLSearchParams(params);
      prevParams.set('cursor', meta.previousCursor);
      links.previous = `${baseUrl}?${prevParams.toString()}`;
    }

    return links;
  }
}

export class OffsetPagination {
  /**
   * Calculate offset from page and limit
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Generate offset-based pagination metadata
   */
  static generateMeta(
    totalCount: number,
    page: number,
    limit: number
  ): PaginationMeta {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      totalCount,
      hasNextPage,
      hasPreviousPage,
      limit,
      currentPage: page,
      totalPages,
    };
  }
}