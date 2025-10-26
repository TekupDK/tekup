import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantKey = url.searchParams.get('apiKey') || process.env.NEXT_PUBLIC_TENANT_API_KEY || '';
  const cfg = getConfig();
  const headers: Record<string,string> = {};
  if (tenantKey) headers['x-tenant-key'] = tenantKey;

  const res = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/metrics`, { headers, cache: 'no-store' });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

