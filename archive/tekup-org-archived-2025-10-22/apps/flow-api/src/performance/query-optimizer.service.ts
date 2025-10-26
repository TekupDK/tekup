import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface QueryPlan {
  nodeType: string;
  totalCost: number;
  rows: number;
  width: number;
  actualTime?: number;
  actualRows?: number;
  indexName?: string;
  filterCondition?: string;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'gin' | 'gist' | 'hash';
  reason: string;
  estimatedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery?: string;
  queryPlan: QueryPlan[];
  indexRecommendations: IndexRecommendation[];
  estimatedImprovement: number;
  suggestions: string[];
}

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private readonly queryPatterns = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Analyze query and provide optimization recommendations
   */
  async analyzeQuery(query: string, params?: any[]): Promise<QueryOptimizationResult> {
    try {
      this.logger.debug(`Analyzing query: ${query.substring(0, 100)}...`);

      // Get query execution plan
      const queryPlan = await this.getQueryPlan(query, params);
      
      // Analyze query patterns
      const patterns = this.analyzeQueryPatterns(query);
      
      // Generate index recommendations
      const indexRecommendations = this.generateIndexRecommendations(query, queryPlan);
      
      // Generate optimization suggestions
      const suggestions = this.generateOptimizationSuggestions(query, queryPlan);
      
      // Estimate improvement potential
      const estimatedImprovement = this.estimateImprovement(queryPlan, indexRecommendations);

      return {
        originalQuery: query,
        queryPlan,
        indexRecommendations,
        estimatedImprovement,
        suggestions,
      };
    } catch (error) {
      this.logger.error(`Failed to analyze query: ${error instanceof Error ? error.message : String(error)}`);
      return {
        originalQuery: query,
        queryPlan: [],
        indexRecommendations: [],
        estimatedImprovement: 0,
        suggestions: ['Query analysis failed - check query syntax'],
      };
    }
  }

  /**
   * Get PostgreSQL query execution plan
   */
  private async getQueryPlan(query: string, params?: any[]): Promise<QueryPlan[]> {
    try {
      // Use EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) for detailed plan
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      
      // Note: This is a simplified version. In practice, you'd need to handle
      // parameterized queries and parse the actual JSON response
      const result = await this.prisma.$queryRawUnsafe(explainQuery, ...(params || []));
      
      // Parse the execution plan (simplified)
      return this.parseExecutionPlan(result);
    } catch (error) {
      this.logger.warn(`Could not get query plan: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Parse PostgreSQL execution plan
   */
  private parseExecutionPlan(planResult: any): QueryPlan[] {
    try {
      // This is a simplified parser. Real implementation would need
      // to handle the complex JSON structure from PostgreSQL EXPLAIN
      if (Array.isArray(planResult) && planResult[0]?.['QUERY PLAN']) {
        const plan = planResult[0]['QUERY PLAN'][0];
        return this.extractPlanNodes(plan.Plan);
      }
      return [];
    } catch (error) {
      this.logger.warn(`Failed to parse execution plan: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Extract plan nodes recursively
   */
  private extractPlanNodes(planNode: any): QueryPlan[] {
    const nodes: QueryPlan[] = [];
    
    if (planNode) {
      nodes.push({
        nodeType: planNode['Node Type'] || 'Unknown',
        totalCost: planNode['Total Cost'] || 0,
        rows: planNode['Plan Rows'] || 0,
        width: planNode['Plan Width'] || 0,
        actualTime: planNode['Actual Total Time'],
        actualRows: planNode['Actual Rows'],
        indexName: planNode['Index Name'],
        filterCondition: planNode['Filter'],
      });

      // Process child plans
      if (planNode.Plans) {
        for (const childPlan of planNode.Plans) {
          nodes.push(...this.extractPlanNodes(childPlan));
        }
      }
    }

    return nodes;
  }

  /**
   * Analyze query patterns for optimization opportunities
   */
  private analyzeQueryPatterns(query: string): string[] {
    const patterns: string[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // Track query frequency
    const queryHash = this.hashQuery(normalizedQuery);
    this.queryPatterns.set(queryHash, (this.queryPatterns.get(queryHash) || 0) + 1);

    // Detect common patterns
    if (normalizedQuery.includes('select *')) {
      patterns.push('wildcard_select');
    }

    if (normalizedQuery.includes('order by') && !normalizedQuery.includes('limit')) {
      patterns.push('unbounded_sort');
    }

    if (normalizedQuery.includes('like \'%')) {
      patterns.push('leading_wildcard');
    }

    if (normalizedQuery.includes('or ')) {
      patterns.push('or_condition');
    }

    if (normalizedQuery.includes('in (select')) {
      patterns.push('subquery_in');
    }

    if (normalizedQuery.includes('exists (select')) {
      patterns.push('exists_subquery');
    }

    return patterns;
  }

  /**
   * Generate index recommendations based on query analysis
   */
  private generateIndexRecommendations(query: string, queryPlan: QueryPlan[]): IndexRecommendation[] {
    const recommendations: IndexRecommendation[] = [];
    const normalizedQuery = query.toLowerCase();

    // Look for sequential scans in query plan
    const sequentialScans = queryPlan.filter(node => 
      node.nodeType === 'Seq Scan' && node.rows > 1000
    );

    for (const scan of sequentialScans) {
      // Extract table name and suggest index
      const tableMatch = normalizedQuery.match(/from\s+(\w+)/);
      const whereMatch = normalizedQuery.match(/where\s+(\w+)/);
      
      if (tableMatch && whereMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: [whereMatch[1]],
          type: 'btree',
          reason: 'Sequential scan detected on large table',
          estimatedImprovement: Math.min(90, scan.rows / 100),
          priority: scan.rows > 10000 ? 'high' : 'medium',
        });
      }
    }

    // Suggest indexes for ORDER BY clauses
    const orderByMatch = normalizedQuery.match(/order\s+by\s+(\w+)/);
    if (orderByMatch) {
      const tableMatch = normalizedQuery.match(/from\s+(\w+)/);
      if (tableMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: [orderByMatch[1]],
          type: 'btree',
          reason: 'ORDER BY clause without index',
          estimatedImprovement: 30,
          priority: 'medium',
        });
      }
    }

    // Suggest GIN indexes for JSON queries
    if (normalizedQuery.includes('->') || normalizedQuery.includes('->>')) {
      const tableMatch = normalizedQuery.match(/from\s+(\w+)/);
      const jsonColumnMatch = normalizedQuery.match(/(\w+)\s*->/);
      
      if (tableMatch && jsonColumnMatch) {
        recommendations.push({
          table: tableMatch[1],
          columns: [jsonColumnMatch[1]],
          type: 'gin',
          reason: 'JSON operations detected',
          estimatedImprovement: 50,
          priority: 'high',
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(query: string, queryPlan: QueryPlan[]): string[] {
    const suggestions: string[] = [];
    const normalizedQuery = query.toLowerCase();

    // Check for SELECT *
    if (normalizedQuery.includes('select *')) {
      suggestions.push('Replace SELECT * with specific column names to reduce data transfer');
    }

    // Check for missing LIMIT
    if (normalizedQuery.includes('order by') && !normalizedQuery.includes('limit')) {
      suggestions.push('Add LIMIT clause to ORDER BY queries to prevent sorting large result sets');
    }

    // Check for leading wildcards in LIKE
    if (normalizedQuery.includes('like \'%')) {
      suggestions.push('Avoid leading wildcards in LIKE patterns - consider full-text search');
    }

    // Check for OR conditions
    if (normalizedQuery.includes(' or ')) {
      suggestions.push('Consider rewriting OR conditions as UNION for better performance');
    }

    // Check for subqueries
    if (normalizedQuery.includes('in (select')) {
      suggestions.push('Consider rewriting IN subqueries as JOINs');
    }

    // Check for expensive operations in query plan
    const expensiveNodes = queryPlan.filter(node => node.totalCost > 1000);
    if (expensiveNodes.length > 0) {
      suggestions.push('Query contains expensive operations - consider adding indexes or rewriting');
    }

    // Check for large result sets
    const largeScans = queryPlan.filter(node => node.rows > 10000);
    if (largeScans.length > 0) {
      suggestions.push('Query processes large number of rows - add WHERE conditions to filter data');
    }

    return suggestions;
  }

  /**
   * Estimate performance improvement potential
   */
  private estimateImprovement(queryPlan: QueryPlan[], indexRecommendations: IndexRecommendation[]): number {
    let improvement = 0;

    // Base improvement from index recommendations
    improvement += indexRecommendations.reduce((sum, rec) => sum + rec.estimatedImprovement, 0);

    // Additional improvement from query plan analysis
    const sequentialScans = queryPlan.filter(node => node.nodeType === 'Seq Scan');
    improvement += sequentialScans.length * 20;

    const sorts = queryPlan.filter(node => node.nodeType === 'Sort');
    improvement += sorts.length * 15;

    // Cap at 95% improvement
    return Math.min(95, improvement);
  }

  /**
   * Get frequently executed queries
   */
  getFrequentQueries(): Array<{ query: string; frequency: number }> {
    return Array.from(this.queryPatterns.entries())
      .map(([hash, frequency]) => ({ query: hash, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Generate SQL for creating recommended indexes
   */
  generateIndexSQL(recommendation: IndexRecommendation): string {
    const indexName = `idx_${recommendation.table}_${recommendation.columns.join('_')}`;
    const columns = recommendation.columns.join(', ');
    
    switch (recommendation.type) {
      case 'gin':
        return `CREATE INDEX CONCURRENTLY ${indexName} ON ${recommendation.table} USING GIN (${columns});`;
      case 'gist':
        return `CREATE INDEX CONCURRENTLY ${indexName} ON ${recommendation.table} USING GIST (${columns});`;
      case 'hash':
        return `CREATE INDEX CONCURRENTLY ${indexName} ON ${recommendation.table} USING HASH (${columns});`;
      default:
        return `CREATE INDEX CONCURRENTLY ${indexName} ON ${recommendation.table} (${columns});`;
    }
  }

  /**
   * Hash query for pattern tracking
   */
  private hashQuery(query: string): string {
    // Simple hash - replace parameters with placeholders
    return query
      .replace(/\$\d+/g, '$?')
      .replace(/'\w+'/g, "'?'")
      .replace(/\d+/g, '?')
      .substring(0, 200);
  }
}