import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MCPServer, MCPServerMetric, MCPToolExecution } from '../../types';
import {
  Activity,
  Server,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface MCPServerChartProps {
  servers: MCPServer[];
  metrics: MCPServerMetric[];
  toolExecutions: MCPToolExecution[];
  selectedServer?: string;
  timeRange: '1h' | '6h' | '24h' | '7d';
}

const SERVER_COLORS = {
  'code-intelligence-mcp': '#3b82f6',
  'database-mcp': '#10b981',
  'knowledge-mcp': '#f59e0b',
  'autonomous-browser-tester': '#8b5cf6',
};

export function MCPServerChart({ 
  servers, 
  metrics, 
  toolExecutions, 
  selectedServer,
  timeRange 
}: MCPServerChartProps) {
  // Filter data for selected server or show all
  const filteredMetrics = selectedServer 
    ? metrics.filter(m => m.server_id === selectedServer)
    : metrics;

  const filteredExecutions = selectedServer
    ? toolExecutions.filter(e => e.server_id === selectedServer)
    : toolExecutions;

  // Process data for charts
  const chartData = filteredMetrics.map(metric => ({
    timestamp: new Date(metric.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    responseTime: Math.round(metric.response_time),
    uptime: Math.round(metric.uptime),
    memoryUsage: Math.round(metric.memory_usage),
    cpuUsage: Math.round(metric.cpu_usage),
    activeConnections: metric.active_connections,
    toolExecutions: metric.tool_executions,
    errorCount: metric.error_count,
    serverName: servers.find(s => s.id === metric.server_id)?.name || metric.server_id,
  }));

  // Server status distribution
  const statusData = servers.map(server => {
    const latestMetric = metrics
      .filter(m => m.server_id === server.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return {
      name: server.name,
      value: 1,
      status: latestMetric?.status || 'unknown',
      color: latestMetric?.status === 'healthy' ? '#10b981' : 
             latestMetric?.status === 'degraded' ? '#f59e0b' : '#ef4444',
    };
  });

  // Tool execution success rate
  const executionStats = toolExecutions.reduce((acc, execution) => {
    if (!acc[execution.server_id]) {
      acc[execution.server_id] = { success: 0, error: 0, timeout: 0 };
    }
    acc[execution.server_id][execution.status]++;
    return acc;
  }, {} as Record<string, { success: number; error: number; timeout: number }>);

  const executionChartData = Object.entries(executionStats).map(([serverId, stats]) => ({
    server: servers.find(s => s.id === serverId)?.name || serverId,
    success: stats.success,
    error: stats.error,
    timeout: stats.timeout,
    total: stats.success + stats.error + stats.timeout,
    successRate: Math.round((stats.success / (stats.success + stats.error + stats.timeout)) * 100),
  }));

  // Recent tool executions
  const recentExecutions = filteredExecutions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'responseTime' && 'Response Time: '}
              {entry.dataKey === 'uptime' && 'Uptime: '}
              {entry.dataKey === 'memoryUsage' && 'Memory Usage: '}
              {entry.dataKey === 'cpuUsage' && 'CPU Usage: '}
              {entry.dataKey === 'activeConnections' && 'Active Connections: '}
              {entry.dataKey === 'toolExecutions' && 'Tool Executions: '}
              {entry.dataKey === 'errorCount' && 'Error Count: '}
              <span className="font-medium">
                {entry.value}
                {entry.dataKey.includes('Time') || entry.dataKey.includes('Usage') ? 'ms' : 
                 entry.dataKey === 'uptime' ? '%' :
                 entry.dataKey.includes('memory') ? 'MB' : 
                 entry.dataKey.includes('cpu') ? '%' : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getExecutionStatusBadge = (status: MCPToolExecution['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      case 'timeout':
        return <Badge variant="warning">Timeout</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* MCP Server Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Servers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {servers.length}
                </p>
                <div className="flex items-center mt-1">
                  <Server className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-xs text-blue-600">MCP Servers</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(metrics.reduce((sum, m) => sum + m.response_time, 0) / metrics.length || 0)}ms
                </p>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">Last check</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tool Executions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {toolExecutions.length}
                </p>
                <div className="flex items-center mt-1">
                  <Play className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="text-xs text-purple-600">Last 24h</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {toolExecutions.length > 0 
                    ? Math.round((toolExecutions.filter(e => e.status === 'success').length / toolExecutions.length) * 100)
                    : 0
                  }%
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-xs text-green-600">Overall</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCP Server Performance Trends */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time & Uptime Trends
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Performance metrics over time
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Uptime (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="Response Time (ms)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="uptime"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  name="Uptime (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resource Usage
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              CPU and Memory utilization
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Usage', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cpuUsage"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="CPU Usage (%)"
                />
                <Area
                  type="monotone"
                  dataKey="memoryUsage"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.6}
                  name="Memory Usage (MB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Execution Success Rate */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tool Execution Statistics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Success, error, and timeout rates by server
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="server" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Executions', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {label}
                          </p>
                          <p className="text-sm text-green-600">Success: {data.success}</p>
                          <p className="text-sm text-red-600">Errors: {data.error}</p>
                          <p className="text-sm text-yellow-600">Timeouts: {data.timeout}</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Success Rate: {data.successRate}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="success" fill="#10b981" name="Success" radius={[2, 2, 0, 0]} />
                <Bar dataKey="error" fill="#ef4444" name="Errors" radius={[2, 2, 0, 0]} />
                <Bar dataKey="timeout" fill="#f59e0b" name="Timeouts" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Server Status Overview */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Server Status Overview
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current status of all MCP servers
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {servers.map(server => {
                const latestMetric = metrics
                  .filter(m => m.server_id === server.id)
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                
                return (
                  <div key={server.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(latestMetric?.status || 'unknown')}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {server.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {server.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          latestMetric?.status === 'healthy' ? 'success' :
                          latestMetric?.status === 'degraded' ? 'warning' : 'danger'
                        }>
                          {latestMetric?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {latestMetric ? `${Math.round(latestMetric.response_time)}ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Tool Executions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Tool Executions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Latest tool execution results
          </p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Server
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Execution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentExecutions.map((execution) => (
                  <tr key={execution.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {servers.find(s => s.id === execution.server_id)?.name || execution.server_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {execution.tool_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getExecutionStatusBadge(execution.status)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(execution.execution_time)}ms
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(execution.timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}