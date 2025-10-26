'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@tekup/ui';
import { useState } from 'react';

const mockDetail = {
  'voice-gemini': {
    name: 'TekUp Voice Agent',
    provider: 'gemini',
    description: 'Dansk realtids voice agent med tenant-awareness',
    settings: {
      voice: 'Zephyr',
      language: 'da-DK',
      tenants: ['tekup', 'rendetalje', 'foodtruck']
    }
  },
  'inbox-openai': {
    name: 'Inbox AI (OpenAI)',
    provider: 'openai',
    description: 'E-mail opsummering, svar og kategorisering',
    settings: {
      model: 'gpt-4-turbo',
      tone: 'professional'
    }
  },
  'inbox-anthropic': {
    name: 'Inbox AI (Anthropic)',
    provider: 'anthropic',
    description: 'Alternativ leverandør for e-mail funktioner',
    settings: {
      model: 'claude-3-sonnet-20240229',
      tone: 'professional'
    }
  }
} as const;

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useMemo(() => mockDetail[params.id as keyof typeof mockDetail], [params.id]);
  const [settings, setSettings] = useState<Record<string, any>>(data?.settings || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  if (!data) {
    return (
      <main className="min-h-screen p-8">
        <div className="text-zinc-400">Agent ikke fundet.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <p className="text-zinc-400 mt-2">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card p-6">
            <h2 className="font-semibold mb-3">Provider</h2>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 capitalize">{data.provider}</Badge>
          </Card>

          <Card className="glass-card p-6 md:col-span-2">
            <h2 className="font-semibold mb-3">Indstillinger</h2>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true); setSaved(null);
                try {
                  const res = await fetch(`/api/agents/${params.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ settings })
                  });
                  if (!res.ok) throw new Error('Gem fejlede');
                  setSaved('Gemt ✔');
                } catch (err: any) {
                  setSaved(err?.message || 'Fejl');
                } finally {
                  setSaving(false);
                }
              }}
            >
              {Object.entries(settings).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 items-center gap-3">
                  <label className="text-sm text-zinc-400">{k}</label>
                  <input
                    className="col-span-2 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm"
                    value={Array.isArray(v) ? v.join(', ') : String(v)}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSettings((s) => ({ ...s, [k]: Array.isArray(v) ? next.split(',').map(x => x.trim()) : next }));
                    }}
                  />
                </div>
              ))}
              <div className="mt-4 flex items-center gap-3">
                <Button disabled={saving} className="px-4 py-2 rounded-md bg-indigo-600 text-white">
                  {saving ? 'Gemmer...' : 'Gem ændringer'}
                </Button>
                {saved && <span className="text-xs text-zinc-400">{saved}</span>}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </main>
  );
}
