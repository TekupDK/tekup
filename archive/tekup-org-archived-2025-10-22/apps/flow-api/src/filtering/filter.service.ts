import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
  field: string;
}

export interface NumericRangeFilter {
  min?: number;
  max?: number;
  field: string;
}

export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
  nullsLast?: boolean;
}

export interface FilterRequest {
  tenantId: string;
  filters?: FilterCriteria[];
  dateFilters?: DateRangeFilter[];
  numericFilters?: NumericRangeFilter[];
  textSearch?: string;
  sorting?: SortCriteria[];
  pagination?: {
    limit: number;
    offset: number;
  };
  customFields?: Record<string, any>;
}

export interface FilterResponse<T> {
  data: T[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: AppliedFilter[];
  sortingApplied: SortCriteria[];
  executionTime: number;
  queryPlan?: any;
}

export interface AppliedFilter {
  field: string;
  operator: string;
  value: any;
  resultCount: number;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
  BETWEEN = 'between',
  REGEX = 'regex',
  ILIKE = 'ilike', // Case-insensitive like
  ARRAY_CONTAINS = 'arrayContains',
  ARRAY_CONTAINS_ANY = 'arrayContainsAny',
  JSON_CONTAINS = 'jsonContains',
}

export interface FilterMetadata {
  allowedFields: string[];
  fieldTypes: Record<string, string>;
  customFieldsEnabled: boolean;
  maxFilters: number;
  maxSortFields: number;
}

@Injectable()
export class FilterService {
  private readonly logger = new Logger(FilterService.name);
  private readonly allowedLeadFields = [
    'id', 'source', 'status', 'createdAt', 'updatedAt',
    'complianceType', 'severity', 'scanId', 'findingCategory',
    'recommendation', 'autoActionable', 'slaDeadline',
    'affectedSystems', 'duplicateOf'
  ];
  
  private readonly fieldTypes: Record<string, string> = {
    id: 'string',
    source: 'string',
    status: 'enum',
    createdAt: 'date',
    updatedAt: 'date',
    complianceType: 'enum',
    severity: 'enum',
    scanId: 'string',
    findingCategory: 'string',
    recommendation: 'string',
    autoActionable: 'boolean',
    slaDeadline: 'date',
    affectedSystems: 'array',
    duplicateOf: 'string',
  };

  private readonly maxFiltersPerRequest = 20;
  private readonly maxSortFields = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Apply advanced filtering and sorting to lead queries
   */
  async filterLeads(filterRequest: FilterRequest): Promise<FilterResponse<any>> {
    const startTime = Date.now();

    try {
      // Validate filter request
      this.validateFilterRequest(filterRequest);

      // Build Prisma query conditions
      const whereConditions = this.buildWhereConditions(filterRequest);
      
      // Build sorting conditions
      const orderByConditions = this.buildOrderByConditions(filterRequest.sorting || []);
      
      // Execute count query for total records
      const totalCount = await this.prisma.lead.count({
        where: { tenantId: filterRequest.tenantId },
      });

      // Execute filtered count query
      const filteredCount = await this.prisma.lead.count({
        where: whereConditions,
      });

      // Execute main query with pagination
      const data = await this.prisma.lead.findMany({
        where: whereConditions,
        orderBy: orderByConditions,
        skip: filterRequest.pagination?.offset || 0,
        take: filterRequest.pagination?.limit || 50,
        include: {
          events: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Generate applied filters summary
      const appliedFilters = this.generateAppliedFiltersSummary(filterRequest, data.length);

      const executionTime = Date.now() - startTime;

      // Record metrics
      this.recordFilterMetrics(filterRequest, executionTime, filteredCount);

      // Log filtering activity
      this.logFilterActivity(filterRequest, filteredCount, executionTime);

      return {
        data,
        totalCount,
        filteredCount,
        appliedFilters,
        sortingApplied: filterRequest.sorting || [],
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordFilterMetrics(filterRequest, executionTime, 0, error);
      
      this.structuredLogger.error(
        'Filter operation failed',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId: filterRequest.tenantId,
            filterCount: filterRequest.filters?.length || 0,
            error: error.message,
            executionTime,
          },
        }
      );

      throw error;
    }
  }

  /**
   * Get available filter options for a field
   */
  async getFilterOptions(
    tenantId: string,
    field: string,
    limit: number = 100
  ): Promise<{ values: any[]; count: number }> {
    if (!this.allowedLeadFields.includes(field)) {
      throw new BadRequestException(`Field "${field}" is not allowed for filtering`);
    }

    try {
      const result = await this.prisma.lead.findMany({
        where: { tenantId },
        select: { [field]: true },
        distinct: [field as any],
        take: limit,
        orderBy: { [field]: 'asc' },
      });

      const values = result
        .map(item => item[field as keyof typeof item])
        .filter(value => value !== null && value !== undefined);

      return {
        values: values.slice(0, limit),
        count: values.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get filter options for field ${field}:`, error);
      return { values: [], count: 0 };
    }
  }

  /**
   * Get filter metadata for UI components
   */
  getFilterMetadata(): FilterMetadata {
    return {
      allowedFields: this.allowedLeadFields,
      fieldTypes: this.fieldTypes,
      customFieldsEnabled: true,
      maxFilters: this.maxFiltersPerRequest,
      maxSortFields: this.maxSortFields,
    };
  }

  /**
   * Build complex queries with custom SQL for advanced filtering
   */
  async executeCustomFilter(
    tenantId: string,
    customQuery: string,
    parameters: any[] = []
  ): Promise<any[]> {
    // Validate and sanitize custom query
    this.validateCustomQuery(customQuery);

    try {
      const sanitizedQuery = this.sanitizeCustomQuery(customQuery, tenantId);
      const result = await this.prisma.$queryRawUnsafe(sanitizedQuery, ...parameters);
      
      this.structuredLogger.info(
        'Custom filter query executed',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId,
            queryLength: customQuery.length,
            parameterCount: parameters.length,
          },
        }
      );

      return Array.isArray(result) ? result : [result];
    } catch (error) {
      this.logger.error('Custom filter query failed:', error);
      throw new BadRequestException('Custom query execution failed');
    }
  }

  /**
   * Advanced date range filtering with time zones
   */
  async filterByDateRange(
    tenantId: string,
    field: string,
    from?: Date,
    to?: Date,
    timezone?: string
  ): Promise<any[]> {
    if (!this.allowedLeadFields.includes(field)) {
      throw new BadRequestException(`Field "${field}" is not allowed for date filtering`);
    }

    if (this.fieldTypes[field] !== 'date') {
      throw new BadRequestException(`Field "${field}" is not a date field`);
    }

    const whereCondition: any = { tenantId };
    const dateFilter: any = {};

    if (from) {
      dateFilter.gte = from;
    }

    if (to) {
      dateFilter.lte = to;
    }

    if (Object.keys(dateFilter).length > 0) {
      whereCondition[field] = dateFilter;
    }

    const results = await this.prisma.lead.findMany({
      where: whereCondition,
      orderBy: { [field]: 'desc' },
    });

    return results;
  }

  /**
   * Multi-field sorting with custom ordering
   */
  async applySorting<T>(
    query: any,
    sortCriteria: SortCriteria[]
  ): Promise<T[]> {
    if (sortCriteria.length === 0) {
      return query.orderBy({ createdAt: 'desc' });
    }

    const orderByConditions = this.buildOrderByConditions(sortCriteria);
    return query.orderBy(orderByConditions);
  }

  /**
   * Dynamic aggregation queries
   */
  async getAggregationData(
    tenantId: string,
    groupByField: string,
    aggregationType: 'count' | 'sum' | 'avg' | 'min' | 'max' = 'count',
    filters?: FilterCriteria[]
  ): Promise<Record<string, number>> {
    if (!this.allowedLeadFields.includes(groupByField)) {
      throw new BadRequestException(`Field "${groupByField}" is not allowed for aggregation`);
    }

    try {
      let whereConditions = { tenantId };
      
      if (filters && filters.length > 0) {
        whereConditions = this.buildWhereConditions({ tenantId, filters });
      }

      const rawQuery = `
        SELECT 
          "${groupByField}" as group_key,
          ${this.buildAggregationFunction(aggregationType, groupByField)} as value
        FROM "Lead"
        WHERE "tenantId" = $1
        ${filters ? this.buildFilterSQL(filters) : ''}
        GROUP BY "${groupByField}"
        ORDER BY value DESC
        LIMIT 50
      `;

      const result = await this.prisma.$queryRawUnsafe(rawQuery, tenantId);
      
      const aggregationData: Record<string, number> = {};
      (result as any[]).forEach(row => {
        if (row.group_key !== null) {
          aggregationData[row.group_key] = Number(row.value);
        }
      });

      return aggregationData;
    } catch (error) {
      this.logger.error('Aggregation query failed:', error);
      throw new BadRequestException('Aggregation query execution failed');
    }
  }

  private validateFilterRequest(filterRequest: FilterRequest): void {
    // Validate filter count
    const totalFilters = (filterRequest.filters?.length || 0) +
                        (filterRequest.dateFilters?.length || 0) +
                        (filterRequest.numericFilters?.length || 0);

    if (totalFilters > this.maxFiltersPerRequest) {
      throw new BadRequestException(
        `Too many filters. Maximum allowed: ${this.maxFiltersPerRequest}`
      );
    }

    // Validate sort criteria count
    if (filterRequest.sorting && filterRequest.sorting.length > this.maxSortFields) {
      throw new BadRequestException(
        `Too many sort fields. Maximum allowed: ${this.maxSortFields}`
      );
    }

    // Validate field names
    filterRequest.filters?.forEach(filter => {
      if (!this.allowedLeadFields.includes(filter.field)) {
        throw new BadRequestException(`Field "${filter.field}" is not allowed for filtering`);
      }
    });

    filterRequest.sorting?.forEach(sort => {
      if (!this.allowedLeadFields.includes(sort.field)) {
        throw new BadRequestException(`Field "${sort.field}" is not allowed for sorting`);
      }
    });

    // Validate pagination
    if (filterRequest.pagination) {
      if (filterRequest.pagination.limit > 1000) {
        throw new BadRequestException('Maximum limit is 1000');
      }
      if (filterRequest.pagination.limit < 1) {
        throw new BadRequestException('Limit must be at least 1');
      }
    }
  }

  private buildWhereConditions(filterRequest: FilterRequest): any {
    const conditions: any = { tenantId: filterRequest.tenantId };

    // Apply basic filters
    filterRequest.filters?.forEach(filter => {
      conditions[filter.field] = this.buildFilterCondition(filter);
    });

    // Apply date range filters
    filterRequest.dateFilters?.forEach(dateFilter => {
      const dateCondition: any = {};
      if (dateFilter.from) dateCondition.gte = dateFilter.from;
      if (dateFilter.to) dateCondition.lte = dateFilter.to;
      
      if (Object.keys(dateCondition).length > 0) {
        conditions[dateFilter.field] = dateCondition;
      }
    });

    // Apply numeric range filters
    filterRequest.numericFilters?.forEach(numFilter => {
      const numCondition: any = {};
      if (numFilter.min !== undefined) numCondition.gte = numFilter.min;
      if (numFilter.max !== undefined) numCondition.lte = numFilter.max;
      
      if (Object.keys(numCondition).length > 0) {
        conditions[numFilter.field] = numCondition;
      }
    });

    // Apply text search (simple implementation)
    if (filterRequest.textSearch && filterRequest.textSearch.trim().length > 0) {
      conditions.OR = [
        { source: { contains: filterRequest.textSearch, mode: 'insensitive' } },
        { recommendation: { contains: filterRequest.textSearch, mode: 'insensitive' } },
        { findingCategory: { contains: filterRequest.textSearch, mode: 'insensitive' } },
      ];
    }

    return conditions;
  }

  private buildFilterCondition(filter: FilterCriteria): any {
    switch (filter.operator) {
      case FilterOperator.EQUALS:
        return { equals: filter.value };
      case FilterOperator.NOT_EQUALS:
        return { not: filter.value };
      case FilterOperator.GREATER_THAN:
        return { gt: filter.value };
      case FilterOperator.GREATER_THAN_OR_EQUAL:
        return { gte: filter.value };
      case FilterOperator.LESS_THAN:
        return { lt: filter.value };
      case FilterOperator.LESS_THAN_OR_EQUAL:
        return { lte: filter.value };
      case FilterOperator.CONTAINS:
        return { contains: filter.value, mode: 'insensitive' };
      case FilterOperator.STARTS_WITH:
        return { startsWith: filter.value, mode: 'insensitive' };
      case FilterOperator.ENDS_WITH:
        return { endsWith: filter.value, mode: 'insensitive' };
      case FilterOperator.IN:
        return { in: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case FilterOperator.NOT_IN:
        return { notIn: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case FilterOperator.IS_NULL:
        return null;
      case FilterOperator.IS_NOT_NULL:
        return { not: null };
      case FilterOperator.ARRAY_CONTAINS:
        return { has: filter.value };
      case FilterOperator.ARRAY_CONTAINS_ANY:
        return { hasSome: Array.isArray(filter.value) ? filter.value : [filter.value] };
      default:
        throw new BadRequestException(`Unsupported filter operator: ${filter.operator}`);
    }
  }

  private buildOrderByConditions(sortCriteria: SortCriteria[]): any[] {
    if (sortCriteria.length === 0) {
      return [{ createdAt: 'desc' }];
    }

    return sortCriteria.map(sort => ({
      [sort.field]: sort.direction,
    }));
  }

  private buildAggregationFunction(type: string, field: string): string {
    switch (type) {
      case 'count':
        return 'COUNT(*)';
      case 'sum':
        return `SUM("${field}")`;
      case 'avg':
        return `AVG("${field}")`;
      case 'min':
        return `MIN("${field}")`;
      case 'max':
        return `MAX("${field}")`;
      default:
        return 'COUNT(*)';
    }
  }

  private buildFilterSQL(filters: FilterCriteria[]): string {
    // This is a simplified version - would need more sophisticated SQL building
    return filters.map(filter => {
      switch (filter.operator) {
        case FilterOperator.EQUALS:
          return `AND "${filter.field}" = '${filter.value}'`;
        case FilterOperator.CONTAINS:
          return `AND "${filter.field}" ILIKE '%${filter.value}%'`;
        default:
          return '';
      }
    }).join(' ');
  }

  private validateCustomQuery(query: string): void {
    // Basic SQL injection prevention
    const dangerousPatterns = [
      /;\s*(drop|delete|insert|update|alter|create|truncate)/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /xp_/i,
      /sp_/i,
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(query)) {
        throw new BadRequestException('Query contains potentially dangerous SQL patterns');
      }
    });

    // Must contain FROM "Lead"
    if (!query.toLowerCase().includes('from "lead"')) {
      throw new BadRequestException('Query must include FROM "Lead" clause');
    }
  }

  private sanitizeCustomQuery(query: string, tenantId: string): string {
    // Ensure tenant isolation
    if (!query.toLowerCase().includes('"tenantid"')) {
      const whereClause = `WHERE "tenantId" = '${tenantId}'`;
      
      if (query.toLowerCase().includes('where')) {
        query = query.replace(/where/i, `WHERE "tenantId" = '${tenantId}' AND `);
      } else {
        query += ` ${whereClause}`;
      }
    }

    return query;
  }

  private generateAppliedFiltersSummary(
    filterRequest: FilterRequest,
    resultCount: number
  ): AppliedFilter[] {
    const appliedFilters: AppliedFilter[] = [];

    filterRequest.filters?.forEach(filter => {
      appliedFilters.push({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        resultCount,
      });
    });

    filterRequest.dateFilters?.forEach(dateFilter => {
      appliedFilters.push({
        field: dateFilter.field,
        operator: 'dateRange',
        value: { from: dateFilter.from, to: dateFilter.to },
        resultCount,
      });
    });

    return appliedFilters;
  }

  private recordFilterMetrics(
    filterRequest: FilterRequest,
    executionTime: number,
    resultCount: number,
    error?: any
  ): void {
    const labels = {
      tenant: filterRequest.tenantId,
      filterCount: (filterRequest.filters?.length || 0).toString(),
      sortCount: (filterRequest.sorting?.length || 0).toString(),
      hasError: error ? 'true' : 'false',
    };

    this.metricsService.histogram('filter_operation_duration_ms', executionTime, labels);
    this.metricsService.histogram('filter_operation_results', resultCount, labels);
    this.metricsService.increment('filter_operations_total', labels);

    if (error) {
      this.metricsService.increment('filter_operation_errors_total', {
        ...labels,
        errorType: error.constructor.name,
      });
    }
  }

  private logFilterActivity(
    filterRequest: FilterRequest,
    resultCount: number,
    executionTime: number
  ): void {
    this.structuredLogger.info(
      'Filter operation completed',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId: filterRequest.tenantId,
          filterCount: filterRequest.filters?.length || 0,
          dateFilterCount: filterRequest.dateFilters?.length || 0,
          numericFilterCount: filterRequest.numericFilters?.length || 0,
          sortingCount: filterRequest.sorting?.length || 0,
          resultCount,
          executionTime,
          hasTextSearch: !!filterRequest.textSearch,
          hasPagination: !!filterRequest.pagination,
        },
      }
    );
  }
}