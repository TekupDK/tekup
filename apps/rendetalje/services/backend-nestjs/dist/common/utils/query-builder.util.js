"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilderUtil = void 0;
const pagination_util_1 = require("./pagination.util");
class QueryBuilderUtil {
    static applyPagination(query, pagination) {
        const { page = 1, limit = 20, sortBy, sortOrder = 'asc' } = pagination;
        pagination_util_1.PaginationUtil.validatePagination(pagination);
        const offset = pagination_util_1.PaginationUtil.getOffset(page, limit);
        if (sortBy) {
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        }
        else {
            query = query.order('created_at', { ascending: false });
        }
        query = query.range(offset, offset + limit - 1);
        return query;
    }
    static applySearch(query, searchFields, searchTerm) {
        if (!searchTerm || searchFields.length === 0) {
            return query;
        }
        const searchConditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`).join(',');
        return query.or(searchConditions);
    }
    static applyFilters(query, filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    query = query.in(key, value);
                }
                else {
                    query = query.eq(key, value);
                }
            }
        });
        return query;
    }
    static async executeCountQuery(client, tableName, filters, searchFields, searchTerm) {
        let countQuery = client
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        if (filters) {
            countQuery = this.applyFilters(countQuery, filters);
        }
        if (searchFields && searchTerm) {
            countQuery = this.applySearch(countQuery, searchFields, searchTerm);
        }
        const { count, error } = await countQuery;
        if (error) {
            throw new Error(`Failed to count records: ${error.message}`);
        }
        return count || 0;
    }
}
exports.QueryBuilderUtil = QueryBuilderUtil;
//# sourceMappingURL=query-builder.util.js.map