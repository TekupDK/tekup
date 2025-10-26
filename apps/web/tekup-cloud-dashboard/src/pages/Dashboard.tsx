import { useState, useEffect } from 'react';
import { KPICard } from '../components/dashboard/KPICard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { AgentMonitor } from '../components/agents/AgentMonitor';
import { KPIMetric, Activity, AIAgent } from '../types';
import { apiService } from '../lib/api';

export function Dashboard() {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock tenant ID - in production this would come from auth context
  const tenantId = '1';

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all dashboard data in parallel
        const [kpiData, activitiesData, agentsData] = await Promise.all([
          apiService.getKPIMetrics(tenantId),
          apiService.getActivities(tenantId, 5),
          apiService.getAgents(tenantId)
        ]);

        setKpiMetrics(kpiData);
        setRecentActivities(activitiesData);
        setAgents(agentsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data. Using fallback data.');
        
        // Use fallback data on error
        setKpiMetrics([
          { label: 'Total Revenue', value: '428.5k DKK', change: 12.5, trend: 'up', icon: '💰' },
          { label: 'Active Leads', value: '143', change: 8.2, trend: 'up', icon: '👥' },
          { label: 'System Health', value: '98.2%', change: 0.3, trend: 'up', icon: '💚' },
          { label: 'Agent Status', value: '7/7', change: 0, trend: 'stable', icon: '🤖' },
        ]);
        setRecentActivities(getFallbackActivities());
        setAgents(getFallbackAgents());
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [tenantId]);

  const getFallbackActivities = (): Activity[] => [
    {
      id: '1',
      tenant_id: '1',
      type: 'lead_created',
      title: 'New lead captured',
      description: 'John Doe from Acme Corp via website form',
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '2',
      tenant_id: '1',
      type: 'invoice_sent',
      title: 'Invoice sent',
      description: 'Invoice #1234 sent to Client XYZ - 15,000 DKK',
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: '3',
      tenant_id: '1',
      type: 'email_sent',
      title: 'Campaign email sent',
      description: 'Monthly newsletter sent to 250 subscribers',
      created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    },
    {
      id: '4',
      tenant_id: '1',
      type: 'meeting_scheduled',
      title: 'Meeting scheduled',
      description: 'Sales call with potential client on Friday 10:00',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: '5',
      tenant_id: '1',
      type: 'agent_action',
      title: 'Agent automation completed',
      description: 'Email follow-up sequence completed for 12 leads',
      created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    },
  ];

  const getFallbackAgents = (): AIAgent[] => [
    {
      id: '1',
      name: 'Lead Capture Agent',
      type: 'lead_capture',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 1247,
      average_response_time: 145,
      description: 'Monitors and captures leads from Gmail, Calendar, and Website',
    },
    {
      id: '2',
      name: 'Email Automation Agent',
      type: 'email_automation',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 3421,
      average_response_time: 89,
      description: 'Manages email campaigns and automated follow-ups',
    },
    {
      id: '3',
      name: 'Calendar Agent',
      type: 'calendar',
      status: 'processing',
      last_activity: new Date().toISOString(),
      tasks_processed: 892,
      average_response_time: 212,
      description: 'Handles meeting scheduling and calendar synchronization',
    },
    {
      id: '4',
      name: 'Invoicing Agent',
      type: 'invoicing',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 567,
      average_response_time: 324,
      description: 'Manages Billy.dk invoicing and payment tracking',
    },
    {
      id: '5',
      name: 'Support Agent',
      type: 'support',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 2134,
      average_response_time: 178,
      description: 'Provides customer support and knowledge base queries',
    },
    {
      id: '6',
      name: 'Analytics Agent',
      type: 'analytics',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 445,
      average_response_time: 456,
      description: 'Generates reports and business intelligence insights',
    },
    {
      id: '7',
      name: 'Orchestrator Agent',
      type: 'orchestrator',
      status: 'active',
      last_activity: new Date().toISOString(),
      tasks_processed: 8923,
      average_response_time: 67,
      description: 'Coordinates all agents and manages task distribution',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
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
