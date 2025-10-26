"use client";
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { fetchPrometheusMetrics } from '@/lib/metrics';
import { getConfig } from '@/lib/config';

type Props = { apiUrl: string };

export function MetricsPanel({ apiUrl }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counters, setCounters] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const cfg = getConfig();
        const metrics = await fetchPrometheusMetrics(apiUrl || cfg.apiUrl, cfg.apiKey);
        if (cancelled) return;
        const leadCreated = (metrics['lead_created_total']?.samples || []).reduce((acc, s) => acc + s.value, 0);
        const voiceSessions = (metrics['voice_session_started_total']?.samples || []).reduce((acc, s) => acc + s.value, 0);
        const voiceCmds = (metrics['voice_command_executed_total']?.samples || []).reduce((acc, s) => acc + s.value, 0);
        setCounters([
          { name: 'Leads (total)', value: leadCreated },
          { name: 'Voice sessions', value: voiceSessions },
          { name: 'Voice commands', value: voiceCmds },
        ]);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Fejl ved hentning');
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiUrl]);

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">System Metrics</h2>
        <span className="text-xs text-zinc-400">Kilde: {apiUrl}/metrics</span>
      </div>
      {loading && <div className="text-zinc-400 text-sm">Indlæser...</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {counters.map((c) => (
            <div key={c.name} className="rounded-lg border border-white/10 p-4">
              <div className="text-xs text-zinc-400">{c.name}</div>
              <div className="text-2xl font-bold mt-1">{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
