import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsDateString, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SearchFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  source?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  customFields?: Record<string, any>;
}

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class SearchOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @IsOptional()
  @IsEnum(['relevance', 'date', 'combined'])
  rankingMode?: 'relevance' | 'date' | 'combined';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  includeHighlights?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  fuzzyMatching?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Transform(({ value }) => parseFloat(value))
  minSimilarity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  searchFields?: string[];
}

export class SearchQueryDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  query: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchFiltersDto)
  filters?: SearchFiltersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SearchOptionsDto)
  options?: SearchOptionsDto;
}

export class AutocompleteQueryDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(value))
  limit?: number;
}

export class BulkIndexUpdateDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leadIds?: string[];
}

export class SearchResponseDto {
  results: SearchResultDto[] = [];
  totalCount: number = 0;
  searchTime: number = 0;
  suggestions?: string[];
  facets?: SearchFacetsDto;
  query: SearchQueryInfoDto = new SearchQueryInfoDto();
}

export class SearchResultDto {
  id: string = '';
  rank: number = 0;
  similarity: number = 0;
  highlights?: SearchHighlightDto[];
  matchedFields: string[] = [];
  data: any = {};
}

export class SearchHighlightDto {
  field: string = '';
  fragment: string = '';
  startOffset: number = 0;
  endOffset: number = 0;
}

export class SearchFacetsDto {
  status?: Record<string, number>;
  source?: Record<string, number>;
  tags?: Record<string, number>;
  dateRanges?: Record<string, number>;
}

export class SearchQueryInfoDto {
  original: string = '';
  processed: string = '';
  tokens: string[] = [];
}

// Advanced search DTOs for complex queries

export class AdvancedSearchFiltersDto extends SearchFiltersDto {
  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ScoreRangeDto)
  scoreRange?: ScoreRangeDto;

  @IsOptional()
  @IsBoolean()
  hasNotes?: boolean;

  @IsOptional()
  @IsBoolean()
  hasEvents?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minEventCount?: number;
}

export class ScoreRangeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  min?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  max?: number = 100;
}

export class AdvancedSearchOptionsDto extends SearchOptionsDto {
  @IsOptional()
  @IsBoolean()
  includeRelatedData?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsBoolean()
  enableAnalytics?: boolean;
}

export class AdvancedSearchQueryDto extends SearchQueryDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedSearchFiltersDto)
  filters?: AdvancedSearchFiltersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedSearchOptionsDto)
  options?: AdvancedSearchOptionsDto;
}

// Search analytics DTOs

export class SearchAnalyticsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class SearchStatsDto {
  totalSearches: number = 0;
  uniqueQueries: number = 0;
  avgResultsPerSearch: number = 0;
  avgSearchTime: number = 0;
  topQueries: Array<{ query: string; count: number }> = [];
  zeroResultQueries: Array<{ query: string; count: number }> = [];
  popularFilters: Record<string, number> = {};
}

// Fuzzy search DTOs for typo tolerance

export class FuzzySearchDto extends SearchQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(3)
  maxTypos?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  similarityThreshold?: number;

  @IsOptional()
  @IsBoolean()
  enablePhoneticMatching?: boolean;
}

// Export validation groups for different use cases
export const BASIC_SEARCH_GROUP = 'basic_search';
export const ADVANCED_SEARCH_GROUP = 'advanced_search';
export const AUTOCOMPLETE_GROUP = 'autocomplete';
export const FUZZY_SEARCH_GROUP = 'fuzzy_search';