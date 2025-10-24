import { SupabaseClient } from '@supabase/supabase-js';
import { PaginationDto } from '../dto/pagination.dto';
export declare class QueryBuilderUtil {
    static applyPagination<T>(query: any, pagination: PaginationDto): any;
    static applySearch(query: any, searchFields: string[], searchTerm?: string): any;
    static applyFilters(query: any, filters: Record<string, any>): any;
    static executeCountQuery(client: SupabaseClient, tableName: string, filters?: Record<string, any>, searchFields?: string[], searchTerm?: string): Promise<number>;
}
