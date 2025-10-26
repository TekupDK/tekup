import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

export interface QueryMetadata {
  operation: string;
  table: string;
  tenantId: string;
  estimatedRows?: number;
  userId?: string;
}

export interface QueryPerformance {
  query: string;
  executionTime: number;
  rowsReturned: number;
  indexesUsed: string[];
  optimizationSuggestions: string[];
  timestamp: Date;
  metadata: QueryMetadata;
}

export interface SlowQuery extends QueryPerformance {
  frequency: number;
  avgExecutionTime: number;
  maxExecutionTime: number;
}

export interface PerformanceReport {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  slowQueries: SlowQuery[];
  connectionPoolStats: ConnectionPoolStats;
  recommendations: string[];
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  maxConnections: number;
  avgWaitTime: number;
  connectionErrors: number;
}

export interface OptimizedQuery {
  originalQuery: string;
  optimizedQuery: string;
  estimatedImprovement: number;
  suggestions: string[];
}

@Injectable()
export class PerformanceService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly slowQueries = new Map<string, SlowQuery>();
  private readonly queryHistory: QueryPerformance[] = [];
  private readonly maxHistorySize = 1000;
  
  private performanceMetrics = {
    totalQueries: 0,
    totalExecutionTime: 0,
    slowQueryCount: 0,
    connectionPoolHits: 0,
    connectionPoolMisses: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService
  ) {}

  async onModuleInit() {
    this.logger.log('Performance monitoring service initialized');
    
    // Start periodic cleanup of old query history
    setInterval(() => {
      this.cleanupQueryHistory();
    }, 300000); // 5 minutes
  }

  /**
   * Measure and track database query performance
   */
  async measureQuery<T>(
    queryFn: () => Promise<T>,
    metadata: QueryMetadata
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      this.logger.debug(`Starting query measurement: ${metadata.operation} on ${metadata.table}`);
      
      // Execute the query
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      // Determine rows returned
      const rowsReturned = this.getRowCount(result);
      
      // Create performance record
      const performance: QueryPerformance = {
        query: metadata.operation,
        executionTime,
        rowsReturned,
        indexesUsed: [], // Would need query plan analysis for this
        optimizationSuggestions: this.generateOptimizationSuggestions(executionTime, rowsReturned, metadata),
        timestamp: new Date(),
        metadata,
      };

      // Track metrics
      this.trackQueryMetrics(performance);
      
      // Store in history
      this.addToQueryHistory(performance);
      
      // Check if it's a slow query
      if (executionTime > this.slowQueryThreshold) {
        this.trackSlowQuery(performance);
      }

      // Record Prometheus metrics
      this.metricsService.histogram(
        'database_query_duration_seconds',
        executionTime / 1000,
        {
          operation: metadata.operation,
          table: metadata.table,
          tenant_id: metadata.tenantId,
        }
      );

      this.metricsService.increment(
        'database_queries_total',
        {
          operation: metadata.operation,
          table: metadata.table,
          tenant_id: metadata.tenantId,
          status: 'success',
        }
      );

      this.logger.debug(
        `Query completed: ${metadata.operation} on ${metadata.table} (${executionTime}ms, ${rowsReturned} rows)`
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(
        `Query failed: ${metadata.operation} on ${metadata.table} (${executionTime}ms)`,
        error
      );

      // Record error metrics
      this.metricsService.increment(
        'database_queries_total',
        {
          operation: metadata.operation,
          table: metadata.table,
          tenant_id: metadata.tenantId,
          status: 'error',
        }
      );

      this.metricsService.histogram(
        'database_query_duration_seconds',
        executionTime / 1000,
        {
          operation: metadata.operation,
          table: metadata.table,
          tenant_id: metadata.tenantId,
        }
      );

      throw error;
    }
  }

  /**
   * Optimize query based on patterns and metadata
   */
  optimizeQuery(query: string, params: any[]): OptimizedQuery {
    const suggestions: string[] = [];
    let optimizedQuery = query;
    let estimatedImprovement = 0;

    // Basic optimization suggestions
    if (query.includes('SELECT *')) {
      suggestions.push('Avoid SELECT * - specify only needed columns');
      estimatedImprovement += 15;
    }

    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      suggestions.push('Consider adding LIMIT when using ORDER BY');
      estimatedImprovement += 10;
    }

    if (query.includes('LIKE %')) {
      suggestions.push('Consider using full-text search instead of LIKE with leading wildcard');
      estimatedImprovement += 25;
    }

    if (!query.includes('WHERE') && query.includes('SELECT')) {
      suggestions.push('Add WHERE clause to filter results');
      estimatedImprovement += 30;
    }

    // Check for missing indexes (simplified heuristic)
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push('Ensure proper indexes exist for WHERE clause columns');
      estimatedImprovement += 20;
    }

    return {
      originalQuery: query,
      optimizedQuery,
      estimatedImprovement,
      suggestions,
    };
  }

  /**
   * Get slow queries with statistics
   */
  getSlowQueries(): SlowQuery[] {
    return Array.from(this.slowQueries.values())
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 20); // Top 20 slow queries
  }

  /**
   * Generate comprehensive performance report
   */
  async analyzePerformance(): Promise<PerformanceReport> {
    const recentQueries = this.queryHistory.slice(-100); // Last 100 queries
    
    if (recentQueries.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        slowQueries: [],
        connectionPoolStats: await this.getConnectionPoolStats(),
        recommendations: ['No query data available yet'],
      };
    }

    const executionTimes = recentQueries.map(q => q.executionTime).sort((a, b) => a - b);
    const avgResponseTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p99Index = Math.floor(executionTimes.length * 0.99);
    
    const p95ResponseTime = executionTimes[p95Index] || 0;
    const p99ResponseTime = executionTimes[p99Index] || 0;
    
    // Calculate throughput (queries per second over last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentQueriesCount = this.queryHistory.filter(
      q => q.timestamp.getTime() > oneMinuteAgo
    ).length;
    const throughput = recentQueriesCount / 60;

    const slowQueries = this.getSlowQueries();
    const connectionPoolStats = await this.getConnectionPoolStats();
    
    const recommendations = this.generateRecommendations({
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowQueries,
      connectionPoolStats,
    });

    return {
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      throughput,
      errorRate: 0, // Would need error tracking
      slowQueries,
      connectionPoolStats,
      recommendations,
    };
  }

  /**
   * Get connection pool statistics
   */
  private async getConnectionPoolStats(): Promise<ConnectionPoolStats> {
    try {
      // This would need to be implemented based on the actual connection pool
      // For now, return mock data
      return {
        totalConnections: 20,
        activeConnections: 5,
        idleConnections: 15,
        waitingConnections: 0,
        maxConnections: 20,
        avgWaitTime: 0,
        connectionErrors: 0,
      };
    } catch (error) {
      this.logger.error('Failed to get connection pool stats:', error);
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingConnections: 0,
        maxConnections: 0,
        avgWaitTime: 0,
        connectionErrors: 1,
      };
    }
  }

  /**
   * Track query metrics
   */
  private trackQueryMetrics(performance: QueryPerformance): void {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.totalExecutionTime += performance.executionTime;
    
    if (performance.executionTime > this.slowQueryThreshold) {
      this.performanceMetrics.slowQueryCount++;
    }
  }

  /**
   * Add query to history with size limit
   */
  private addToQueryHistory(performance: QueryPerformance): void {
    this.queryHistory.push(performance);
    
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory.shift(); // Remove oldest
    }
  }

  /**
   * Track slow queries with aggregated statistics
   */
  private trackSlowQuery(performance: QueryPerformance): void {
    const key = `${performance.metadata.operation}_${performance.metadata.table}`;
    
    if (this.slowQueries.has(key)) {
      const existing = this.slowQueries.get(key)!;
      existing.frequency++;
      existing.avgExecutionTime = (existing.avgExecutionTime + performance.executionTime) / 2;
      existing.maxExecutionTime = Math.max(existing.maxExecutionTime, performance.executionTime);
    } else {
      this.slowQueries.set(key, {
        ...performance,
        frequency: 1,
        avgExecutionTime: performance.executionTime,
        maxExecutionTime: performance.executionTime,
      });
    }

    this.logger.warn(
      `Slow query detected: ${performance.metadata.operation} on ${performance.metadata.table} (${performance.executionTime}ms)`
    );
  }

  /**
   * Generate optimization suggestions based on performance data
   */
  private generateOptimizationSuggestions(
    executionTime: number,
    rowsReturned: number,
    metadata: QueryMetadata
  ): string[] {
    const suggestions: string[] = [];

    if (executionTime > this.slowQueryThreshold) {
      suggestions.push('Query execution time exceeds threshold - consider optimization');
    }

    if (rowsReturned > 1000) {
      suggestions.push('Large result set - consider pagination or filtering');
    }

    if (metadata.operation.includes('SELECT') && rowsReturned === 0) {
      suggestions.push('Query returned no results - check WHERE conditions');
    }

    if (executionTime > 500 && rowsReturned < 10) {
      suggestions.push('High execution time for small result set - check indexes');
    }

    return suggestions;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(data: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowQueries: SlowQuery[];
    connectionPoolStats: ConnectionPoolStats;
  }): string[] {
    const recommendations: string[] = [];

    if (data.avgResponseTime > 200) {
      recommendations.push('Average response time is high - consider query optimization');
    }

    if (data.p95ResponseTime > 500) {
      recommendations.push('P95 response time exceeds target - investigate slow queries');
    }

    if (data.slowQueries.length > 5) {
      recommendations.push('Multiple slow queries detected - review and optimize');
    }

    if (data.connectionPoolStats.activeConnections / data.connectionPoolStats.maxConnections > 0.8) {
      recommendations.push('Connection pool utilization is high - consider increasing pool size');
    }

    if (data.connectionPoolStats.waitingConnections > 0) {
      recommendations.push('Connections are waiting - increase pool size or optimize queries');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics look good');
    }

    return recommendations;
  }

  /**
   * Get row count from query result
   */
  private getRowCount(result: any): number {
    if (Array.isArray(result)) {
      return result.length;
    }
    if (result && typeof result === 'object' && 'count' in result) {
      return result.count;
    }
    return result ? 1 : 0;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up old query history
   */
  private cleanupQueryHistory(): void {
    const cutoff = Date.now() - 3600000; // 1 hour ago
    const initialLength = this.queryHistory.length;
    
    // Remove queries older than 1 hour
    for (let i = this.queryHistory.length - 1; i >= 0; i--) {
      if (this.queryHistory[i].timestamp.getTime() < cutoff) {
        this.queryHistory.splice(i, 1);
      }
    }

    const removed = initialLength - this.queryHistory.length;
    if (removed > 0) {
      this.logger.debug(`Cleaned up ${removed} old query records`);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      avgExecutionTime: this.performanceMetrics.totalQueries > 0 
        ? this.performanceMetrics.totalExecutionTime / this.performanceMetrics.totalQueries 
        : 0,
      slowQueryRate: this.performanceMetrics.totalQueries > 0
        ? (this.performanceMetrics.slowQueryCount / this.performanceMetrics.totalQueries) * 100
        : 0,
    };
  }
}