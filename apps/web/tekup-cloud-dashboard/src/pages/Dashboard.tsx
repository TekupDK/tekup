import { useQuery } from '@tanstack/react-query';
import { KPICard } from '../components/dashboard/KPICard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { AgentMonitor } from '../components/agents/AgentMonitor';
import { SkeletonCard } from '../components/ui';
import { apiClient, queryKeys } from '../lib/api';

export function Dashboard() {
  // React Query for data fetching
  const { data: kpiMetrics = [], isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: queryKeys.kpis,
    queryFn: () => apiClient.getKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: queryKeys.activities,
    queryFn: () => apiClient.getActivities(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiClient.getAgents(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const isLoading = kpiLoading || activitiesLoading || agentsLoading;
  const error = kpiError?.message || null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
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
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiMetrics.map((metric, index) => (
          <KPICard key={index} metric={metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivities} />
        <AgentMonitor agents={agents} />
      </div>
    </div>
  );
}
