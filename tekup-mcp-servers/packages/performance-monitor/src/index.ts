/**
 * Performance Monitoring Infrastructure for Tekup MCP Servers
 * 
 * This module provides lightweight, dependency-free performance monitoring
 * capabilities for all Tekup MCP servers.
 */

export interface PerformanceMetrics {
  timestamp: number;
  serverId: string;
  serverVersion: string;
  
  // Resource Usage
  cpuUsage?: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // Request/Response Metrics
  requestsTotal: number;
  requestsSucceeded: number;
  requestsFailed: number;
  averageResponseTime: number;
  
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
  }>;
  
  // Health Status
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastError?: string;
}

export interface ToolExecutionContext {
  toolName: string;
  startTime: number;
  serverId: string;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private toolTimings: Map<string, number[]> = new Map();
  private responseTimes: number[] = [];
  
  constructor(
    private serverId: string,
    private serverVersion: string,
    private port?: number
  ) {
    this.metrics = this.initializeMetrics();
  }
  
  private initializeMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      serverId: this.serverId,
      serverVersion: this.serverVersion,
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      requestsTotal: 0,
      requestsSucceeded: 0,
      requestsFailed: 0,
      averageResponseTime: 0,
      toolsExecuted: 0,
      toolsSucceeded: 0,
      toolsFailed: 0,
      toolExecutionTimes: {},
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
    }
    
    // Update tool-specific timing
    if (!this.metrics.toolExecutionTimes[context.toolName]) {
      this.metrics.toolExecutionTimes[context.toolName] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: Infinity,
        maxTime: 0
      };
    }
    
    const toolMetrics = this.metrics.toolExecutionTimes[context.toolName];
    toolMetrics.count++;
    toolMetrics.totalTime += duration;
    toolMetrics.averageTime = toolMetrics.totalTime / toolMetrics.count;
    toolMetrics.minTime = Math.min(toolMetrics.minTime, duration);
    toolMetrics.maxTime = Math.max(toolMetrics.maxTime, duration);
    
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
   * Track HTTP request
   */
  trackRequest(responseTime: number, success: boolean, error?: string): void {
    this.metrics.requestsTotal++;
    if (success) {
      this.metrics.requestsSucceeded++;
    } else {
      this.metrics.requestsFailed++;
      this.metrics.lastError = error;
    }
    
    // Track response time in ring buffer
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) { // Keep last 1000 requests
      this.responseTimes.shift();
    }
    
    // Update average response time
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    this.metrics.averageResponseTime = Math.round(sum / this.responseTimes.length);
    
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
    
    // CPU usage (simplified - this is an approximation)
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsage = Math.round((cpuUsage.user + cpuUsage.system) / 1000);
    
    this.metrics.timestamp = Date.now();
    this.metrics.uptime = process.uptime();
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateResourceMetrics();
    return { ...this.metrics };
  }
  
  /**
   * Get health check status
   */
  getHealthStatus(): { status: string; metrics: PerformanceMetrics } {
    this.updateResourceMetrics();
    return {
      status: this.metrics.status,
      metrics: this.metrics
    };
  }
  
  /**
   * Reset metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.toolTimings.clear();
    this.responseTimes.length = 0;
  }
  
  /**
   * Get performance summary for dashboard
   */
  getDashboardSummary(): {
    serverId: string;
    status: string;
    uptime: string;
    memoryUsage: string;
    requestsPerMinute: number;
    averageResponseTime: number;
    toolSuccessRate: number;
    topTools: Array<{ name: string; avgTime: number; count: number }>;
  } {
    const metrics = this.getMetrics();
    
    // Calculate requests per minute (approximate)
    const requestsPerMinute = this.responseTimes.length > 0 ? 
      Math.round((this.responseTimes.length / (metrics.uptime / 60))) : 0;
    
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
      requestsPerMinute,
      averageResponseTime: Math.round(metrics.averageResponseTime),
      toolSuccessRate,
      topTools
    };
  }
  
  private updateServerStatus(): void {
    const errorRate = this.metrics.requestsTotal > 0 ? 
      (this.metrics.requestsFailed / this.metrics.requestsTotal) * 100 : 0;
    
    const toolErrorRate = this.metrics.toolsExecuted > 0 ? 
      (this.metrics.toolsFailed / this.metrics.toolsExecuted) * 100 : 0;
    
    const memoryUsagePercent = this.metrics.memoryUsage.percentage;
    
    // Determine status based on various factors
    if (errorRate > 50 || toolErrorRate > 50 || memoryUsagePercent > 90) {
      this.metrics.status = 'unhealthy';
    } else if (errorRate > 20 || toolErrorRate > 20 || memoryUsagePercent > 75) {
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
 * HTTP handler utilities for adding monitoring endpoints to MCP servers
 */
export class MonitoringHttpHandler {
  /**
   * Create monitoring HTTP endpoints for an existing HTTP server
   */
  static addMonitoringEndpoints(
    httpServer: any,
    monitor: PerformanceMonitor,
    additionalEndpoints?: Record<string, (req: any, res: any) => void>
  ): void {
    const originalHandler = httpServer.on.bind(httpServer);
    
    httpServer.on('request', async (req: any, res: any) => {
      const startTime = Date.now();
      const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
      
      try {
        // Handle monitoring endpoints
        if (req.method === "GET" && url.pathname === "/health") {
          const health = monitor.getHealthStatus();
          res.writeHead(200, { "Content-Type": "application/json" })
            .end(JSON.stringify(health));
          return;
        }
        
        if (req.method === "GET" && url.pathname === "/metrics") {
          const metrics = monitor.getMetrics();
          res.writeHead(200, { "Content-Type": "application/json" })
            .end(JSON.stringify(metrics, null, 2));
          return;
        }
        
        if (req.method === "GET" && url.pathname === "/metrics/summary") {
          const summary = monitor.getDashboardSummary();
          res.writeHead(200, { "Content-Type": "application/json" })
            .end(JSON.stringify(summary, null, 2));
          return;
        }
        
        // Handle custom additional endpoints
        if (additionalEndpoints && additionalEndpoints[url.pathname]) {
          additionalEndpoints[url.pathname](req, res);
          return;
        }
        
        // Continue to original handler
        return originalHandler(req, res);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        monitor.trackRequest(responseTime, false, (error as Error).message);
        
        if (!res.headersSent) {
          res.writeHead(500).end("Internal Server Error");
        }
      } finally {
        const responseTime = Date.now() - startTime;
        if (url.pathname !== "/health" && url.pathname !== "/metrics" && url.pathname !== "/metrics/summary") {
          monitor.trackRequest(responseTime, !res.statusCode || res.statusCode < 400);
        }
      }
    });
  }
}

/**
 * Utility to wrap tool execution with monitoring
 */
export function withPerformanceMonitoring<T extends any[], R>(
  monitor: PerformanceMonitor,
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