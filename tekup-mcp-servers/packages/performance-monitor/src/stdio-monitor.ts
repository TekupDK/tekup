/**
 * Performance Monitoring for Stdio-based MCP Servers
 * 
 * This module provides lightweight performance monitoring for stdio-based MCP servers
 * that don't have HTTP endpoints but can still track tool execution metrics.
 */

export interface StdioMetrics {
  timestamp: number;
  serverId: string;
  serverVersion: string;
  
  // Tool Performance Metrics
  toolsExecuted: number;
  toolsSucceeded: number;
  toolsFailed: number;
  toolExecutionTimes: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    lastExecution?: number;
  }>;
  
  // Resource Usage
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // Status
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastError?: string;
}

export interface ToolExecutionContext {
  toolName: string;
  startTime: number;
  serverId: string;
}

export class StdioPerformanceMonitor {
  private metrics: StdioMetrics;
  private toolTimings: Map<string, number[]> = new Map();
  
  constructor(
    private serverId: string,
    private serverVersion: string
  ) {
    this.metrics = this.initializeMetrics();
  }
  
  private initializeMetrics(): StdioMetrics {
    const memoryUsage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      serverId: this.serverId,
      serverVersion: this.serverVersion,
      toolsExecuted: 0,
      toolsSucceeded: 0,
      toolsFailed: 0,
      toolExecutionTimes: {},
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      status: 'healthy',
      uptime: process.uptime()
    };
  }
  
  /**
   * Start monitoring a tool execution
   */
  startToolExecution(toolName: string): ToolExecutionContext {
    return {
      toolName,
      startTime: Date.now(),
      serverId: this.serverId
    };
  }
  
  /**
   * Complete monitoring a tool execution
   */
  completeToolExecution(context: ToolExecutionContext, success: boolean, error?: string): void {
    const duration = Date.now() - context.startTime;
    
    // Update basic metrics
    this.metrics.toolsExecuted++;
    if (success) {
      this.metrics.toolsSucceeded++;
    } else {
      this.metrics.toolsFailed++;
      this.metrics.lastError = error;
      if (error) {
        console.error(`[${this.serverId}] Tool ${context.toolName} failed:`, error);
      }
    }
    
    // Update tool-specific timing
    if (!this.metrics.toolExecutionTimes[context.toolName]) {
      this.metrics.toolExecutionTimes[context.toolName] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastExecution: Date.now()
      };
    }
    
    const toolMetrics = this.metrics.toolExecutionTimes[context.toolName];
    toolMetrics.count++;
    toolMetrics.totalTime += duration;
    toolMetrics.averageTime = toolMetrics.totalTime / toolMetrics.count;
    toolMetrics.minTime = Math.min(toolMetrics.minTime, duration);
    toolMetrics.maxTime = Math.max(toolMetrics.maxTime, duration);
    toolMetrics.lastExecution = Date.now();
    
    // Track timing in ring buffer for recent performance
    if (!this.toolTimings.has(context.toolName)) {
      this.toolTimings.set(context.toolName, []);
    }
    const timings = this.toolTimings.get(context.toolName)!;
    timings.push(duration);
    if (timings.length > 100) { // Keep last 100 executions
      timings.shift();
    }
    
    // Update server status based on error rate
    this.updateServerStatus();
  }
  
  /**
   * Update system resource metrics
   */
  updateResourceMetrics(): void {
    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage = {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    };
    
    this.metrics.timestamp = Date.now();
    this.metrics.uptime = process.uptime();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): StdioMetrics {
    this.updateResourceMetrics();
    return { ...this.metrics };
  }
  
  /**
   * Log metrics summary (for stdio servers)
   */
  logMetricsSummary(): void {
    const metrics = this.getMetrics();
    console.error(`[${this.serverId}] Performance Metrics Summary:`);
    console.error(`  Status: ${metrics.status}`);
    console.error(`  Uptime: ${this.formatUptime(metrics.uptime)}`);
    console.error(`  Memory: ${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB / ${Math.round(metrics.memoryUsage.total / 1024 / 1024)}MB (${metrics.memoryUsage.percentage}%)`);
    console.error(`  Tools Executed: ${metrics.toolsExecuted} (${metrics.toolsSucceeded} succeeded, ${metrics.toolsFailed} failed)`);
    
    if (Object.keys(metrics.toolExecutionTimes).length > 0) {
      console.error(`  Tool Performance:`);
      Object.entries(metrics.toolExecutionTimes).forEach(([tool, data]) => {
        console.error(`    ${tool}: ${data.count} executions, avg ${Math.round(data.averageTime)}ms, min ${Math.round(data.minTime)}ms, max ${Math.round(data.maxTime)}ms`);
      });
    }
  }
  
  /**
   * Get performance summary for dashboard
   */
  getDashboardSummary(): {
    serverId: string;
    status: string;
    uptime: string;
    memoryUsage: string;
    toolSuccessRate: number;
    toolsPerMinute: number;
    topTools: Array<{ name: string; avgTime: number; count: number }>;
  } {
    const metrics = this.getMetrics();
    
    // Calculate tools per minute (approximate)
    const toolsPerMinute = metrics.uptime > 0 ? 
      Math.round((metrics.toolsExecuted / (metrics.uptime / 60))) : 0;
    
    // Calculate tool success rate
    const toolSuccessRate = metrics.toolsExecuted > 0 ? 
      Math.round((metrics.toolsSucceeded / metrics.toolsExecuted) * 100) : 0;
    
    // Get top 5 tools by execution count
    const topTools = Object.entries(metrics.toolExecutionTimes)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        avgTime: Math.round(data.averageTime),
        count: data.count
      }));
    
    return {
      serverId: metrics.serverId,
      status: metrics.status,
      uptime: this.formatUptime(metrics.uptime),
      memoryUsage: `${Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB / ${Math.round(metrics.memoryUsage.total / 1024 / 1024)}MB (${metrics.memoryUsage.percentage}%)`,
      toolSuccessRate,
      toolsPerMinute,
      topTools
    };
  }
  
  /**
   * Check if server is healthy
   */
  isHealthy(): boolean {
    return this.metrics.status === 'healthy';
  }
  
  /**
   * Get recent errors
   */
  getRecentErrors(): string[] {
    const errors: string[] = [];
    if (this.metrics.lastError) {
      errors.push(this.metrics.lastError);
    }
    
    // Check for recent failed tool executions
    Object.entries(this.metrics.toolExecutionTimes).forEach(([tool, data]) => {
      if (data.count > 0 && data.averageTime > 30000) { // Tools taking > 30 seconds average
        errors.push(`Tool ${tool} is performing slowly (avg ${Math.round(data.averageTime)}ms)`);
      }
    });
    
    return errors;
  }
  
  private updateServerStatus(): void {
    const toolErrorRate = this.metrics.toolsExecuted > 0 ? 
      (this.metrics.toolsFailed / this.metrics.toolsExecuted) * 100 : 0;
    
    const memoryUsagePercent = this.metrics.memoryUsage.percentage;
    
    // Check for performance degradation
    let slowTools = 0;
    Object.values(this.metrics.toolExecutionTimes).forEach(data => {
      if (data.averageTime > 10000) { // Average execution time > 10 seconds
        slowTools++;
      }
    });
    
    // Determine status based on various factors
    if (toolErrorRate > 50 || memoryUsagePercent > 90 || slowTools > 2) {
      this.metrics.status = 'unhealthy';
    } else if (toolErrorRate > 20 || memoryUsagePercent > 75 || slowTools > 0) {
      this.metrics.status = 'degraded';
    } else {
      this.metrics.status = 'healthy';
    }
  }
  
  private formatUptime(uptime: number): string {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

/**
 * Utility to wrap tool execution with monitoring for stdio servers
 */
export function withStdioPerformanceMonitoring<T extends any[], R>(
  monitor: StdioPerformanceMonitor,
  toolName: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const context = monitor.startToolExecution(toolName);
    
    try {
      const result = await fn(...args);
      monitor.completeToolExecution(context, true);
      return result;
    } catch (error) {
      monitor.completeToolExecution(context, false, (error as Error).message);
      throw error;
    }
  };
}