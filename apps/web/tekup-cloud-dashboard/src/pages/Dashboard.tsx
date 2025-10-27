import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "../components/dashboard/KPICard";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { QuickActions } from "../components/dashboard/QuickActions";
import { PerformanceChart } from "../components/dashboard/PerformanceChart";
import { AgentMonitor } from "../components/agents/AgentMonitor";
import { SkeletonCard } from "../components/ui";
import { useRealTimeMetrics } from "../hooks/useRealTimeMetrics";
import { apiClient, queryKeys } from "../lib/api";
import { Cpu, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Dashboard() {
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  
  // React Query for data fetching
  const {
    data: kpiMetrics = [],
    isLoading: kpiLoading,
    error: kpiError,
  } = useQuery({
    queryKey: queryKeys.kpis,
    queryFn: () => apiClient.getKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentActivities = [], isLoading: activitiesLoading } =
    useQuery({
      queryKey: queryKeys.activities,
      queryFn: () => apiClient.getActivities(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiClient.getAgents(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Real-time monitoring data
  const {
    infrastructureData,
    alerts,
    connectionStatus,
    isConnected,
    error: monitoringError,
  } = useRealTimeMetrics({
    enableInfrastructure: true,
    enableAPIPerformance: false,
    enableAlerts: true,
  });

  const isLoading = kpiLoading || activitiesLoading || agentsLoading;
  const error = kpiError?.message || null;

  // Calculate system health metrics
  const latestMetrics = infrastructureData.length > 0
    ? infrastructureData[infrastructureData.length - 1]
    : null;

  const activeAlerts = alerts.filter(alert => !alert.acknowledged).length;
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged).length;

  // Enhanced KPI metrics with system health data
  const enhancedKPIMetrics = [
    ...kpiMetrics,
    ...(latestMetrics ? [
      {
        label: "CPU Usage",
        value: `${Math.round(latestMetrics.cpu_usage)}%`,
        change: latestMetrics.cpu_usage > 80 ? 5 : -2,
        trend: (latestMetrics.cpu_usage > 80 ? 'down' : 'up') as 'up' | 'down' | 'stable',
        icon: "🖥️",
        type: "system"
      },
      {
        label: "Memory Usage",
        value: `${Math.round(latestMetrics.memory_usage)}%`,
        change: latestMetrics.memory_usage > 85 ? 3 : -1,
        trend: (latestMetrics.memory_usage > 85 ? 'down' : 'up') as 'up' | 'down' | 'stable',
        icon: "💾",
        type: "system"
      },
      {
        label: "Active Alerts",
        value: activeAlerts.toString(),
        change: criticalAlerts > 0 ? 10 : -5,
        trend: (criticalAlerts > 0 ? 'down' : 'up') as 'up' | 'down' | 'stable',
        icon: "🚨",
        type: "alert"
      },
      {
        label: "System Health",
        value: isConnected ? "Online" : "Offline",
        change: isConnected ? 0 : -100,
        trend: (isConnected ? 'up' : 'down') as 'up' | 'down' | 'stable',
        icon: "✅",
        type: "status"
      }
    ] : [])
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(error || monitoringError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error || monitoringError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Real-time Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Real-time {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* System Health Toggle */}
          <button
            onClick={() => setShowSystemHealth(!showSystemHealth)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              showSystemHealth
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            System Health
          </button>
        </div>
      </div>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {enhancedKPIMetrics.slice(0, 8).map((metric, index) => (
          <div key={index} className="relative">
            <KPICard metric={metric} />
            {/* Alert indicator for critical metrics */}
            {metric.type === 'alert' && criticalAlerts > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
            {metric.type === 'system' && latestMetrics && (
              <div className="absolute bottom-2 right-2">
                {metric.label.includes('CPU') && (
                  <Cpu className={`w-4 h-4 ${
                    latestMetrics.cpu_usage > 80 ? 'text-red-500' : 'text-green-500'
                  }`} />
                )}
                {metric.label.includes('Memory') && (
                  <Activity className={`w-4 h-4 ${
                    latestMetrics.memory_usage > 85 ? 'text-red-500' : 'text-green-500'
                  }`} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* System Health Panel (Collapsible) */}
      {showSystemHealth && latestMetrics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Health Overview
            </h3>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                All systems operational
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(latestMetrics.cpu_usage)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    latestMetrics.cpu_usage > 80 ? 'bg-red-500' :
                    latestMetrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${latestMetrics.cpu_usage}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(latestMetrics.memory_usage)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    latestMetrics.memory_usage > 85 ? 'bg-red-500' :
                    latestMetrics.memory_usage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${latestMetrics.memory_usage}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(latestMetrics.disk_usage)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Disk</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className={`h-2 rounded-full ${
                    latestMetrics.disk_usage > 90 ? 'bg-red-500' :
                    latestMetrics.disk_usage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${latestMetrics.disk_usage}%` }}
                />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(latestMetrics.network_in + latestMetrics.network_out)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">KB/s</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Network I/O
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance and Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activities and Agent Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivities} />
        <AgentMonitor agents={agents} />
      </div>

      {/* Active Alerts Panel (if there are alerts) */}
      {activeAlerts > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {activeAlerts} Active Alert{activeAlerts !== 1 ? 's' : ''}
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {criticalAlerts > 0 && `${criticalAlerts} critical alert${criticalAlerts !== 1 ? 's' : ''} requiring attention.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
