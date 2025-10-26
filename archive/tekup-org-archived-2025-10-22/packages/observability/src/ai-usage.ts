interface UsageRecord {
  model: string;
  tenant?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
  ts: number;
}

const recent: UsageRecord[] = [];
const MAX_RECORDS = 5000;

export function recordAiUsage(partial: Omit<UsageRecord, 'ts'>) {
  const rec: UsageRecord = { ts: Date.now(), ...partial };
  recent.push(rec);
  if (recent.length > MAX_RECORDS) recent.shift();
  return rec;
}

export interface AggregatedUsage {
  model: string;
  tenant?: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  costUsd: number;
}

export function aggregateUsage(): AggregatedUsage[] {
  const map = new Map<string, AggregatedUsage>();
  for (const r of recent) {
    const key = `${r.model}::${r.tenant || ''}`;
    let agg = map.get(key);
    if (!agg) {
      agg = { model: r.model, tenant: r.tenant, inputTokens: 0, outputTokens: 0, calls: 0, costUsd: 0 };
      map.set(key, agg);
    }
    agg.inputTokens += r.inputTokens;
    agg.outputTokens += r.outputTokens;
    agg.calls += 1;
    agg.costUsd += r.costUsd || 0;
  }
  return Array.from(map.values());
}

export function recentUsage(limit = 100) {
  return recent.slice(-limit);
}
