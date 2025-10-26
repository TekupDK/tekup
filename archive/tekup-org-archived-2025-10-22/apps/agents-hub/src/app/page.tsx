'use client';

import { AgentsOverview } from '@/components/agents-overview';
import { MetricsPanel } from '@/components/metrics-panel';
import { EnvWarning } from '@/components/env-warning';
import { AgentMarketplace } from '@/components/marketplace/agent-marketplace';
import { useState } from 'react';

export default function AgentsHubPage() {
  const [activeView, setActiveView] = useState<'overview' | 'marketplace'>('marketplace');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <EnvWarning />
        
        {/* Navigation */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveView('marketplace')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'marketplace'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🏪 Agent Marketplace
              </button>
              <button
                onClick={() => setActiveView('overview')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  activeView === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📊 System Overview
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeView === 'marketplace' ? (
            <AgentMarketplace />
          ) : (
            <div className="space-y-6">
              <MetricsPanel apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'} />
              <AgentsOverview />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
