import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantKey = url.searchParams.get('apiKey') || process.env.NEXT_PUBLIC_TENANT_API_KEY || '';
  const cfg = getConfig();

  const headers: Record<string,string> = {};
  if (tenantKey) headers['x-tenant-key'] = tenantKey;

  const [healthRes, readyRes, liveRes] = await Promise.allSettled([
    fetch(`${cfg.apiUrl.replace(/\/$/, '')}/health?detailed=1`, { headers, cache: 'no-store' }),
    fetch(`${cfg.apiUrl.replace(/\/$/, '')}/health/ready`, { headers, cache: 'no-store' }),
    fetch(`${cfg.apiUrl.replace(/\/$/, '')}/health/live`, { headers, cache: 'no-store' })
  ]);

  const summarize = (r: PromiseSettledResult<Response>) => {
    if (r.status === 'fulfilled') return { ok: r.value.ok, status: r.value.status };
    return { ok: false };
  };

  return NextResponse.json({
    system: summarize(healthRes),
    ready: summarize(readyRes),
    live: summarize(liveRes)
  });
}

