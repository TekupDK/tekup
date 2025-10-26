import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationQueryDto, CursorPaginationQueryDto, HybridPaginationQueryDto } from './dto/pagination.dto.js';
import { plainToClass, transform } from 'class-transformer';
import { validate } from 'class-validator';

/**
 * Extract and validate pagination parameters from query string
 */
export const Pagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<PaginationQueryDto> => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    // Transform query parameters to proper types
    const paginationDto = plainToClass(PaginationQueryDto, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      sortBy: query.sortBy || undefined,
      sortOrder: query.sortOrder || 'desc',
    });

    // Validate the DTO
    const errors = await validate(paginationDto);
    if (errors.length > 0) {
      throw new Error(`Pagination validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    return paginationDto;
  },
);

/**
 * Extract and validate cursor pagination parameters from query string
 */
export const CursorPagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<CursorPaginationQueryDto> => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const paginationDto = plainToClass(CursorPaginationQueryDto, {
      cursor: query.cursor || undefined,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      sortBy: query.sortBy || 'id',
      sortOrder: query.sortOrder || 'desc',
    });

    const errors = await validate(paginationDto);
    if (errors.length > 0) {
      throw new Error(`Cursor pagination validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    return paginationDto;
  },
);

/**
 * Extract and validate hybrid pagination parameters from query string
 */
export const HybridPagination = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<HybridPaginationQueryDto> => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const paginationDto = plainToClass(HybridPaginationQueryDto, {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      sortBy: query.sortBy || undefined,
      sortOrder: query.sortOrder || 'desc',
      cursor: query.cursor || undefined,
      includeTotalCount: query.includeTotalCount === 'true' || query.includeTotalCount === true,
    });

    const errors = await validate(paginationDto);
    if (errors.length > 0) {
      throw new Error(`Hybrid pagination validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    return paginationDto;
  },
);

/**
 * Decorator to automatically apply pagination to controller methods
 */
export function UsePagination(type: 'offset' | 'cursor' | 'hybrid' = 'offset') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // The pagination parameters should be injected via the parameter decorators
      // This decorator is mainly for documentation and future enhancements
      return originalMethod.apply(this, args);
    };

    // Add metadata for Swagger documentation
    Reflect.defineMetadata('pagination:type', type, target, propertyName);

    return descriptor;
  };
}

/**
 * Utility function to extract pagination from request manually
 */
export function extractPaginationFromRequest(request: any): PaginationQueryDto {
  const query = request.query;
  
  return {
    page: query.page ? Math.max(1, parseInt(query.page, 10)) : 1,
    limit: query.limit ? Math.min(100, Math.max(1, parseInt(query.limit, 10))) : 20,
    sortBy: query.sortBy || undefined,
    sortOrder: ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : 'desc',
  };
}

/**
 * Utility function to extract cursor pagination from request manually
 */
export function extractCursorPaginationFromRequest(request: any): CursorPaginationQueryDto {
  const query = request.query;
  
  return {
    cursor: query.cursor || undefined,
    limit: query.limit ? Math.min(100, Math.max(1, parseInt(query.limit, 10))) : 20,
    sortBy: query.sortBy || 'id',
    sortOrder: ['asc', 'desc'].includes(query.sortOrder) ? query.sortOrder : 'desc',
  };
}