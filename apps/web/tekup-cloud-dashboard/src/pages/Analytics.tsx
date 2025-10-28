import { useState } from 'react';
import { BusinessMetricsChart } from '../components/monitoring';
import { InfrastructureChart } from '../components/monitoring';
import { APIPerformanceChart } from '../components/monitoring';
import { MCPServerChart } from '../components/monitoring';
import { useRealTimeMetrics } from '../hooks/useRealTimeMetrics';
import { useMCPServerMetrics } from '../hooks/useMCPServerMetrics';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
const [activeTab, setActiveTab] = useState<'business' | 'infrastructure' | 'api' | 'mcp'>('business');
  
  const {
    infrastructureData,
    apiPerformanceData,
    connectionStatus,
    isConnected,
    error,
} = useRealTimeMetrics({
    enableInfrastructure: true,
    enableAPIPerformance: true,
    enableAlerts: false,
  });

  const {
    servers: mcpServers,
    metrics: mcpMetrics,
    health: mcpHealth,
    toolExecutions: mcpToolExecutions,
    loading: mcpLoading,
    error: mcpError,
    refresh: refreshMCP,
  } = useMCPServerMetrics({
    pollInterval: 30000,
    enableRealTime: true,
  });

  // Mock business metrics data for development
  const generateMockBusinessData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(0, currentMonth + 1).map((month, index) => ({
      timestamp: month,
      revenue: 30000 + Math.random() * 20000 + index * 5000,
      users: 1000 + Math.random() * 1500 + index * 200,
      conversions: 50 + Math.random() * 100 + index * 10,
      orders: 80 + Math.random() * 120 + index * 15,
    }));
  };

  const generateMockUserActivityData = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: Math.floor(Math.random() * 500) + 1500,
        newUsers: Math.floor(Math.random() * 200) + 100,
        returningUsers: Math.floor(Math.random() * 300) + 1200,
        sessionDuration: Math.random() * 30 + 15,
      });
    }
    return days;
  };

  const businessMetricsData = generateMockBusinessData();
  const userActivityData = generateMockUserActivityData();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track performance metrics and business insights
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {connectionStatus}
                </span>
              </div>
              
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('business')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'business'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Business Metrics
              </button>
              <button
                onClick={() => setActiveTab('infrastructure')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'infrastructure'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Infrastructure
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'api'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                API Performance
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mcp'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                MCP Servers
              </button>
            </nav>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  €45,231
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +12.5% from last month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  2,543
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +8.3% from last week
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Conversion Rate
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  3.24%
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  -0.5% from last month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg. Order Value
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  €127
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  +3.2% from last month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Connection Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'business' && (
            <BusinessMetricsChart
              revenueData={businessMetricsData}
              userActivityData={userActivityData}
              timeRange={timeRange}
            />
          )}
          
          {activeTab === 'infrastructure' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Infrastructure Monitoring
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Real-time system resource utilization and performance metrics
                </p>
              </div>
              <InfrastructureChart
                data={infrastructureData}
                timeRange="24h"
              />
            </div>
          )}
          
          {activeTab === 'api' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  API Performance Monitoring
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Request/response times, error rates, and endpoint performance
                </p>
              </div>
              <APIPerformanceChart
                data={apiPerformanceData}
                timeRange="24h"
                mcpServerMetrics={mcpMetrics}
              />
            </div>
          )}
          
          {activeTab === 'mcp' && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      MCP Server Monitoring
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Real-time monitoring of MCP server performance and health
                    </p>
                  </div>
                  <button
                    onClick={refreshMCP}
                    disabled={mcpLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {mcpLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {mcpError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>MCP Error:</strong> {mcpError}
                  </p>
                </div>
              )}
              
              <MCPServerChart
                servers={mcpServers}
                metrics={mcpMetrics}
                toolExecutions={mcpToolExecutions}
                timeRange="24h"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
