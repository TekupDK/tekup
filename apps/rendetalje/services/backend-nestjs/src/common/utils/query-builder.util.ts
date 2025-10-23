import { SupabaseClient } from '@supabase/supabase-js';
import { PaginationDto } from '../dto/pagination.dto';
import { PaginationUtil } from './pagination.util';

export class QueryBuilderUtil {
  static applyPagination<T>(
    query: any,
    pagination: PaginationDto,
  ): any {
    const { page = 1, limit = 20, sortBy, sortOrder = 'asc' } = pagination;
    
    PaginationUtil.validatePagination(pagination);
    
    const offset = PaginationUtil.getOffset(page, limit);
    
    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      // Default sort by created_at desc
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    return query;
  }

  static applySearch(
    query: any,
    searchFields: string[],
    searchTerm?: string,
  ): any {
    if (!searchTerm || searchFields.length === 0) {
      return query;
    }

    // Create OR conditions for search across multiple fields
    const searchConditions = searchFields.map(field => 
      `${field}.ilike.%${searchTerm}%`
    ).join(',');

    return query.or(searchConditions);
  }

  static applyFilters(
    query: any,
    filters: Record<string, any>,
  ): any {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    return query;
  }

  static async executeCountQuery(
    client: SupabaseClient,
    tableName: string,
    filters?: Record<string, any>,
    searchFields?: string[],
    searchTerm?: string,
  ): Promise<number> {
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