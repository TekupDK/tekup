import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { PerformanceService } from '../performance/performance.service.js';
import { EnhancedDatabasePerformanceService } from '../performance/enhanced-database-performance.service.js';

export interface IndexRecommendation {
  tableName: string;
  columns: string[];
  indexType: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

export interface PartitionRecommendation {
  tableName: string;
  partitionKey: string;
  partitionType: 'range' | 'list' | 'hash';
  recommendation: string;
  estimatedImpact: string;
}

export interface DatabaseOptimizationReport {
  timestamp: Date;
  indexRecommendations: IndexRecommendation[];
  partitionRecommendations: PartitionRecommendation[];
  connectionPoolOptimizations: string[];
  queryOptimizationSuggestions: string[];
  performanceImprovements: string[];
}

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly performanceService: PerformanceService,
    private readonly enhancedPerformanceService: EnhancedDatabasePerformanceService,
  ) {}

  /**
   * Analyze query patterns and recommend indexes
   */
  async analyzeQueryPatterns(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    try {
      // Get slow queries from performance service
      const slowQueries = this.performanceService.getSlowQueries(20);
      
      // Analyze common query patterns
      for (const slowQuery of slowQueries) {
        // Check for missing indexes on common query patterns
        if (slowQuery.query.includes('WHERE') && slowQuery.query.includes('tenantId')) {
          // Most queries filter by tenantId, ensure we have proper indexes
          recommendations.push({
            tableName: 'Lead',
            columns: ['tenantId'],
            indexType: 'btree',
            recommendation: 'Ensure tenantId is properly indexed for tenant isolation',
            priority: 'high',
            estimatedImpact: 'Could reduce query time by 50-80%',
          });
        }

        if (slowQuery.query.includes('ORDER BY') && slowQuery.query.includes('createdAt')) {
          // Common sorting pattern
          recommendations.push({
            tableName: 'Lead',
            columns: ['tenantId', 'createdAt'],
            indexType: 'btree',
            recommendation: 'Composite index on tenantId and createdAt for sorting',
            priority: 'high',
            estimatedImpact: 'Could reduce sorting time by 70-90%',
          });
        }

        if (slowQuery.query.includes('status') && slowQuery.query.includes('tenantId')) {
          // Common filtering pattern
          recommendations.push({
            tableName: 'Lead',
            columns: ['tenantId', 'status'],
            indexType: 'btree',
            recommendation: 'Composite index on tenantId and status for filtering',
            priority: 'high',
            estimatedImpact: 'Could reduce filtering time by 60-85%',
          });
        }

        if (slowQuery.query.includes('source') && slowQuery.query.includes('tenantId')) {
          // Common filtering pattern
          recommendations.push({
            tableName: 'Lead',
            columns: ['tenantId', 'source'],
            indexType: 'btree',
            recommendation: 'Composite index on tenantId and source for filtering',
            priority: 'medium',
            estimatedImpact: 'Could reduce filtering time by 40-70%',
          });
        }
      }

      // Check for missing indexes on foreign keys
      recommendations.push({
        tableName: 'Lead',
        columns: ['tenantId'],
        indexType: 'btree',
        recommendation: 'Ensure foreign key tenantId is indexed',
        priority: 'high',
        estimatedImpact: 'Critical for referential integrity performance',
      });

      recommendations.push({
        tableName: 'LeadEvent',
        columns: ['leadId'],
        indexType: 'btree',
        recommendation: 'Ensure foreign key leadId is indexed',
        priority: 'high',
        estimatedImpact: 'Critical for event queries',
      });

      recommendations.push({
        tableName: 'ApiKey',
        columns: ['tenantId'],
        indexType: 'btree',
        recommendation: 'Ensure foreign key tenantId is indexed',
        priority: 'high',
        estimatedImpact: 'Critical for API key queries',
      });

      // Check for missing indexes on frequently queried fields
      recommendations.push({
        tableName: 'Lead',
        columns: ['complianceType'],
        indexType: 'btree',
        recommendation: 'Index on complianceType for compliance queries',
        priority: 'medium',
        estimatedImpact: 'Could reduce compliance query time by 50-70%',
      });

      recommendations.push({
        tableName: 'Lead',
        columns: ['slaDeadline'],
        indexType: 'btree',
        recommendation: 'Index on slaDeadline for SLA monitoring',
        priority: 'medium',
        estimatedImpact: 'Could reduce SLA query time by 60-80%',
      });

      // Check for missing indexes on duplicate detection fields
      recommendations.push({
        tableName: 'Lead',
        columns: ['duplicateOf'],
        indexType: 'btree',
        recommendation: 'Index on duplicateOf for duplicate queries',
        priority: 'medium',
        estimatedImpact: 'Could reduce duplicate query time by 70-85%',
      });

      // Check for missing indexes on duplicate group tables
      recommendations.push({
        tableName: 'DuplicateGroup',
        columns: ['tenantId', 'resolved'],
        indexType: 'btree',
        recommendation: 'Composite index on tenantId and resolved for group queries',
        priority: 'high',
        estimatedImpact: 'Could reduce group query time by 60-80%',
      });

      recommendations.push({
        tableName: 'DuplicateGroupMember',
        columns: ['leadId'],
        indexType: 'btree',
        recommendation: 'Index on leadId for member lookups',
        priority: 'high',
        estimatedImpact: 'Could reduce member lookup time by 70-90%',
      });

      this.structuredLogger.info('Database index analysis completed', {
        ...this.contextService.toLogContext(),
        metadata: {
          recommendationsCount: recommendations.length,
        },
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to analyze query patterns:', error);
      return [];
    }
  }

  /**
   * Recommend database partitioning strategies
   */
  async recommendPartitioning(): Promise<PartitionRecommendation[]> {
    const recommendations: PartitionRecommendation[] = [];

    try {
      // For large datasets, recommend partitioning by date
      recommendations.push({
        tableName: 'Lead',
        partitionKey: 'createdAt',
        partitionType: 'range',
        recommendation: 'Partition Lead table by createdAt for better performance with large datasets',
        estimatedImpact: 'Could improve query performance by 50-80% for time-based queries',
      });

      recommendations.push({
        tableName: 'LeadEvent',
        partitionKey: 'createdAt',
        partitionType: 'range',
        recommendation: 'Partition LeadEvent table by createdAt for better performance',
        estimatedImpact: 'Could improve event query performance by 40-70%',
      });

      recommendations.push({
        tableName: 'ApiKeyUsageLog',
        partitionKey: 'timestamp',
        partitionType: 'range',
        recommendation: 'Partition ApiKeyUsageLog by timestamp for better performance',
        estimatedImpact: 'Could improve log query performance by 60-85%',
      });

      this.structuredLogger.info('Database partitioning analysis completed', {
        ...this.contextService.toLogContext(),
        metadata: {
          recommendationsCount: recommendations.length,
        },
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to recommend partitioning:', error);
      return [];
    }
  }

  /**
   * Optimize connection pooling configuration
   */
  async optimizeConnectionPooling(): Promise<string[]> {
    const optimizations: string[] = [];

    try {
      // Get current connection pool stats
      const poolStats = await this.performanceService.getConnectionPoolStats();

      // Recommend optimizations based on usage
      if (poolStats.connectionErrors > 0) {
        optimizations.push('Investigate connection errors and consider increasing connection timeout');
      }

      if (poolStats.waitingConnections > 0) {
        optimizations.push('Consider increasing max connections to reduce waiting connections');
      }

      if (poolStats.connectionPoolUtilization > 80) {
        optimizations.push('Connection pool utilization is high, consider increasing max connections');
      }

      if (poolStats.idleConnections < 5) {
        optimizations.push('Low idle connections, consider adjusting connection pool settings');
      }

      // General recommendations
      optimizations.push('Configure connection pool timeouts to prevent connection leaks');
      optimizations.push('Set appropriate connection pool size based on concurrent request patterns');
      optimizations.push('Enable connection validation to detect stale connections');
      optimizations.push('Implement connection retry logic for transient failures');

      this.structuredLogger.info('Connection pooling optimization analysis completed', {
        ...this.contextService.toLogContext(),
        metadata: {
          optimizationsCount: optimizations.length,
          poolStats,
        },
      });

      return optimizations;
    } catch (error) {
      this.logger.error('Failed to optimize connection pooling:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive database optimization report
   */
  async generateOptimizationReport(): Promise<DatabaseOptimizationReport> {
    try {
      const indexRecommendations = await this.analyzeQueryPatterns();
      const partitionRecommendations = await this.recommendPartitioning();
      const connectionPoolOptimizations = await this.optimizeConnectionPooling();
      const queryOptimizationSuggestions = await this.getQueryOptimizationSuggestions();
      const performanceImprovements = await this.getPerformanceImprovements();

      const report: DatabaseOptimizationReport = {
        timestamp: new Date(),
        indexRecommendations,
        partitionRecommendations,
        connectionPoolOptimizations,
        queryOptimizationSuggestions,
        performanceImprovements,
      };

      this.structuredLogger.info('Database optimization report generated', {
        ...this.contextService.toLogContext(),
        metadata: {
          report,
        },
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to generate optimization report:', error);
      throw error;
    }
  }

  /**
   * Get query optimization suggestions
   */
  private async getQueryOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Get slow queries and analyze them
      const slowQueries = this.performanceService.getSlowQueries(10);
      
      for (const slowQuery of slowQueries) {
        if (slowQuery.query.includes('SELECT *')) {
          suggestions.push('Avoid SELECT * queries, specify only required columns');
        }

        if (slowQuery.query.includes('ORDER BY') && !slowQuery.query.includes('LIMIT')) {
          suggestions.push('Add LIMIT clauses to ORDER BY queries to reduce result set size');
        }

        if (slowQuery.query.includes('LIKE') && slowQuery.query.includes('%') && slowQuery.query.includes('email')) {
          suggestions.push('Consider using full-text search instead of LIKE with wildcards for email searches');
        }

        if (slowQuery.avgExecutionTime > 5000) {
          suggestions.push(`Query "${slowQuery.query}" takes over 5 seconds on average, consider rewriting or adding indexes`);
        }
      }

      // General suggestions
      suggestions.push('Use prepared statements to reduce query parsing overhead');
      suggestions.push('Implement query result caching for frequently accessed data');
      suggestions.push('Use EXPLAIN ANALYZE to understand query execution plans');
      suggestions.push('Consider using materialized views for complex aggregations');

      return suggestions;
    } catch (error) {
      this.logger.error('Failed to get query optimization suggestions:', error);
      return [];
    }
  }

  /**
   * Get performance improvement recommendations
   */
  private async getPerformanceImprovements(): Promise<string[]> {
    const improvements: string[] = [];

    try {
      // Get current performance metrics
      const poolStats = await this.performanceService.getConnectionPoolStats();
      const slowQueries = this.performanceService.getSlowQueries(5);

      // Connection pool improvements
      if (poolStats.connectionPoolUtilization > 70) {
        improvements.push('Optimize connection pool utilization to reduce connection contention');
      }

      // Query performance improvements
      if (slowQueries.length > 0) {
        improvements.push('Implement query optimization based on slow query analysis');
      }

      // General improvements
      improvements.push('Implement read replicas for read-heavy workloads');
      improvements.push('Use connection pooling to reduce connection overhead');
      improvements.push('Enable database query caching for frequently accessed data');
      improvements.push('Implement database connection retry logic for transient failures');
      improvements.push('Use database connection validation to detect stale connections');
      improvements.push('Monitor database performance metrics continuously');

      return improvements;
    } catch (error) {
      this.logger.error('Failed to get performance improvements:', error);
      return [];
    }
  }
}