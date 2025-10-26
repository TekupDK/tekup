import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';

export interface DetailedQueryMetrics {
  queryHash: string;
  queryText: string;
  operation: string;
  table: string;
  tenantId: string;
  executionTime: number;
  rowsReturned: number;
  rowsExamined: number;
  indexesUsed: string[];
  planCost: number;
  bufferHits: number;
  bufferReads: number;
  timestamp: Date;
  callStack?: string;
  parameters?: any[];
}

export interface QueryPlanAnalysis {
  queryHash: string;
  plan: any;
  totalCost: number;
  indexScans: number;
  seqScans: number;
  nestedLoops: number;
  hashJoins: number;
  sortOperations: number;
  recommendations: string[];
}

export interface DatabaseConnectionMetrics {
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  connectionUtilization: number;
  avgConnectionAge: number;
  longRunningQueries: number;
  lockedQueries: number;
  deadlocks: number;
  connectionErrors: number;
  connectionLeaks: number;
  timestamp: Date;
}

export interface SlowQueryAnalysis {
  queryHash: string;
  queryText: string;
  avgExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  p95ExecutionTime: number;
  callCount: number;
  lastSeen: Date;
  tenantId: string;
  avgRowsReturned: number;
  avgRowsExamined: number;
  selectivityRatio: number;
  indexUsageScore: number;
  optimizationPriority: number;
  recommendations: string[];
}

export interface DatabasePerformanceSnapshot {
  timestamp: Date;
  totalQueries: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowQueriesCount: number;
  errorRate: number;
  connectionMetrics: DatabaseConnectionMetrics;
  topSlowQueries: SlowQueryAnalysis[];
  queryPlanIssues: QueryPlanAnalysis[];
  recommendations: string[];
}

@Injectable()
export class EnhancedDatabasePerformanceService {
  private readonly logger = new Logger(EnhancedDatabasePerformanceService.name);
  private readonly queryMetrics = new Map<string, DetailedQueryMetrics[]>();
  private readonly queryPlans = new Map<string, QueryPlanAnalysis>();
  private readonly slowQueryThreshold = 1000; // 1 second
  private readonly verySlowQueryThreshold = 5000; // 5 seconds
  private readonly performanceHistory: DetailedQueryMetrics[] = [];
  private readonly maxHistorySize = 50000; // Increased for detailed analysis
  private readonly connectionMetricsHistory: DatabaseConnectionMetrics[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService
  ) {
    // Set up periodic monitoring and cleanup
    setInterval(() => this.collectConnectionMetrics(), 30000); // Every 30 seconds
    setInterval(() => this.analyzeSlowQueries(), 300000); // Every 5 minutes
    setInterval(() => this.generatePerformanceSnapshot(), 600000); // Every 10 minutes
    setInterval(() => this.cleanupOldMetrics(), 3600000); // Every hour
  }

  /**
   * Enhanced query measurement with detailed metrics
   */
  async measureQueryDetailed<T>(
    queryFn: () => Promise<T>,
    metadata: {
      operation: string;
      table: string;
      tenantId: string;
      parameters?: any[];
      expectedRows?: number;
    }
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    const queryHash = this.generateQueryHash(metadata);
    
    // Capture call stack for debugging
    const callStack = this.captureCallStack();

    try {
      // Execute query with timing
      const result = await queryFn();
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // Analyze result
      const rowsReturned = Array.isArray(result) ? result.length : 
                          (result && typeof result === 'object' && 'length' in result) ? 
                          (result as any).length : 1;

      // Get query plan if available (would need raw SQL access)
      const planAnalysis = await this.analyzeQueryPlan(metadata, queryHash);

      // Create detailed metrics
      const detailedMetrics: DetailedQueryMetrics = {
        queryHash,
        queryText: this.reconstructQueryText(metadata),
        operation: metadata.operation,
        table: metadata.table,
        tenantId: metadata.tenantId,
        executionTime: executionTimeMs,
        rowsReturned,
        rowsExamined: planAnalysis?.totalCost || rowsReturned,
        indexesUsed: planAnalysis?.plan?.indexesUsed || [],
        planCost: planAnalysis?.totalCost || 0,
        bufferHits: 0, // Would be populated from database stats
        bufferReads: 0, // Would be populated from database stats
        timestamp: new Date(),
        callStack,
        parameters: metadata.parameters,
      };

      // Store metrics
      this.recordDetailedQueryMetrics(queryHash, detailedMetrics);

      // Record Prometheus metrics
      this.recordPrometheusMetrics(detailedMetrics);

      // Check for performance issues
      await this.checkPerformanceIssues(detailedMetrics);

      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1_000_000;

      // Record error metrics
      this.metrics.increment('database_query_errors_total', {
        operation: metadata.operation,
        table: metadata.table,
        tenant: metadata.tenantId,
        error_type: error.constructor.name,
      });

      this.structuredLogger.error(
        `Database query failed: ${metadata.operation}`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            operation: metadata.operation,
            table: metadata.table,
            tenantId: metadata.tenantId,
            executionTime: executionTimeMs,
            error: error.message,
            callStack,
          },
        }
      );

      throw error;
    }
  }

  /**
   * Analyze slow queries and provide recommendations
   */
  async analyzeSlowQueries(): Promise<SlowQueryAnalysis[]> {
    const slowQueries = new Map<string, SlowQueryAnalysis>();
    const recentHistory = this.getRecentHistory(60); // Last hour

    // Group by query hash and analyze
    recentHistory.forEach(metric => {
      if (metric.executionTime >= this.slowQueryThreshold) {
        const key = metric.queryHash;
        
        if (slowQueries.has(key)) {
          const existing = slowQueries.get(key)!;
          this.updateSlowQueryAnalysis(existing, metric);
        } else {
          slowQueries.set(key, this.createSlowQueryAnalysis(metric));
        }
      }
    });

    const analysisResults = Array.from(slowQueries.values())
      .sort((a, b) => b.optimizationPriority - a.optimizationPriority);

    // Log significant slow queries
    analysisResults.slice(0, 5).forEach(analysis => {
      this.structuredLogger.warn(
        `Slow query detected: ${analysis.queryText.substring(0, 100)}...`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            queryHash: analysis.queryHash,
            avgExecutionTime: analysis.avgExecutionTime,
            callCount: analysis.callCount,
            tenantId: analysis.tenantId,
            recommendations: analysis.recommendations,
          },
        }
      );
    });

    return analysisResults;
  }

  /**
   * Collect real-time database connection metrics
   */
  async collectConnectionMetrics(): Promise<DatabaseConnectionMetrics> {
    try {
      // This would integrate with actual PostgreSQL monitoring
      // For now, providing enhanced mock structure
      
      const metrics: DatabaseConnectionMetrics = {
        activeConnections: await this.getActiveConnectionCount(),
        idleConnections: await this.getIdleConnectionCount(),
        maxConnections: await this.getMaxConnectionCount(),
        connectionUtilization: 0, // Calculated below
        avgConnectionAge: await this.getAvgConnectionAge(),
        longRunningQueries: await this.getLongRunningQueryCount(),
        lockedQueries: await this.getLockedQueryCount(),
        deadlocks: await this.getDeadlockCount(),
        connectionErrors: 0, // Would be tracked from connection attempts
        connectionLeaks: 0, // Would be detected from connection lifecycle
        timestamp: new Date(),
      };

      metrics.connectionUtilization = 
        (metrics.activeConnections / metrics.maxConnections) * 100;

      // Record metrics
      this.recordConnectionMetrics(metrics);
      
      // Store in history
      this.connectionMetricsHistory.push(metrics);
      if (this.connectionMetricsHistory.length > 1000) {
        this.connectionMetricsHistory.splice(0, 100);
      }

      return metrics;
    } catch (error) {
      this.logger.error('Failed to collect connection metrics:', error);
      return this.getDefaultConnectionMetrics();
    }
  }

  /**
   * Generate comprehensive performance snapshot
   */
  async generatePerformanceSnapshot(): Promise<DatabasePerformanceSnapshot> {
    const recentHistory = this.getRecentHistory(60); // Last hour
    const connectionMetrics = await this.collectConnectionMetrics();
    
    if (recentHistory.length === 0) {
      return this.getEmptySnapshot(connectionMetrics);
    }

    const executionTimes = recentHistory.map(h => h.executionTime).sort((a, b) => a - b);
    const totalQueries = recentHistory.length;
    
    const avgResponseTime = executionTimes.reduce((sum, time) => sum + time, 0) / totalQueries;
    const p50ResponseTime = this.getPercentile(executionTimes, 0.50);
    const p95ResponseTime = this.getPercentile(executionTimes, 0.95);
    const p99ResponseTime = this.getPercentile(executionTimes, 0.99);
    
    const slowQueriesCount = recentHistory.filter(h => h.executionTime >= this.slowQueryThreshold).length;
    const errorRate = 0; // Would be calculated from error metrics

    const topSlowQueries = await this.analyzeSlowQueries();
    const queryPlanIssues = this.analyzeQueryPlanIssues();
    const recommendations = this.generatePerformanceRecommendations(
      recentHistory,
      connectionMetrics,
      topSlowQueries
    );

    const snapshot: DatabasePerformanceSnapshot = {
      timestamp: new Date(),
      totalQueries,
      avgResponseTime,
      p50ResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      slowQueriesCount,
      errorRate,
      connectionMetrics,
      topSlowQueries: topSlowQueries.slice(0, 10),
      queryPlanIssues,
      recommendations,
    };

    // Log performance snapshot
    this.structuredLogger.info(
      'Database performance snapshot generated',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          totalQueries: snapshot.totalQueries,
          avgResponseTime: snapshot.avgResponseTime,
          p95ResponseTime: snapshot.p95ResponseTime,
          slowQueriesCount: snapshot.slowQueriesCount,
          connectionUtilization: snapshot.connectionMetrics.connectionUtilization,
          recommendationsCount: snapshot.recommendations.length,
        },
      }
    );

    return snapshot;
  }

  /**
   * Get performance recommendations for a specific tenant
   */
  getTenantPerformanceRecommendations(tenantId: string): string[] {
    const tenantMetrics = this.performanceHistory
      .filter(h => h.tenantId === tenantId)
      .slice(-1000); // Recent queries

    const recommendations: string[] = [];

    if (tenantMetrics.length === 0) {
      return ['No recent query data available for analysis'];
    }

    const avgExecutionTime = tenantMetrics.reduce((sum, m) => sum + m.executionTime, 0) / tenantMetrics.length;
    const slowQueries = tenantMetrics.filter(m => m.executionTime >= this.slowQueryThreshold);

    if (avgExecutionTime > 500) {
      recommendations.push('Average query execution time is high - consider query optimization');
    }

    if (slowQueries.length > tenantMetrics.length * 0.1) {
      recommendations.push('High percentage of slow queries detected - review query patterns');
    }

    const tableUsage = this.analyzeTableUsage(tenantMetrics);
    if (tableUsage.lead && tableUsage.lead.avgExecutionTime > 300) {
      recommendations.push('Lead table queries are slow - consider adding indexes on frequently queried fields');
    }

    return recommendations;
  }

  private generateQueryHash(metadata: { operation: string; table: string; parameters?: any[] }): string {
    const baseString = `${metadata.operation}:${metadata.table}`;
    return Buffer.from(baseString).toString('base64').substring(0, 16);
  }

  private reconstructQueryText(metadata: { operation: string; table: string; parameters?: any[] }): string {
    return `${metadata.operation} on ${metadata.table}`;
  }

  private captureCallStack(): string {
    const stack = new Error().stack;
    return stack?.split('\n').slice(2, 5).join('\n') || 'Stack not available';
  }

  private recordDetailedQueryMetrics(queryHash: string, metrics: DetailedQueryMetrics): void {
    if (!this.queryMetrics.has(queryHash)) {
      this.queryMetrics.set(queryHash, []);
    }

    const queryHistory = this.queryMetrics.get(queryHash)!;
    queryHistory.push(metrics);

    // Keep limited history per query
    if (queryHistory.length > 500) {
      queryHistory.splice(0, 100);
    }

    // Add to global history
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.splice(0, 1000);
    }
  }

  private recordPrometheusMetrics(metrics: DetailedQueryMetrics): void {
    this.metrics.histogram('database_query_duration_detailed_ms', metrics.executionTime, {
      operation: metrics.operation,
      table: metrics.table,
      tenant: metrics.tenantId,
    });

    this.metrics.histogram('database_query_rows_returned', metrics.rowsReturned, {
      operation: metrics.operation,
      table: metrics.table,
      tenant: metrics.tenantId,
    });

    this.metrics.histogram('database_query_plan_cost', metrics.planCost, {
      operation: metrics.operation,
      table: metrics.table,
      tenant: metrics.tenantId,
    });

    // Index usage metrics
    this.metrics.gauge('database_query_index_usage', metrics.indexesUsed.length, {
      operation: metrics.operation,
      table: metrics.table,
      tenant: metrics.tenantId,
    });
  }

  private async checkPerformanceIssues(metrics: DetailedQueryMetrics): Promise<void> {
    const issues: string[] = [];

    if (metrics.executionTime >= this.verySlowQueryThreshold) {
      issues.push(`Very slow query: ${metrics.executionTime}ms`);
    }

    if (metrics.rowsReturned > 10000) {
      issues.push(`Large result set: ${metrics.rowsReturned} rows`);
    }

    if (metrics.indexesUsed.length === 0 && metrics.rowsExamined > 100) {
      issues.push('Query not using indexes effectively');
    }

    if (issues.length > 0) {
      this.structuredLogger.warn(
        `Performance issues detected in query`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            queryHash: metrics.queryHash,
            operation: metrics.operation,
            table: metrics.table,
            tenantId: metrics.tenantId,
            issues,
            metrics: {
              executionTime: metrics.executionTime,
              rowsReturned: metrics.rowsReturned,
              indexesUsed: metrics.indexesUsed,
            },
          },
        }
      );
    }
  }

  // Mock methods for database-specific operations
  // These would be implemented with actual database monitoring queries

  private async getActiveConnectionCount(): Promise<number> {
    // SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
    return 8;
  }

  private async getIdleConnectionCount(): Promise<number> {
    // SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';
    return 12;
  }

  private async getMaxConnectionCount(): Promise<number> {
    // SHOW max_connections;
    return 100;
  }

  private async getAvgConnectionAge(): Promise<number> {
    // SELECT avg(extract(epoch from now() - backend_start)) FROM pg_stat_activity;
    return 300; // 5 minutes average
  }

  private async getLongRunningQueryCount(): Promise<number> {
    // SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';
    return 2;
  }

  private async getLockedQueryCount(): Promise<number> {
    // SELECT count(*) FROM pg_locks WHERE NOT granted;
    return 0;
  }

  private async getDeadlockCount(): Promise<number> {
    // SELECT deadlocks FROM pg_stat_database WHERE datname = current_database();
    return 0;
  }

  private async analyzeQueryPlan(metadata: any, queryHash: string): Promise<QueryPlanAnalysis | null> {
    // This would use EXPLAIN ANALYZE for actual queries
    return null;
  }

  private recordConnectionMetrics(metrics: DatabaseConnectionMetrics): void {
    this.metrics.gauge('database_connections_active_detailed', metrics.activeConnections);
    this.metrics.gauge('database_connections_idle_detailed', metrics.idleConnections);
    this.metrics.gauge('database_connection_utilization_detailed', metrics.connectionUtilization);
    this.metrics.gauge('database_connection_avg_age', metrics.avgConnectionAge);
    this.metrics.gauge('database_long_running_queries', metrics.longRunningQueries);
    this.metrics.gauge('database_locked_queries', metrics.lockedQueries);
    this.metrics.gauge('database_deadlocks', metrics.deadlocks);
  }

  private getRecentHistory(minutes: number): DetailedQueryMetrics[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.performanceHistory.filter(h => h.timestamp >= cutoffTime);
  }

  private createSlowQueryAnalysis(metric: DetailedQueryMetrics): SlowQueryAnalysis {
    return {
      queryHash: metric.queryHash,
      queryText: metric.queryText,
      avgExecutionTime: metric.executionTime,
      maxExecutionTime: metric.executionTime,
      minExecutionTime: metric.executionTime,
      p95ExecutionTime: metric.executionTime,
      callCount: 1,
      lastSeen: metric.timestamp,
      tenantId: metric.tenantId,
      avgRowsReturned: metric.rowsReturned,
      avgRowsExamined: metric.rowsExamined,
      selectivityRatio: metric.rowsReturned / Math.max(metric.rowsExamined, 1),
      indexUsageScore: metric.indexesUsed.length,
      optimizationPriority: this.calculateOptimizationPriority(metric),
      recommendations: this.generateQueryRecommendations(metric),
    };
  }

  private updateSlowQueryAnalysis(existing: SlowQueryAnalysis, metric: DetailedQueryMetrics): void {
    existing.callCount++;
    existing.avgExecutionTime = (existing.avgExecutionTime + metric.executionTime) / 2;
    existing.maxExecutionTime = Math.max(existing.maxExecutionTime, metric.executionTime);
    existing.minExecutionTime = Math.min(existing.minExecutionTime, metric.executionTime);
    existing.lastSeen = metric.timestamp;
    existing.avgRowsReturned = (existing.avgRowsReturned + metric.rowsReturned) / 2;
    existing.avgRowsExamined = (existing.avgRowsExamined + metric.rowsExamined) / 2;
    existing.selectivityRatio = existing.avgRowsReturned / Math.max(existing.avgRowsExamined, 1);
    existing.optimizationPriority = this.calculateOptimizationPriority(metric);
  }

  private calculateOptimizationPriority(metric: DetailedQueryMetrics): number {
    let priority = 0;
    
    // Execution time impact (0-50 points)
    priority += Math.min(metric.executionTime / 100, 50);
    
    // Call frequency impact (estimated, 0-20 points)
    priority += Math.min(10, 20); // Would use actual call count
    
    // Resource usage impact (0-30 points)
    priority += Math.min(metric.rowsExamined / 1000, 20);
    priority += Math.min((10 - metric.indexesUsed.length) * 2, 10);

    return priority;
  }

  private generateQueryRecommendations(metric: DetailedQueryMetrics): string[] {
    const recommendations: string[] = [];

    if (metric.executionTime > this.verySlowQueryThreshold) {
      recommendations.push('Critical: Query execution time exceeds 5 seconds');
    }

    if (metric.indexesUsed.length === 0) {
      recommendations.push('Add appropriate indexes to improve query performance');
    }

    if (metric.rowsReturned > 1000) {
      recommendations.push('Consider implementing pagination for large result sets');
    }

    if (metric.rowsExamined > metric.rowsReturned * 10) {
      recommendations.push('Query examining too many rows - improve selectivity');
    }

    return recommendations;
  }

  private analyzeQueryPlanIssues(): QueryPlanAnalysis[] {
    // Would analyze actual query plans
    return [];
  }

  private generatePerformanceRecommendations(
    history: DetailedQueryMetrics[],
    connectionMetrics: DatabaseConnectionMetrics,
    slowQueries: SlowQueryAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    if (connectionMetrics.connectionUtilization > 80) {
      recommendations.push('High connection utilization - consider connection pooling optimization');
    }

    if (slowQueries.length > 5) {
      recommendations.push('Multiple slow queries detected - review query optimization strategy');
    }

    const avgExecutionTime = history.reduce((sum, h) => sum + h.executionTime, 0) / history.length;
    if (avgExecutionTime > 500) {
      recommendations.push('Overall query performance is slow - consider database optimization');
    }

    return recommendations;
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.floor(sortedArray.length * percentile);
    return sortedArray[Math.min(index, sortedArray.length - 1)] || 0;
  }

  private analyzeTableUsage(metrics: DetailedQueryMetrics[]): Record<string, { avgExecutionTime: number; count: number }> {
    const usage: Record<string, { avgExecutionTime: number; count: number; totalTime: number }> = {};

    metrics.forEach(metric => {
      if (!usage[metric.table]) {
        usage[metric.table] = { avgExecutionTime: 0, count: 0, totalTime: 0 };
      }
      usage[metric.table].count++;
      usage[metric.table].totalTime += metric.executionTime;
    });

    // Calculate averages
    Object.keys(usage).forEach(table => {
      usage[table].avgExecutionTime = usage[table].totalTime / usage[table].count;
    });

    return usage;
  }

  private getDefaultConnectionMetrics(): DatabaseConnectionMetrics {
    return {
      activeConnections: 0,
      idleConnections: 0,
      maxConnections: 100,
      connectionUtilization: 0,
      avgConnectionAge: 0,
      longRunningQueries: 0,
      lockedQueries: 0,
      deadlocks: 0,
      connectionErrors: 1,
      connectionLeaks: 0,
      timestamp: new Date(),
    };
  }

  private getEmptySnapshot(connectionMetrics: DatabaseConnectionMetrics): DatabasePerformanceSnapshot {
    return {
      timestamp: new Date(),
      totalQueries: 0,
      avgResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      slowQueriesCount: 0,
      errorRate: 0,
      connectionMetrics,
      topSlowQueries: [],
      queryPlanIssues: [],
      recommendations: ['No recent query data available for analysis'],
    };
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    // Clean performance history
    const initialSize = this.performanceHistory.length;
    for (let i = this.performanceHistory.length - 1; i >= 0; i--) {
      if (this.performanceHistory[i].timestamp < cutoffTime) {
        this.performanceHistory.splice(i, 1);
      }
    }

    // Clean connection metrics history
    for (let i = this.connectionMetricsHistory.length - 1; i >= 0; i--) {
      if (this.connectionMetricsHistory[i].timestamp < cutoffTime) {
        this.connectionMetricsHistory.splice(i, 1);
      }
    }

    this.logger.debug(`Cleaned up ${initialSize - this.performanceHistory.length} old performance metrics`);
  }
}