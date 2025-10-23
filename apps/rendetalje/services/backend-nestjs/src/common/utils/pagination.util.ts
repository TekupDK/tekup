import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';

export class PaginationUtil {
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    pagination: PaginationDto,
  ): PaginatedResponseDto<T> {
    const { page = 1, limit = 20 } = pagination;
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  static getOffset(page: number = 1, limit: number = 20): number {
    return (page - 1) * limit;
  }

  static validatePagination(pagination: PaginationDto): void {
    const { page = 1, limit = 20 } = pagination;
    
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }
    
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }
}