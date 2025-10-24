"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationUtil = void 0;
class PaginationUtil {
    static createPaginatedResponse(data, total, pagination) {
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
    static getOffset(page = 1, limit = 20) {
        return (page - 1) * limit;
    }
    static validatePagination(pagination) {
        const { page = 1, limit = 20 } = pagination;
        if (page < 1) {
            throw new Error('Page must be greater than 0');
        }
        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
    }
}
exports.PaginationUtil = PaginationUtil;
//# sourceMappingURL=pagination.util.js.map