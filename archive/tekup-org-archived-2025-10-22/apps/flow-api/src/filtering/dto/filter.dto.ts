import { IsString, IsOptional, IsArray, IsNumber, IsDateString, IsEnum, ValidateNested, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum FilterOperatorDto {
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
  ILIKE = 'ilike',
  ARRAY_CONTAINS = 'arrayContains',
  ARRAY_CONTAINS_ANY = 'arrayContainsAny',
  JSON_CONTAINS = 'jsonContains',
}

export class FilterCriteriaDto {
  @IsString()
  field: string;

  @IsEnum(FilterOperatorDto)
  operator: FilterOperatorDto;

  value: any;

  @IsOptional()
  @IsEnum(['string', 'number', 'date', 'boolean', 'array'])
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'array';
}

export class DateRangeFilterDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsString()
  field: string;
}

export class NumericRangeFilterDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  min?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  max?: number;

  @IsString()
  field: string;
}

export class SortCriteriaDto {
  @IsString()
  field: string;

  @IsEnum(['asc', 'desc'])
  direction: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  nullsLast?: boolean;
}

export class PaginationDto {
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  limit: number;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset: number;
}

export class FilterRequestDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterCriteriaDto)
  filters?: FilterCriteriaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateRangeFilterDto)
  dateFilters?: DateRangeFilterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NumericRangeFilterDto)
  numericFilters?: NumericRangeFilterDto[];

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  textSearch?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortCriteriaDto)
  sorting?: SortCriteriaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;

  @IsOptional()
  customFields?: Record<string, any>;
}

export class CustomFilterDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  query: string;

  @IsOptional()
  @IsArray()
  parameters?: any[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

export class AggregationRequestDto {
  @IsString()
  groupByField: string;

  @IsOptional()
  @IsEnum(['count', 'sum', 'avg', 'min', 'max'])
  aggregationType?: 'count' | 'sum' | 'avg' | 'min' | 'max';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterCriteriaDto)
  filters?: FilterCriteriaDto[];
}

// Response DTOs

export class FilterResponseDto<T> {
  data: T[];
  totalCount: number;
  filteredCount: number;
  appliedFilters: AppliedFilterDto[];
  sortingApplied: SortCriteriaDto[];
  executionTime: number;
  queryPlan?: any;
}

export class AppliedFilterDto {
  field: string;
  operator: string;
  value: any;
  resultCount: number;
}

export class FilterMetadataDto {
  allowedFields: string[];
  fieldTypes: Record<string, string>;
  customFieldsEnabled: boolean;
  maxFilters: number;
  maxSortFields: number;
}

// Advanced filtering DTOs

export class AdvancedFilterRequestDto extends FilterRequestDto {
  @IsOptional()
  @IsBoolean()
  includeRelatedData?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeFields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeFields?: string[];

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  enableAnalytics?: boolean;
}

export class FilterConditionGroupDto {
  @IsEnum(['AND', 'OR'])
  operator: 'AND' | 'OR';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterCriteriaDto)
  conditions: FilterCriteriaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionGroupDto)
  nestedGroups?: FilterConditionGroupDto[];
}

export class ComplexFilterRequestDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterConditionGroupDto)
  filterGroup?: FilterConditionGroupDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateRangeFilterDto)
  dateFilters?: DateRangeFilterDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortCriteriaDto)
  sorting?: SortCriteriaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;
}

// Export validation DTOs

export class ExportFilterRequestDto extends FilterRequestDto {
  @IsOptional()
  @IsEnum(['json', 'csv', 'xlsx'])
  format?: 'json' | 'csv' | 'xlsx';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  @IsOptional()
  @IsBoolean()
  includeHeaders?: boolean;

  @IsOptional()
  @IsString()
  filename?: string;
}

// Analytics DTOs

export class FilterAnalyticsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupByFields?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class FilterStatsResponseDto {
  totalQueries: number;
  uniqueFilters: number;
  avgExecutionTime: number;
  avgResultsPerQuery: number;
  popularFields: Array<{ field: string; count: number }>;
  popularOperators: Array<{ operator: string; count: number }>;
  performanceMetrics: {
    slowQueries: number;
    fastQueries: number;
    timeoutQueries: number;
  };
}

// Validation groups for different use cases
export const BASIC_FILTER_GROUP = 'basic_filter';
export const ADVANCED_FILTER_GROUP = 'advanced_filter';
export const COMPLEX_FILTER_GROUP = 'complex_filter';
export const EXPORT_FILTER_GROUP = 'export_filter';
export const ANALYTICS_GROUP = 'analytics';