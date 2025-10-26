import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { CacheService } from '../cache/cache.service.js';

export interface SearchQuery {
  query: string;
  tenantId: string;
  filters?: SearchFilters;
  options?: SearchOptions;
}

export interface SearchFilters {
  status?: string[];
  source?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  rankingMode?: 'relevance' | 'date' | 'combined';
  includeHighlights?: boolean;
  fuzzyMatching?: boolean;
  minSimilarity?: number;
  searchFields?: string[];
}

export interface SearchResult {
  id: string;
  rank: number;
  similarity: number;
  highlights?: SearchHighlight[];
  matchedFields: string[];
  data: any;
}

export interface SearchHighlight {
  field: string;
  fragment: string;
  startOffset: number;
  endOffset: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
  facets?: SearchFacets;
  query: {
    original: string;
    processed: string;
    tokens: string[];
  };
}

export interface SearchFacets {
  status?: Record<string, number>;
  source?: Record<string, number>;
  tags?: Record<string, number>;
  dateRanges?: Record<string, number>;
}

export interface SearchIndexInfo {
  tableName: string;
  searchableFields: string[];
  vectorColumn: string;
  indexName: string;
  indexSize: string;
  lastUpdated: Date;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly searchCache = new Map<string, SearchResponse>();
  private readonly cacheTimeout = 300000; // 5 minutes
  private readonly searchConfiguration = {
    defaultSearchConfig: 'english',
    minimumWordLength: 2,
    maximumResults: 1000,
    defaultSimilarityThreshold: 0.1,
    enablePhrasalSearch: true,
    enableFuzzySearch: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService,
    private readonly cacheService: CacheService
  ) {
    // Initialize search indexes on startup
    this.initializeSearchIndexes().catch(error => {
      this.logger.error('Failed to initialize search indexes:', error);
    });
  }

  /**
   * Perform full-text search across lead data
   */
  async searchLeads(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(searchQuery);

    try {
      // Check cache first
      const cachedResult = await this.getCachedSearch(cacheKey);
      if (cachedResult) {
        this.recordSearchMetrics('cache_hit', Date.now() - startTime, searchQuery);
        return cachedResult;
      }

      // Validate and process query
      const processedQuery = this.processSearchQuery(searchQuery.query);
      if (!processedQuery.isValid) {
        return this.createEmptyResponse(searchQuery.query, processedQuery.tokens);
      }

      // Build search conditions
      const searchConditions = this.buildSearchConditions(searchQuery, processedQuery);
      
      // Execute search with ranking
      const results = await this.executeSearch(searchQuery, searchConditions);
      
      // Generate suggestions for improved queries
      const suggestions = await this.generateSearchSuggestions(searchQuery.query, results.length);
      
      // Generate facets for filtering
      const facets = await this.generateSearchFacets(searchQuery, searchConditions);
      
      const response: SearchResponse = {
        results,
        totalCount: results.length,
        searchTime: Date.now() - startTime,
        suggestions,
        facets,
        query: {
          original: searchQuery.query,
          processed: processedQuery.processed,
          tokens: processedQuery.tokens,
        },
      };

      // Cache the result
      await this.cacheSearchResult(cacheKey, response);
      
      // Record metrics
      this.recordSearchMetrics('database_hit', response.searchTime, searchQuery, results.length);
      
      // Log search activity
      this.logSearchActivity(searchQuery, response);

      return response;
    } catch (error) {
      const searchTime = Date.now() - startTime;
      this.recordSearchMetrics('error', searchTime, searchQuery);
      
      this.structuredLogger.error(
        `Search query failed: ${searchQuery.query}`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId: searchQuery.tenantId,
            query: searchQuery.query,
            error: error.message,
            searchTime,
          },
        }
      );

      throw error;
    }
  }

  /**
   * Search with autocomplete suggestions
   */
  async searchWithAutocomplete(
    partialQuery: string,
    tenantId: string,
    limit: number = 10
  ): Promise<{ suggestions: string[]; results: SearchResult[] }> {
    try {
      // Generate autocomplete suggestions
      const suggestions = await this.generateAutocompleteSuggestions(partialQuery, tenantId, limit);
      
      // If query is long enough, also return search results
      let results: SearchResult[] = [];
      if (partialQuery.length >= 3) {
        const searchResponse = await this.searchLeads({
          query: partialQuery,
          tenantId,
          options: { limit: Math.min(limit, 5) }
        });
        results = searchResponse.results;
      }

      return { suggestions, results };
    } catch (error) {
      this.logger.error('Autocomplete search failed:', error);
      return { suggestions: [], results: [] };
    }
  }

  /**
   * Update search vectors for a lead
   */
  async updateLeadSearchVector(leadId: string, tenantId: string): Promise<void> {
    try {
      // Get lead data
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId },
        include: {
          events: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!lead) {
        throw new Error(`Lead ${leadId} not found for tenant ${tenantId}`);
      }

      // Generate search vector
      const searchVector = this.generateLeadSearchVector(lead);
      
      // Update the search vector using raw SQL
      await this.prisma.$executeRaw`
        UPDATE "Lead" 
        SET search_vector = to_tsvector('english', ${searchVector})
        WHERE id = ${leadId} AND "tenantId" = ${tenantId}
      `;

      this.structuredLogger.debug(
        `Updated search vector for lead ${leadId}`,
        {
          ...this.contextService.toLogContext(),
          metadata: { leadId, tenantId, vectorLength: searchVector.length },
        }
      );
    } catch (error) {
      this.logger.error(`Failed to update search vector for lead ${leadId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update search vectors for multiple leads
   */
  async bulkUpdateSearchVectors(tenantId: string, leadIds?: string[]): Promise<number> {
    const startTime = Date.now();
    
    try {
      let query = `
        UPDATE "Lead" 
        SET search_vector = to_tsvector('english', 
          COALESCE("name", '') || ' ' ||
          COALESCE("email", '') || ' ' ||
          COALESCE("phone", '') || ' ' ||
          COALESCE("company", '') || ' ' ||
          COALESCE("source", '') || ' ' ||
          COALESCE("notes", '')
        )
        WHERE "tenantId" = $1
      `;

      let params: any[] = [tenantId];
      
      if (leadIds && leadIds.length > 0) {
        query += ` AND id = ANY($2)`;
        params.push(leadIds);
      }

      const result = await this.prisma.$executeRawUnsafe(query, ...params);
      const updatedCount = Array.isArray(result) ? result.length : result;
      
      const duration = Date.now() - startTime;
      
      this.structuredLogger.info(
        `Bulk updated ${updatedCount} search vectors`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantId,
            updatedCount,
            duration,
            leadIds: leadIds?.length || 'all',
          },
        }
      );

      this.metricsService.histogram('search_vector_bulk_update_duration_ms', duration, {
        tenant: tenantId,
      });

      return updatedCount;
    } catch (error) {
      this.logger.error('Bulk search vector update failed:', error);
      throw error;
    }
  }

  /**
   * Get search index information and stats
   */
  async getSearchIndexInfo(tenantId: string): Promise<SearchIndexInfo[]> {
    try {
      // Get index information from PostgreSQL system tables
      const indexInfo = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          pg_size_pretty(pg_total_relation_size(indexname::regclass)) as index_size
        FROM pg_indexes 
        WHERE indexdef LIKE '%search_vector%'
        AND schemaname = 'public'
      `;

      const searchIndexes: SearchIndexInfo[] = indexInfo.map((info: any) => ({
        tableName: info.tablename,
        searchableFields: this.extractSearchableFields(info.indexdef),
        vectorColumn: 'search_vector',
        indexName: info.indexname,
        indexSize: info.index_size,
        lastUpdated: new Date(), // Would be tracked separately
      }));

      return searchIndexes;
    } catch (error) {
      this.logger.error('Failed to get search index info:', error);
      return [];
    }
  }

  /**
   * Optimize search performance by rebuilding indexes
   */
  async optimizeSearchIndexes(): Promise<void> {
    try {
      this.logger.log('Starting search index optimization...');
      
      // Reindex the search vector index
      await this.prisma.$executeRaw`REINDEX INDEX CONCURRENTLY lead_search_vector_idx`;
      
      // Update statistics
      await this.prisma.$executeRaw`ANALYZE "Lead"`;
      
      this.logger.log('Search index optimization completed');
    } catch (error) {
      this.logger.error('Search index optimization failed:', error);
      throw error;
    }
  }

  private async initializeSearchIndexes(): Promise<void> {
    try {
      // Check if search vector column exists
      const columnExists = await this.prisma.$queryRaw<any[]>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Lead' AND column_name = 'search_vector'
      `;

      if (columnExists.length === 0) {
        // Add search vector column
        await this.prisma.$executeRaw`
          ALTER TABLE "Lead" 
          ADD COLUMN search_vector tsvector
        `;

        // Create GIN index for fast full-text search
        await this.prisma.$executeRaw`
          CREATE INDEX CONCURRENTLY lead_search_vector_idx 
          ON "Lead" USING gin(search_vector)
        `;

        // Create trigger to automatically update search vector
        await this.prisma.$executeRaw`
          CREATE OR REPLACE FUNCTION update_lead_search_vector()
          RETURNS trigger AS $$
          BEGIN
            NEW.search_vector := to_tsvector('english', 
              COALESCE(NEW.name, '') || ' ' ||
              COALESCE(NEW.email, '') || ' ' ||
              COALESCE(NEW.phone, '') || ' ' ||
              COALESCE(NEW.company, '') || ' ' ||
              COALESCE(NEW.source, '') || ' ' ||
              COALESCE(NEW.notes, '')
            );
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `;

        await this.prisma.$executeRaw`
          CREATE TRIGGER lead_search_vector_update
          BEFORE INSERT OR UPDATE ON "Lead"
          FOR EACH ROW EXECUTE FUNCTION update_lead_search_vector()
        `;

        this.logger.log('Search indexes and triggers created successfully');
      }

      // Initialize search vectors for existing leads
      const existingLeadsCount = await this.prisma.lead.count();
      if (existingLeadsCount > 0) {
        this.logger.log(`Initializing search vectors for ${existingLeadsCount} existing leads...`);
        await this.bulkUpdateSearchVectors(''); // Update all tenants
      }

    } catch (error) {
      this.logger.error('Failed to initialize search indexes:', error);
      // Don't throw - allow service to start even if search setup fails
    }
  }

  private processSearchQuery(query: string): {
    isValid: boolean;
    processed: string;
    tokens: string[];
    operators: string[];
  } {
    if (!query || query.trim().length < this.searchConfiguration.minimumWordLength) {
      return { isValid: false, processed: '', tokens: [], operators: [] };
    }

    // Clean and process the query
    let processed = query.toLowerCase().trim();
    
    // Extract quoted phrases
    const phrases: string[] = [];
    processed = processed.replace(/"([^"]+)"/g, (match, phrase) => {
      phrases.push(phrase);
      return `__PHRASE_${phrases.length - 1}__`;
    });

    // Tokenize
    let tokens = processed.split(/\s+/).filter(token => 
      token.length >= this.searchConfiguration.minimumWordLength
    );

    // Replace phrase placeholders
    tokens = tokens.map(token => {
      const phraseMatch = token.match(/__PHRASE_(\d+)__/);
      if (phraseMatch) {
        return `"${phrases[parseInt(phraseMatch[1])]}"`;
      }
      return token;
    });

    // Extract search operators
    const operators = tokens.filter(token => 
      token.startsWith('+') || token.startsWith('-') || token.includes('*')
    );

    return {
      isValid: tokens.length > 0,
      processed: tokens.join(' '),
      tokens,
      operators,
    };
  }

  private buildSearchConditions(searchQuery: SearchQuery, processedQuery: any): any {
    const conditions: any = {
      tenantId: searchQuery.tenantId,
    };

    // Add text search condition
    if (processedQuery.tokens.length > 0) {
      // Convert tokens to PostgreSQL full-text search query
      const tsQuery = this.buildTsQuery(processedQuery.tokens);
      conditions.searchVector = tsQuery;
    }

    // Add filters
    if (searchQuery.filters) {
      if (searchQuery.filters.status && searchQuery.filters.status.length > 0) {
        conditions.status = { in: searchQuery.filters.status };
      }

      if (searchQuery.filters.source && searchQuery.filters.source.length > 0) {
        conditions.source = { in: searchQuery.filters.source };
      }

      if (searchQuery.filters.dateRange) {
        const dateFilter: any = {};
        if (searchQuery.filters.dateRange.from) {
          dateFilter.gte = searchQuery.filters.dateRange.from;
        }
        if (searchQuery.filters.dateRange.to) {
          dateFilter.lte = searchQuery.filters.dateRange.to;
        }
        if (Object.keys(dateFilter).length > 0) {
          conditions.createdAt = dateFilter;
        }
      }
    }

    return conditions;
  }

  private async executeSearch(
    searchQuery: SearchQuery,
    conditions: any
  ): Promise<SearchResult[]> {
    const options = searchQuery.options || {};
    const limit = Math.min(options.limit || 50, this.searchConfiguration.maximumResults);
    const offset = options.offset || 0;

    // Build the raw SQL query for full-text search with ranking
    const tsQuery = this.buildTsQuery(this.processSearchQuery(searchQuery.query).tokens);
    
    const results = await this.prisma.$queryRaw<any[]>`
      SELECT 
        l.*,
        ts_rank(l.search_vector, to_tsquery('english', ${tsQuery})) as rank,
        similarity(
          COALESCE(l.name, '') || ' ' || COALESCE(l.email, '') || ' ' || COALESCE(l.company, ''),
          ${searchQuery.query}
        ) as similarity,
        ts_headline('english', 
          COALESCE(l.name, '') || ' ' || COALESCE(l.email, '') || ' ' || COALESCE(l.notes, ''),
          to_tsquery('english', ${tsQuery}),
          'MaxWords=20, MinWords=5'
        ) as headline
      FROM "Lead" l
      WHERE l."tenantId" = ${searchQuery.tenantId}
        AND l.search_vector @@ to_tsquery('english', ${tsQuery})
        ${this.buildAdditionalFilters(searchQuery.filters)}
      ORDER BY 
        ${this.buildOrderClause(options.rankingMode || 'relevance')}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return results.map((row: any, index: number) => ({
      id: row.id,
      rank: parseFloat(row.rank) || 0,
      similarity: parseFloat(row.similarity) || 0,
      highlights: this.parseHighlights(row.headline, searchQuery.query),
      matchedFields: this.extractMatchedFields(row, searchQuery.query),
      data: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        source: row.source,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    }));
  }

  private buildTsQuery(tokens: string[]): string {
    return tokens
      .map(token => {
        // Handle quoted phrases
        if (token.startsWith('"') && token.endsWith('"')) {
          return token.slice(1, -1).replace(/\s+/g, ' & ');
        }
        // Handle prefix matching
        if (token.endsWith('*')) {
          return token.slice(0, -1) + ':*';
        }
        return token;
      })
  .join(' & ');
  }

  private buildAdditionalFilters(filters?: SearchFilters): string {
    if (!filters) return '';

    let filterSql = '';

    if (filters.status && filters.status.length > 0) {
      const statusList = filters.status.map(s => `'${s}'`).join(',');
      filterSql += ` AND l.status IN (${statusList})`;
    }

    if (filters.source && filters.source.length > 0) {
      const sourceList = filters.source.map(s => `'${s}'`).join(',');
      filterSql += ` AND l.source IN (${sourceList})`;
    }

    if (filters.dateRange) {
      if (filters.dateRange.from) {
        filterSql += ` AND l."createdAt" >= '${filters.dateRange.from.toISOString()}'`;
      }
      if (filters.dateRange.to) {
        filterSql += ` AND l."createdAt" <= '${filters.dateRange.to.toISOString()}'`;
      }
    }

    return filterSql;
  }

  private buildOrderClause(rankingMode: string): string {
    switch (rankingMode) {
      case 'date':
        return 'l."createdAt" DESC';
      case 'combined':
        return 'rank DESC, l."createdAt" DESC';
      case 'relevance':
      default:
        return 'rank DESC, similarity DESC';
    }
  }

  private generateLeadSearchVector(lead: any): string {
    const searchableText = [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.source,
      lead.notes,
      // Include recent event data
      ...(lead.events || []).map((event: any) => event.notes || ''),
    ]
      .filter(text => text && text.trim().length > 0)
      .join(' ');

    return searchableText;
  }

  private parseHighlights(headline: string, query: string): SearchHighlight[] {
    // Parse PostgreSQL ts_headline output for highlights
    const highlights: SearchHighlight[] = [];
    const regex = /<b>(.*?)<\/b>/g;
    let match;

    while ((match = regex.exec(headline)) !== null) {
      highlights.push({
        field: 'content',
        fragment: headline,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }

    return highlights;
  }

  private extractMatchedFields(row: any, query: string): string[] {
    const fields: string[] = [];
    const queryLower = query.toLowerCase();

    if (row.name && row.name.toLowerCase().includes(queryLower)) {
      fields.push('name');
    }
    if (row.email && row.email.toLowerCase().includes(queryLower)) {
      fields.push('email');
    }
    if (row.company && row.company.toLowerCase().includes(queryLower)) {
      fields.push('company');
    }
    if (row.notes && row.notes.toLowerCase().includes(queryLower)) {
      fields.push('notes');
    }

    return fields;
  }

  private async generateAutocompleteSuggestions(
    partialQuery: string,
    tenantId: string,
    limit: number
  ): Promise<string[]> {
    try {
      // Get frequent search terms from lead data
      const suggestions = await this.prisma.$queryRaw<{ suggestion: string }[]>`
        SELECT DISTINCT
          CASE 
            WHEN name ILIKE ${`%${partialQuery}%`} THEN name
            WHEN email ILIKE ${`%${partialQuery}%`} THEN email
            WHEN company ILIKE ${`%${partialQuery}%`} THEN company
          END as suggestion
        FROM "Lead"
        WHERE "tenantId" = ${tenantId}
          AND (
            name ILIKE ${`%${partialQuery}%`} OR
            email ILIKE ${`%${partialQuery}%`} OR
            company ILIKE ${`%${partialQuery}%`}
          )
        ORDER BY suggestion
        LIMIT ${limit}
      `;

      return suggestions
        .map((s: any) => s.suggestion)
        .filter((s: string) => s && s.trim().length > 0);
    } catch (error) {
      this.logger.error('Failed to generate autocomplete suggestions:', error);
      return [];
    }
  }

  private async generateSearchSuggestions(
    query: string,
    resultCount: number
  ): Promise<string[]> {
    if (resultCount > 0) return [];

    // Generate suggestions for queries with no results
    const suggestions: string[] = [];
    
    // Simple suggestions based on common typos and variations
    const words = query.toLowerCase().split(/\s+/);
    
    if (words.length === 1) {
      const word = words[0];
      if (word.length > 3) {
        suggestions.push(word.slice(0, -1)); // Remove last character
        suggestions.push(word + 's'); // Add plural
      }
    }

    return suggestions.slice(0, 3);
  }

  private async generateSearchFacets(
    searchQuery: SearchQuery,
    conditions: any
  ): Promise<SearchFacets> {
    try {
      // Get facet counts for the current search
      const facets = await this.prisma.$queryRaw<any[]>`
        SELECT 
          status,
          source,
          COUNT(*) as count
        FROM "Lead"
        WHERE "tenantId" = ${searchQuery.tenantId}
        GROUP BY status, source
        ORDER BY count DESC
      `;

      const searchFacets: SearchFacets = {};
      facets.forEach((facet: any) => {
        if (facet.status) {
          searchFacets.status = searchFacets.status || {};
          searchFacets.status[facet.status] = parseInt(facet.count) || 0;
        }
        if (facet.source) {
          searchFacets.source = searchFacets.source || {};
          searchFacets.source[facet.source] = parseInt(facet.count) || 0;
        }
      });

      return searchFacets;
    } catch (error) {
      this.logger.error('Failed to generate search facets:', error);
      return {};
    }
  }

  private generateCacheKey(searchQuery: SearchQuery): string {
    const key = JSON.stringify({
      query: searchQuery.query,
      tenantId: searchQuery.tenantId,
      filters: searchQuery.filters,
      options: searchQuery.options,
    });
    return `search:${Buffer.from(key).toString('base64')}`;
  }

  private async getCachedSearch(cacheKey: string): Promise<SearchResponse | null> {
    try {
      const cached = await this.cacheService.get(cacheKey);
      return cached && typeof cached === 'string' ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  private async cacheSearchResult(cacheKey: string, response: SearchResponse): Promise<void> {
    try {
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(response),
        { ttl: Math.floor(this.cacheTimeout / 1000) }
      );
    } catch (error) {
      // Cache errors shouldn't break search
      this.logger.warn('Failed to cache search result:', error);
    }
  }

  private createEmptyResponse(originalQuery: string, tokens: string[]): SearchResponse {
    return {
      results: [],
      totalCount: 0,
      searchTime: 0,
      suggestions: [],
      facets: {},
      query: {
        original: originalQuery,
        processed: '',
        tokens,
      },
    };
  }

  private recordSearchMetrics(
    type: string,
    duration: number,
    searchQuery: SearchQuery,
    resultCount?: number
  ): void {
    this.metricsService.histogram('search_duration_ms', duration, {
      type,
      tenant: searchQuery.tenantId,
    });

    this.metricsService.increment('search_requests_total', {
      type,
      tenant: searchQuery.tenantId,
    });

    if (resultCount !== undefined) {
      this.metricsService.histogram('search_results_count', resultCount, {
        tenant: searchQuery.tenantId,
      });
    }
  }

  private logSearchActivity(searchQuery: SearchQuery, response: SearchResponse): void {
    this.structuredLogger.info(
      'Search query executed',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          tenantId: searchQuery.tenantId,
          query: searchQuery.query,
          resultCount: response.totalCount,
          searchTime: response.searchTime,
          hasFilters: !!searchQuery.filters,
          hasSuggestions: (response.suggestions?.length || 0) > 0,
        },
      }
    );
  }

  private extractSearchableFields(indexDef: string): string[] {
    // Extract field names from index definition
    // This is a simplified implementation
    return ['name', 'email', 'phone', 'company', 'source', 'notes'];
  }
}