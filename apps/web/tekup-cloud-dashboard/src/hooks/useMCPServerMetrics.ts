import { useState, useEffect, useCallback } from 'react';
import { MCPServer, MCPServerMetric, MCPServerHealth, MCPToolExecution } from '../types';

interface UseMCPServerMetricsOptions {
  pollInterval?: number;
  enableRealTime?: boolean;
}

interface MCPServerMetricsData {
  servers: MCPServer[];
  metrics: MCPServerMetric[];
  health: MCPServerHealth[];
  toolExecutions: MCPToolExecution[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export function useMCPServerMetrics(options: UseMCPServerMetricsOptions = {}) {
  const { pollInterval = 30000, enableRealTime = true } = options;

  const [data, setData] = useState<MCPServerMetricsData>({
    servers: [],
    metrics: [],
    health: [],
    toolExecutions: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Load MCP server configuration
  const loadMCPServerConfig = useCallback(async (): Promise<MCPServer[]> => {
    try {
      // Try to load from the config file
      const response = await fetch('/api/mcp-servers/config');
      if (!response.ok) {
        throw new Error('Failed to load MCP server config');
      }
      const config = await response.json();
      return config.mcpServers || [];
    } catch (error) {
      console.warn('Failed to load MCP config, using fallback:', error);
      // Fallback to hardcoded config matching dashboard-integration.json
      return [
        {
          id: 'code-intelligence-mcp',
          name: 'Code Intelligence MCP',
          description: 'Semantic code search and analysis server',
          type: 'http',
          baseUrl: 'http://localhost:8050',
          healthEndpoint: '/health',
          metricsEndpoint: '/metrics',
          summaryEndpoint: '/metrics/summary',
          status: 'active',
          category: 'development-tools',
          tags: ['code-search', 'semantic-analysis', 'development'],
        },
        {
          id: 'database-mcp',
          name: 'Database MCP',
          description: 'Supabase and Prisma integration server',
          type: 'http',
          baseUrl: 'http://localhost:8051',
          healthEndpoint: '/health',
          metricsEndpoint: '/metrics',
          summaryEndpoint: '/metrics/summary',
          status: 'active',
          category: 'database-tools',
          tags: ['supabase', 'prisma', 'database'],
        },
        {
          id: 'knowledge-mcp',
          name: 'Knowledge MCP',
          description: 'Knowledge management and search server',
          type: 'http',
          baseUrl: 'http://localhost:8052',
          healthEndpoint: '/health',
          metricsEndpoint: '/metrics',
          summaryEndpoint: '/metrics/summary',
          status: 'active',
          category: 'knowledge-tools',
          tags: ['search', 'documentation', 'knowledge-base'],
        },
        {
          id: 'autonomous-browser-tester',
          name: 'Autonomous Browser Tester',
          description: 'Browser automation and testing server',
          type: 'stdio',
          status: 'active',
          category: 'testing-tools',
          tags: ['browser-automation', 'testing', 'puppeteer'],
        },
      ];
    }
  }, []);

  // Check MCP server health
  const checkServerHealth = useCallback(async (server: MCPServer): Promise<MCPServerHealth> => {
    if (server.type === 'stdio') {
      // For stdio servers, we can't check HTTP health
      return {
        server_id: server.id,
        status: 'unknown',
        last_check: new Date().toISOString(),
        response_time: 0,
        version: 'stdio',
        uptime: 100,
      };
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${server.baseUrl}${server.healthEndpoint}`, {
        method: 'GET',
        timeout: 5000,
      });
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const healthData = await response.json();
      
      return {
        server_id: server.id,
        status: 'healthy',
        last_check: new Date().toISOString(),
        response_time: responseTime,
        version: healthData.version,
        uptime: healthData.uptime || 100,
      };
    } catch (error) {
      return {
        server_id: server.id,
        status: 'down',
        last_check: new Date().toISOString(),
        response_time: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        uptime: 0,
      };
    }
  }, []);

  // Fetch MCP server metrics
  const fetchServerMetrics = useCallback(async (server: MCPServer): Promise<MCPServerMetric | null> => {
    if (server.type === 'stdio') {
      // Generate mock data for stdio servers
      return {
        id: `${server.id}-${Date.now()}`,
        server_id: server.id,
        timestamp: new Date().toISOString(),
        uptime: 95 + Math.random() * 5,
        response_time: Math.random() * 100 + 20,
        memory_usage: Math.random() * 200 + 50,
        cpu_usage: Math.random() * 30 + 5,
        active_connections: Math.floor(Math.random() * 10) + 1,
        total_requests: Math.floor(Math.random() * 1000) + 500,
        error_count: Math.floor(Math.random() * 5),
        tool_executions: Math.floor(Math.random() * 50) + 10,
        average_execution_time: Math.random() * 500 + 100,
        status: 'healthy',
      };
    }

    try {
      const response = await fetch(`${server.baseUrl}${server.summaryEndpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const metricsData = await response.json();
      
      return {
        id: `${server.id}-${Date.now()}`,
        server_id: server.id,
        timestamp: new Date().toISOString(),
        uptime: metricsData.uptime || 100,
        response_time: metricsData.response_time || 0,
        memory_usage: metricsData.memory_usage || 0,
        cpu_usage: metricsData.cpu_usage || 0,
        active_connections: metricsData.active_connections || 0,
        total_requests: metricsData.total_requests || 0,
        error_count: metricsData.error_count || 0,
        tool_executions: metricsData.tool_executions || 0,
        average_execution_time: metricsData.average_execution_time || 0,
        status: metricsData.status || 'healthy',
      };
    } catch (error) {
      console.error(`Failed to fetch metrics for ${server.id}:`, error);
      return null;
    }
  }, []);

  // Generate mock tool executions for demonstration
  const generateMockToolExecutions = useCallback((serverId: string, count: number = 5): MCPToolExecution[] => {
    const tools = ['search', 'analyze', 'process', 'validate', 'transform', 'extract'];
    const statuses: MCPToolExecution['status'][] = ['success', 'error', 'timeout'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `${serverId}-exec-${Date.now()}-${i}`,
      server_id: serverId,
      tool_name: tools[Math.floor(Math.random() * tools.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      execution_time: Math.random() * 2000 + 100,
      timestamp: new Date(Date.now() - Math.random() * 300000).toISOString(), // Last 5 minutes
      error_message: Math.random() > 0.9 ? 'Tool execution failed' : undefined,
      parameters: { test: true },
    }));
  }, []);

  // Main data fetching function
  const fetchAllData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Load server configuration
      const servers = await loadMCPServerConfig();
      
      // Check health for all servers
      const healthPromises = servers.map(checkServerHealth);
      const healthResults = await Promise.allSettled(healthPromises);
      const health = healthResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<MCPServerHealth>).value);

      // Fetch metrics for all servers
      const metricsPromises = servers.map(fetchServerMetrics);
      const metricsResults = await Promise.allSettled(metricsPromises);
      const metrics = metricsResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<MCPServerMetric>).value!);

      // Generate mock tool executions
      const allToolExecutions: MCPToolExecution[] = [];
      servers.forEach(server => {
        const executions = generateMockToolExecutions(server.id, Math.floor(Math.random() * 8) + 3);
        allToolExecutions.push(...executions);
      });

      setData({
        servers,
        metrics,
        health,
        toolExecutions: allToolExecutions.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [loadMCPServerConfig, checkServerHealth, fetchServerMetrics, generateMockToolExecutions]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time polling
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(fetchAllData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, pollInterval, enableRealTime]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Get server by ID
  const getServer = useCallback((serverId: string) => {
    return data.servers.find(server => server.id === serverId);
  }, [data.servers]);

  // Get latest metrics for a server
  const getLatestMetrics = useCallback((serverId: string) => {
    return data.metrics
      .filter(metric => metric.server_id === serverId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [data.metrics]);

  // Get health status for a server
  const getServerHealth = useCallback((serverId: string) => {
    return data.health.find(h => h.server_id === serverId);
  }, [data.health]);

  // Get tool executions for a server
  const getToolExecutions = useCallback((serverId: string, limit: number = 10) => {
    return data.toolExecutions
      .filter(execution => execution.server_id === serverId)
      .slice(0, limit);
  }, [data.toolExecutions]);

  // Calculate summary statistics
  const getSummaryStats = useCallback(() => {
    const totalServers = data.servers.length;
    const healthyServers = data.health.filter(h => h.status === 'healthy').length;
    const downServers = data.health.filter(h => h.status === 'down').length;
    const avgResponseTime = data.health.length > 0 
      ? data.health.reduce((sum, h) => sum + h.response_time, 0) / data.health.length 
      : 0;
    const totalRequests = data.metrics.reduce((sum, m) => sum + m.total_requests, 0);
    const totalErrors = data.metrics.reduce((sum, m) => sum + m.error_count, 0);

    return {
      totalServers,
      healthyServers,
      downServers,
      avgResponseTime: Math.round(avgResponseTime),
      totalRequests,
      totalErrors,
      healthPercentage: totalServers > 0 ? Math.round((healthyServers / totalServers) * 100) : 0,
    };
  }, [data.servers, data.health, data.metrics]);

  return {
    ...data,
    refresh,
    getServer,
    getLatestMetrics,
    getServerHealth,
    getToolExecutions,
    getSummaryStats,
  };
}