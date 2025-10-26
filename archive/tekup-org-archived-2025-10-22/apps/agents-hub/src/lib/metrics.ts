export async function fetchPrometheusMetrics(apiUrl: string, apiKey?: string) {
  const headers: Record<string,string> = {};
  if (apiKey) headers['x-tenant-key'] = apiKey;
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/metrics`, { cache: 'no-store', headers });
  if (!res.ok) throw new Error('Failed to load metrics');
  const text = await res.text();
  return parsePrometheus(text);
}

export type PromMetric = {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary' | 'unknown';
  samples: Array<{ labels: Record<string, string>; value: number }>;
};

export function parsePrometheus(text: string): Record<string, PromMetric> {
  const lines = text.split('\n');
  const metrics: Record<string, PromMetric> = {};
  let currentTypeByName: Record<string,string> = {};

  for (const line of lines) {
    if (!line || line.startsWith('# HELP')) continue;
    if (line.startsWith('# TYPE')) {
      const [, name, type] = line.split(/\s+/);
      currentTypeByName[name] = type;
      if (!metrics[name]) metrics[name] = { name, type: (type as any) ?? 'unknown', samples: [] };
      continue;
    }
    const m = line.match(/^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?<labels>\{[^}]*\})?\s+(?<value>-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/);
    if (!m || !m.groups) continue;
    const name = m.groups.name;
    const labelsRaw = m.groups.labels?.slice(1,-1) || '';
    const value = Number(m.groups.value);
    const labels: Record<string,string> = {};
    if (labelsRaw) {
      for (const kv of labelsRaw.split(',')) {
        const [k, v] = kv.split('=');
        labels[k] = v?.replace(/^"|"$/g, '') ?? '';
      }
    }
    if (!metrics[name]) metrics[name] = { name, type: (currentTypeByName[name] as any) ?? 'unknown', samples: [] };
    metrics[name].samples.push({ labels, value });
  }
  return metrics;
}
