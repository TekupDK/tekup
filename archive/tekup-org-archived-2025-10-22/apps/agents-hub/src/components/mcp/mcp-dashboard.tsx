import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { getConfig } from '@/lib/config';

type TabType = 'plugins' | 'tools' | 'resources' | 'prompts';

export const MCPDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('plugins');
  const [tenants] = useState<string[]>(['tekup', 'rendetalje', 'foodtruck']);
  const [selectedTenant, setSelectedTenant] = useState<string>('tekup');
  const [servers, setServers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const cfg = getConfig();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams();
        if (cfg.apiKey) qs.set('apiKey', cfg.apiKey);
        const [serversRes, healthRes] = await Promise.all([
          fetch(`/api/mcp/servers?${qs.toString()}`, { cache: 'no-store' }),
          fetch(`/api/mcp/health?${qs.toString()}`, { cache: 'no-store' })
        ]);
        const serversJson = await serversRes.json();
        const healthJson = await healthRes.json();
        if (cancelled) return;
        setServers(serversJson.servers || []);
        setHealth(healthJson || null);
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTenant, cfg.apiKey]);

  const tabs = [
    { id: 'plugins' as TabType, name: 'Plugin Manager' },
    { id: 'tools' as TabType, name: 'Tool Executor' },
    { id: 'resources' as TabType, name: 'Resources' },
    { id: 'prompts' as TabType, name: 'Prompts' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white/5 border-b border-white/10 px-6 py-4 rounded-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Model Context Protocol</h1>
            <p className="text-zinc-400 mt-1">Manage plugins, execute tools, and access resources</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Tenant</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-md text-sm px-2 py-1"
            >
              {tenants.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border-b border-white/10 mt-4 rounded-md">
        <nav className="flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 text-sm font-medium ${isActive ? 'text-blue-300' : 'text-zinc-400 hover:text-white'}`}
              >
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-auto mt-4 space-y-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400">System Health</div>
              <div className="text-lg font-semibold">{health?.system?.ok ? 'Healthy' : 'Degraded/Unhealthy'}</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded ${health?.system?.ok ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {health?.system?.ok ? 'OK' : 'ISSUES'}
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="text-sm text-zinc-400 mb-2">MCP Servers</div>
          {loading && <div className="text-zinc-400 text-sm">Loading...</div>}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servers.map((s) => (
                <div key={s.id} className="rounded-md border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-zinc-400">{s.description}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${s.status === 'connected' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{s.status}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-2">Tools: {s.capabilities?.tools?.length || 0}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MCPDashboard;

