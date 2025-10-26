import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FilterService, FilterRequest, FilterResponse, FilterMetadata } from './filter.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';
import { CacheInterceptor } from '../cache/cache.interceptor.js';
import { ValidationPipe } from '../common/validation/validation.pipe.js';
import { FilterRequestDto, AggregationRequestDto, CustomFilterDto } from './dto/filter.dto.js';

@Controller('filter')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor, CacheInterceptor)
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  /**
   * Apply advanced filtering and sorting to leads
   */
  @Post('leads')
  @RateLimit({
    windowMs: 60000,  // 1 minute
    maxRequests: 100,
  })
  async filterLeads(
    @Body(ValidationPipe) filterRequestDto: FilterRequestDto,
    @Req() req: Request
  ): Promise<FilterResponse<any>> {
    const tenantId = this.extractTenantId(req);
    
    const filterRequest: FilterRequest = {
      tenantId,
      filters: filterRequestDto.filters,
      dateFilters: filterRequestDto.dateFilters,
      numericFilters: filterRequestDto.numericFilters,
      textSearch: filterRequestDto.textSearch,
      sorting: filterRequestDto.sorting,
      pagination: filterRequestDto.pagination,
      customFields: filterRequestDto.customFields,
    };

    return this.filterService.filterLeads(filterRequest);
  }

  /**
   * Quick filtering with GET method for simple queries
   */
  @Get('leads')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 150,
  })
  async quickFilter(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('complianceType') complianceType?: string,
    @Query('severity') severity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
    @Req() req: Request
  ): Promise<FilterResponse<any>> {
    const tenantId = this.extractTenantId(req);
    
    const filterRequest: FilterRequest = {
      tenantId,
      filters: [],
      dateFilters: [],
      numericFilters: [],
    };

    // Build filters from query parameters
    if (status) {
      filterRequest.filters!.push({
        field: 'status',
        operator: 'in' as any,
        value: status.split(','),
      });
    }

    if (source) {
      filterRequest.filters!.push({
        field: 'source',
        operator: 'in' as any,
        value: source.split(','),
      });
    }

    if (complianceType) {
      filterRequest.filters!.push({
        field: 'complianceType',
        operator: 'in' as any,
        value: complianceType.split(','),
      });
    }

    if (severity) {
      filterRequest.filters!.push({
        field: 'severity',
        operator: 'in' as any,
        value: severity.split(','),
      });
    }

    // Date range filter
    if (from || to) {
      filterRequest.dateFilters!.push({
        field: 'createdAt',
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
    }

    // Text search
    if (search) {
      filterRequest.textSearch = search.trim();
    }

    // Sorting
    if (sortBy) {
      filterRequest.sorting = [{
        field: sortBy,
        direction: sortOrder || 'desc',
      }];
    }

    // Pagination
    if (limit || offset) {
      filterRequest.pagination = {
        limit: limit ? Math.min(parseInt(limit, 10), 1000) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };
    }

    return this.filterService.filterLeads(filterRequest);
  }

  /**
   * Get available filter options for a specific field
   */
  @Get('options/:field')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 100,
  })
  async getFilterOptions(
    @Param('field') field: string,
    @Query('limit') limit?: string,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!field || field.trim().length === 0) {
      throw new BadRequestException('Field parameter is required');
    }

    const optionLimit = limit ? Math.min(parseInt(limit, 10), 500) : 100;
    
    const options = await this.filterService.getFilterOptions(
      tenantId,
      field.trim(),
      optionLimit
    );

    return {
      field,
      options: options.values,
      totalCount: options.count,
      truncated: options.count > optionLimit,
    };
  }

  /**
   * Get filter metadata for UI components
   */
  @Get('metadata')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 50,  // Lower frequency for metadata
  })
  async getFilterMetadata(): Promise<FilterMetadata> {
    return this.filterService.getFilterMetadata();
  }

  /**
   * Execute custom filtering query (admin operation)
   */
  @Post('custom')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10,  // Very limited for custom queries
  })
  async executeCustomFilter(
    @Body(ValidationPipe) customFilterDto: CustomFilterDto,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!customFilterDto.query || customFilterDto.query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }

    if (customFilterDto.query.length > 2000) {
      throw new BadRequestException('Query too long. Maximum 2000 characters allowed');
    }

    try {
      const results = await this.filterService.executeCustomFilter(
        tenantId,
        customFilterDto.query.trim(),
        customFilterDto.parameters || []
      );

      return {
        success: true,
        results,
        resultCount: results.length,
        query: customFilterDto.query,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        query: customFilterDto.query,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Advanced date range filtering
   */
  @Get('date-range/:field')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 100,
  })
  async filterByDateRange(
    @Param('field') field: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('timezone') timezone?: string,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!field || field.trim().length === 0) {
      throw new BadRequestException('Field parameter is required');
    }

    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (from) {
      fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        throw new BadRequestException('Invalid "from" date format');
      }
    }

    if (to) {
      toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        throw new BadRequestException('Invalid "to" date format');
      }
    }

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('"from" date must be before "to" date');
    }

    const results = await this.filterService.filterByDateRange(
      tenantId,
      field.trim(),
      fromDate,
      toDate,
      timezone
    );

    return {
      field,
      dateRange: {
        from: fromDate?.toISOString(),
        to: toDate?.toISOString(),
        timezone,
      },
      results,
      resultCount: results.length,
    };
  }

  /**
   * Get aggregation data for analytics
   */
  @Post('aggregation')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 50,
  })
  async getAggregationData(
    @Body(ValidationPipe) aggregationDto: AggregationRequestDto,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    if (!aggregationDto.groupByField) {
      throw new BadRequestException('groupByField is required');
    }

    try {
      const aggregationData = await this.filterService.getAggregationData(
        tenantId,
        aggregationDto.groupByField,
        aggregationDto.aggregationType || 'count',
        aggregationDto.filters
      );

      return {
        success: true,
        groupByField: aggregationDto.groupByField,
        aggregationType: aggregationDto.aggregationType || 'count',
        data: aggregationData,
        entryCount: Object.keys(aggregationData).length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        groupByField: aggregationDto.groupByField,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get filtering statistics for analytics
   */
  @Get('stats')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 20,
  })
  async getFilteringStats(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    try {
      // Get basic statistics
      const [
        totalLeads,
        statusAggregation,
        sourceAggregation,
        complianceTypeAggregation,
        severityAggregation
      ] = await Promise.all([
        this.filterService.getAggregationData(tenantId, 'id', 'count'),
        this.filterService.getAggregationData(tenantId, 'status', 'count'),
        this.filterService.getAggregationData(tenantId, 'source', 'count'),
        this.filterService.getAggregationData(tenantId, 'complianceType', 'count'),
        this.filterService.getAggregationData(tenantId, 'severity', 'count')
      ]);

      return {
        success: true,
        tenantId,
        totalLeads: Object.values(totalLeads).reduce((sum, count) => sum + count, 0),
        distributions: {
          status: statusAggregation,
          source: sourceAggregation,
          complianceType: complianceTypeAggregation,
          severity: severityAggregation,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tenantId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Export filtered data (returns first page as sample)
   */
  @Post('export')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 5,   // Very limited for export operations
  })
  async exportFilteredData(
    @Body(ValidationPipe) filterRequestDto: FilterRequestDto,
    @Query('format') format?: 'json' | 'csv',
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    // Limit export to prevent abuse
    const exportRequest: FilterRequest = {
      tenantId,
      filters: filterRequestDto.filters,
      dateFilters: filterRequestDto.dateFilters,
      numericFilters: filterRequestDto.numericFilters,
      textSearch: filterRequestDto.textSearch,
      sorting: filterRequestDto.sorting,
      pagination: {
        limit: Math.min(filterRequestDto.pagination?.limit || 100, 1000),
        offset: filterRequestDto.pagination?.offset || 0,
      },
      customFields: filterRequestDto.customFields,
    };

    const results = await this.filterService.filterLeads(exportRequest);
    
    return {
      success: true,
      format: format || 'json',
      data: results.data,
      metadata: {
        totalCount: results.totalCount,
        filteredCount: results.filteredCount,
        exportedCount: results.data.length,
        appliedFilters: results.appliedFilters,
        sortingApplied: results.sortingApplied,
        executionTime: results.executionTime,
      },
      timestamp: new Date().toISOString(),
      note: results.filteredCount > results.data.length ? 
        `Only showing first ${results.data.length} of ${results.filteredCount} total filtered results` : 
        undefined,
    };
  }

  /**
   * Validate filter query before execution
   */
  @Post('validate')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 100,
  })
  async validateFilter(
    @Body(ValidationPipe) filterRequestDto: FilterRequestDto,
    @Req() req: Request
  ) {
    const tenantId = this.extractTenantId(req);
    
    try {
      // Validate the filter request structure
      const filterRequest: FilterRequest = {
        tenantId,
        filters: filterRequestDto.filters,
        dateFilters: filterRequestDto.dateFilters,
        numericFilters: filterRequestDto.numericFilters,
        textSearch: filterRequestDto.textSearch,
        sorting: filterRequestDto.sorting,
        pagination: { limit: 1, offset: 0 }, // Minimal pagination for validation
        customFields: filterRequestDto.customFields,
      };

      // Execute with minimal results to validate query
      const results = await this.filterService.filterLeads(filterRequest);
      
      return {
        valid: true,
        message: 'Filter query is valid',
        estimatedResults: results.filteredCount,
        executionTime: results.executionTime,
        appliedFilters: results.appliedFilters.length,
        sortingFields: results.sortingApplied.length,
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message,
        error: error.constructor.name,
      };
    }
  }

  private extractTenantId(req: Request): string {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return tenantId;
  }
}