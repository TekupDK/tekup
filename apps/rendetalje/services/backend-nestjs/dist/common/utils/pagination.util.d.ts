import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';
export declare class PaginationUtil {
    static createPaginatedResponse<T>(data: T[], total: number, pagination: PaginationDto): PaginatedResponseDto<T>;
    static getOffset(page?: number, limit?: number): number;
    static validatePagination(pagination: PaginationDto): void;
}
