'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Server, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ServiceHealthCard } from '../components/ServiceHealthCard';
import { SystemOverview } from '../components/SystemOverview';
import { HealthTrendChart } from '../components/HealthTrendChart';
import { AlertsPanel } from '../components/AlertsPanel';

// Service configuration
const SERVICES = [
  {
    id: 'flow-api',
    name: 'Flow API',
    url: process.env.NEXT_PUBLIC_FLOW_API_URL || 'http://localhost:4000',
    description: 'Core flow management and lead processing',
    critical: true,
  },
  {
    id: 'crm-api',
    name: 'CRM API',
    url: process.env.NEXT_PUBLIC_CRM_API_URL || 'http://localhost:4001',
    description: 'Customer relationship management',
    critical: true,
  },
  {
    id: 'lead-platform',
    name: 'Lead Platform API',
    url: process.env.NEXT_PUBLIC_LEAD_PLATFORM_API_URL || 'http://localhost:4002',
    description: 'Lead qualification and processing',
    critical: true,
  },
  {
    id: 'voicedk-api',
    name: 'VoiceDK API',
    url: process.env.NEXT_PUBLIC_VOICEDK_API_URL || 'http://localhost:4003',
    description: 'Danish voice processing and AI',
    critical: false,
  },
  {
    id: 'mcp-studio',
    name: 'MCP Studio Backend',
    url: process.env.NEXT_PUBLIC_MCP_STUDIO_API_URL || 'http://localhost:4004',
    description: 'MCP development tools and management',
    critical: false,
  },
  {
    id: 'inbox-ai',
    name: 'Inbox AI Backend',
    url: process.env.NEXT_PUBLIC_INBOX_AI_API_URL || 'http://localhost:4005',
    description: 'AI-powered email processing',
    critical: false,
  },
  {
    id: 'agentrooms',
    name: 'AgentRooms Backend',
    url: process.env.NEXT_PUBLIC_AGENTROOMS_API_URL || 'http://localhost:4006',
    description: 'AI agent collaboration platform',
    critical: false,
  },
];

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ServiceHealth {
  id: string;
  status: HealthStatus;
  responseTime: number;
  lastCheck: string;
  uptime: number;
  version: string;
  dependencies?: Array<{
    name: string;
    status: HealthStatus;
    responseTime: number;
  }>;
  error?: string;
}

// Fetch health status for a single service
async function fetchServiceHealth(service: typeof SERVICES[0]): Promise<ServiceHealth> {
  try {
    const response = await fetch(`${service.url}/health?detailed=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: service.id,
      status: data.status || 'unknown',
      responseTime: data.responseTime || 0,
      lastCheck: new Date().toISOString(),
      uptime: data.uptime || 0,
      version: data.version || 'unknown',
      dependencies: data.dependencies || [],
    };
  } catch (error) {
    return {
      id: service.id,
      status: 'unhealthy',
      responseTime: 0,
      lastCheck: new Date().toISOString(),
      uptime: 0,
      version: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default function Dashboard() {
  const [healthHistory, setHealthHistory] = useState<Array<{ timestamp: string; services: ServiceHealth[] }>>([]);

  // Fetch all services health
  const { data: servicesHealth, isLoading, refetch } = useQuery({
    queryKey: ['services-health'],
    queryFn: async () => {
      const healthPromises = SERVICES.map(fetchServiceHealth);
      return await Promise.all(healthPromises);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Store health history for trending
  useEffect(() => {
    if (servicesHealth) {
      const newHistoryEntry = {
        timestamp: new Date().toISOString(),
        services: servicesHealth,
      };
      
      setHealthHistory(prev => {
        const updated = [...prev, newHistoryEntry];
        // Keep only last 50 entries (25 minutes of history)
        return updated.slice(-50);
      });
    }
  }, [servicesHealth]);

  // Calculate system overview stats
  const systemStats = servicesHealth ? {
    healthy: servicesHealth.filter(s => s.status === 'healthy').length,
    degraded: servicesHealth.filter(s => s.status === 'degraded').length,
    unhealthy: servicesHealth.filter(s => s.status === 'unhealthy').length,
    total: servicesHealth.length,
    criticalServicesDown: servicesHealth.filter(s => {
      const service = SERVICES.find(svc => svc.id === s.id);
      return service?.critical && s.status === 'unhealthy';
    }).length,
  } : null;

  // Get overall system status
  const systemStatus: HealthStatus = systemStats ? 
    (systemStats.criticalServicesDown > 0 ? 'unhealthy' : 
     systemStats.unhealthy > 0 ? 'degraded' : 
     systemStats.degraded > 0 ? 'degraded' : 'healthy') : 'unknown';

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900\">
      {/* Header */}
      <header className=\"glass border-b border-white/10 backdrop-blur-xl sticky top-0 z-10\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">
          <div className=\"flex items-center justify-between\">
            <div className=\"flex items-center space-x-4\">
              <div className=\"p-2 rounded-xl bg-primary-500/20 backdrop-blur-sm\">
                <Activity className=\"h-8 w-8 text-primary-400\" />
              </div>
              <div>
                <h1 className=\"text-2xl font-bold text-white\">TekUp API Monitor</h1>
                <p className=\"text-slate-300\">Real-time microservices health dashboard</p>
              </div>
            </div>
            
            <div className=\"flex items-center space-x-4\">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full glass ${
                systemStatus === 'healthy' ? 'bg-success-500/20' :
                systemStatus === 'degraded' ? 'bg-warning-500/20' :
                systemStatus === 'unhealthy' ? 'bg-error-500/20' : 'bg-slate-500/20'
              }`}>
                {systemStatus === 'healthy' && <CheckCircle className=\"h-5 w-5 text-success-400\" />}
                {systemStatus === 'degraded' && <AlertTriangle className=\"h-5 w-5 text-warning-400\" />}
                {systemStatus === 'unhealthy' && <XCircle className=\"h-5 w-5 text-error-400\" />}
                {systemStatus === 'unknown' && <Clock className=\"h-5 w-5 text-slate-400\" />}
                <span className=\"text-white font-medium capitalize\">{systemStatus}</span>
              </div>
              
              <button 
                onClick={() => refetch()}
                disabled={isLoading}
                className=\"px-4 py-2 rounded-xl glass hover:bg-white/10 transition-colors text-white font-medium disabled:opacity-50\"
              >
                {isLoading ? 'Checking...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8\">
        {/* System Overview */}
        {systemStats && (
          <SystemOverview 
            stats={systemStats}
            systemStatus={systemStatus}
          />
        )}

        {/* Health Trend Chart */}
        {healthHistory.length > 0 && (
          <div className=\"glass rounded-2xl p-6 backdrop-blur-xl border border-white/10\">
            <h2 className=\"text-xl font-semibold text-white mb-6 flex items-center space-x-2\">
              <Server className=\"h-5 w-5\" />
              <span>Health Trends</span>
            </h2>
            <HealthTrendChart history={healthHistory} services={SERVICES} />
          </div>
        )}

        {/* Services Grid */}
        <div className=\"grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6\">
          {SERVICES.map(service => {
            const health = servicesHealth?.find(h => h.id === service.id);
            return (
              <ServiceHealthCard
                key={service.id}
                service={service}
                health={health}
                isLoading={isLoading}
              />
            );
          })}
        </div>

        {/* Alerts Panel */}
        {servicesHealth && (
          <AlertsPanel 
            services={SERVICES}
            healthData={servicesHealth}
          />
        )}
      </main>
    </div>
  );
}
