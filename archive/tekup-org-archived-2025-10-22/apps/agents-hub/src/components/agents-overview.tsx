import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Bot, Settings, Gauge } from 'lucide-react';

type AgentItem = {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic';
  status: 'active' | 'idle' | 'error';
  tenants: string[];
};

const mockAgents: AgentItem[] = [
  { id: 'voice-gemini', name: 'TekUp Voice Agent', provider: 'gemini', status: 'active', tenants: ['tekup', 'rendetalje', 'foodtruck'] },
  { id: 'inbox-openai', name: 'Inbox AI (OpenAI)', provider: 'openai', status: 'active', tenants: ['tekup'] },
  { id: 'inbox-anthropic', name: 'Inbox AI (Anthropic)', provider: 'anthropic', status: 'idle', tenants: ['tekup'] }
];

const providerBadge: Record<AgentItem['provider'], string> = {
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openai: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  anthropic: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
};

const statusBadge: Record<AgentItem['status'], string> = {
  active: 'bg-green-500/20 text-green-300 border-green-500/30',
  idle: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30'
};

export function AgentsOverview() {
  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full mb-4">
            <Bot className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300 uppercase tracking-wide">AI Agents Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Overblik over dine AI Agents</h1>
          <p className="text-zinc-400 mt-3">Styr, personliggør og overvåg dine AI-agenter på tværs af TekUp-platformen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAgents.map((agent) => (
            <Card key={agent.id} className="glass-card p-6 border-glass-border/30 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <Bot className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className={`text-xs ${providerBadge[agent.provider]}`}>{agent.provider}</Badge>
                      <Badge className={`text-xs ${statusBadge[agent.status]}`}>{agent.status}</Badge>
                    </div>
                  </div>
                </div>
                <Link href={`/agents/${agent.id}`} className="text-zinc-400 hover:text-blue-300 transition-colors" aria-label="Konfigurer">
                  <Settings className="w-5 h-5" />
                </Link>
              </div>

              <div className="text-sm text-zinc-400">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4" />
                  <span>Tenants: {agent.tenants.join(', ')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
