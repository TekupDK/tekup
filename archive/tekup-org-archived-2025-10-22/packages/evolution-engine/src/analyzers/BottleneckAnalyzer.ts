import { CodeSection, SystemMetrics } from '../types';
import { PerformanceAnalyzer } from './PerformanceAnalyzer';
import { CodeComplexityAnalyzer } from './CodeComplexityAnalyzer';
import { DatabaseQueryAnalyzer } from './DatabaseQueryAnalyzer';
import { MemoryLeakAnalyzer } from './MemoryLeakAnalyzer';
import { CacheEfficiencyAnalyzer } from './CacheEfficiencyAnalyzer';

/**
 * AI-Powered Bottleneck Analyzer
 * Uses multiple analysis strategies to identify performance bottlenecks
 * and optimization opportunities in the codebase
 */
export class BottleneckAnalyzer {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-evolution-engine-src-');

  private performanceAnalyzer: PerformanceAnalyzer;
  private complexityAnalyzer: CodeComplexityAnalyzer;
  private queryAnalyzer: DatabaseQueryAnalyzer;
  private memoryAnalyzer: MemoryLeakAnalyzer;
  private cacheAnalyzer: CacheEfficiencyAnalyzer;

  constructor() {
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.complexityAnalyzer = new CodeComplexityAnalyzer();
    this.queryAnalyzer = new DatabaseQueryAnalyzer();
    this.memoryAnalyzer = new MemoryLeakAnalyzer();
    this.cacheAnalyzer = new CacheEfficiencyAnalyzer();
  }

  /**
   * Comprehensive bottleneck analysis using multiple AI strategies
   */
  async analyzeBottlenecks(
    currentMetrics: SystemMetrics,
    codebasePath: string
  ): Promise<CodeSection[]> {
    try {
      logger.info('🔍 Starting comprehensive bottleneck analysis...');

      // Run all analyzers in parallel for efficiency
      const [
        complexityIssues,
        queryIssues,
        memoryIssues,
        cacheIssues,
        performanceIssues
      ] = await Promise.all([
        this.complexityAnalyzer.analyze(codebasePath),
        this.queryAnalyzer.analyze(codebasePath),
        this.memoryAnalyzer.analyze(codebasePath),
        this.cacheAnalyzer.analyze(codebasePath),
        this.performanceAnalyzer.analyze(currentMetrics, codebasePath)
      ]);

      // Combine and deduplicate findings
      const allBottlenecks = this.combineAndDeduplicate([
        ...complexityIssues,
        ...queryIssues,
        ...memoryIssues,
        ...cacheIssues,
        ...performanceIssues
      ]);

      // Prioritize by impact and complexity
      const prioritizedBottlenecks = this.prioritizeBottlenecks(allBottlenecks);

      logger.info(`🎯 Identified ${prioritizedBottlenecks.length} optimization opportunities`);

      return prioritizedBottlenecks;
    } catch (error) {
      logger.error('Error in bottleneck analysis:', error);
      return [];
    }
  }

  /**
   * Combine findings from multiple analyzers and remove duplicates
   */
  private combineAndDeduplicate(bottlenecks: CodeSection[]): CodeSection[] {
    const uniqueBottlenecks = new Map<string, CodeSection>();

    for (const bottleneck of bottlenecks) {
      const key = `${bottleneck.filePath}:${bottleneck.startLine}:${bottleneck.endLine}`;
      
      if (uniqueBottlenecks.has(key)) {
        // Merge metrics and take the higher impact score
        const existing = uniqueBottlenecks.get(key)!;
        existing.performanceImpact = Math.max(
          existing.performanceImpact,
          bottleneck.performanceImpact
        );
        existing.metrics = { ...existing.metrics, ...bottleneck.metrics };
      } else {
        uniqueBottlenecks.set(key, bottleneck);
      }
    }

    return Array.from(uniqueBottlenecks.values());
  }

  /**
   * Prioritize bottlenecks by impact vs complexity ratio
   */
  private prioritizeBottlenecks(bottlenecks: CodeSection[]): CodeSection[] {
    return bottlenecks.sort((a, b) => {
      // Calculate ROI: performance impact / complexity
      const aROI = a.performanceImpact / Math.max(a.complexity, 1);
      const bROI = b.performanceImpact / Math.max(b.complexity, 1);
      
      // Primary sort by ROI
      if (Math.abs(aROI - bROI) > 0.1) {
        return bROI - aROI;
      }
      
      // Secondary sort by performance impact
      if (a.performanceImpact !== b.performanceImpact) {
        return b.performanceImpact - a.performanceImpact;
      }
      
      // Tertiary sort by complexity (lower is better)
      return a.complexity - b.complexity;
    });
  }

  /**
   * Get detailed analysis report for a specific bottleneck
   */
  async getDetailedAnalysis(bottleneck: CodeSection): Promise<{
    rootCause: string;
    impactAnalysis: string;
    optimizationStrategies: string[];
    riskAssessment: string;
    estimatedEffort: number;
  }> {
    try {
      // Analyze the specific bottleneck in detail
      const analysis = await this.performDeepAnalysis(bottleneck);
      
      return {
        rootCause: analysis.rootCause,
        impactAnalysis: analysis.impactAnalysis,
        optimizationStrategies: analysis.strategies,
        riskAssessment: analysis.riskAssessment,
        estimatedEffort: analysis.estimatedEffort
      };
    } catch (error) {
      logger.error('Error in detailed analysis:', error);
      return {
        rootCause: 'Analysis failed',
        impactAnalysis: 'Unable to determine impact',
        optimizationStrategies: [],
        riskAssessment: 'Unknown risk level',
        estimatedEffort: 0
      };
    }
  }

  /**
   * Perform deep analysis of a specific bottleneck
   */
  private async performDeepAnalysis(bottleneck: CodeSection): Promise<{
    rootCause: string;
    impactAnalysis: string;
    strategies: string[];
    riskAssessment: string;
    estimatedEffort: number;
  }> {
    // This would integrate with AI services for deep code analysis
    // For now, return a structured analysis based on the bottleneck type
    
    const analysis = {
      rootCause: this.identifyRootCause(bottleneck),
      impactAnalysis: this.analyzeImpact(bottleneck),
      strategies: this.generateOptimizationStrategies(bottleneck),
      riskAssessment: this.assessRisk(bottleneck),
      estimatedEffort: this.estimateEffort(bottleneck)
    };

    return analysis;
  }

  private identifyRootCause(bottleneck: CodeSection): string {
    if (bottleneck.type === 'function' && bottleneck.complexity > 8) {
      return 'High cyclomatic complexity causing performance degradation';
    }
    
    if (bottleneck.dependencyCount > 20) {
      return 'Excessive dependencies creating tight coupling and performance overhead';
    }
    
    if (bottleneck.performanceImpact > 80) {
      return 'Critical performance bottleneck requiring immediate attention';
    }
    
    return 'Performance issue identified through system monitoring';
  }

  private analyzeImpact(bottleneck: CodeSection): string {
    const impact = bottleneck.performanceImpact;
    
    if (impact > 90) {
      return `Critical impact: This bottleneck is severely affecting system performance and should be addressed immediately.`;
    } else if (impact > 70) {
      return `High impact: Significant performance degradation observed.`;
    } else if (impact > 50) {
      return `Medium impact: Noticeable performance impact that should be optimized.`;
    } else {
      return `Low impact: Minor performance issue that could be improved.`;
    }
  }

  private generateOptimizationStrategies(bottleneck: CodeSection): string[] {
    const strategies: string[] = [];
    
    if (bottleneck.complexity > 8) {
      strategies.push('Refactor complex logic into smaller, focused functions');
      strategies.push('Extract common patterns into utility functions');
      strategies.push('Consider using design patterns to simplify logic');
    }
    
    if (bottleneck.dependencyCount > 20) {
      strategies.push('Reduce dependencies through dependency injection');
      strategies.push('Implement interface segregation principle');
      strategies.push('Use facade pattern to simplify external dependencies');
    }
    
    if (bottleneck.type === 'database') {
      strategies.push('Optimize database queries and add proper indexing');
      strategies.push('Implement query result caching');
      strategies.push('Consider database connection pooling');
    }
    
    if (bottleneck.type === 'memory') {
      strategies.push('Implement object pooling for frequently created objects');
      strategies.push('Add memory leak detection and cleanup');
      strategies.push('Optimize data structures for memory efficiency');
    }
    
    // Always include general optimization strategies
    strategies.push('Add performance monitoring and metrics collection');
    strategies.push('Implement automated testing for performance regressions');
    
    return strategies;
  }

  private assessRisk(bottleneck: CodeSection): string {
    const complexity = bottleneck.complexity;
    const impact = bottleneck.performanceImpact;
    
    if (complexity > 9 && impact > 80) {
      return 'High risk: Complex changes with high impact require careful testing and rollback strategy';
    } else if (complexity > 7 || impact > 60) {
      return 'Medium risk: Moderate complexity or impact, standard testing procedures recommended';
    } else {
      return 'Low risk: Simple changes with low impact, minimal risk of regression';
    }
  }

  private estimateEffort(bottleneck: CodeSection): number {
    // Estimate effort in hours based on complexity and type
    let baseEffort = bottleneck.complexity * 2;
    
    switch (bottleneck.type) {
      case 'function':
        baseEffort *= 1.5;
        break;
      case 'class':
        baseEffort *= 2;
        break;
      case 'service':
        baseEffort *= 3;
        break;
      case 'module':
        baseEffort *= 4;
        break;
    }
    
    // Add time for testing and documentation
    baseEffort += Math.ceil(baseEffort * 0.3);
    
    return Math.ceil(baseEffort);
  }
}