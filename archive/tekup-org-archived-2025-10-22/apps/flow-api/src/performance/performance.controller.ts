import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { PerformanceService } from './performance.service.js';
import { QueryOptimizerService } from './query-optimizer.service.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { TenantId } from '../auth/tenant-id.decorator.js';

@Controller('performance')
@UseGuards(ApiKeyGuard)
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly queryOptimizerService: QueryOptimizerService
  ) {}

  /**
   * Get current performance metrics
   */
  @Get('metrics')
  async getMetrics(@TenantId() tenantId: string) {
    const [metrics, slowQueries] = await Promise.all([
      this.performanceService.getMetrics(),
      this.performanceService.getSlowQueries()
    ]);

    return {
      metrics,
      slowQueries: slowQueries.slice(0, 5), // Top 5 slow queries
      tenantId,
    };
  }

  /**
   * Get comprehensive performance report
   */
  @Get('report')
  async getPerformanceReport(@TenantId() tenantId: string) {
    const report = await this.performanceService.analyzePerformance();
    
    return {
      ...report,
      tenantId,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get slow queries with details
   */
  @Get('slow-queries')
  async getSlowQueries(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string
  ) {
    const slowQueries = this.performanceService.getSlowQueries();
    const limitNum = limit ? parseInt(limit, 10) : 20;
    
    return {
      slowQueries: slowQueries.slice(0, limitNum),
      total: slowQueries.length,
      tenantId,
    };
  }

  /**
   * Analyze a specific query
   */
  @Get('analyze-query')
  async analyzeQuery(
    @TenantId() tenantId: string,
    @Query('query') query: string
  ) {
    if (!query) {
      return {
        error: 'Query parameter is required',
        tenantId,
      };
    }

    try {
      const analysis = await this.queryOptimizerService.analyzeQuery(query);
      
      return {
        ...analysis,
        tenantId,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: 'Failed to analyze query',
        details: error.message,
        tenantId,
      };
    }
  }

  /**
   * Get index recommendations
   */
  @Get('index-recommendations')
  async getIndexRecommendations(@TenantId() tenantId: string) {
    const slowQueries = this.performanceService.getSlowQueries();
    const recommendations = [];

    // Analyze slow queries for index recommendations
    for (const slowQuery of slowQueries.slice(0, 10)) {
      try {
        const analysis = await this.queryOptimizerService.analyzeQuery(slowQuery.query);
        recommendations.push(...analysis.indexRecommendations);
      } catch (error) {
        // Skip queries that can't be analyzed
        continue;
      }
    }

    // Remove duplicates and sort by priority
    const uniqueRecommendations = recommendations
      .filter((rec, index, arr) => 
        arr.findIndex(r => r.table === rec.table && r.columns.join(',') === rec.columns.join(',')) === index
      )
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    return {
      recommendations: uniqueRecommendations,
      total: uniqueRecommendations.length,
      tenantId,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get SQL for creating recommended indexes
   */
  @Get('index-sql/:table/:columns')
  async getIndexSQL(
    @TenantId() tenantId: string,
    @Param('table') table: string,
    @Param('columns') columns: string,
    @Query('type') type?: 'btree' | 'gin' | 'gist' | 'hash'
  ) {
    const recommendation = {
      table,
      columns: columns.split(','),
      type: type || 'btree' as const,
      reason: 'Manual request',
      estimatedImprovement: 0,
      priority: 'medium' as const,
    };

    const sql = this.queryOptimizerService.generateIndexSQL(recommendation);

    return {
      sql,
      recommendation,
      tenantId,
      warning: 'Review this SQL before executing in production. Use CONCURRENTLY to avoid blocking.',
    };
  }

  /**
   * Get frequent queries
   */
  @Get('frequent-queries')
  async getFrequentQueries(@TenantId() tenantId: string) {
    const frequentQueries = this.queryOptimizerService.getFrequentQueries();

    return {
      queries: frequentQueries,
      total: frequentQueries.length,
      tenantId,
    };
  }
}