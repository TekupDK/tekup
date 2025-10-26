import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SearchService, SearchQuery, SearchResponse } from './search.service.js';
import { MetricsInterceptor } from '../metrics/metrics.interceptor.js';
import { RateLimitingInterceptor, RateLimit } from '../common/rate-limiting/rate-limiting.interceptor.js';
import { CacheInterceptor } from '../cache/cache.interceptor.js';
import { ValidationPipe } from '../common/validation/validation.pipe.js';
import { SearchQueryDto, AutocompleteQueryDto } from './dto/search.dto.js';

@Controller('search')
@UseInterceptors(MetricsInterceptor, RateLimitingInterceptor, CacheInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Full-text search across leads
   */
  @Post('leads')
  @RateLimit({
    windowMs: 60000,  // 1 minute
    maxRequests: 100, // Allow more searches per minute
  })
  async searchLeads(
    @Body(ValidationPipe) searchQueryDto: SearchQueryDto,
    @Req() req: Request
  ): Promise<SearchResponse> {
    const tenantId = this.extractTenantId(req);
    
    if (!searchQueryDto.query || searchQueryDto.query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters long');
    }

    const searchQuery: SearchQuery = {
      query: searchQueryDto.query,
      tenantId,
      filters: searchQueryDto.filters,
      options: searchQueryDto.options,
    };

    return this.searchService.searchLeads(searchQuery);
  }

  /**
   * Quick search with GET method for simple queries
   */
  @Get('leads')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 150, // Higher limit for GET requests
  })
  async quickSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('ranking') rankingMode?: string,
    @Req() req: Request
  ): Promise<SearchResponse> {
    const tenantId = this.extractTenantId(req);
    
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query parameter "q" must be at least 2 characters long');
    }

    const searchQuery: SearchQuery = {
      query: query.trim(),
      tenantId,
      filters: {
        ...(status && { status: status.split(',') }),
        ...(source && { source: source.split(',') }),
      },
      options: {
        limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
        rankingMode: rankingMode as any || 'relevance',
      },
    };

    return this.searchService.searchLeads(searchQuery);
  }

  /**
   * Autocomplete suggestions
   */
  @Get('autocomplete')
  @RateLimit({
    windowMs: 30000,  // 30 seconds
    maxRequests: 200, // High frequency for autocomplete
  })
  async autocomplete(
    @Query('q') partialQuery: string,
    @Query('limit') limit?: string,
    @Req() req: Request
  ): Promise<{ suggestions: string[]; results: any[] }> {
    const tenantId = this.extractTenantId(req);
    
    if (!partialQuery || partialQuery.trim().length < 1) {
      return { suggestions: [], results: [] };
    }

    const searchLimit = limit ? Math.min(parseInt(limit, 10), 20) : 10;
    
    return this.searchService.searchWithAutocomplete(
      partialQuery.trim(),
      tenantId,
      searchLimit
    );
  }

  /**
   * Advanced search with complex filters
   */
  @Post('leads/advanced')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 50, // Lower limit for complex searches
  })
  async advancedSearch(
    @Body(ValidationPipe) searchQueryDto: SearchQueryDto,
    @Req() req: Request
  ): Promise<SearchResponse> {
    const tenantId = this.extractTenantId(req);
    
    // Validate advanced search parameters
    if (searchQueryDto.options?.limit && searchQueryDto.options.limit > 500) {
      throw new BadRequestException('Maximum limit for advanced search is 500');
    }

    const searchQuery: SearchQuery = {
      query: searchQueryDto.query || '*', // Allow empty query for filter-only searches
      tenantId,
      filters: searchQueryDto.filters,
      options: {
        ...searchQueryDto.options,
        includeHighlights: true, // Always include highlights for advanced search
      },
    };

    return this.searchService.searchLeads(searchQuery);
  }

  /**
   * Search within a specific date range
   */
  @Get('leads/date-range')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 80,
  })
  async searchByDateRange(
    @Query('q') query: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('limit') limit?: string,
    @Req() req: Request
  ): Promise<SearchResponse> {
    const tenantId = this.extractTenantId(req);
    
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query parameter "q" is required');
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

    const searchQuery: SearchQuery = {
      query: query.trim(),
      tenantId,
      filters: {
        dateRange: {
          from: fromDate,
          to: toDate,
        },
      },
      options: {
        limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
        rankingMode: 'combined', // Use combined ranking for date-based searches
      },
    };

    return this.searchService.searchLeads(searchQuery);
  }

  /**
   * Get search suggestions for empty results
   */
  @Get('suggestions/:query')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 100,
  })
  async getSearchSuggestions(
    @Param('query') query: string,
    @Req() req: Request
  ): Promise<{ suggestions: string[] }> {
    const tenantId = this.extractTenantId(req);
    
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Query must be at least 2 characters long');
    }

    // First try the search to see if it returns results
    const searchResult = await this.searchService.searchLeads({
      query: query.trim(),
      tenantId,
      options: { limit: 1 }, // Just check if any results exist
    });

    // If no results, return the suggestions from the search response
    return {
      suggestions: searchResult.suggestions || [],
    };
  }

  /**
   * Update search index for a specific lead
   */
  @Post('index/lead/:leadId')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 200, // Allow frequent index updates
  })
  async updateLeadIndex(
    @Param('leadId') leadId: string,
    @Req() req: Request
  ): Promise<{ success: boolean; message: string }> {
    const tenantId = this.extractTenantId(req);
    
    if (!leadId || leadId.trim().length === 0) {
      throw new BadRequestException('Lead ID is required');
    }

    try {
      await this.searchService.updateLeadSearchVector(leadId, tenantId);
      return {
        success: true,
        message: `Search index updated for lead ${leadId}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update search index',
      };
    }
  }

  /**
   * Bulk update search indexes
   */
  @Post('index/bulk-update')
  @RateLimit({
    windowMs: 300000, // 5 minutes
    maxRequests: 10,  // Very limited for bulk operations
  })
  async bulkUpdateIndexes(
    @Body() body: { leadIds?: string[] },
    @Req() req: Request
  ): Promise<{ success: boolean; updatedCount: number; message: string }> {
    const tenantId = this.extractTenantId(req);
    
    try {
      const updatedCount = await this.searchService.bulkUpdateSearchVectors(
        tenantId,
        body.leadIds
      );
      
      return {
        success: true,
        updatedCount,
        message: `Successfully updated ${updatedCount} search vectors`,
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        message: error.message || 'Failed to bulk update search indexes',
      };
    }
  }

  /**
   * Get search index statistics
   */
  @Get('index/stats')
  @RateLimit({
    windowMs: 60000,
    maxRequests: 20,
  })
  async getIndexStats(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    try {
      const indexInfo = await this.searchService.getSearchIndexInfo(tenantId);
      return {
        success: true,
        indexes: indexInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get index statistics',
        indexes: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Optimize search indexes (admin operation)
   */
  @Post('index/optimize')
  @RateLimit({
    windowMs: 3600000, // 1 hour
    maxRequests: 2,    // Very limited - optimization is expensive
  })
  async optimizeIndexes(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    try {
      await this.searchService.optimizeSearchIndexes();
      return {
        success: true,
        message: 'Search indexes optimized successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to optimize search indexes',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Search health check
   */
  @Get('health')
  @RateLimit({
    windowMs: 30000,
    maxRequests: 60,
  })
  async searchHealthCheck(@Req() req: Request) {
    const tenantId = this.extractTenantId(req);
    
    try {
      // Perform a simple search to verify functionality
      const testSearch = await this.searchService.searchLeads({
        query: 'test',
        tenantId,
        options: { limit: 1 },
      });

      return {
        status: 'healthy',
        searchWorking: true,
        indexesAvailable: testSearch !== null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        searchWorking: false,
        error: error.message,
        timestamp: new Date().toISOString(),
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